package model

type BlogPost struct {
	ID        string `json:"id"`
	Slug      string `json:"slug"`
	Title     string `json:"title"`
	Excerpt   string `json:"excerpt"`
	Content   string `json:"content"`
	Published bool   `json:"published"`
	CreatedAt string `json:"createdAt"`
	UpdatedAt string `json:"updatedAt"`
}

type CreatePostRequest struct {
	Slug    string `json:"slug"`
	Title   string `json:"title"`
	Excerpt string `json:"excerpt"`
	Content string `json:"content"`
}

type UpdatePostRequest struct {
	Slug      string `json:"slug"`
	Title     string `json:"title"`
	Excerpt   string `json:"excerpt"`
	Content   string `json:"content"`
	Published bool   `json:"published"`
}

type SetPublishedRequest struct {
	Published bool `json:"published"`
}
