import { DatabaseZap, SearchX, UserPlus, Users } from 'lucide-react'
import { Button, EmptyState } from '@/components/ui'
import { plural } from '@/lib/format'
import { useIsAdmin } from '@/store'
import type { Client } from '@/types'
import { editedItem, PageContainer, PageHeader, useEditTarget } from '@/features/shell'
import { ClientFormModal } from '@/features/clients/components/ClientFormModal'
import { ClientGrid } from '@/features/clients/components/ClientGrid'
import { ClientList } from '@/features/clients/components/ClientList'
import { ClientToolbar } from '@/features/clients/components/ClientToolbar'
import { useClientList } from '@/features/clients/hooks/useClientList'
import { useClientView } from '@/features/clients/hooks/useClientView'
import { useDemoLoader } from '@/features/clients/hooks/useDemoLoader'

export function ClientsPage() {
  const list = useClientList()
  const isAdmin = useIsAdmin()
  const form = useEditTarget<Client>()
  const demo = useDemoLoader()
  const { view, setView } = useClientView()
  const ClientsView = view === 'list' ? ClientList : ClientGrid
  const addButton = (
    <Button leftIcon={UserPlus} onClick={form.openCreate}>
      Nuevo usuario
    </Button>
  )

  return (
    <PageContainer>
      <PageHeader
        title={list.filters.archived ? 'Usuarios archivados' : 'Usuarios'}
        description={list.filters.archived ? isAdmin ? 'Puedes restaurarlos o eliminarlos desde su menú «⋯».' : 'Puedes restaurarlos desde su menú «⋯».' : `${plural(list.activeCount, 'usuario activo', 'usuarios activos')}`}
        actions={addButton}
      />
      <ClientToolbar
        filters={list.filters}
        archivedCount={list.archivedCount}
        view={view}
        onViewChange={setView}
        onQueryChange={list.setQuery}
        onPlanChange={list.setPlan}
        onToggleArchived={list.toggleArchived}
      />
      {list.visible.length > 0 ? (
        <ClientsView clients={list.visible} pinnedCounts={list.pinnedCounts} onEdit={form.openEdit} />
      ) : list.isFiltering ? (
        <EmptyState
          icon={SearchX}
          title="No hay usuarios con esos filtros"
          description="Prueba con otro nombre o quita el filtro de plan."
          action={<Button variant="secondary" onClick={list.clearFilters}>Quitar filtros</Button>}
        />
      ) : (
        <EmptyState
          icon={Users}
          title="Aún no hay usuarios"
          description="Cuando alguien del equipo añada un usuario, aparecerá aquí."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              {addButton}
              {demo.canLoadDemo && (
                <Button variant="secondary" leftIcon={DatabaseZap} onClick={demo.loadDemo}>
                  Cargar datos de demostración
                </Button>
              )}
            </div>
          }
        />
      )}
      {form.target && <ClientFormModal client={editedItem(form.target)} onClose={form.close} />}
    </PageContainer>
  )
}
