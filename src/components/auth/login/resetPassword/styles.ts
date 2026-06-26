import styled from 'styled-components'

export const Wrapper = styled.div`
  min-height: 100vh;
  background: #07071a;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
`

export const Card = styled.div`
  width: 100%;
  max-width: 420px;
  background: rgba(15, 15, 40, 0.85);
  border: 1px solid rgba(124, 58, 237, 0.2);
  border-radius: 20px;
  padding: 40px 32px;
  backdrop-filter: blur(12px);
`

export const Title = styled.h1`
  font-size: 28px;
  font-weight: 800;
  color: #ffffff;
  text-align: center;
  margin-bottom: 8px;
`

export const Subtitle = styled.p`
  font-size: 14px;
  color: #94a3b8;
  text-align: center;
  margin-bottom: 32px;
`

export const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
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

export const Button = styled.button`
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #7c3aed, #6d28d9);
  border: none;
  border-radius: 12px;
  color: #ffffff;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.2s;
  margin-top: 8px;

  &:hover { opacity: 0.92; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`

export const Success = styled.div`
  background: rgba(34, 197, 94, 0.15);
  border: 1px solid rgba(34, 197, 94, 0.3);
  border-radius: 8px;
  padding: 10px 14px;
  color: #86efac;
  font-size: 13px;
  margin-bottom: 16px;
  text-align: center;
`

export const Error = styled.div`
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
  padding: 10px 14px;
  color: #fca5a5;
  font-size: 13px;
  margin-bottom: 16px;
  text-align: center;
`

export const BackLink = styled.button`
  background: none;
  border: none;
  color: #a78bfa;
  font-size: 13px;
  cursor: pointer;
  margin-top: 16px;
  display: block;
  width: 100%;
  text-align: center;

  &:hover { color: #c4b5fd; }
`
