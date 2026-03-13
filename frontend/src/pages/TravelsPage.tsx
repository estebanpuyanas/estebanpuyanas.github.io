import { useNavBar } from '../hooks/useNavBar'
import Footer from '../components/Footer'
import TravelsMap, { type TravelMarker } from '../components/TravelsMap'

// Placeholder — replace with real data from backend
const MARKERS: TravelMarker[] = []

export default function TravelsPage() {
  const { nav, mobileMenu } = useNavBar()

  return (
    <>
      {nav}
      {mobileMenu}
      <div className="page-content">
        <section>
          <div className="section-wrapper">
            <p className="section-label">// travels</p>
          </div>
          <TravelsMap
            markers={MARKERS}
            onMarkerClick={(marker) => {
              // TODO: open photo modal/drawer with marker.photos
              console.log('marker clicked:', marker)
            }}
          />
        </section>
      </div>
      <Footer />
    </>
  )
}
