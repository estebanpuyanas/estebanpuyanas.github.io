package db

import (
	"database/sql"
	"fmt"

	_ "modernc.org/sqlite"
)

const schema = `
CREATE TABLE IF NOT EXISTS travel_pins (
	id                TEXT PRIMARY KEY,
	location_name     TEXT NOT NULL,
	country           TEXT NOT NULL,
	latitude          REAL NOT NULL,
	longitude         REAL NOT NULL,
	cloudinary_folder TEXT NOT NULL,
	created_at        DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pin_images (
	public_id   TEXT PRIMARY KEY,
	pin_id      TEXT NOT NULL REFERENCES travel_pins(id) ON DELETE CASCADE,
	caption     TEXT NOT NULL DEFAULT '',
	uploaded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);`

func Open(path string) (*sql.DB, error) {
	db, err := sql.Open("sqlite", path)
	if err != nil {
		return nil, fmt.Errorf("open sqlite: %w", err)
	}
	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("ping sqlite: %w", err)
	}
	if _, err := db.Exec(schema); err != nil {
		return nil, fmt.Errorf("migrate schema: %w", err)
	}
	// idempotent! fails silently if column already exists
	_, _ = db.Exec(`ALTER TABLE pin_images ADD COLUMN secure_url TEXT NOT NULL DEFAULT ''`)
	_, _ = db.Exec(`ALTER TABLE pin_images ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0`)
	return db, nil
}
