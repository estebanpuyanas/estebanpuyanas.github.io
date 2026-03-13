import { useState, useEffect } from 'react'
import { useInView } from './useInView'
import ProjectCard from '../components/ProjectCard'

interface GitHubRepo {
  id: number
  name: string
  description: string | null
  html_url: string
  updated_at: string
  language: string | null
  fork: boolean
}

export function useProjectsSection() {
  const ref = useInView()
  const [repos, setRepos] = useState<GitHubRepo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetch('https://api.github.com/users/estebanpuyanas/repos?per_page=100&sort=updated')
      .then((res) => {
        if (!res.ok) throw new Error(`${res.status}`)
        return res.json()
      })
      .then((data: GitHubRepo[]) => {
        setRepos(data.filter((r) => !r.fork))
        setLoading(false)
      })
      .catch(() => {
        setError(true)
        setLoading(false)
      })
  }, [])

  return (
    <section id="projects" ref={ref as React.RefObject<HTMLElement>}>
      <div className="section-wrapper">
        <p className="section-label" data-inview>// projects</p>

        {loading && (
          <div className="projects-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="project-card-skeleton" />
            ))}
          </div>
        )}

        {error && (
          <p className="projects-error">
            Could not load repositories.{' '}
            <a
              href="https://github.com/estebanpuyanas"
              target="_blank"
              rel="noopener noreferrer"
              className="projects-error-link"
            >
              View on GitHub →
            </a>
          </p>
        )}

        {!loading && !error && (
          <div className="projects-grid" data-inview data-delay="1">
            {repos.map((repo, i) => (
              <ProjectCard key={repo.id} repo={repo} index={i} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
