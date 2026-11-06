import { useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { AppButton } from '@/components/ui/AppButton'
import { AppText } from '@/components/ui/AppText'
import { Notice } from '@/components/ui/Notice'
import { TextField } from '@/components/ui/TextField'
import { COPY } from '@/config/copy'
import { COLORS, SPACING } from '@/config/theme'
import { PASSWORD_MIN_LENGTH } from '@/lib/accountRules'
import { errorMessage } from '@/lib/errors'
import { useChangePassword, useSignOut } from '../hooks/useAuthActions'
import { newPasswordError } from '../utils/access'

/** First sign-in: the temporary password the coach gave is replaced before anything else. */
export function PasswordChangeForm() {
  const [password, setPassword] = useState('')
  const [repeated, setRepeated] = useState('')
  const [problem, setProblem] = useState<string | null>(null)
  const change = useChangePassword()
  const signOut = useSignOut()

  const submit = () => {
    const invalid = newPasswordError(password, repeated)
    setProblem(invalid)
    if (invalid) return
    change.mutate(password, { onError: (error) => setProblem(errorMessage(error)) })
  }

  return (
    <View style={styles.form}>
      <AppText variant="title" color={COLORS.white} style={styles.center}>
        {COPY.password.title}
      </AppText>
      <AppText color={COLORS.white} style={styles.center}>
        {COPY.password.body}
      </AppText>
      <TextField
        dark
        label={COPY.password.newPassword}
        hint={COPY.password.rule(PASSWORD_MIN_LENGTH)}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="new-password"
        textContentType="newPassword"
      />
      <TextField
        dark
        label={COPY.password.repeat}
        value={repeated}
        onChangeText={setRepeated}
        secureTextEntry
        autoComplete="new-password"
        textContentType="newPassword"
        onSubmitEditing={submit}
      />
      {problem ? <Notice tone="danger" message={problem} /> : null}
      <AppButton
        label={change.isPending ? COPY.password.submitting : COPY.password.submit}
        variant="light"
        loading={change.isPending}
        onPress={submit}
        block
      />
      <AppButton label={COPY.access.signOut} variant="ghost" onPress={() => signOut.mutate()} block />
    </View>
  )
}

const styles = StyleSheet.create({
  form: { gap: SPACING.lg },
  center: { textAlign: 'center' },
})
