import { useNavBar } from '../hooks/useNavBar'
import Footer from '../components/Footer'

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
        </section>
      </div>
      <Footer />
    </>
  )
}
