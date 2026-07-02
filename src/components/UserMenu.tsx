'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'

export default function UserMenu() {
  const { user, token, logout } = useAuth()
  const [open, setOpen] = useState(false)

  if (!token || !user) return null

  return (
    <div style={{ position: 'relative' }}>
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
          border: '2px solid rgba(167, 139, 250, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: 14,
          fontWeight: 700,
          cursor: 'pointer',
        }}
        title={user.email}
        onClick={() => setOpen((v) => !v)}
      >
        {user.email.charAt(0).toUpperCase()}
      </div>

      {open && (
        <>
          <div
            style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: 8,
              background: 'rgba(15, 15, 40, 0.95)',
              border: '1px solid rgba(124, 58, 237, 0.2)',
              borderRadius: 10,
              padding: '6px 0',
              minWidth: 150,
              zIndex: 50,
            }}
          >
            <div
              style={{
                padding: '8px 14px',
                color: '#94a3b8',
                fontSize: 12,
                borderBottom: '1px solid rgba(124, 58, 237, 0.1)',
              }}
            >
              {user.email}
            </div>
            <button
              type="button"
              onClick={() => {
                logout()
                setOpen(false)
                window.location.href = '/home'
              }}
              style={{
                width: '100%',
                background: 'none',
                border: 'none',
                padding: '8px 14px',
                color: '#fca5a5',
                fontSize: 13,
                cursor: 'pointer',
                textAlign: 'left',
                display: 'block',
              }}
            >
              Sign Out
            </button>
          </div>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 49 }}
            onClick={() => setOpen(false)}
          />
        </>
      )}
    </div>
  )
}
