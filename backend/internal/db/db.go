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
	return db, nil
}
