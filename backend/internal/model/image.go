package model

type Image struct {
	CloudinaryPublicID  string `json:"cloudinaryPublicId"`
	CloudinarySecureURL string `json:"cloudinarySecureUrl"`
	Caption             string `json:"caption"`
	UploadedAt          string `json:"uploadedAt"`
}
