import './index.css'
import { useNavBar } from './hooks/useNavBar'
import { useHeroSection } from './hooks/useHeroSection'

export default function App() {
  const { nav, mobileMenu } = useNavBar()
  const hero = useHeroSection()

  return (
    <>
      {nav}
      {mobileMenu}
      {hero}
    </>
  )
}
