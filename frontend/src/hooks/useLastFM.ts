import { useState, useEffect } from 'react'
import { getRecentTracks, type Track } from '../services/lastfmService'

export interface LastFMState {
  tracks: Track[]
  loading: boolean
  fetching: boolean
  error: boolean
  lastUpdated: Date | null
  loadMore: () => void
  refresh: () => void
  canLoadMore: boolean
}

const POLL_MS = 30_000
const STEP = 10
const MAX_LIMIT = 50

export function useLastFM(): LastFMState {
  const [tracks, setTracks] = useState<Track[]>([])
  const [loading, setLoading] = useState(true)
  const [fetching, setFetching] = useState(false)
  const [error, setError] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [limit, setLimit] = useState(STEP)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const data = await getRecentTracks(limit)
        if (!cancelled) {
          setTracks(data)
          setError(false)
          setLastUpdated(new Date())
        }
      } catch {
        if (!cancelled) setError(true)
      } finally {
        if (!cancelled) {
          setLoading(false)
          setFetching(false)
        }
      }
    }

    load()
    const id = setInterval(load, POLL_MS)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [limit, tick])

  const loadMore = () => {
    setFetching(true)
    setLimit(l => Math.min(l + STEP, MAX_LIMIT))
  }

  const refresh = () => {
    setFetching(true)
    setTick(t => t + 1)
  }

  return {
    tracks,
    loading,
    fetching,
    error,
    lastUpdated,
    loadMore,
    refresh,
    canLoadMore: limit < MAX_LIMIT,
  }
}
