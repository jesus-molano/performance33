import { useEffect } from 'react'
import { retainScreens } from '@/features/screens/store/screensConnection'

/** Keeps the screens loaded and live while the calling component is mounted. */
export function useScreensConnection(): void {
  useEffect(() => retainScreens(), [])
}
