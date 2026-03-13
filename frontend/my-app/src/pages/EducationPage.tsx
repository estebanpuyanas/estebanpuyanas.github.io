import { useNavBar } from '../hooks/useNavBar'
import { useEducationSection } from '../hooks/useEducationSection'
import Footer from '../components/Footer'

export default function EducationPage() {
  const { nav, mobileMenu } = useNavBar()
  const education = useEducationSection()

  return (
    <>
      {nav}
      {mobileMenu}
      <div className="page-content">
        {education}
      </div>
      <Footer />
    </>
  )
}
