package service

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/google/uuid"

	"lastfm/api/internal/cloudinary"
	"lastfm/api/internal/model"
)

type TravelPinService struct {
	db         *sql.DB
	cloudinary *cloudinary.CloudinaryService
}

func NewTravelPinService(db *sql.DB, cld *cloudinary.CloudinaryService) *TravelPinService {
	return &TravelPinService{db: db, cloudinary: cld}
}

func (s *TravelPinService) GetAllPins(ctx context.Context) ([]model.TravelPin, error) {
	rows, err := s.db.QueryContext(ctx, `
		SELECT id, location_name, country, latitude, longitude, cloudinary_folder
		FROM travel_pins
		ORDER BY created_at DESC`)
	if err != nil {
		return nil, fmt.Errorf("query pins: %w", err)
	}
	defer rows.Close()

	pins := []model.TravelPin{}
	for rows.Next() {
		var p model.TravelPin
		if err := rows.Scan(&p.ID, &p.LocationName, &p.Country, &p.Latitude, &p.Longitude, &p.CloudinaryFolder); err != nil {
			return nil, fmt.Errorf("scan pin: %w", err)
		}
		p.Images = []model.Image{}
		pins = append(pins, p)
	}
	return pins, rows.Err()
}

func (s *TravelPinService) GetPinImages(ctx context.Context, id string) ([]model.Image, error) {
	var folder string
	err := s.db.QueryRowContext(ctx, `SELECT cloudinary_folder FROM travel_pins WHERE id = $1`, id).Scan(&folder)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("pin not found")
	}
	if err != nil {
		return nil, fmt.Errorf("query pin: %w", err)
	}

	rows, err := s.db.QueryContext(ctx, `
		SELECT public_id, secure_url, caption, uploaded_at
		FROM pin_images WHERE pin_id = $1 ORDER BY sort_order ASC, uploaded_at ASC`, id)
	if err != nil {
		return nil, fmt.Errorf("query images: %w", err)
	}
	defer rows.Close()

	var images []model.Image
	for rows.Next() {
		var img model.Image
		var secureURL string
		var uploadedAt time.Time
		if err := rows.Scan(&img.CloudinaryPublicID, &secureURL, &img.Caption, &uploadedAt); err != nil {
			return nil, fmt.Errorf("scan image: %w", err)
		}
		img.UploadedAt = uploadedAt.Format(time.RFC3339)
		if secureURL != "" {
			img.CloudinarySecureURL = secureURL
		} else if s.cloudinary != nil {
			img.CloudinarySecureURL = "https://res.cloudinary.com/" + s.cloudinary.CloudName() + "/image/upload/" + img.CloudinaryPublicID
		}
		images = append(images, img)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate images: %w", err)
	}
	if images == nil {
		return []model.Image{}, nil
	}
	return images, nil
}

func (s *TravelPinService) DeletePin(ctx context.Context, id string) error {
	result, err := s.db.ExecContext(ctx, `DELETE FROM travel_pins WHERE id = $1`, id)
	if err != nil {
		return fmt.Errorf("delete pin: %w", err)
	}
	rows, _ := result.RowsAffected()
	if rows == 0 {
		return fmt.Errorf("pin not found")
	}
	return nil
}

func (s *TravelPinService) GetCloudinaryFolders(ctx context.Context) ([]string, error) {
	if s.cloudinary == nil {
		return []string{}, nil
	}
	return s.cloudinary.ListFolders(ctx)
}

func (s *TravelPinService) CreatePin(ctx context.Context, req model.CreatePinRequest) (model.TravelPin, error) {
	id := uuid.New().String()
	_, err := s.db.ExecContext(ctx, `
		INSERT INTO travel_pins (id, location_name, country, latitude, longitude, cloudinary_folder)
		VALUES ($1, $2, $3, $4, $5, $6)`,
		id, req.LocationName, req.Country, req.Latitude, req.Longitude, req.CloudinaryFolder)
	if err != nil {
		return model.TravelPin{}, fmt.Errorf("insert pin: %w", err)
	}
	return model.TravelPin{
		ID:           id,
		LocationName: req.LocationName,
		Country:      req.Country,
		Latitude:     req.Latitude,
		Longitude:    req.Longitude,
		Images:       []model.Image{},
	}, nil
}

