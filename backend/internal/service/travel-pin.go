package service

import (
	"context"
	"database/sql"
	"fmt"
	"io"

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
	if s.cloudinary == nil || folder == "" {
		return []model.Image{}, nil
	}
	return s.cloudinary.GetImagesByFolder(ctx, folder)
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
	return s.cloudinary.UploadImage(ctx, file, folder)
}
