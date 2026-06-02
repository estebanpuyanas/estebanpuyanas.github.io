package handler

import (
	"encoding/json"
	"net/http"

	"lastfm/api/internal/model"
	"lastfm/api/internal/service"
)

type BlogHandler struct {
	svc *service.BlogService
}

func NewBlogHandler(svc *service.BlogService) *BlogHandler {
	return &BlogHandler{svc: svc}
}

func (h *BlogHandler) GetPublishedPosts(w http.ResponseWriter, r *http.Request) {
	posts, err := h.svc.GetPublishedPosts(r.Context())
	if err != nil {
		http.Error(w, `{"error":"failed to fetch posts"}`, http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(posts)
}

func (h *BlogHandler) GetPublishedPost(w http.ResponseWriter, r *http.Request) {
	slug := r.PathValue("slug")
	if slug == "" {
		http.Error(w, `{"error":"missing slug"}`, http.StatusBadRequest)
		return
	}
	post, err := h.svc.GetPublishedPost(r.Context(), slug)
	if err != nil {
		if err.Error() == "post not found" {
			http.Error(w, `{"error":"post not found"}`, http.StatusNotFound)
		} else {
			http.Error(w, `{"error":"failed to fetch post"}`, http.StatusInternalServerError)
		}
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(post)
}

func (h *BlogHandler) GetAllPosts(w http.ResponseWriter, r *http.Request) {
	posts, err := h.svc.GetAllPosts(r.Context())
	if err != nil {
		http.Error(w, `{"error":"failed to fetch posts"}`, http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(posts)
}

func (h *BlogHandler) GetPost(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		http.Error(w, `{"error":"missing id"}`, http.StatusBadRequest)
		return
	}
	post, err := h.svc.GetPostByID(r.Context(), id)
	if err != nil {
		if err.Error() == "post not found" {
			http.Error(w, `{"error":"post not found"}`, http.StatusNotFound)
		} else {
			http.Error(w, `{"error":"failed to fetch post"}`, http.StatusInternalServerError)
		}
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(post)
}

func (h *BlogHandler) CreatePost(w http.ResponseWriter, r *http.Request) {
	var req model.CreatePostRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"invalid request body"}`, http.StatusBadRequest)
		return
	}
	post, err := h.svc.CreatePost(r.Context(), req)
	if err != nil {
		if err.Error() == "slug and title are required" {
			http.Error(w, `{"error":"slug and title are required"}`, http.StatusBadRequest)
		} else if err.Error() == "slug already exists" {
			http.Error(w, `{"error":"slug already exists"}`, http.StatusConflict)
		} else {
			http.Error(w, `{"error":"failed to create post"}`, http.StatusInternalServerError)
		}
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(post)
}

func (h *BlogHandler) UpdatePost(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		http.Error(w, `{"error":"missing id"}`, http.StatusBadRequest)
		return
	}
	var req model.UpdatePostRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"invalid request body"}`, http.StatusBadRequest)
		return
	}
	post, err := h.svc.UpdatePost(r.Context(), id, req)
	if err != nil {
		if err.Error() == "post not found" {
			http.Error(w, `{"error":"post not found"}`, http.StatusNotFound)
		} else if err.Error() == "slug and title are required" {
			http.Error(w, `{"error":"slug and title are required"}`, http.StatusBadRequest)
		} else if err.Error() == "slug already exists" {
			http.Error(w, `{"error":"slug already exists"}`, http.StatusConflict)
		} else {
			http.Error(w, `{"error":"failed to update post"}`, http.StatusInternalServerError)
		}
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(post)
}

func (h *BlogHandler) DeletePost(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		http.Error(w, `{"error":"missing id"}`, http.StatusBadRequest)
		return
	}
	if err := h.svc.DeletePost(r.Context(), id); err != nil {
		if err.Error() == "post not found" {
			http.Error(w, `{"error":"post not found"}`, http.StatusNotFound)
		} else {
			http.Error(w, `{"error":"failed to delete post"}`, http.StatusInternalServerError)
		}
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *BlogHandler) SetPublished(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		http.Error(w, `{"error":"missing id"}`, http.StatusBadRequest)
		return
	}
	var req model.SetPublishedRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"invalid request body"}`, http.StatusBadRequest)
		return
	}
	if err := h.svc.SetPublished(r.Context(), id, req.Published); err != nil {
		if err.Error() == "post not found" {
			http.Error(w, `{"error":"post not found"}`, http.StatusNotFound)
		} else {
			http.Error(w, `{"error":"failed to update post"}`, http.StatusInternalServerError)
		}
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
