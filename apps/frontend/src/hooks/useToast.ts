import toast from 'react-hot-toast'

export const useToast = () => ({
  success: (msg: string) => toast.success(msg, {
    style: { background: 'var(--card)', color: 'var(--txt)', border: '1px solid var(--green)' },
    iconTheme: { primary: 'var(--green)', secondary: 'var(--card)' },
  }),
  error: (msg: string) => toast.error(msg, {
    style: { background: 'var(--card)', color: 'var(--txt)', border: '1px solid var(--red)' },
    iconTheme: { primary: 'var(--red)', secondary: 'var(--card)' },
  }),
  info: (msg: string) => toast(msg, {
    style: { background: 'var(--card)', color: 'var(--txt)', border: '1px solid var(--border)' },
  }),
  loading: (msg: string) => toast.loading(msg, {
    style: { background: 'var(--card)', color: 'var(--txt)' },
  }),
  dismiss: toast.dismiss,
})
