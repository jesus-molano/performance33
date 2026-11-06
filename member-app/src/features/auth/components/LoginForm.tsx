import { useRef, useState, type ComponentRef } from 'react'
import { StyleSheet, View, type TextInput } from 'react-native'
import { AppButton } from '@/components/ui/AppButton'
import { AppText } from '@/components/ui/AppText'
import { Notice } from '@/components/ui/Notice'
import { TextField } from '@/components/ui/TextField'
import { COPY } from '@/config/copy'
import { COLORS, SPACING } from '@/config/theme'
import { errorMessage } from '@/lib/errors'
import { backend } from '@/services/backend'
import { useSignIn } from '../hooks/useAuthActions'

/** Any name works in the demo; this one is filled in by "Entrar en la demo". */
const DEMO_CREDENTIALS = { identifier: 'laura.demo', password: 'demo' }

export function LoginForm() {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [problem, setProblem] = useState<string | null>(null)
  const signIn = useSignIn()
  const passwordRef = useRef<ComponentRef<typeof TextInput>>(null)

  const submit = (credentials = { identifier, password }) => {
    if (!credentials.identifier.trim() || !credentials.password) {
      setProblem(COPY.login.missing)
      return
    }
    setProblem(null)
    signIn.mutate(credentials, { onError: (error) => setProblem(errorMessage(error)) })
  }

  return (
    <View style={styles.form}>
      <AppText variant="title" color={COLORS.white} style={styles.title}>
        {COPY.login.title}
      </AppText>
      <TextField
        dark
        label={COPY.login.identifier}
        hint={COPY.login.identifierHint}
        value={identifier}
        onChangeText={setIdentifier}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="username"
        textContentType="username"
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => passwordRef.current?.focus()}
      />
      <TextField
        dark
        ref={passwordRef}
        label={COPY.login.password}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="go"
        onSubmitEditing={() => submit()}
      />
      {problem ? <Notice tone="danger" message={problem} /> : null}
      <AppButton
        label={signIn.isPending ? COPY.login.submitting : COPY.login.submit}
        variant="light"
        loading={signIn.isPending}
        onPress={() => submit()}
        block
      />
      {backend.mode === 'demo' ? (
        <AppButton label={COPY.login.demo} variant="secondary" disabled={signIn.isPending} onPress={() => submit(DEMO_CREDENTIALS)} block />
      ) : null}
      <AppText color={COLORS.white} style={styles.help}>
        {COPY.login.help}
      </AppText>
    </View>
  )
}

const styles = StyleSheet.create({
  form: { gap: SPACING.lg },
  title: { textAlign: 'center' },
  help: { textAlign: 'center' },
})