func (s *TravelPinService) UploadPinImage(ctx context.Context, id string, file io.Reader) (*model.Image, error) {
	var folder string
	err := s.db.QueryRowContext(ctx, `SELECT cloudinary_folder FROM travel_pins WHERE id = $1`, id).Scan(&folder)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("pin not found")
	}
	if err != nil {
		return nil, fmt.Errorf("query pin: %w", err)
	}
	if s.cloudinary == nil {
		return nil, fmt.Errorf("cloudinary not configured")
	}

	img, err := s.cloudinary.UploadImage(ctx, file, folder)
	if err != nil {
		return nil, err
	}

	var maxOrder int
	_ = s.db.QueryRowContext(ctx,
		`SELECT COALESCE(MAX(sort_order), -1) FROM pin_images WHERE pin_id = $1`, id).Scan(&maxOrder)

	_, dbErr := s.db.ExecContext(ctx,
		`INSERT INTO pin_images (public_id, pin_id, secure_url, caption, sort_order)
		 VALUES ($1, $2, $3, '', $4)
		 ON CONFLICT (public_id) DO NOTHING`,
		img.CloudinaryPublicID, id, img.CloudinarySecureURL, maxOrder+1)
	if dbErr == nil {
		var uploadedAt time.Time
		_ = s.db.QueryRowContext(ctx,
			`SELECT uploaded_at FROM pin_images WHERE public_id = $1`,
			img.CloudinaryPublicID,
		).Scan(&uploadedAt)
		if !uploadedAt.IsZero() {
			img.UploadedAt = uploadedAt.Format(time.RFC3339)
		}
	}

	return img, nil
}

func (s *TravelPinService) DeletePinImage(ctx context.Context, pinID, publicID string) error {
	var count int
	err := s.db.QueryRowContext(ctx,
		`SELECT COUNT(*) FROM pin_images WHERE public_id = $1 AND pin_id = $2`,
		publicID, pinID).Scan(&count)
	if err != nil || count == 0 {
		return fmt.Errorf("image not found")
	}
	if s.cloudinary != nil {
		_ = s.cloudinary.DeleteImage(ctx, publicID)
	}
	_, err = s.db.ExecContext(ctx,
		`DELETE FROM pin_images WHERE public_id = $1 AND pin_id = $2`,
		publicID, pinID)
	return err
}

// SyncPinImages checks each DB image record with a HEAD request to its
// Cloudinary CDN URL and removes records for assets that return 404.
func (s *TravelPinService) SyncPinImages(ctx context.Context, pinID string) (int, error) {
	var exists int
	err := s.db.QueryRowContext(ctx, `SELECT COUNT(*) FROM travel_pins WHERE id = $1`, pinID).Scan(&exists)
	if err != nil || exists == 0 {
		return 0, fmt.Errorf("pin not found")
	}

	rows, err := s.db.QueryContext(ctx,
		`SELECT public_id, secure_url FROM pin_images WHERE pin_id = $1`, pinID)
	if err != nil {
		return 0, fmt.Errorf("query images: %w", err)
	}

	type record struct {
		publicID  string
		secureURL string
	}
	var records []record
	for rows.Next() {
		var r record
		if err := rows.Scan(&r.publicID, &r.secureURL); err != nil {
			continue
		}
		records = append(records, r)
	}
	rows.Close()
	if err := rows.Err(); err != nil {
		return 0, fmt.Errorf("iterate images: %w", err)
	}

	var stale []string
	for _, rec := range records {
		url := rec.secureURL
		if url == "" && s.cloudinary != nil {
			url = "https://res.cloudinary.com/" + s.cloudinary.CloudName() + "/image/upload/" + rec.publicID
		}
		if url == "" {
			continue
		}
		req, err := http.NewRequestWithContext(ctx, http.MethodHead, url, nil)
		if err != nil {
			continue
		}
		resp, err := http.DefaultClient.Do(req)
		if err != nil {
			continue
		}
		resp.Body.Close()
		if resp.StatusCode == http.StatusNotFound {
			stale = append(stale, rec.publicID)
		}
	}

	for _, pubID := range stale {
		_, _ = s.db.ExecContext(ctx,
			`DELETE FROM pin_images WHERE public_id = $1 AND pin_id = $2`,
			pubID, pinID)
	}
	return len(stale), nil
}

