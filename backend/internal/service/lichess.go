package service

import (
	"bufio"
	"encoding/json"
	"fmt"
	"net/http"
	"sync"
	"time"

	"lastfm/api/internal/model"
)

const lichessBaseURL = "https://lichess.org/api"

const (
	activityCacheTTL = 55 * time.Minute
	userCacheTTL     = 5 * time.Minute
)

type LichessService struct {
	username   string
	httpClient *http.Client

	activityMu   sync.RWMutex
	activityDays []model.LichessActivityDay
	activityAt   time.Time

	userMu  sync.RWMutex
	userVal *model.LichessUser
	userAt  time.Time

	// Closed once the initial activity prewarm completes (success or failure).
	// Subsequent reads on a closed channel return immediately, so all callers
	// that arrive after the first fetch never block here.
	prewarmDone chan struct{}
}

func NewLichessService(username string) *LichessService {
	s := &LichessService{
		username:    username,
		httpClient:  &http.Client{Timeout: 120 * time.Second},
		prewarmDone: make(chan struct{}),
	}
	go s.prewarmAndRefresh()
	return s
}

// prewarmAndRefresh fetches activity once at startup, signals prewarmDone,
// then refreshes on a ticker so the cache never goes stale mid-session.
func (s *LichessService) prewarmAndRefresh() {
	s.refreshActivity()
	close(s.prewarmDone)

	ticker := time.NewTicker(activityCacheTTL)
	defer ticker.Stop()
	for range ticker.C {
		s.refreshActivity()
	}
}

func (s *LichessService) refreshActivity() {
	days, err := s.fetchActivity()
	if err != nil {
		return
	}
	s.activityMu.Lock()
	s.activityDays = days
	s.activityAt = time.Now()
	s.activityMu.Unlock()
}

// GetActivity returns per-day game counts for the rolling 52-week heatmap.
//
// Hot path (cache populated): returns immediately from memory.
// Stale path (TTL exceeded but cache exists): returns old data immediately;
//
//	the background ticker is already fetching fresh data.
//
// Cold path (server just started, prewarm still running): blocks until the
//
//	initial fetch completes, then returns the result.
func (s *LichessService) GetActivity() ([]model.LichessActivityDay, error) {
	s.activityMu.RLock()
	hasCache := s.activityDays != nil
	s.activityMu.RUnlock()

	if !hasCache {
		// Block until the prewarm goroutine finishes its first fetch.
		// After close(), every subsequent read returns immediately.
		<-s.prewarmDone
	}

	s.activityMu.RLock()
	days := s.activityDays
	s.activityMu.RUnlock()

	if days != nil {
		return days, nil
	}

	// Prewarm failed (Lichess unreachable at startup) — try once synchronously.
	return s.fetchActivity()
}

// GetUser fetches user performance stats with a 5-minute in-memory cache.
// Returns stale data on fetch error rather than propagating the failure.
func (s *LichessService) GetUser() (*model.LichessUser, error) {
	s.userMu.RLock()
	if s.userVal != nil && time.Since(s.userAt) < userCacheTTL {
		u := s.userVal
		s.userMu.RUnlock()
		return u, nil
	}
	s.userMu.RUnlock()

	user, err := s.fetchUser()
	if err != nil {
		s.userMu.RLock()
		stale := s.userVal
		s.userMu.RUnlock()
		if stale != nil {
			return stale, nil
		}
		return nil, err
	}

	s.userMu.Lock()
	s.userVal = user
	s.userAt = time.Now()
	s.userMu.Unlock()
	return user, nil
}

func (s *LichessService) fetchUser() (*model.LichessUser, error) {
	url := fmt.Sprintf("%s/user/%s", lichessBaseURL, s.username)
	req, err := http.NewRequest(http.MethodGet, url, nil)
	if err != nil {
		return nil, fmt.Errorf("lichess build request: %w", err)
	}
	req.Header.Set("Accept", "application/json")

	resp, err := s.httpClient.Do(req)
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

func (s *LichessService) fetchActivity() ([]model.LichessActivityDay, error) {
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

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("lichess activity fetch: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("lichess games API returned %d", resp.StatusCode)
	}

	dayCounts := make(map[string]int)
	scanner := bufio.NewScanner(resp.Body)
	scanner.Buffer(make([]byte, 512*1024), 512*1024)
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

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("lichess recent games fetch: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("lichess games API returned %d", resp.StatusCode)
	}

	var games []model.LichessGame
	scanner := bufio.NewScanner(resp.Body)
	scanner.Buffer(make([]byte, 512*1024), 512*1024)
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
