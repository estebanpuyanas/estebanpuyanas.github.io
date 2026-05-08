package handler

import (
	"encoding/json"
	"net/http"

	"lastfm/api/internal/service"
)

type TravelPinHandler struct {
	svc *service.TravelPinService
}

func NewTravelPinHandler(svc *service.TravelPinService) *TravelPinHandler {
	return &TravelPinHandler{svc: svc}
}

// GetAllPins handles GET /api/travel/pins
func (h *TravelPinHandler) GetAllPins(w http.ResponseWriter, r *http.Request) {
	pins, err := h.svc.GetAllPins(r.Context())
	if err != nil {
		http.Error(w, `{"error":"failed to fetch travel pins"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(pins)
}
