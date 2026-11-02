import { Compass } from 'lucide-react'
import { Button, EmptyState } from '@/components/ui'
import { navigate, paths } from '@/lib/routes'
import { PageContainer } from '@/features/shell/components/PageLayout'

export function NotFoundPage() {
  return (
    <PageContainer>
      <EmptyState
        icon={Compass}
        title="No encontramos esta página"
        description="Puede que el enlace sea antiguo o que se haya borrado lo que buscabas."
        action={<Button onClick={() => navigate(paths.clients())}>Volver a usuarios</Button>}
      />
    </PageContainer>
  )
}
