package cloudinary

import (
	"context"
	"fmt"

	cld "github.com/cloudinary/cloudinary-go/v2"
	"github.com/cloudinary/cloudinary-go/v2/api"
	"github.com/cloudinary/cloudinary-go/v2/api/admin"

	"lastfm/api/internal/model"
)

type CloudinaryService struct {
	client *cld.Cloudinary
}

func NewCloudinaryService(cloudName, apiKey, apiSecret string) (*CloudinaryService, error) {
	client, err := cld.NewFromParams(cloudName, apiKey, apiSecret)
	if err != nil {
		return nil, fmt.Errorf("failed to initialize Cloudinary client: %w", err)
	}
	client.Config.URL.Secure = true

	return &CloudinaryService{client: client}, nil
}

// GetImagesByFolder fetches all images stored under the given Cloudinary folder prefix.
func (s *CloudinaryService) GetImagesByFolder(ctx context.Context, folder string) ([]model.Image, error) {
	resp, err := s.client.Admin.Assets(ctx, admin.AssetsParams{
		Prefix:    folder,
		AssetType: api.Image,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to fetch images from Cloudinary: %w", err)
	}

	images := make([]model.Image, 0, len(resp.Assets))
	for _, a := range resp.Assets {
		images = append(images, model.Image{
			CloudinaryPublicID:  a.PublicID,
			CloudinarySecureURL: a.SecureURL,
		})
	}

	return images, nil
}
