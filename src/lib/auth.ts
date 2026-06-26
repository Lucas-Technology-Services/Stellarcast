'use client'

const USER_TOKEN_KEY = 'stellarcast_user_token'
const USER_DATA_KEY = 'stellarcast_user_data'

export interface UserData {
  id: string
  email: string
  access_type: 'producer' | 'viewer'
  created_at: string
  updated_at: string
}

export interface LoginResponse {
  token: string
  expires_at: string
  user: UserData
}

export function getUserToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(USER_TOKEN_KEY)
}

export function setUserToken(token: string): void {
  localStorage.setItem(USER_TOKEN_KEY, token)
}

export function removeUserToken(): void {
  localStorage.removeItem(USER_TOKEN_KEY)
}

export function removeUserData(): void {
  localStorage.removeItem(USER_DATA_KEY)
}

export function getUserData(): UserData | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(USER_DATA_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as UserData
  } catch {
    return null
  }
}

export function setUserData(user: UserData): void {
  localStorage.setItem(USER_DATA_KEY, JSON.stringify(user))
}

export function isAuthenticated(): boolean {
  return !!getUserToken()
}
