import { useNavBar } from '../hooks/useNavBar'
import { useExperienceSection } from '../hooks/useExperienceSection'
import Footer from '../components/Footer'

export default function ExperiencePage() {
  const { nav, mobileMenu } = useNavBar()
  const experience = useExperienceSection()

  return (
    <>
      {nav}
      {mobileMenu}
      <div className="page-content">
        {experience}
      </div>
      <Footer />
    </>
  )
}
