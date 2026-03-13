import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const NAV_ITEMS = [
  { label: 'about', path: '/about' },
  { label: 'education', path: '/education' },
  { label: 'experience', path: '/experience' },
  { label: 'projects', path: '/projects' },
  { label: 'music', path: '/music' },
  { label: 'travels', path: '/travels' },
]

export function useNavBar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))

  const nav = (
    <nav className="nav">
      <Link to="/" className="nav-logo">EP</Link>

      <ul className="nav-links nav-links-desktop">
        {NAV_ITEMS.map(({ label, path }) => (
          <li key={path}>
            <Link to={path} className="nav-link">{label}</Link>
          </li>
        ))}
      </ul>

      <button
        className="theme-toggle"
        onClick={toggleTheme}
        aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
        title={theme === 'dark' ? '蓮 Lotus' : '波 Wave'}
      >
        <span className="theme-pip" />
        {theme === 'dark' ? '波 Wave' : '蓮 Lotus'}
      </button>

      <button
        className="nav-hamburger"
        onClick={() => setMobileOpen((v) => !v)}
        aria-label="Toggle menu"
      >
        <span className={`hamburger-bar${mobileOpen ? ' bar-top-open' : ''}`} />
        <span className={`hamburger-bar${mobileOpen ? ' bar-mid-open' : ''}`} />
        <span className={`hamburger-bar${mobileOpen ? ' bar-bot-open' : ''}`} />
      </button>
    </nav>
  )

  const mobileMenu = mobileOpen ? (
    <div className="mobile-menu">
      {NAV_ITEMS.map(({ label, path }) => (
        <Link
          key={path}
          to={path}
          className="mobile-link"
          onClick={() => setMobileOpen(false)}
        >
          {label}
        </Link>
      ))}
    </div>
  ) : null

  return { nav, mobileMenu }
}
