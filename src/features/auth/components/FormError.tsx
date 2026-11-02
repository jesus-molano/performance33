import { CircleAlert } from 'lucide-react'
import { Callout } from '@/components/ui'

/** Error line of the login forms. */
export function FormError({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <Callout tone="warning" icon={CircleAlert}>
      {message}
    </Callout>
  )
}
