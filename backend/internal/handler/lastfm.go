package handler

import (
	"encoding/json"
	"net/http"

	"lastfm/api/internal/service"
)

type LastFMHandler struct {
	svc *service.LastFMService
}

func NewLastFMHandler(svc *service.LastFMService) *LastFMHandler {
	return &LastFMHandler{svc: svc}
}

// GetRecentTracks handles GET /api/music/recent-tracks
func (h *LastFMHandler) GetRecentTracks(w http.ResponseWriter, r *http.Request) {
	tracks, err := h.svc.GetRecentTracks(10)
	if err != nil {
		http.Error(w, `{"error":"failed to fetch tracks"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(tracks)
}
