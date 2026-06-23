// Migrates data from the local SQLite travels.db into a Neon Postgres database.
//
// Usage:
//
//	go run ./cmd/migrate [--sqlite ./travels.db]
//
// Reads NEON_DATABASE_URL from .env or the environment.
package main

import (
	"context"
	"database/sql"
	"flag"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/joho/godotenv"
	_ "modernc.org/sqlite"
)

// pgSchema is the DDL run against Postgres before any data is inserted.
const pgSchema = `
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

func main() {
	sqlitePath := flag.String("sqlite", "travels.db", "path to the SQLite database file")
	flag.Parse()

	if err := godotenv.Load(); err != nil {
		log.Println("no .env file found, reading from environment")
	}

	neonURL := os.Getenv("NEON_DATABASE_URL")
	if neonURL == "" {
		log.Fatal("NEON_DATABASE_URL environment variable is required")
	}

	ctx := context.Background()

	log.Printf("opening sqlite: %s", *sqlitePath)
	sqlite, err := sql.Open("sqlite", *sqlitePath)
	if err != nil {
		log.Fatalf("open sqlite: %v", err)
	}
	defer sqlite.Close()
	if err := sqlite.PingContext(ctx); err != nil {
		log.Fatalf("ping sqlite: %v", err)
	}

	log.Println("connecting to neon postgres")
	pg, err := pgx.Connect(ctx, neonURL)
	if err != nil {
		log.Fatalf("connect postgres: %v", err)
	}
	defer pg.Close(ctx)

	log.Println("applying schema")
	if _, err := pg.Exec(ctx, pgSchema); err != nil {
		log.Fatalf("apply schema: %v", err)
	}

	if err := migrateTravelPins(ctx, sqlite, pg); err != nil {
		log.Fatalf("migrate travel_pins: %v", err)
	}
	if err := migratePinImages(ctx, sqlite, pg); err != nil {
		log.Fatalf("migrate pin_images: %v", err)
	}
	if err := migrateBlogPosts(ctx, sqlite, pg); err != nil {
		log.Fatalf("migrate blog_posts: %v", err)
	}

	log.Println("migration complete")
}

func migrateTravelPins(ctx context.Context, sqlite *sql.DB, pg *pgx.Conn) error {
	rows, err := sqlite.QueryContext(ctx, `
		SELECT id, location_name, country, latitude, longitude, cloudinary_folder, created_at
		FROM travel_pins`)
	if err != nil {
		return fmt.Errorf("query: %w", err)
	}
	defer rows.Close()

	inserted := 0
	skipped := 0
	for rows.Next() {
		var (
			id, locationName, country, cloudinaryFolder string
			lat, lon                                    float64
			createdAtRaw                                string
		)
		if err := rows.Scan(&id, &locationName, &country, &lat, &lon, &cloudinaryFolder, &createdAtRaw); err != nil {
			return fmt.Errorf("scan: %w", err)
		}
		createdAt := parseTime(createdAtRaw)

		_, err := pg.Exec(ctx, `
			INSERT INTO travel_pins (id, location_name, country, latitude, longitude, cloudinary_folder, created_at)
			VALUES ($1, $2, $3, $4, $5, $6, $7)
			ON CONFLICT (id) DO NOTHING`,
			id, locationName, country, lat, lon, cloudinaryFolder, createdAt,
		)
		if err != nil {
			return fmt.Errorf("insert pin %s: %w", id, err)
		}
		if tag, _ := pg.Exec(ctx, `SELECT 1 FROM travel_pins WHERE id = $1`, id); tag.RowsAffected() > 0 {
			inserted++
		} else {
			skipped++
		}
	}
	if err := rows.Err(); err != nil {
		return err
	}
	log.Printf("travel_pins: %d rows processed (%d skipped — already existed)", inserted+skipped, skipped)
	return nil
}

func migratePinImages(ctx context.Context, sqlite *sql.DB, pg *pgx.Conn) error {
	rows, err := sqlite.QueryContext(ctx, `
		SELECT public_id, pin_id, caption, uploaded_at, secure_url, sort_order
		FROM pin_images`)
	if err != nil {
		return fmt.Errorf("query: %w", err)
	}
	defer rows.Close()

	count := 0
	for rows.Next() {
		var (
			publicID, pinID, caption, secureURL string
			uploadedAtRaw                       string
			sortOrder                           int
		)
		if err := rows.Scan(&publicID, &pinID, &caption, &uploadedAtRaw, &secureURL, &sortOrder); err != nil {
			return fmt.Errorf("scan: %w", err)
		}
		uploadedAt := parseTime(uploadedAtRaw)

		_, err := pg.Exec(ctx, `
			INSERT INTO pin_images (public_id, pin_id, caption, uploaded_at, secure_url, sort_order)
			VALUES ($1, $2, $3, $4, $5, $6)
			ON CONFLICT (public_id) DO NOTHING`,
			publicID, pinID, caption, uploadedAt, secureURL, sortOrder,
		)
		if err != nil {
			return fmt.Errorf("insert image %s: %w", publicID, err)
		}
		count++
	}
	if err := rows.Err(); err != nil {
		return err
	}
	log.Printf("pin_images: %d rows processed", count)
	return nil
}

func migrateBlogPosts(ctx context.Context, sqlite *sql.DB, pg *pgx.Conn) error {
	rows, err := sqlite.QueryContext(ctx, `
		SELECT id, slug, title, excerpt, content, published, created_at, updated_at
		FROM blog_posts`)
	if err != nil {
		return fmt.Errorf("query: %w", err)
	}
	defer rows.Close()

	count := 0
	for rows.Next() {
		var (
			id, slug, title, excerpt, content string
			published                         int
			createdAtRaw, updatedAtRaw        string
		)
		if err := rows.Scan(&id, &slug, &title, &excerpt, &content, &published, &createdAtRaw, &updatedAtRaw); err != nil {
			return fmt.Errorf("scan: %w", err)
		}
		createdAt := parseTime(createdAtRaw)
		updatedAt := parseTime(updatedAtRaw)

		_, err := pg.Exec(ctx, `
			INSERT INTO blog_posts (id, slug, title, excerpt, content, published, created_at, updated_at)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
			ON CONFLICT (id) DO NOTHING`,
			id, slug, title, excerpt, content, published == 1, createdAt, updatedAt,
		)
		if err != nil {
			return fmt.Errorf("insert post %s: %w", id, err)
		}
		count++
	}
	if err := rows.Err(); err != nil {
		return err
	}
	log.Printf("blog_posts: %d rows processed", count)
	return nil
}

// parseTime handles the two datetime formats SQLite commonly stores:
// "2006-01-02 15:04:05" and "2006-01-02T15:04:05Z".
func parseTime(s string) time.Time {
	for _, layout := range []string{
		"2006-01-02 15:04:05",
		"2006-01-02T15:04:05Z",
		"2006-01-02T15:04:05-07:00",
	} {
		if t, err := time.Parse(layout, s); err == nil {
			return t
		}
	}
	log.Printf("warning: could not parse time %q, using zero value", s)
	return time.Time{}
}
