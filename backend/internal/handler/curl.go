package handler

import (
	"context"
	"fmt"
	"net/http"
	"strings"
	"unicode/utf8"

	"lastfm/api/internal/model"
	"lastfm/api/internal/service"
)

const (
	ansiReset = "\033[0m"
	ansiBlue  = "\033[38;5;75m"
	ansiCyan  = "\033[38;5;87m"
	ansiGray  = "\033[38;5;241m"
	ansiCream = "\033[38;5;223m"
	ansiGreen = "\033[38;5;120m"
	ansiDim   = "\033[38;5;250m"
	ansiGold  = "\033[38;5;214m"
)

type CurlHandler struct {
	lastfmSvc *service.LastFMService
	travelSvc *service.TravelPinService
}

func NewCurlHandler(lastfmSvc *service.LastFMService, travelSvc *service.TravelPinService) *CurlHandler {
	return &CurlHandler{lastfmSvc: lastfmSvc, travelSvc: travelSvc}
}

func isCurlClient(r *http.Request) bool {
	return strings.HasPrefix(r.Header.Get("User-Agent"), "curl/")
}

func (h *CurlHandler) Index(w http.ResponseWriter, r *http.Request) {
	if !isCurlClient(r) {
		http.Redirect(w, r, "/", http.StatusFound)
		return
	}
	w.Header().Set("Content-Type", "text/plain; charset=utf-8")
	fmt.Fprint(w, buildIndexPage(r.Host))
}

func (h *CurlHandler) Music(w http.ResponseWriter, r *http.Request) {
	if !isCurlClient(r) {
		http.Redirect(w, r, "/", http.StatusFound)
		return
	}
	w.Header().Set("Content-Type", "text/plain; charset=utf-8")
	tracks, err := h.lastfmSvc.GetRecentTracks(10)
	if err != nil {
		fmt.Fprintf(w, "\n  %serror: could not fetch tracks%s\n\n", ansiCyan, ansiReset)
		return
	}
	fmt.Fprint(w, buildMusicPage(tracks))
}

func (h *CurlHandler) Travels(w http.ResponseWriter, r *http.Request) {
	if !isCurlClient(r) {
		http.Redirect(w, r, "/", http.StatusFound)
		return
	}
	w.Header().Set("Content-Type", "text/plain; charset=utf-8")
	pins, err := h.travelSvc.GetAllPins(context.Background())
	if err != nil {
		fmt.Fprintf(w, "\n  %serror: could not fetch pins%s\n\n", ansiCyan, ansiReset)
		return
	}
	fmt.Fprint(w, buildTravelsPage(pins))
}

// padRight pads s with spaces on the right to reach visual width.
// s must not contain ANSI escape codes. Uses rune count so multi-byte
// Unicode characters (e.g. em dash) don't break alignment.
func padRight(s string, width int) string {
	n := utf8.RuneCountInString(s)
	if n >= width {
		return s
	}
	return s + strings.Repeat(" ", width-n)
}

func hr(n int) string {
	return fmt.Sprintf("  %s%s%s\n", ansiGray, strings.Repeat("─", n), ansiReset)
}

