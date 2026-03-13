import { useNavBar } from '../hooks/useNavBar'
import { useAboutSection } from '../hooks/useAboutSection'
import Footer from '../components/Footer'

export default function AboutPage() {
  const { nav, mobileMenu } = useNavBar()
  const about = useAboutSection()

  return (
    <>
      {nav}
      {mobileMenu}
      <div className="page-content">
        {about}
      </div>
      <Footer />
    </>
  )
}
