package db

import (
	"database/sql"
	"fmt"

	_ "github.com/jackc/pgx/v5/stdlib"
)

const schema = `
CREATE TABLE IF NOT EXISTS travel_pins (
	id                TEXT PRIMARY KEY,
	location_name     TEXT NOT NULL,
	country           TEXT NOT NULL,
	latitude          DOUBLE PRECISION NOT NULL,
	longitude         DOUBLE PRECISION NOT NULL,
	cloudinary_folder TEXT NOT NULL,
	created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pin_images (
	public_id   TEXT PRIMARY KEY,
	pin_id      TEXT NOT NULL REFERENCES travel_pins(id) ON DELETE CASCADE,
	caption     TEXT NOT NULL DEFAULT '',
	uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	secure_url  TEXT NOT NULL DEFAULT '',
	sort_order  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS blog_posts (
	id         TEXT PRIMARY KEY,
	slug       TEXT UNIQUE NOT NULL,
	title      TEXT NOT NULL,
	excerpt    TEXT NOT NULL DEFAULT '',
	content    TEXT NOT NULL DEFAULT '',
	published  BOOLEAN NOT NULL DEFAULT FALSE,
	created_at TIMESTAMPTZ DEFAULT NOW(),
	updated_at TIMESTAMPTZ DEFAULT NOW()
);`

func Open(url string) (*sql.DB, error) {
	db, err := sql.Open("pgx", url)
	if err != nil {
		return nil, fmt.Errorf("open postgres: %w", err)
	}
	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("ping postgres: %w", err)
	}
	if _, err := db.Exec(schema); err != nil {
		return nil, fmt.Errorf("apply schema: %w", err)
	}
	return db, nil
}
