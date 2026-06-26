'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'
import { getUserToken, setUserToken, removeUserToken, getUserData, setUserData, removeUserData, type UserData } from './auth'
import { loginUser, registerUser } from './api'

interface AuthContextValue {
  user: UserData | null
  token: string | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, accessType: 'producer' | 'viewer') => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserData | null>(() => getUserData())
  const [token, setToken] = useState<string | null>(() => getUserToken())
  const isLoading = false

  const login = useCallback(async (email: string, password: string) => {
    const res = await loginUser(email, password)
    setUserToken(res.token)
    setUserData(res.user)
    setToken(res.token)
    setUser(res.user)
  }, [])

  const register = useCallback(
    async (email: string, password: string, accessType: 'producer' | 'viewer') => {
      await registerUser(email, password, accessType)
      await login(email, password)
    },
    [login],
  )

  const logout = useCallback(() => {
    removeUserToken()
    removeUserData()
    setToken(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