// MoveFolder renames a pin's Cloudinary folder and updates all DB records.
func (s *TravelPinService) MoveFolder(ctx context.Context, pinID, newFolder string) error {
	newFolder = strings.Trim(newFolder, "/")
	if newFolder == "" {
		return fmt.Errorf("folder cannot be empty")
	}

	var oldFolder string
	err := s.db.QueryRowContext(ctx, `SELECT cloudinary_folder FROM travel_pins WHERE id = $1`, pinID).Scan(&oldFolder)
	if err == sql.ErrNoRows {
		return fmt.Errorf("pin not found")
	}
	if err != nil {
		return fmt.Errorf("query pin: %w", err)
	}
	oldFolder = strings.Trim(oldFolder, "/")
	if oldFolder == newFolder {
		return nil
	}

	rows, err := s.db.QueryContext(ctx, `SELECT public_id FROM pin_images WHERE pin_id = $1`, pinID)
	if err != nil {
		return fmt.Errorf("query images: %w", err)
	}
	var publicIDs []string
	for rows.Next() {
		var id string
		if err := rows.Scan(&id); err == nil {
			publicIDs = append(publicIDs, id)
		}
	}
	rows.Close()

	if s.cloudinary != nil && oldFolder != "" {
		folderErr := s.cloudinary.RenameFolder(ctx, oldFolder, newFolder)
		if folderErr != nil {
			if !errors.Is(folderErr, cloudinary.ErrFolderNotFound) {
				return fmt.Errorf("cloudinary rename folder: %w", folderErr)
			}
			log.Printf("MoveFolder: folder %q not found in Cloudinary, renaming per-image", oldFolder)
			for _, oldID := range publicIDs {
				suffix := strings.TrimPrefix(oldID, oldFolder+"/")
				if suffix == oldID {
					parts := strings.Split(oldID, "/")
					suffix = parts[len(parts)-1]
				}
				newID := newFolder + "/" + suffix
				if _, err := s.cloudinary.RenameImage(ctx, oldID, newID); err != nil {
					log.Printf("MoveFolder: rename %s → %s: %v", oldID, newID, err)
				}
			}
		}
	}

	cloudName := ""
	if s.cloudinary != nil {
		cloudName = s.cloudinary.CloudName()
	}
	for _, oldID := range publicIDs {
		suffix := strings.TrimPrefix(oldID, oldFolder+"/")
		if suffix == oldID {
			parts := strings.Split(oldID, "/")
			suffix = parts[len(parts)-1]
		}
		newID := newFolder + "/" + suffix
		newURL := "https://res.cloudinary.com/" + cloudName + "/image/upload/" + newID
		_, _ = s.db.ExecContext(ctx,
			`UPDATE pin_images SET public_id = $1, secure_url = $2 WHERE public_id = $3 AND pin_id = $4`,
			newID, newURL, oldID, pinID)
	}

	_, err = s.db.ExecContext(ctx, `UPDATE travel_pins SET cloudinary_folder = $1 WHERE id = $2`, newFolder, pinID)
	return err
}

func (s *TravelPinService) UpdateImageOrder(ctx context.Context, pinID string, publicIDs []string) error {
	var count int
	if err := s.db.QueryRowContext(ctx, `SELECT COUNT(*) FROM travel_pins WHERE id = $1`, pinID).Scan(&count); err != nil || count == 0 {
		return fmt.Errorf("pin not found")
	}
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback()
	for i, pubID := range publicIDs {
		if _, err := tx.ExecContext(ctx,
			`UPDATE pin_images SET sort_order = $1 WHERE public_id = $2 AND pin_id = $3`,
			i, pubID, pinID); err != nil {
			return fmt.Errorf("update sort_order: %w", err)
		}
	}
	return tx.Commit()
}

func (s *TravelPinService) UpdateLocationName(ctx context.Context, pinID, locationName string) error {
	result, err := s.db.ExecContext(ctx,
		`UPDATE travel_pins SET location_name = $1 WHERE id = $2`,
		locationName, pinID)
	if err != nil {
		return fmt.Errorf("update location name: %w", err)
	}
	rows, _ := result.RowsAffected()
	if rows == 0 {
		return fmt.Errorf("pin not found")
	}
	return nil
}

func (s *TravelPinService) UpdatePinImageCaption(ctx context.Context, pinID, publicID, caption string) error {
	result, err := s.db.ExecContext(ctx,
		`UPDATE pin_images SET caption = $1 WHERE public_id = $2 AND pin_id = $3`,
		caption, publicID, pinID)
	if err != nil {
		return fmt.Errorf("update caption: %w", err)
	}
	rows, _ := result.RowsAffected()
	if rows == 0 {
		return fmt.Errorf("image not found")
	}
	return nil
}
