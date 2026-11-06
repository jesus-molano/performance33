import { QueryClientProvider } from '@tanstack/react-query'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useState } from 'react'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { ToastProvider } from '@/components/ui/Toast'
import { COPY } from '@/config/copy'
import { COLORS } from '@/config/theme'
import { AuthProvider } from '@/features/auth/AuthProvider'
import { createQueryClient } from '@/lib/queryClient'

export default function RootLayout() {
  const [queryClient] = useState(createQueryClient)
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ToastProvider>
            <StatusBar style="auto" />
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: COLORS.surface } }}>
              <Stack.Screen name="perfil" options={{ presentation: 'modal', headerShown: true, title: COPY.tabs.profile }} />
              <Stack.Screen name="borrar-cuenta" options={{ headerShown: true, title: COPY.deleteAccount.title }} />
            </Stack>
          </ToastProvider>
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  )
}
