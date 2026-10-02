import { useEffect, useState } from 'react'
import type { UpdateState } from '@shared/api'

/** Live update status from the main process. */
export function useUpdate(): UpdateState | null {
  const [state, setState] = useState<UpdateState | null>(null)
  useEffect(() => {
    void window.linky.getUpdate().then(setState)
    return window.linky.onUpdateChanged(setState)
  }, [])
  return state
}

export const OFFER_STATUSES: UpdateState['status'][] = ['available', 'downloading', 'ready', 'error']
