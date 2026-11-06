import { QrCode } from 'lucide-react'
import { MEMBER_ACCESS_COPY } from '@/features/members/config/copy'
import { MEMBER_APP_DOWNLOAD_URL } from '@/features/members/config/memberApp'

/** The members' app download page, whose QR sends each phone to its store (or to the web version). New tab. */
export function QrLink() {
  return (
    <a
      href={MEMBER_APP_DOWNLOAD_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="-mx-2 inline-flex min-h-11 items-center gap-2 self-start rounded-lg px-2 text-md font-medium text-brand-strong hover:bg-brand-soft"
    >
      <QrCode size={18} aria-hidden />
      {MEMBER_ACCESS_COPY.qr}
    </a>
  )
}
