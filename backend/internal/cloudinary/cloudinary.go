package cloudinary

import (
	"context"
	"errors"
	"fmt"
	"io"
	"sort"
	"strings"

	cld "github.com/cloudinary/cloudinary-go/v2"
	"github.com/cloudinary/cloudinary-go/v2/api"
	"github.com/cloudinary/cloudinary-go/v2/api/admin" // used only for folder listing (RootFolders/SubFolders)
	"github.com/cloudinary/cloudinary-go/v2/api/uploader"

	"lastfm/api/internal/model"
)

// ErrFolderNotFound is returned by RenameFolder when Cloudinary cannot locate
// the source folder. Callers may fall back to per-image rename.
var ErrFolderNotFound = errors.New("cloudinary folder not found")

type CloudinaryService struct {
	client    *cld.Cloudinary
	cloudName string
}

func NewCloudinaryService(cloudName, apiKey, apiSecret string) (*CloudinaryService, error) {
	client, err := cld.NewFromParams(cloudName, apiKey, apiSecret)
	if err != nil {
		return nil, fmt.Errorf("failed to initialize Cloudinary client: %w", err)
	}
	client.Config.URL.Secure = true

	return &CloudinaryService{client: client, cloudName: cloudName}, nil
}

func (s *CloudinaryService) CloudName() string { return s.cloudName }

func (s *CloudinaryService) ListFolders(ctx context.Context) ([]string, error) {
	var result []string
	queue := []string{""} // empty = root level

	for len(queue) > 0 {
		parent := queue[0]
		queue = queue[1:]

		var folders []admin.FolderResult
		if parent == "" {
			resp, err := s.client.Admin.RootFolders(ctx, admin.RootFoldersParams{})
			if err != nil {
				return nil, fmt.Errorf("failed to list root folders: %w", err)
			}
			folders = resp.Folders
		} else {
			resp, err := s.client.Admin.SubFolders(ctx, admin.SubFoldersParams{Folder: parent})
			if err != nil {
				continue
			}
			folders = resp.Folders
		}

		for _, f := range folders {
			result = append(result, f.Path)
			queue = append(queue, f.Path)
		}
	}

	sort.Strings(result)
	return result, nil
}

// UploadImage uploads a file to the given Cloudinary folder using the Upload
// API. Cloudinary creates the folder automatically on first upload, matching
// the same behaviour as the reference Node implementation.
func (s *CloudinaryService) UploadImage(ctx context.Context, file io.Reader, folder string) (*model.Image, error) {
	resp, err := s.client.Upload.Upload(ctx, file, uploader.UploadParams{
		Folder:         folder,
		UseFilename:    api.Bool(true),
		UniqueFilename: api.Bool(true),
	})
	if err != nil {
		return nil, fmt.Errorf("Upload: %w", err)
	}
	if resp.Error.Message != "" {
		return nil, fmt.Errorf("Upload: %s", resp.Error.Message)
	}
	return &model.Image{
		CloudinaryPublicID:  resp.PublicID,
		CloudinarySecureURL: resp.SecureURL,
	}, nil
}

// RenameFolder renames an entire Cloudinary folder atomically.
// Returns ErrFolderNotFound if Cloudinary cannot locate the source path so
// callers can fall back to per-image rename.
func (s *CloudinaryService) RenameFolder(ctx context.Context, fromPath, toPath string) error {
	resp, err := s.client.Admin.RenameFolder(ctx, admin.RenameFolderParams{
		FromPath: fromPath,
		ToPath:   toPath,
	})
	if err != nil {
		msg := strings.ToLower(err.Error())
		if strings.Contains(msg, "not found") ||
			strings.Contains(msg, "doesn't exist") ||
			strings.Contains(msg, "cannot find") {
			return ErrFolderNotFound
		}
		return fmt.Errorf("rename folder: %w", err)
	}
	if resp.Error.Message != "" {
		msg := strings.ToLower(resp.Error.Message)
		if strings.Contains(msg, "not found") ||
			strings.Contains(msg, "doesn't exist") ||
			strings.Contains(msg, "cannot find") {
			return ErrFolderNotFound
		}
		return fmt.Errorf("rename folder: %s", resp.Error.Message)
	}
	return nil
}

// RenameImage moves a single asset to a new public_id using the Upload API.
// Returns the new secure URL constructed from the cloud name.
func (s *CloudinaryService) RenameImage(ctx context.Context, fromPublicID, toPublicID string) (string, error) {
	_, err := s.client.Upload.Rename(ctx, uploader.RenameParams{
		FromPublicID: fromPublicID,
		ToPublicID:   toPublicID,
	})
	if err != nil {
		return "", fmt.Errorf("rename image: %w", err)
	}
	return "https://res.cloudinary.com/" + s.cloudName + "/image/upload/" + toPublicID, nil
}

func (s *CloudinaryService) DeleteImage(ctx context.Context, publicID string) error {
	resp, err := s.client.Upload.Destroy(ctx, uploader.DestroyParams{PublicID: publicID})
	if err != nil {
		return fmt.Errorf("destroy: %w", err)
	}
	if resp.Error.Message != "" {
		return fmt.Errorf("destroy: %s", resp.Error.Message)
	}
	return nil
}
