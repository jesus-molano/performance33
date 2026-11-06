// /borrar-cuenta: also opened from outside the app (the stores ask for a web page to delete an account), so it works
// signed out too: then it explains how.

import { router } from 'expo-router'
import { useState } from 'react'
import { AppButton } from '@/components/ui/AppButton'
import { AppText } from '@/components/ui/AppText'
import { Card } from '@/components/ui/Card'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Notice } from '@/components/ui/Notice'
import { Screen } from '@/components/ui/Screen'
import { useToast } from '@/components/ui/Toast'
import { COPY } from '@/config/copy'
import { useAuth } from '@/features/auth/AuthProvider'
import { errorMessage } from '@/lib/errors'
import { useDeleteAccount } from '../hooks/useDeleteAccount'

export function DeleteAccountScreen() {
  const { session } = useAuth()
  const [asking, setAsking] = useState(false)
  const [problem, setProblem] = useState<string | null>(null)
  const remove = useDeleteAccount()
  const toast = useToast()

  const confirm = () =>
    remove.mutate(undefined, {
      onSuccess: () => {
        toast(COPY.deleteAccount.done)
        router.replace('/entrar')
      },
      onError: (error) => setProblem(errorMessage(error)),
      onSettled: () => setAsking(false),
    })

  return (
    <Screen edges={['bottom']}>
      <Card>
        <AppText variant="large">{COPY.deleteAccount.body}</AppText>
      </Card>
      {problem ? <Notice tone="danger" message={problem} /> : null}
      {session === 'signed-in' ? (
        <AppButton label={COPY.deleteAccount.confirm} variant="danger" onPress={() => setAsking(true)} block />
      ) : (
        <>
          <AppText muted>{COPY.deleteAccount.signedOutBody}</AppText>
          <AppButton label={COPY.deleteAccount.signIn} onPress={() => router.replace('/entrar')} block />
        </>
      )}
      <ConfirmDialog
        visible={asking}
        title={COPY.deleteAccount.confirmQuestion}
        confirmLabel={remove.isPending ? COPY.deleteAccount.deleting : COPY.deleteAccount.confirm}
        cancelLabel={COPY.common.cancel}
        confirmVariant="danger"
        busy={remove.isPending}
        onConfirm={confirm}
        onCancel={() => setAsking(false)}
      />
    </Screen>
  )
}
