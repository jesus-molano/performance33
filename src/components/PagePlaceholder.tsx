import { Hammer } from 'lucide-react'
import { EmptyState } from './ui/EmptyState'

/** Temporary content for pages a builder has not implemented yet. */
export function PagePlaceholder({ title }: { title: string }) {
  return <EmptyState icon={Hammer} title={title} description="Esta pantalla está en construcción." />
}
