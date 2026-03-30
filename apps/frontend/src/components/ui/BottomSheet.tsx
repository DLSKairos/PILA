import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'full'
  title?: string
}

const heights = { sm: '30vh', md: '50vh', lg: '75vh', full: '90vh' }

export function BottomSheet({ isOpen, onClose, children, size = 'md', title }: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'flex-end',
      }}
    >
      <div
        ref={sheetRef}
        onClick={e => e.stopPropagation()}
        className="animate-slide-up"
        style={{
          width: '100%',
          maxHeight: heights[size],
          minHeight: heights[size],
          background: 'var(--card)',
          borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0',
          border: '1px solid var(--border)',
          borderBottom: 'none',
          overflowY: 'auto',
          paddingBottom: 'env(safe-area-inset-bottom, 16px)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 8px' }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--border)' }} />
        </div>
        {title && (
          <div style={{
            padding: '0 20px 12px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <span style={{ fontWeight: 600, color: 'var(--txt)' }}>{title}</span>
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', color: 'var(--txt-sub)', cursor: 'pointer', fontSize: 18 }}
            >
              ✕
            </button>
          </div>
        )}
        <div style={{ padding: '16px 20px' }}>
          {children}
        </div>
      </div>
    </div>,
    document.body
  )
}
