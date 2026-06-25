package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

	"lastfm/api/internal/service"
)

type LichessHandler struct {
	svc *service.LichessService
}

func NewLichessHandler(svc *service.LichessService) *LichessHandler {
	return &LichessHandler{svc: svc}
}

// GetUser handles GET /api/chess/user
func (h *LichessHandler) GetUser(w http.ResponseWriter, r *http.Request) {
	user, err := h.svc.GetUser()
	if err != nil {
		http.Error(w, `{"error":"failed to fetch chess user"}`, http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Cache-Control", "public, max-age=300")
	json.NewEncoder(w).Encode(user)
}

// GetActivity handles GET /api/chess/activity
// Returns per-day game counts for the rolling 52-week heatmap window.
func (h *LichessHandler) GetActivity(w http.ResponseWriter, r *http.Request) {
	days, err := h.svc.GetActivity()
	if err != nil {
		http.Error(w, `{"error":"failed to fetch chess activity"}`, http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Cache-Control", "public, max-age=3600")
	json.NewEncoder(w).Encode(days)
}

// GetRecentGames handles GET /api/chess/recent-games?max=N (default 5, max 20)
func (h *LichessHandler) GetRecentGames(w http.ResponseWriter, r *http.Request) {
	max := 5
	if s := r.URL.Query().Get("max"); s != "" {
		if n, err := strconv.Atoi(s); err == nil && n > 0 && n <= 20 {
			max = n
		}
	}
	games, err := h.svc.GetRecentGames(max)
	if err != nil {
		http.Error(w, `{"error":"failed to fetch recent games"}`, http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Cache-Control", "no-store")
	json.NewEncoder(w).Encode(games)
}
