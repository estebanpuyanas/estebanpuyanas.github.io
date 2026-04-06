package service

import (
	"encoding/json"
	"fmt"
	"net/http"

	"lastfm/api/internal/model"
)

const lastFMBaseURL = "https://ws.audioscrobbler.com/2.0/"

type LastFMService struct {
	apiKey   string
	username string
}

func NewLastFMService(apiKey, username string) *LastFMService {
	return &LastFMService{apiKey: apiKey, username: username}
}

// GetRecentTracks fetches the last `limit` scrobbled tracks for the configured user.
func (s *LastFMService) GetRecentTracks(limit int) ([]model.Track, error) {
	url := fmt.Sprintf(
		"%s?method=user.getrecenttracks&user=%s&api_key=%s&format=json&limit=%d",
		lastFMBaseURL, s.username, s.apiKey, limit,
	)

	resp, err := http.Get(url) //nolint:gosec
	if err != nil {
		return nil, fmt.Errorf("failed to call Last.fm API: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("Last.fm API returned status %d", resp.StatusCode)
	}

	var raw model.LastFMRecentTracksResponse
	if err := json.NewDecoder(resp.Body).Decode(&raw); err != nil {
		return nil, fmt.Errorf("failed to decode Last.fm response: %w", err)
	}

	tracks := make([]model.Track, 0, len(raw.RecentTracks.Tracks))
	for _, t := range raw.RecentTracks.Tracks {
		track := model.Track{
			Name:   t.Name,
			Artist: t.Artist.Name,
			Album:  t.Album.Name,
		}

		// Pick the largest available image.
		for _, img := range t.Images {
			if img.Size == "extralarge" {
				track.ImageURL = img.URL
				break
			}
		}

		// @attr.nowplaying is "true" (string) when the track is live.
		if t.Attr != nil && t.Attr.NowPlaying == "true" {
			track.NowPlaying = true
		}

		if t.Date != nil {
			track.PlayedAt = t.Date.Text
		}

		tracks = append(tracks, track)
	}

	return tracks, nil
}
