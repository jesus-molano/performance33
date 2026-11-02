import { useState } from 'react'
import { useConfirmStore } from '@/store/confirmStore'
import { Button } from './Button'
import { Input } from './Input'
import { Modal } from './Modal'

export interface ConfirmDialogProps {
  open: boolean
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  /** Confirm stays disabled until this word is typed. */
  requireText?: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  danger = false,
  requireText,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [typed, setTyped] = useState('')
  const finish = (action: () => void) => () => {
    setTyped('')
    action()
  }
  return (
    <Modal
      open={open}
      onClose={finish(onCancel)}
      title={title}
      description={description}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={finish(onCancel)}>
            {cancelLabel}
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} disabled={requireText !== undefined && typed !== requireText} onClick={finish(onConfirm)}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {requireText && (
        <Input label={`Escribe ${requireText} para confirmar`} value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" autoFocus nativeUndo />
      )}
    </Modal>
  )
}

/** Renders the dialog requested through useConfirm(). Mounted once in App. */
export function ConfirmHost() {
  const pending = useConfirmStore((s) => s.pending)
  const settle = useConfirmStore((s) => s.settle)
  return (
    <ConfirmDialog
      open={pending !== null}
      title={pending?.title ?? ''}
      description={pending?.description}
      confirmLabel={pending?.confirmLabel}
      cancelLabel={pending?.cancelLabel}
      danger={pending?.danger}
      requireText={pending?.requireText}
      onConfirm={() => settle(true)}
      onCancel={() => settle(false)}
    />
  )
}
