package model

// These structs mirror the Last.fm API JSON response shape.
// Go uses struct tags (`json:"..."`) to map JSON field names to struct fields.

type LastFMImage struct {
	URL  string `json:"#text"`
	Size string `json:"size"`
}

type LastFMArtist struct {
	Name string `json:"#text"`
}

type LastFMAlbum struct {
	Name string `json:"#text"`
}

type LastFMDate struct {
	UTS  string `json:"uts"`
	Text string `json:"#text"`
}

// NowPlaying is only present on the track if it's currently playing.
type LastFMTrackAttr struct {
	NowPlaying string `json:"nowplaying"`
}

type LastFMTrack struct {
	Name   string           `json:"name"`
	Artist LastFMArtist     `json:"artist"`
	Album  LastFMAlbum      `json:"album"`
	Images []LastFMImage    `json:"image"`
	Date   *LastFMDate      `json:"date,omitempty"` // nil if currently playing
	Attr   *LastFMTrackAttr `json:"@attr,omitempty"`
}

type LastFMRecentTracksResponse struct {
	RecentTracks struct {
		Tracks []LastFMTrack `json:"track"`
	} `json:"recenttracks"`
}

type Track struct {
	Name       string `json:"name"`
	Artist     string `json:"artist"`
	Album      string `json:"album"`
	ImageURL   string `json:"imageUrl"`
	NowPlaying bool   `json:"nowPlaying"`
	PlayedAt   string `json:"playedAt"`
}
