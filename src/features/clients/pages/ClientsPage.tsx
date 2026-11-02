import { DatabaseZap, SearchX, UserPlus, Users } from 'lucide-react'
import { Button, EmptyState } from '@/components/ui'
import { plural } from '@/lib/format'
import type { Client } from '@/types'
import { editedItem, PageContainer, PageHeader, useEditTarget } from '@/features/shell'
import { ClientFormModal } from '@/features/clients/components/ClientFormModal'
import { ClientGrid } from '@/features/clients/components/ClientGrid'
import { ClientToolbar } from '@/features/clients/components/ClientToolbar'
import { useClientList } from '@/features/clients/hooks/useClientList'
import { useDemoLoader } from '@/features/clients/hooks/useDemoLoader'

export function ClientsPage() {
  const list = useClientList()
  const form = useEditTarget<Client>()
  const demo = useDemoLoader()
  const addButton = (
    <Button leftIcon={UserPlus} onClick={form.openCreate}>
      Nuevo cliente
    </Button>
  )

  return (
    <PageContainer>
      <PageHeader
        title={list.filters.archived ? 'Clientes archivados' : 'Clientes'}
        description={list.filters.archived ? 'Puedes restaurarlos desde su menú «⋯».' : `${plural(list.activeCount, 'cliente activo', 'clientes activos')}`}
        actions={addButton}
      />
      <ClientToolbar
        filters={list.filters}
        archivedCount={list.archivedCount}
        onQueryChange={list.setQuery}
        onPlanChange={list.setPlan}
        onToggleArchived={list.toggleArchived}
      />
      {list.visible.length > 0 ? (
        <ClientGrid clients={list.visible} pinnedCounts={list.pinnedCounts} onEdit={form.openEdit} />
      ) : list.isFiltering ? (
        <EmptyState
          icon={SearchX}
          title="No hay clientes con esos filtros"
          description="Prueba con otro nombre o quita el filtro de plan."
          action={<Button variant="secondary" onClick={list.clearFilters}>Quitar filtros</Button>}
        />
      ) : (
        <EmptyState
          icon={Users}
          title="Aún no hay clientes"
          description="Cuando alguien del equipo añada un cliente, aparecerá aquí."
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
