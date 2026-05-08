import { useNavBar } from '../hooks/useNavBar'
import Footer from '../components/Footer'
import TravelsMap, { type TravelMarker } from '../components/TravelsMap'

const MARKERS: TravelMarker[] = []

export default function TravelsPage() {
  const { nav, mobileMenu } = useNavBar()

  return (
    <>
      {nav}
      {mobileMenu}
      <div className="page-content">
        <TravelsMap
          label="// travels"
          markers={MARKERS}
          onMarkerClick={(marker) => {
            console.log('marker clicked:', marker)
          }}
        />
      </div>
      <Footer />
    </>
  )
}
