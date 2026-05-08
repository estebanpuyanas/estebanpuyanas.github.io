const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'

export interface Track {
  name: string
  artist: string
  album: string
  imageUrl: string
  nowPlaying: boolean
  playedAt: string
}

export async function getRecentTracks(limit = 10): Promise<Track[]> {
  const res = await fetch(`${BASE_URL}/api/music/recent-tracks?limit=${limit}`, { cache: 'no-store' })
  if (!res.ok) throw new Error(`Last.fm fetch failed: ${res.status}`)
  return res.json() as Promise<Track[]>
}
