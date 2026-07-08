import { createHmac, timingSafeEqual } from 'crypto'

const TOKEN_TTL_MS = 4 * 60 * 60 * 1000

function signingSecret(): string {
  return process.env.PLAYER_TOKEN_SECRET || process.env.JWT_SECRET || ''
}

export function generatePlayerToken(videoId: string): string {
  const exp = Date.now() + TOKEN_TTL_MS
  const payload = `${videoId}:${exp}`
  const payloadB64 = Buffer.from(payload).toString('base64url')

  const mac = createHmac('sha256', signingSecret())
  mac.update(payloadB64)
  const sig = mac.digest('base64url')

  return `${payloadB64}.${sig}`
}

export function validatePlayerToken(token: string): string {
  const parts = token.split('.')
  if (parts.length !== 2) {
    throw new Error('invalid streaming token')
  }

  const [payloadB64, sigB64] = parts

  const mac = createHmac('sha256', signingSecret())
  mac.update(payloadB64)
  const expectedSig = mac.digest('base64url')

  const sigBuf = Buffer.from(sigB64)
  const expectedBuf = Buffer.from(expectedSig)

  if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) {
    throw new Error('invalid streaming token')
  }

  const payload = Buffer.from(payloadB64, 'base64url').toString('utf-8')
  const idx = payload.lastIndexOf(':')
  if (idx < 0) {
    throw new Error('invalid streaming token')
  }

  const videoId = payload.slice(0, idx)
  const exp = parseInt(payload.slice(idx + 1), 10)

  if (Date.now() > exp) {
    throw new Error('streaming token has expired')
  }

  return videoId
}
