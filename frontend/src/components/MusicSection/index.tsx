import { useInView } from "../../hooks/useInView";
import { useLastFM } from "../../hooks/useLastFM";
import { useSlowLoad } from "../../hooks/useSlowLoad";
import ScrobbleCarousel from "../ScrobbleCarousel";

export default function MusicSection() {
  const ref = useInView();
  const {
    tracks,
    loading,
    fetching,
    error,
    lastUpdated,
    loadMore,
    canLoadMore,
  } = useLastFM();
  const slow = useSlowLoad(loading);

  return (
    <section id="music" ref={ref as React.RefObject<HTMLElement>}>
      <div className="section-wrapper section-wrapper--music">
        <p className="section-label" data-inview>
          // music
        </p>

        {loading && (
          <p className="music-status" data-inview>
            loading...
            {slow && (
              <span className="slow-hint">
                This runs on a free-tier server that sleeps when idle — the
                first load can take up to a minute.
              </span>
            )}
          </p>
        )}
        {error && (
          <p className="music-status music-status--error" data-inview>
            could not load scrobbles.
          </p>
        )}
        {!loading && !error && (
          <ScrobbleCarousel
            tracks={tracks}
            fetching={fetching}
            lastUpdated={lastUpdated}
            onLoadMore={loadMore}
            canLoadMore={canLoadMore}
          />
        )}
      </div>
    </section>
  );
}
