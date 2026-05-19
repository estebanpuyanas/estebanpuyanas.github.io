package model

type TravelPin struct {
	ID           string  `json:"id"`
	LocationName string  `json:"locationName"`
	Country      string  `json:"country"`
	Latitude     float64 `json:"latitude"`
	Longitude    float64 `json:"longitude"`
	Images       []Image `json:"images"`
}

type CreatePinRequest struct {
	LocationName     string  `json:"locationName"`
	Country          string  `json:"country"`
	Latitude         float64 `json:"latitude"`
	Longitude        float64 `json:"longitude"`
	CloudinaryFolder string  `json:"cloudinaryFolder"`
}

type UpdateCaptionRequest struct {
	PublicID string `json:"publicId"`
	Caption  string `json:"caption"`
}
