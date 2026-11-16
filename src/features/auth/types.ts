export interface AuthUser {
  id: string
  email?: string
  displayName?: string
}

export type AuthMode = 'cloud' | 'local-demo'
