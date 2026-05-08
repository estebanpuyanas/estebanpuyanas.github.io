import { useInView } from '../../hooks/useInView'
import { useLastFM } from '../../hooks/useLastFM'
import ScrobbleCarousel from '../ScrobbleCarousel'

export default function MusicSection() {
  const ref = useInView()
  const { tracks, loading, fetching, error, lastUpdated, loadMore, refresh, canLoadMore } = useLastFM()

  return (
    <section id="music" ref={ref as React.RefObject<HTMLElement>}>
      <div className="section-wrapper">
        <p className="section-label" data-inview>
          // music
        </p>

        {loading && (
          <p className="music-status" data-inview>loading...</p>
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
            onRefresh={refresh}
            canLoadMore={canLoadMore}
          />
        )}
      </div>
    </section>
  )
}
