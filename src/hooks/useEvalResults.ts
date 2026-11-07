import { useEffect, useState } from 'react'
import { groupBySubject } from '@/lib/evals'
import type { EvalResults } from '../../shared/types.ts'

const POLL_MS = 5000

export type EvalResultsState = {
  results: EvalResults | null
  failed: boolean
}

// Keeps fetching while a suite is running, which also picks up runs started from a terminal or CI
export function useEvalResults(): EvalResultsState {
  const [state, setState] = useState<EvalResultsState>({ results: null, failed: false })

  useEffect(() => {
    const controller = new AbortController()
    let timer: ReturnType<typeof setTimeout>

    async function load() {
      try {
        const response = await fetch('/api/evals', { signal: controller.signal })
        if (!response.ok) throw new Error(`Status ${response.status}`)

        const results: EvalResults = await response.json()
        if (controller.signal.aborted) return

        setState({ results, failed: false })
        if (groupBySubject(results.suites).some((subject) => subject.running)) {
          timer = setTimeout(load, POLL_MS)
        }
      } catch {
        if (!controller.signal.aborted) setState((current) => ({ ...current, failed: true }))
      }
    }

    load()
    return () => {
      controller.abort()
      clearTimeout(timer)
    }
  }, [])

  return state
}
