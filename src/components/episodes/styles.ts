'use client'

import styled from 'styled-components'

export const Wrapper = styled.div`
  min-height: 100vh;
  background: #07071a;
  display: flex;
  flex-direction: column;
  align-items: center;
`

export const Header = styled.header`
  width: 100%;
  max-width: 1200px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 32px;
`

export const LogoText = styled.span`
  font-size: 20px;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: -0.3px;
`

export const Nav = styled.nav`
  display: flex;
  align-items: center;
  gap: 20px;
  a {
    color: #c4b5fd;
    text-decoration: none;
    font-size: 14px;
    font-weight: 500;
    &:hover { color: #ffffff; }
  }
`

export const UserBadge = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #7c3aed, #4f46e5);
  border: 2px solid rgba(167, 139, 250, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 14px;
  font-weight: 700;
`

export const Content = styled.main`
  width: 100%;
  max-width: 900px;
  padding: 0 20px 60px;
`

export const PageTitle = styled.h1`
  font-size: 28px;
  font-weight: 800;
  color: #ffffff;
  margin-bottom: 4px;
`

export const PageSubtitle = styled.p`
  font-size: 14px;
  color: #94a3b8;
  margin-bottom: 32px;
`

export const BackLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #a78bfa;
  font-size: 13px;
  text-decoration: none;
  margin-bottom: 16px;
  &:hover { color: #c4b5fd; }
`

export const EpisodeCard = styled.div`
  background: rgba(15, 15, 40, 0.85);
  border: 1px solid rgba(124, 58, 237, 0.2);
  border-radius: 14px;
  padding: 20px 24px;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
`

export const EpisodeInfo = styled.div`
  flex: 1;
`

export const EpisodeTitle = styled.h3`
  font-size: 15px;
  font-weight: 600;
  color: #ffffff;
  margin: 0 0 4px;
`

export const EpisodeMeta = styled.div`
  font-size: 12px;
  color: #64748b;
  display: flex;
  gap: 12px;
  align-items: center;
`

export const StatusBadge = styled.span<{ $status: string }>`
  padding: 2px 10px;
  border-radius: 9999px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  color: ${({ $status }) =>
    $status === 'published' ? '#22c55e' : $status === 'processing' ? '#f59e0b' : $status === 'failed' ? '#ef4444' : '#64748b'};
  background: ${({ $status }) =>
    $status === 'published' ? 'rgba(34,197,94,0.15)' : $status === 'processing' ? 'rgba(245,158,11,0.15)' : $status === 'failed' ? 'rgba(239,68,68,0.15)' : 'rgba(100,116,139,0.15)'};
`

export const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #64748b;
  p { font-size: 16px; margin-bottom: 8px; color: #94a3b8; }
`

export const FormCard = styled.div`
  width: 100%;
  background: rgba(15, 15, 40, 0.85);
  border: 1px solid rgba(124, 58, 237, 0.2);
  border-radius: 20px;
  padding: 36px;
  backdrop-filter: blur(12px);
  display: flex;
  flex-direction: column;
  gap: 24px;
`

export const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

export const Label = styled.label`
  font-size: 14px;
  font-weight: 600;
  color: #e2e8f0;
`

export const Input = styled.input`
  width: 100%;
  background: rgba(10, 10, 30, 0.7);
  border: 1px solid rgba(124, 58, 237, 0.25);
  border-radius: 10px;
  padding: 12px 16px;
  font-size: 14px;
  color: #e2e8f0;
  outline: none;
  box-sizing: border-box;
  &:focus {
    border-color: rgba(124, 58, 237, 0.6);
    box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.12);
  }
`

export const Textarea = styled.textarea`
  width: 100%;
  background: rgba(10, 10, 30, 0.7);
  border: 1px solid rgba(124, 58, 237, 0.25);
  border-radius: 10px;
  padding: 12px 16px;
  font-size: 14px;
  color: #e2e8f0;
  outline: none;
  resize: vertical;
  min-height: 100px;
  font-family: inherit;
  box-sizing: border-box;
  &:focus {
    border-color: rgba(124, 58, 237, 0.6);
    box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.12);
  }
`

export const Button = styled.button`
  padding: 14px 28px;
  background: linear-gradient(135deg, #7c3aed, #6d28d9);
  border: none;
  border-radius: 12px;
  color: #ffffff;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.2s;
  &:hover { opacity: 0.92; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`

export const ErrorBox = styled.div`
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
  padding: 10px 14px;
  color: #fca5a5;
  font-size: 13px;
`

export const SuccessBox = styled.div`
  background: rgba(34, 197, 94, 0.15);
  border: 1px solid rgba(34, 197, 94, 0.3);
  border-radius: 8px;
  padding: 10px 14px;
  color: #86efac;
  font-size: 13px;
`
