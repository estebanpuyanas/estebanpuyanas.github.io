import { GhIcon, ArrowRight } from './Icons'

interface GitHubRepo {
  id: number
  name: string
  description: string | null
  html_url: string
  updated_at: string
  language: string | null
  fork: boolean
}

function formatRepoName(name: string): string {
  return name
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export default function ProjectCard({ repo, index }: { repo: GitHubRepo; index: number }) {
  return (
    <a href={repo.html_url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
      <div className="project-card">
        <p className="project-num">{String(index + 1).padStart(2, '0')}</p>
        <h3 className="project-name">{formatRepoName(repo.name)}</h3>
        {repo.description && <p className="project-desc">{repo.description}</p>}
        <div className="project-footer">
          <div className="tech-tags">
            {repo.language && <span className="tech-tag">{repo.language}</span>}
            <span className="tech-tag">{formatDate(repo.updated_at)}</span>
          </div>
          <span className="gh-link">
            <GhIcon /> <ArrowRight />
          </span>
        </div>
      </div>
    </a>
  )
}
