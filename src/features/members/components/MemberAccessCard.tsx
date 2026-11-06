import { Smartphone, UserPlus } from 'lucide-react'
import { Button, Card } from '@/components/ui'
import type { Client } from '@/types'
import { MEMBER_ACCESS_COPY } from '@/features/members/config/copy'
import { useMemberAccessCard, type MemberAccessCardApi } from '@/features/members/hooks/useMemberAccessCard'
import { GiveAccessModal } from './GiveAccessModal'
import { MemberAccessDetails } from './MemberAccessDetails'
import { MemberCredentialsModal } from './MemberCredentialsModal'
import { QrLink } from './QrLink'

function CardBody({ client, card }: { client: Client; card: MemberAccessCardApi }) {
  if (card.loadStatus === 'loading') return <p className="text-md text-fg-muted">…</p>
  if (card.loadStatus === 'error') {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-md text-fg-muted">{MEMBER_ACCESS_COPY.loadFailed}</p>
        <Button variant="ghost" size="sm" onClick={card.retry}>
          {MEMBER_ACCESS_COPY.retry}
        </Button>
      </div>
    )
  }
  if (card.access && card.status) {
    return (
      <>
        <MemberAccessDetails
          access={card.access}
          status={card.status}
          busy={card.busy}
          onResetPassword={() => void card.resetPassword()}
          onSetActive={(active) => void card.setActive(active)}
          onRemove={() => void card.remove()}
        />
        <QrLink />
      </>
    )
  }
  return (
    <>
      <p className="text-md text-fg-muted">{client.archived ? MEMBER_ACCESS_COPY.archived : MEMBER_ACCESS_COPY.none}</p>
      {!client.archived && (
        <Button leftIcon={UserPlus} onClick={card.openGive} disabled={card.busy} className="self-start">
          {MEMBER_ACCESS_COPY.give}
        </Button>
      )}
    </>
  )
}

/** On the user's page: give them the members' app (any coach), see how they enter, and look after the account. */
export function MemberAccessCard({ client }: { client: Client }) {
  const card = useMemberAccessCard(client)
  return (
    <Card className="flex flex-col gap-3">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-fg">
        <Smartphone size={18} aria-hidden className="text-brand-strong" />
        {MEMBER_ACCESS_COPY.title}
      </h2>
      <CardBody client={client} card={card} />
      {card.giving && <GiveAccessModal client={client} busy={card.busy} onSubmit={card.give} onClose={card.closeGive} />}
      {card.credentials && <MemberCredentialsModal name={client.firstName} credentials={card.credentials} onClose={card.closeCredentials} />}
    </Card>
  )
}
