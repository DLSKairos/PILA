import { Toaster } from 'react-hot-toast'

export function PILAToaster() {
  return (
    <Toaster
      position="top-center"
      toastOptions={{
        duration: 3000,
        style: {
          background: 'var(--card)',
          color: 'var(--txt)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          fontFamily: '"DM Sans", sans-serif',
          fontSize: '14px',
          maxWidth: 360,
        },
      }}
    />
  )
}
