package service

import (
	"context"
	"database/sql"
	"fmt"
	"io"
	"net/http"

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
		SELECT id, location_name, country, latitude, longitude
		FROM travel_pins
		ORDER BY created_at DESC`)
	if err != nil {
		return nil, fmt.Errorf("query pins: %w", err)
	}
	defer rows.Close()

	pins := []model.TravelPin{}
	for rows.Next() {
		var p model.TravelPin
		if err := rows.Scan(&p.ID, &p.LocationName, &p.Country, &p.Latitude, &p.Longitude); err != nil {
			return nil, fmt.Errorf("scan pin: %w", err)
		}
		p.Images = []model.Image{}
		pins = append(pins, p)
	}
	return pins, rows.Err()
}

func (s *TravelPinService) GetPinImages(ctx context.Context, id string) ([]model.Image, error) {
	var folder string
	err := s.db.QueryRowContext(ctx, `SELECT cloudinary_folder FROM travel_pins WHERE id = ?`, id).Scan(&folder)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("pin not found")
	}
	if err != nil {
		return nil, fmt.Errorf("query pin: %w", err)
	}

	rows, err := s.db.QueryContext(ctx, `
		SELECT public_id, secure_url, caption, uploaded_at
		FROM pin_images WHERE pin_id = ? ORDER BY uploaded_at DESC`, id)
	if err != nil {
		return nil, fmt.Errorf("query images: %w", err)
	}
	defer rows.Close()

	var images []model.Image
	for rows.Next() {
		var img model.Image
		var secureURL string
		if err := rows.Scan(&img.CloudinaryPublicID, &secureURL, &img.Caption, &img.UploadedAt); err != nil {
			return nil, fmt.Errorf("scan image: %w", err)
		}
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
	result, err := s.db.ExecContext(ctx, `DELETE FROM travel_pins WHERE id = ?`, id)
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
		VALUES (?, ?, ?, ?, ?, ?)`,
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
	err := s.db.QueryRowContext(ctx, `SELECT cloudinary_folder FROM travel_pins WHERE id = ?`, id).Scan(&folder)
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

	_, dbErr := s.db.ExecContext(ctx,
		`INSERT OR IGNORE INTO pin_images (public_id, pin_id, secure_url, caption) VALUES (?, ?, ?, '')`,
		img.CloudinaryPublicID, id, img.CloudinarySecureURL)
	if dbErr == nil {
		_ = s.db.QueryRowContext(ctx,
			`SELECT uploaded_at FROM pin_images WHERE public_id = ?`,
			img.CloudinaryPublicID,
		).Scan(&img.UploadedAt)
	}

	return img, nil
}

func (s *TravelPinService) DeletePinImage(ctx context.Context, pinID, publicID string) error {
	var count int
	err := s.db.QueryRowContext(ctx,
		`SELECT COUNT(*) FROM pin_images WHERE public_id = ? AND pin_id = ?`,
		publicID, pinID).Scan(&count)
	if err != nil || count == 0 {
		return fmt.Errorf("image not found")
	}
	if s.cloudinary != nil {
		// ignore error: "not found" from Cloudinary means already deleted
		_ = s.cloudinary.DeleteImage(ctx, publicID)
	}
	_, err = s.db.ExecContext(ctx,
		`DELETE FROM pin_images WHERE public_id = ? AND pin_id = ?`,
		publicID, pinID)
	return err
}

// SyncPinImages checks each DB image record with a HEAD request to its
// Cloudinary CDN URL and removes records for assets that return 404.
// This avoids the unreliable Cloudinary Admin API entirely.
func (s *TravelPinService) SyncPinImages(ctx context.Context, pinID string) (int, error) {
	var exists int
	err := s.db.QueryRowContext(ctx, `SELECT COUNT(*) FROM travel_pins WHERE id = ?`, pinID).Scan(&exists)
	if err != nil || exists == 0 {
		return 0, fmt.Errorf("pin not found")
	}

	rows, err := s.db.QueryContext(ctx,
		`SELECT public_id, secure_url FROM pin_images WHERE pin_id = ?`, pinID)
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
			continue // network error — skip, don't assume deleted
		}
		resp.Body.Close()
		if resp.StatusCode == http.StatusNotFound {
			stale = append(stale, rec.publicID)
		}
	}

	for _, pubID := range stale {
		_, _ = s.db.ExecContext(ctx,
			`DELETE FROM pin_images WHERE public_id = ? AND pin_id = ?`,
			pubID, pinID)
	}
	return len(stale), nil
}

func (s *TravelPinService) UpdatePinImageCaption(ctx context.Context, pinID, publicID, caption string) error {
	result, err := s.db.ExecContext(ctx,
		`UPDATE pin_images SET caption = ? WHERE public_id = ? AND pin_id = ?`,
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
