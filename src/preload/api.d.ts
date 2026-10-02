import type { LinkyApi } from '../shared/api'

declare global {
  interface Window {
    linky: LinkyApi
  }
}

export {}
