import { describe, expect, it, vi } from 'vitest'
import type { MenuItem } from '@/components/ui'
import { CLIENT_MENU_COPY } from '@/features/clients/config'
import { clientMenuItems } from './clientMenu'

const labels = (items: MenuItem[]) => items.map((item) => (item === 'separator' ? '—' : item.label))
const handlers = () => ({ edit: vi.fn(), archive: vi.fn(), restore: vi.fn(), remove: vi.fn() })

describe('clientMenuItems', () => {
  it('puts "Editar datos" first and offers archiving to an active user, never deleting', () => {
    const h = handlers()
    expect(labels(clientMenuItems({ archived: false }, h))).toEqual([CLIENT_MENU_COPY.edit, '—', CLIENT_MENU_COPY.archive])
  })

  it('offers restore and delete to an archived user, delete only when a remove handler is given', () => {
    expect(labels(clientMenuItems({ archived: true }, handlers()))).toEqual([CLIENT_MENU_COPY.edit, '—', CLIENT_MENU_COPY.restore, CLIENT_MENU_COPY.remove])
    const { remove: _remove, ...noRemove } = handlers()
    expect(labels(clientMenuItems({ archived: true }, noRemove))).toEqual([CLIENT_MENU_COPY.edit, '—', CLIENT_MENU_COPY.restore])
  })

  it('calls each handler with the user', () => {
    const h = handlers()
    const client = { archived: true, id: 'ana' }
    const items = clientMenuItems(client, h).filter((item) => item !== 'separator')
    items.forEach((item) => item.onSelect())
    expect(h.edit).toHaveBeenCalledWith(client)
    expect(h.restore).toHaveBeenCalledWith(client)
    expect(h.remove).toHaveBeenCalledWith(client)
    expect(h.archive).not.toHaveBeenCalled()
  })
})
