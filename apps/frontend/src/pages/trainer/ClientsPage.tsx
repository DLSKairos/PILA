import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { clientsService } from '@/services/clients.service'
import { Card, Avatar, Badge, Button, Input, Modal, Loader } from '@/components/ui'
import { PATHS } from '@/router/paths'
import type { Client } from '@/types/client.types'

type FilterType = 'all' | 'active' | 'inactive'

const FILTER_LABELS: Record<FilterType, string> = {
  all: 'Todos',
  active: 'Activos',
  inactive: 'Inactivos',
}

interface CreateForm {
  firstName: string
  lastName: string
  email: string
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [filtered, setFiltered] = useState<Client[]>([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterType>('all')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<CreateForm>({ firstName: '', lastName: '', email: '' })
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')
  const navigate = useNavigate()

  const loadClients = () => {
    setLoading(true)
    clientsService.getAll()
      .then(res => {
        const data: Client[] = (res.data as any).data ?? []
        setClients(data)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadClients()
  }, [])

  useEffect(() => {
    let result = [...clients]
    if (filter === 'active') result = result.filter(c => c.isActive)
    if (filter === 'inactive') result = result.filter(c => !c.isActive)
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(c =>
        `${c.firstName} ${c.lastName} ${c.email}`.toLowerCase().includes(q)
      )
    }
    setFiltered(result)
  }, [clients, search, filter])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    setCreateError('')
    try {
      await clientsService.create(form)
      setShowModal(false)
      setForm({ firstName: '', lastName: '', email: '' })
      loadClients()
    } catch (err: any) {
      setCreateError(err.response?.data?.message ?? 'Error al crear cliente')
    } finally {
      setCreating(false)
    }
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setForm({ firstName: '', lastName: '', email: '' })
    setCreateError('')
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
        <Loader size="lg" />
      </div>
    )
  }

  return (
    <div style={{ padding: '24px 20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: 32, color: 'var(--txt)', letterSpacing: 1 }}>
          CLIENTES
        </h1>
        <Button size="sm" onClick={() => setShowModal(true)}>+ Nuevo</Button>
      </div>

      {/* Buscador */}
      <Input
        placeholder="Buscar por nombre o email..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ marginBottom: 12 }}
      />

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {(['all', 'active', 'inactive'] as FilterType[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              border: `1px solid ${filter === f ? 'var(--orange)' : 'var(--border)'}`,
              background: filter === f ? 'var(--orange-dim)' : 'transparent',
              color: filter === f ? 'var(--orange)' : 'var(--txt-sub)',
              cursor: 'pointer',
              fontSize: 12,
              fontFamily: '"DM Sans", sans-serif',
              transition: 'all 0.2s',
            }}
          >
            {FILTER_LABELS[f]}
          </button>
        ))}
      </div>

      {/* Lista */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.map(c => (
          <Card
            key={c.id}
            onClick={() => navigate(PATHS.TRAINER.CLIENT_DETAIL(c.id))}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Avatar name={`${c.firstName} ${c.lastName}`} size="md" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--txt)' }}>
                  {c.firstName} {c.lastName}
                </div>
                <div style={{
                  fontSize: 12,
                  color: 'var(--txt-sub)',
                  marginTop: 2,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {c.email}
                </div>
                {c.profile?.goal && (
                  <div style={{ fontSize: 11, color: 'var(--txt-sub)', marginTop: 2 }}>
                    {c.profile.goal}
                  </div>
                )}
              </div>
              <Badge variant={c.isActive ? 'success' : 'neutral'} dot>
                {c.isActive ? 'Activo' : 'Inactivo'}
              </Badge>
            </div>
          </Card>
        ))}

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--txt-sub)' }}>
            <p style={{ fontSize: 32, marginBottom: 8 }}>🔍</p>
            <p style={{ fontSize: 14 }}>
              {search ? 'Sin resultados para esa búsqueda' : 'No hay clientes aún'}
            </p>
            {!search && (
              <button
                onClick={() => setShowModal(true)}
                style={{
                  marginTop: 12,
                  color: 'var(--orange)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 14,
                  fontFamily: '"DM Sans", sans-serif',
                }}
              >
                Agregar primer cliente →
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modal nuevo cliente */}
      <Modal isOpen={showModal} onClose={handleCloseModal} title="Nuevo cliente" size="sm">
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input
              label="Nombre"
              value={form.firstName}
              onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
              required
              autoFocus
            />
            <Input
              label="Apellido"
              value={form.lastName}
              onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
              required
            />
          </div>
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            required
          />
          {createError && (
            <p style={{ color: 'var(--red)', fontSize: 12, margin: 0 }}>{createError}</p>
          )}
          <p style={{ fontSize: 12, color: 'var(--txt-sub)', margin: 0 }}>
            Se enviará un email de activación al cliente con sus credenciales.
          </p>
          <Button type="submit" fullWidth loading={creating}>
            Crear cliente
          </Button>
        </form>
      </Modal>
    </div>
  )
}
