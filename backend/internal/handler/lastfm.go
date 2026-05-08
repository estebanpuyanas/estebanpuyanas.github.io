package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

	"lastfm/api/internal/service"
)

type LastFMHandler struct {
	svc *service.LastFMService
}

func NewLastFMHandler(svc *service.LastFMService) *LastFMHandler {
	return &LastFMHandler{svc: svc}
}

// GetRecentTracks handles GET /api/music/recent-tracks?limit=N (default 10, max 50)
func (h *LastFMHandler) GetRecentTracks(w http.ResponseWriter, r *http.Request) {
	limit := 10
	if s := r.URL.Query().Get("limit"); s != "" {
		if n, err := strconv.Atoi(s); err == nil && n > 0 && n <= 50 {
			limit = n
		}
	}
	tracks, err := h.svc.GetRecentTracks(limit)
	if err != nil {
		http.Error(w, `{"error":"failed to fetch tracks"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Cache-Control", "no-store")
	json.NewEncoder(w).Encode(tracks)
}