func buildIndexPage(host string) string {
	// About box dimensions:
	//   inner (visual content width) = 65
	//   outer (with │ borders)       = 67
	//   top:    ┌─ about  (9) + ─×57 + ┐ = 67
	//   bottom: └ + ─×65 + ┘           = 67
	const aboutInner = 65

	// Links box dimensions:
	//   left inner  = 22, right inner = 36
	//   outer = 1 + 22 + 1 + 36 + 1 = 61
	//   top:    ┌─ links  (9) + ─×14 + ┬ + ─×36 + ┐ = 61
	//   bottom: └ + ─×22 + ┴ + ─×36 + ┘            = 61
	const (
		leftInner  = 22
		rightInner = 36
	)

	var sb strings.Builder

	// ── Logo ──────────────────────────────────────────────────────────────────
	sb.WriteString("\n")
	sb.WriteString(fmt.Sprintf("  %s██████╗  ██████╗ %s\n", ansiBlue, ansiReset))
	sb.WriteString(fmt.Sprintf("  %s██╔════╝ ██╔══██╗%s      %sEsteban Puyana%s\n", ansiBlue, ansiReset, ansiCream, ansiReset))
	sb.WriteString(fmt.Sprintf("  %s█████╗   ██████╔╝%s      %saspiring software engineer%s\n", ansiBlue, ansiReset, ansiDim, ansiReset))
	sb.WriteString(fmt.Sprintf("  %s██╔══╝   ██╔═══╝ %s      %sCS + Philosophy · Northeastern University%s\n", ansiBlue, ansiReset, ansiGray, ansiReset))
	sb.WriteString(fmt.Sprintf("  %s███████╗ ██║      %s      %sBoston, MA%s\n", ansiBlue, ansiReset, ansiGray, ansiReset))
	sb.WriteString(fmt.Sprintf("  %s╚══════╝ ╚═╝%s\n", ansiBlue, ansiReset))
	sb.WriteString("\n")
	sb.WriteString(hr(69))
	sb.WriteString("\n")

	// ── About box ─────────────────────────────────────────────────────────────
	// top: ┌─ about  (9 chars) + ─×57 + ┐
	sb.WriteString(fmt.Sprintf("  %s┌─%s%sabout%s%s┐%s\n",
		ansiGray, ansiReset, ansiCream, ansiReset,
		ansiGray+strings.Repeat("─", 57), ansiReset))

	aboutLine := func(content string) {
		sb.WriteString(fmt.Sprintf("  %s│%s%s%s│%s\n",
			ansiGray, ansiReset,
			padRight(content, aboutInner),
			ansiGray, ansiReset))
	}

	aboutLine("")
	aboutLine("  B.S. Computer Science & Philosophy")
	aboutLine("  Northeastern University, Boston MA")
	aboutLine("")
	aboutLine("  I love solving hard problems at any level of the stack — from")
	aboutLine("  embedded firmware to distributed data infrastructure.")
	aboutLine("  Outside of work: gym, squash, chess, and vinyl.")
	aboutLine("")

	// bottom: └ + ─×65 + ┘
	sb.WriteString(fmt.Sprintf("  %s└%s┘%s\n", ansiGray, strings.Repeat("─", aboutInner), ansiReset))
	sb.WriteString("\n")

	// ── Links box ─────────────────────────────────────────────────────────────
	// top: ┌─ links  (9 chars) + ─×14 + ┬ + ─×36 + ┐
	sb.WriteString(fmt.Sprintf("  %s┌─%s%slinks%s%s┬%s┐%s\n",
		ansiGray, ansiReset, ansiCream, ansiReset,
		ansiGray+strings.Repeat("─", 14),
		strings.Repeat("─", rightInner),
		ansiReset))

	linksLine := func(label, url string) {
		sb.WriteString(fmt.Sprintf("  %s│%s%s%s%s%s│%s%s%s%s%s│%s\n",
			ansiGray, ansiReset,
			ansiCream, padRight(label, leftInner), ansiReset,
			ansiGray, ansiReset,
			ansiCyan, padRight(url, rightInner), ansiReset,
			ansiGray, ansiReset))
	}

	emptyLinksLine := func() {
		sb.WriteString(fmt.Sprintf("  %s│%s%s%s│%s%s%s│%s\n",
			ansiGray, ansiReset,
			strings.Repeat(" ", leftInner),
			ansiGray, ansiReset,
			strings.Repeat(" ", rightInner),
			ansiGray, ansiReset))
	}

	emptyLinksLine()
	linksLine("  GitHub", "  github.com/estebanpuyanas")
	linksLine("  LinkedIn", "  linkedin.com/in/estebanpuyanas")
	emptyLinksLine()

	// bottom: └ + ─×22 + ┴ + ─×36 + ┘
	sb.WriteString(fmt.Sprintf("  %s└%s┴%s┘%s\n",
		ansiGray,
		strings.Repeat("─", leftInner),
		strings.Repeat("─", rightInner),
		ansiReset))
	sb.WriteString("\n")
	sb.WriteString(hr(69))
	sb.WriteString("\n")

	// ── Commands ──────────────────────────────────────────────────────────────
	sb.WriteString(fmt.Sprintf("  %scommands%s\n", ansiCream, ansiReset))
	sb.WriteString("\n")

	cmdLine := func(cmd, desc string) {
		sb.WriteString(fmt.Sprintf("  %s$ curl%s %s%-35s%s  %s%s%s\n",
			ansiGreen, ansiReset,
			ansiDim, cmd, ansiReset,
			ansiGray, desc, ansiReset))
	}

	cmdLine(host, "this page")
	cmdLine(host+"/curl/music", "what i'm listening to right now")
	cmdLine(host+"/curl/travels", "places i've been")
	sb.WriteString("\n")

	return sb.String()
}

func buildMusicPage(tracks []model.Track) string {
	var sb strings.Builder

	sb.WriteString("\n")
	sb.WriteString(fmt.Sprintf("  %srecent scrobbles%s  ·  %slast.fm/user/estebanpuyanas%s\n",
		ansiCream, ansiReset, ansiCyan, ansiReset))
	sb.WriteString("\n")
	sb.WriteString(hr(69))
	sb.WriteString("\n")

	// Show now-playing first if present
	for _, t := range tracks {
		if t.NowPlaying {
			sb.WriteString(fmt.Sprintf("  %s▶ NOW PLAYING%s\n", ansiGold, ansiReset))
			sb.WriteString(fmt.Sprintf("    %s%s%s\n", ansiCream, t.Name, ansiReset))
			sb.WriteString(fmt.Sprintf("    %s%s%s", ansiDim, t.Artist, ansiReset))
			if t.Album != "" {
				sb.WriteString(fmt.Sprintf(" %s·%s %s%s%s", ansiGray, ansiReset, ansiDim, t.Album, ansiReset))
			}
			sb.WriteString("\n\n")
			sb.WriteString(hr(69))
			sb.WriteString("\n")
			break
		}
	}

	n := 1
	for _, t := range tracks {
		if t.NowPlaying {
			continue
		}
		sb.WriteString(fmt.Sprintf("  %s%2d.%s  %s%s%s\n", ansiGray, n, ansiReset, ansiDim, t.Name, ansiReset))
		sb.WriteString(fmt.Sprintf("       %s%s%s", ansiGray, t.Artist, ansiReset))
		if t.Album != "" {
			sb.WriteString(fmt.Sprintf(" %s·%s %s%s%s", ansiGray, ansiReset, ansiGray, t.Album, ansiReset))
		}
		sb.WriteString("\n\n")
		n++
	}

	return sb.String()
}

func buildTravelsPage(pins []model.TravelPin) string {
	var sb strings.Builder

	sb.WriteString("\n")
	sb.WriteString(fmt.Sprintf("  %stravel pins%s  ·  %s%d places%s\n",
		ansiCream, ansiReset, ansiDim, len(pins), ansiReset))
	sb.WriteString("\n")
	sb.WriteString(hr(69))
	sb.WriteString("\n")

	for _, p := range pins {
		sb.WriteString(fmt.Sprintf("  %s>%s  %s%s%s, %s%s%s\n",
			ansiGreen, ansiReset,
			ansiDim, p.LocationName, ansiReset,
			ansiGray, p.Country, ansiReset))
	}

	sb.WriteString("\n")
	return sb.String()
}
