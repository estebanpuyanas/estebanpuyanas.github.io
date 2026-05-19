package handler

import (
	"encoding/json"
	"net/http"
	"os"
	"strings"

	"lastfm/api/internal/model"
	"lastfm/api/internal/service"
)

type TravelPinHandler struct {
	svc *service.TravelPinService
}

func NewTravelPinHandler(svc *service.TravelPinService) *TravelPinHandler {
	return &TravelPinHandler{svc: svc}
}

func (h *TravelPinHandler) GetAllPins(w http.ResponseWriter, r *http.Request) {
	pins, err := h.svc.GetAllPins(r.Context())
	if err != nil {
		http.Error(w, `{"error":"failed to fetch travel pins"}`, http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(pins)
}

func (h *TravelPinHandler) CreatePin(w http.ResponseWriter, r *http.Request) {
	var req model.CreatePinRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"invalid request body"}`, http.StatusBadRequest)
		return
	}
	if req.LocationName == "" || req.Country == "" || req.CloudinaryFolder == "" {
		http.Error(w, `{"error":"locationName, country, and cloudinaryFolder are required"}`, http.StatusBadRequest)
		return
	}

	pin, err := h.svc.CreatePin(r.Context(), req)
	if err != nil {
		http.Error(w, `{"error":"failed to create pin"}`, http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(pin)
}

func (h *TravelPinHandler) GetPinImages(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		http.Error(w, `{"error":"missing pin id"}`, http.StatusBadRequest)
		return
	}
	images, err := h.svc.GetPinImages(r.Context(), id)
	if err != nil {
		if err.Error() == "pin not found" {
			http.Error(w, `{"error":"pin not found"}`, http.StatusNotFound)
		} else {
			http.Error(w, `{"error":"failed to fetch images"}`, http.StatusInternalServerError)
		}
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(images)
}

func (h *TravelPinHandler) DeletePin(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		http.Error(w, `{"error":"missing pin id"}`, http.StatusBadRequest)
		return
	}
	if err := h.svc.DeletePin(r.Context(), id); err != nil {
		if err.Error() == "pin not found" {
			http.Error(w, `{"error":"pin not found"}`, http.StatusNotFound)
		} else {
			http.Error(w, `{"error":"failed to delete pin"}`, http.StatusInternalServerError)
		}
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *TravelPinHandler) UploadPinImage(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		http.Error(w, `{"error":"missing pin id"}`, http.StatusBadRequest)
		return
	}
	if err := r.ParseMultipartForm(10 << 20); err != nil {
		http.Error(w, `{"error":"invalid multipart form (max 10 MB)"}`, http.StatusBadRequest)
		return
	}
	file, _, err := r.FormFile("image")
	if err != nil {
		http.Error(w, `{"error":"missing image field in form"}`, http.StatusBadRequest)
		return
	}
	defer file.Close()

	image, err := h.svc.UploadPinImage(r.Context(), id, file)
	if err != nil {
		if err.Error() == "pin not found" {
			http.Error(w, `{"error":"pin not found"}`, http.StatusNotFound)
		} else {
			http.Error(w, `{"error":"failed to upload image"}`, http.StatusInternalServerError)
		}
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(image)
}

func (h *TravelPinHandler) GetCloudinaryFolders(w http.ResponseWriter, r *http.Request) {
	folders, err := h.svc.GetCloudinaryFolders(r.Context())
	if err != nil {
		http.Error(w, `{"error":"failed to list folders"}`, http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(folders)
}

// AdminMiddleware rejects requests that don't carry the correct bearer token.
func AdminMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		token := os.Getenv("ADMIN_TOKEN")
		if token == "" {
			http.Error(w, `{"error":"admin not configured"}`, http.StatusInternalServerError)
			return
		}
		auth := r.Header.Get("Authorization")
		if !strings.HasPrefix(auth, "Bearer ") || strings.TrimPrefix(auth, "Bearer ") != token {
			w.Header().Set("Content-Type", "application/json")
			http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
			return
		}
		next(w, r)
	}
}
