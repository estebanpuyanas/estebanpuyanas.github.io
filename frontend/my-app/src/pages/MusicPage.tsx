import { useNavBar } from '../hooks/useNavBar'
import { useMusicSection } from '../hooks/useMusicSection'
import Footer from '../components/Footer'

export default function MusicPage() {
  const { nav, mobileMenu } = useNavBar()
  const music = useMusicSection()

  return (
    <>
      {nav}
      {mobileMenu}
      <div className="page-content">
        {music}
      </div>
      <Footer />
    </>
  )
}
