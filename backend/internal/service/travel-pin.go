package service

import (
	"context"

	"lastfm/api/internal/cloudinary"
	"lastfm/api/internal/model"
)

type TravelPinService struct {
	cloudinary *cloudinary.CloudinaryService
	// db *sql.DB  // added when DB is wired in
}

func NewTravelPinService(cld *cloudinary.CloudinaryService) *TravelPinService {
	return &TravelPinService{cloudinary: cld}
}

// GetAllPins returns all travel pins with their associated images.
// Pin metadata will come from the DB once it is wired in.
func (s *TravelPinService) GetAllPins(ctx context.Context) ([]model.TravelPin, error) {
	// TODO: fetch pin rows from DB, then call s.cloudinary.GetImagesByFolder per pin
	return []model.TravelPin{}, nil
}
