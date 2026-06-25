package model

// LichessPerf holds per-time-control performance stats.
type LichessPerf struct {
	Games  int  `json:"games"`
	Rating int  `json:"rating"`
	Rd     int  `json:"rd"`
	Prog   int  `json:"prog"`
	Prov   bool `json:"prov,omitempty"`
}

type LichessUser struct {
	Perfs struct {
		Bullet    *LichessPerf `json:"bullet,omitempty"`
		Blitz     *LichessPerf `json:"blitz,omitempty"`
		Rapid     *LichessPerf `json:"rapid,omitempty"`
		Classical *LichessPerf `json:"classical,omitempty"`
		Puzzle    *LichessPerf `json:"puzzle,omitempty"`
	} `json:"perfs"`
	Count struct {
		All   int `json:"all"`
		Rated int `json:"rated"`
		Win   int `json:"win"`
		Loss  int `json:"loss"`
		Draw  int `json:"draw"`
	} `json:"count"`
}

// LichessActivityDay is one day of aggregated game counts for the heatmap.
type LichessActivityDay struct {
	Date  string `json:"date"`
	Games int    `json:"games"`
}

// LichessGame is the clean output shape for a single game in the recent games list.
// Result and OpponentName are pre-computed by the service so the frontend needs no username.
type LichessGame struct {
	ID           string `json:"id"`
	Speed        string `json:"speed"`
	CreatedAt    int64  `json:"createdAt"`
	Result       string `json:"result"`
	OpponentName string `json:"opponentName"`
	Opening      string `json:"opening,omitempty"`
}

// LichessRawPlayer is the raw player object inside a Lichess NDJSON game.
type LichessRawPlayer struct {
	User *struct {
		Name string `json:"name"`
		ID   string `json:"id"`
	} `json:"user,omitempty"`
	Rating int `json:"rating,omitempty"`
}

// LichessRawGame is one NDJSON line from GET /api/games/user/{username}.
type LichessRawGame struct {
	ID        string `json:"id"`
	Speed     string `json:"speed"`
	CreatedAt int64  `json:"createdAt"`
	Winner    string `json:"winner,omitempty"` // "white" | "black"; absent for draws
	Opening   *struct {
		Name string `json:"name"`
	} `json:"opening,omitempty"`
	Players struct {
		White LichessRawPlayer `json:"white"`
		Black LichessRawPlayer `json:"black"`
	} `json:"players"`
}
