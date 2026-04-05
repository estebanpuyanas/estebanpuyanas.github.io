package main

import (
	"log"
	"net/http"
	"os"

	"github.com/joho/godotenv"

	"lastfm/api/internal/handler"
	"lastfm/api/internal/service"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("no .env file found, reading from environment")
	}

	apiKey := os.Getenv("LASTFM_API_KEY")
	username := os.Getenv("LASTFM_USERNAME")

	if apiKey == "" || username == "" {
		log.Fatal("LASTFM_API_KEY and LASTFM_USERNAME must be set")
	}

	lastfmSvc := service.NewLastFMService(apiKey, username)
	lastfmHandler := handler.NewLastFMHandler(lastfmSvc)

	mux := http.NewServeMux()
	mux.HandleFunc("GET /api/music/recent-tracks", lastfmHandler.GetRecentTracks)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("server listening on :%s", port)
	if err := http.ListenAndServe(":"+port, corsMiddleware(mux)); err != nil {
		log.Fatalf("server error: %v", err)
	}
}

// corsMiddleware allows requests from the frontend dev server and production origin.
func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}
