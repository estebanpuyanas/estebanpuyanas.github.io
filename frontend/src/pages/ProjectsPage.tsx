import { useNavBar } from '../hooks/useNavBar'
import { useProjectsSection } from '../hooks/useProjectsSection'
import Footer from '../components/Footer'

export default function ProjectsPage() {
  const { nav, mobileMenu } = useNavBar()
  const projects = useProjectsSection()

  return (
    <>
      {nav}
      {mobileMenu}
      <div className="page-content">
        {projects}
      </div>
      <Footer />
    </>
  )
}
