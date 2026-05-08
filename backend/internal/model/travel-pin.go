package model

type TravelPin struct {
	ID           string  `json:"id"`
	LocationName string  `json:"locationName"`
	Country      string  `json:"country"`
	Latitude     float64 `json:"latitude"`
	Longitude    float64 `json:"longitude"`
	Images       []Image `json:"images"`
}
