package service

import (
	"bufio"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"lastfm/api/internal/model"
)

const lichessBaseURL = "https://lichess.org/api"

type LichessService struct {
	username string
}

func NewLichessService(username string) *LichessService {
	return &LichessService{username: username}
}

// GetUser fetches the user's performance stats and total game counts.
func (s *LichessService) GetUser() (*model.LichessUser, error) {
	url := fmt.Sprintf("%s/user/%s", lichessBaseURL, s.username)
	req, err := http.NewRequest(http.MethodGet, url, nil)
	if err != nil {
		return nil, fmt.Errorf("lichess build request: %w", err)
	}
	req.Header.Set("Accept", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("lichess user fetch: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("lichess user API returned %d", resp.StatusCode)
	}

	var user model.LichessUser
	if err := json.NewDecoder(resp.Body).Decode(&user); err != nil {
		return nil, fmt.Errorf("lichess user decode: %w", err)
	}
	return &user, nil
}

// GetActivity fetches games for the rolling 52-week window and returns
// per-day game counts — the same data shape the GitHub contribution heatmap uses.
func (s *LichessService) GetActivity() ([]model.LichessActivityDay, error) {
	since := time.Now().Add(-52 * 7 * 24 * time.Hour).UnixMilli()
	url := fmt.Sprintf(
		"%s/games/user/%s?since=%d&moves=false&clocks=false&evals=false&opening=false",
		lichessBaseURL, s.username, since,
	)

	req, err := http.NewRequest(http.MethodGet, url, nil)
	if err != nil {
		return nil, fmt.Errorf("lichess build request: %w", err)
	}
	req.Header.Set("Accept", "application/x-ndjson")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("lichess activity fetch: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("lichess games API returned %d", resp.StatusCode)
	}

	dayCounts := make(map[string]int)
	scanner := bufio.NewScanner(resp.Body)
	for scanner.Scan() {
		line := scanner.Bytes()
		if len(line) == 0 {
			continue
		}
		var g struct {
			CreatedAt int64 `json:"createdAt"`
		}
		if err := json.Unmarshal(line, &g); err != nil {
			continue
		}
		date := time.UnixMilli(g.CreatedAt).UTC().Format("2006-01-02")
		dayCounts[date]++
	}
	if err := scanner.Err(); err != nil {
		return nil, fmt.Errorf("lichess activity scan: %w", err)
	}

	days := make([]model.LichessActivityDay, 0, len(dayCounts))
	for date, count := range dayCounts {
		days = append(days, model.LichessActivityDay{Date: date, Games: count})
	}
	return days, nil
}

// GetRecentGames fetches the last `max` games and pre-computes result and opponent
// so the frontend does not need to know the username.
func (s *LichessService) GetRecentGames(max int) ([]model.LichessGame, error) {
	url := fmt.Sprintf(
		"%s/games/user/%s?max=%d&opening=true&moves=false&clocks=false&evals=false",
		lichessBaseURL, s.username, max,
	)

	req, err := http.NewRequest(http.MethodGet, url, nil)
	if err != nil {
		return nil, fmt.Errorf("lichess build request: %w", err)
	}
	req.Header.Set("Accept", "application/x-ndjson")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("lichess recent games fetch: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("lichess games API returned %d", resp.StatusCode)
	}

	var games []model.LichessGame
	scanner := bufio.NewScanner(resp.Body)
	for scanner.Scan() {
		line := scanner.Bytes()
		if len(line) == 0 {
			continue
		}
		var raw model.LichessRawGame
		if err := json.Unmarshal(line, &raw); err != nil {
			continue
		}
		games = append(games, s.mapGame(raw))
	}
	if err := scanner.Err(); err != nil {
		return nil, fmt.Errorf("lichess recent games scan: %w", err)
	}
	return games, nil
}

func (s *LichessService) mapGame(raw model.LichessRawGame) model.LichessGame {
	result := "draw"
	if raw.Winner != "" {
		isWhite := raw.Players.White.User != nil && raw.Players.White.User.ID == s.username
		myColor := "black"
		if isWhite {
			myColor = "white"
		}
		if raw.Winner == myColor {
			result = "win"
		} else {
			result = "loss"
		}
	}

	opponentName := "Anon"
	isWhite := raw.Players.White.User != nil && raw.Players.White.User.ID == s.username
	opp := raw.Players.Black
	if !isWhite {
		opp = raw.Players.White
	}
	if opp.User != nil {
		opponentName = opp.User.Name
	}

	opening := ""
	if raw.Opening != nil {
		opening = raw.Opening.Name
	}

	return model.LichessGame{
		ID:           raw.ID,
		Speed:        raw.Speed,
		CreatedAt:    raw.CreatedAt,
		Result:       result,
		OpponentName: opponentName,
		Opening:      opening,
	}
}
