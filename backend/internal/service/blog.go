package service

import (
	"context"
	"database/sql"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"

	"lastfm/api/internal/model"
)

type BlogService struct {
	db *sql.DB
}

func NewBlogService(db *sql.DB) *BlogService {
	return &BlogService{db: db}
}

func (s *BlogService) GetPublishedPosts(ctx context.Context) ([]model.BlogPost, error) {
	rows, err := s.db.QueryContext(ctx, `
		SELECT id, slug, title, excerpt, content, published, created_at, updated_at
		FROM blog_posts
		WHERE published = 1
		ORDER BY created_at DESC`)
	if err != nil {
		return nil, fmt.Errorf("query published posts: %w", err)
	}
	defer rows.Close()
	return scanPosts(rows)
}

func (s *BlogService) GetAllPosts(ctx context.Context) ([]model.BlogPost, error) {
	rows, err := s.db.QueryContext(ctx, `
		SELECT id, slug, title, excerpt, content, published, created_at, updated_at
		FROM blog_posts
		ORDER BY created_at DESC`)
	if err != nil {
		return nil, fmt.Errorf("query all posts: %w", err)
	}
	defer rows.Close()
	return scanPosts(rows)
}

func (s *BlogService) GetPublishedPost(ctx context.Context, slug string) (model.BlogPost, error) {
	var p model.BlogPost
	var published int
	err := s.db.QueryRowContext(ctx, `
		SELECT id, slug, title, excerpt, content, published, created_at, updated_at
		FROM blog_posts
		WHERE slug = ? AND published = 1`, slug).
		Scan(&p.ID, &p.Slug, &p.Title, &p.Excerpt, &p.Content, &published, &p.CreatedAt, &p.UpdatedAt)
	if err == sql.ErrNoRows {
		return p, fmt.Errorf("post not found")
	}
	if err != nil {
		return p, fmt.Errorf("get published post: %w", err)
	}
	p.Published = published == 1
	return p, nil
}

func (s *BlogService) GetPostByID(ctx context.Context, id string) (model.BlogPost, error) {
	var p model.BlogPost
	var published int
	err := s.db.QueryRowContext(ctx, `
		SELECT id, slug, title, excerpt, content, published, created_at, updated_at
		FROM blog_posts
		WHERE id = ?`, id).
		Scan(&p.ID, &p.Slug, &p.Title, &p.Excerpt, &p.Content, &published, &p.CreatedAt, &p.UpdatedAt)
	if err == sql.ErrNoRows {
		return p, fmt.Errorf("post not found")
	}
	if err != nil {
		return p, fmt.Errorf("get post: %w", err)
	}
	p.Published = published == 1
	return p, nil
}

func (s *BlogService) CreatePost(ctx context.Context, req model.CreatePostRequest) (model.BlogPost, error) {
	slug := strings.TrimSpace(req.Slug)
	title := strings.TrimSpace(req.Title)
	if slug == "" || title == "" {
		return model.BlogPost{}, fmt.Errorf("slug and title are required")
	}
	id := uuid.New().String()
	now := time.Now().UTC().Format(time.RFC3339)
	_, err := s.db.ExecContext(ctx, `
		INSERT INTO blog_posts (id, slug, title, excerpt, content, published, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, 0, ?, ?)`,
		id, slug, title, strings.TrimSpace(req.Excerpt), req.Content, now, now)
	if err != nil {
		if strings.Contains(err.Error(), "UNIQUE constraint failed") {
			return model.BlogPost{}, fmt.Errorf("slug already exists")
		}
		return model.BlogPost{}, fmt.Errorf("create post: %w", err)
	}
	return s.GetPostByID(ctx, id)
}

func (s *BlogService) UpdatePost(ctx context.Context, id string, req model.UpdatePostRequest) (model.BlogPost, error) {
	slug := strings.TrimSpace(req.Slug)
	title := strings.TrimSpace(req.Title)
	if slug == "" || title == "" {
		return model.BlogPost{}, fmt.Errorf("slug and title are required")
	}
	now := time.Now().UTC().Format(time.RFC3339)
	published := 0
	if req.Published {
		published = 1
	}
	res, err := s.db.ExecContext(ctx, `
		UPDATE blog_posts
		SET slug = ?, title = ?, excerpt = ?, content = ?, published = ?, updated_at = ?
		WHERE id = ?`,
		slug, title, strings.TrimSpace(req.Excerpt), req.Content, published, now, id)
	if err != nil {
		if strings.Contains(err.Error(), "UNIQUE constraint failed") {
			return model.BlogPost{}, fmt.Errorf("slug already exists")
		}
		return model.BlogPost{}, fmt.Errorf("update post: %w", err)
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return model.BlogPost{}, fmt.Errorf("post not found")
	}
	return s.GetPostByID(ctx, id)
}

func (s *BlogService) DeletePost(ctx context.Context, id string) error {
	res, err := s.db.ExecContext(ctx, `DELETE FROM blog_posts WHERE id = ?`, id)
	if err != nil {
		return fmt.Errorf("delete post: %w", err)
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return fmt.Errorf("post not found")
	}
	return nil
}

func (s *BlogService) SetPublished(ctx context.Context, id string, published bool) error {
	val := 0
	if published {
		val = 1
	}
	now := time.Now().UTC().Format(time.RFC3339)
	res, err := s.db.ExecContext(ctx, `
		UPDATE blog_posts SET published = ?, updated_at = ? WHERE id = ?`, val, now, id)
	if err != nil {
		return fmt.Errorf("set published: %w", err)
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return fmt.Errorf("post not found")
	}
	return nil
}

func scanPosts(rows *sql.Rows) ([]model.BlogPost, error) {
	posts := []model.BlogPost{}
	for rows.Next() {
		var p model.BlogPost
		var published int
		if err := rows.Scan(&p.ID, &p.Slug, &p.Title, &p.Excerpt, &p.Content, &published, &p.CreatedAt, &p.UpdatedAt); err != nil {
			return nil, fmt.Errorf("scan post: %w", err)
		}
		p.Published = published == 1
		posts = append(posts, p)
	}
	return posts, rows.Err()
}
