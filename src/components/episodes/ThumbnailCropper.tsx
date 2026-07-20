'use client'

import React, { useRef, useState, useEffect, useCallback } from 'react'
import { Check, X } from 'lucide-react'

export interface AspectRatioOption {
  label: string
  value: number
}

export const INSTAGRAM_RATIOS: AspectRatioOption[] = [
  { label: '1:1', value: 1 },
  { label: '4:5', value: 4 / 5 },
  { label: '16:9', value: 16 / 9 },
  { label: '9:16', value: 9 / 16 },
  { label: 'Original', value: 0 },
]

interface ThumbnailCropperProps {
  file?: File
  imageUrl?: string
  onCrop: (blob: Blob) => void
  onCancel: () => void
  aspectRatios?: AspectRatioOption[]
  defaultRatioIndex?: number
}

export default function ThumbnailCropper({
  file,
  imageUrl,
  onCrop,
  onCancel,
  aspectRatios = [{ label: '16:9', value: 16 / 9 }],
  defaultRatioIndex = 0,
}: ThumbnailCropperProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [imageSrc, setImageSrc] = useState('')
  const [naturalW, setNaturalW] = useState(0)
  const [naturalH, setNaturalH] = useState(0)
  const [offsetX, setOffsetX] = useState(0)
  const [offsetY, setOffsetY] = useState(0)
  const [selectedRatio, setSelectedRatio] = useState(aspectRatios[defaultRatioIndex])
  const [containerWidth, setContainerWidth] = useState(600)
  const dragging = useRef(false)
  const dragStart = useRef({ x: 0, y: 0 })
  const offsetStart = useRef({ x: 0, y: 0 })
  const raf = useRef<number>(0)

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file)
      setImageSrc(url)
      return () => URL.revokeObjectURL(url)
    } else if (imageUrl) {
      setImageSrc(imageUrl)
    }
  }, [file, imageUrl])

  useEffect(() => {
    if (!containerRef.current) return
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(Math.min(entry.contentRect.width, 600))
      }
    })
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  const imageLoaded = useCallback(() => {
    if (!imageRef.current) return
    setNaturalW(imageRef.current.naturalWidth)
    setNaturalH(imageRef.current.naturalHeight)
  }, [])

  const activeRatio = selectedRatio.value === 0 && naturalW
    ? naturalW / naturalH
    : selectedRatio.value

  const containerHeight = Math.round(containerWidth / activeRatio)

  useEffect(() => {
    setOffsetX(0)
    setOffsetY(0)
  }, [selectedRatio, containerWidth])

  function getConstraints(): { minX: number; maxX: number; minY: number; maxY: number } {
    if (!imageRef.current || !naturalW) {
      return { minX: 0, maxX: 0, minY: 0, maxY: 0 }
    }
    const scale = Math.max(containerWidth / naturalW, containerHeight / naturalH)
    const renderW = naturalW * scale
    const renderH = naturalH * scale
    return {
      minX: -(renderW - containerWidth),
      maxX: 0,
      minY: -(renderH - containerHeight),
      maxY: 0,
    }
  }

  function clamp(v: number, min: number, max: number) {
    return Math.min(max, Math.max(min, v))
  }

  function updateOffset(clientX: number, clientY: number) {
    const dx = clientX - dragStart.current.x
    const dy = clientY - dragStart.current.y
    const cons = getConstraints()
    setOffsetX(clamp(offsetStart.current.x + dx, cons.minX, cons.maxX))
    setOffsetY(clamp(offsetStart.current.y + dy, cons.minY, cons.maxY))
  }

  function onPointerDown(e: React.PointerEvent) {
    dragging.current = true
    dragStart.current = { x: e.clientX, y: e.clientY }
    offsetStart.current = { x: offsetX, y: offsetY }
    containerRef.current?.setPointerCapture(e.pointerId)
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragging.current) return
    if (raf.current) cancelAnimationFrame(raf.current)
    raf.current = requestAnimationFrame(() => updateOffset(e.clientX, e.clientY))
  }

  function onPointerUp(_e: React.PointerEvent) {
    dragging.current = false
  }

  function drawPreview() {
    if (!canvasRef.current || !imageRef.current || !naturalW) return
    const scale = Math.max(containerWidth / naturalW, containerHeight / naturalH)
    const srcX = Math.round(-offsetX / scale)
    const srcY = Math.round(-offsetY / scale)
    const srcW = Math.round(containerWidth / scale)
    const srcH = Math.round(containerHeight / scale)
    const pw = 240
    const ph = Math.round(pw / activeRatio)
    const canvas = canvasRef.current
    canvas.width = pw
    canvas.height = ph
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, pw, ph)
    ctx.drawImage(imageRef.current, srcX, srcY, srcW, srcH, 0, 0, pw, ph)
  }

  useEffect(() => {
    if (!imageRef.current || !naturalW) return
    drawPreview()
  }, [offsetX, offsetY, naturalW, naturalH, containerWidth, containerHeight])

  function getOutputDimensions(): { w: number; h: number } {
    if (selectedRatio.value === 0) {
      const base = 640
      const h = Math.round(base / activeRatio)
      return { w: base, h }
    }
    const r = selectedRatio.value
    return r >= 1
      ? { w: 640, h: Math.round(640 / r) }
      : { w: Math.round(640 * r), h: 640 }
  }

  function handleConfirm() {
    if (!imageRef.current || !naturalW) return
    const scale = Math.max(containerWidth / naturalW, containerHeight / naturalH)
    const srcX = Math.round(-offsetX / scale)
    const srcY = Math.round(-offsetY / scale)
    const srcW = Math.round(containerWidth / scale)
    const srcH = Math.round(containerHeight / scale)
    const { w: outW, h: outH } = getOutputDimensions()
    const canvas = document.createElement('canvas')
    canvas.width = outW
    canvas.height = outH
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(imageRef.current, srcX, srcY, srcW, srcH, 0, 0, outW, outH)
    canvas.toBlob(
      (blob) => {
        if (blob) onCrop(blob)
      },
      'image/jpeg',
      0.92,
    )
  }

  return (
    <div style={{ width: '100%' }}>
      {aspectRatios.length > 1 && (
        <div
          style={{
            display: 'flex',
            gap: 6,
            justifyContent: 'center',
            marginBottom: 14,
            flexWrap: 'wrap',
          }}
        >
          {aspectRatios.map((ratio) => (
            <button
              key={ratio.label}
              type="button"
              onClick={() => setSelectedRatio(ratio)}
              style={{
                padding: '6px 16px',
                borderRadius: 20,
                border: selectedRatio.label === ratio.label
                  ? '1px solid rgba(124,58,237,0.8)'
                  : '1px solid rgba(124,58,237,0.25)',
                background: selectedRatio.label === ratio.label
                  ? 'linear-gradient(135deg, #7c3aed, #6d28d9)'
                  : 'rgba(15,15,40,0.6)',
                color: selectedRatio.label === ratio.label ? '#fff' : '#c4b5fd',
                fontWeight: selectedRatio.label === ratio.label ? 600 : 500,
                fontSize: 13,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {ratio.label}
            </button>
          ))}
        </div>
      )}

      <div
        ref={containerRef}
        style={{
          width: '100%',
          maxWidth: 600,
          margin: '0 auto',
          position: 'relative',
          borderRadius: 12,
          overflow: 'hidden',
          background: '#000',
          touchAction: 'none',
          cursor: dragging.current ? 'grabbing' : 'grab',
          height: containerHeight,
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <img
          ref={imageRef}
          src={imageSrc}
          alt="Crop preview"
          onLoad={imageLoaded}
          draggable={false}
          style={{
            position: 'absolute',
            left: offsetX,
            top: offsetY,
            width: 'auto',
            height: 'auto',
            maxWidth: 'none',
            maxHeight: 'none',
            minWidth: '100%',
            minHeight: '100%',
            objectFit: 'none',
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            boxShadow: 'inset 0 0 0 2px rgba(124,58,237,0.7)',
            borderRadius: 12,
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 12,
            background: 'rgba(0,0,0,0.35)',
            pointerEvents: 'none',
          }}
        />
      </div>

      <p
        style={{
          textAlign: 'center',
          color: '#94a3b8',
          fontSize: 12,
          marginTop: 8,
          marginBottom: 14,
        }}
      >
        Drag the image to adjust — {selectedRatio.label}
      </p>

      <div
        style={{
          display: 'flex',
          gap: 12,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16,
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            width: 200,
            borderRadius: 8,
            border: '2px solid rgba(124,58,237,0.4)',
            aspectRatio: `${activeRatio}`,
            background: '#000',
            maxHeight: 180,
          }}
        />
      </div>

      <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
        <button
          type="button"
          onClick={handleConfirm}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '10px 24px',
            background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
            border: 'none',
            borderRadius: 10,
            color: '#fff',
            fontWeight: 600,
            fontSize: 14,
            cursor: 'pointer',
          }}
        >
          <Check size={16} />
          Confirm Crop
        </button>
        <button
          type="button"
          onClick={onCancel}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '10px 24px',
            background: 'rgba(100,116,139,0.2)',
            border: '1px solid rgba(100,116,139,0.3)',
            borderRadius: 10,
            color: '#94a3b8',
            fontWeight: 600,
            fontSize: 14,
            cursor: 'pointer',
          }}
        >
          <X size={16} />
          Cancel
        </button>
      </div>
    </div>
  )
}
