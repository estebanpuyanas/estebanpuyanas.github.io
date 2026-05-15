package main

import (
	"log"
	"net/http"
	"os"

	"github.com/joho/godotenv"

	"lastfm/api/internal/cloudinary"
	"lastfm/api/internal/db"
	"lastfm/api/internal/handler"
	"lastfm/api/internal/service"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("no .env file found, reading from environment")
	}

	lastFMAPIKey := os.Getenv("LASTFM_API_KEY")
	lastFMUsername := os.Getenv("LASTFM_USERNAME")
	if lastFMAPIKey == "" || lastFMUsername == "" {
		log.Fatal("LASTFM_API_KEY and LASTFM_USERNAME must be set")
	}

	database, err := db.Open("./travels.db")
	if err != nil {
		log.Fatalf("failed to open database: %v", err)
	}
	defer database.Close()

	cloudinaryCloudName := os.Getenv("CLOUDINARY_CLOUD_NAME")
	cloudinaryAPIKey := os.Getenv("CLOUDINARY_API_KEY")
	cloudinaryAPISecret := os.Getenv("CLOUDINARY_API_SECRET")
	if cloudinaryCloudName == "" || cloudinaryAPIKey == "" || cloudinaryAPISecret == "" {
		log.Println("warning: Cloudinary env vars not set — pin images unavailable")
	}

	cloudinarySvc, err := cloudinary.NewCloudinaryService(cloudinaryCloudName, cloudinaryAPIKey, cloudinaryAPISecret)
	if err != nil {
		log.Fatalf("failed to initialize Cloudinary: %v", err)
	}

	lastfmSvc := service.NewLastFMService(lastFMAPIKey, lastFMUsername)
	lastfmHandler := handler.NewLastFMHandler(lastfmSvc)

	travelPinSvc := service.NewTravelPinService(database, cloudinarySvc)
	travelPinHandler := handler.NewTravelPinHandler(travelPinSvc)

	mux := http.NewServeMux()
	mux.HandleFunc("GET /api/music/recent-tracks", lastfmHandler.GetRecentTracks)
	mux.HandleFunc("GET /api/travel/pins", travelPinHandler.GetAllPins)
	mux.HandleFunc("POST /api/travel/pins", handler.AdminMiddleware(travelPinHandler.CreatePin))

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("server listening on :%s", port)
	if err := http.ListenAndServe(":"+port, corsMiddleware(mux)); err != nil {
		log.Fatalf("server error: %v", err)
	}
}

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}
