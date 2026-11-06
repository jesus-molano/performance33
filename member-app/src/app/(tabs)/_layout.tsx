import { Tabs } from 'expo-router/js-tabs'
import { CalendarCheck, CalendarPlus, Dumbbell, type LucideIcon } from '@/components/ui/icons'
import type { ColorValue } from 'react-native'
import { COPY } from '@/config/copy'
import { COLORS, FONT, TOUCH_SIZE } from '@/config/theme'
import { GateGuard } from '@/features/auth/components/GateGuard'
import { useMember } from '@/features/auth/hooks/useMember'
import { useLiveBookings } from '@/features/bookings/hooks/useLiveBookings'
import { ProfileButton } from '@/features/account/components/ProfileButton'

const TAB_ICON_SIZE = 26
/** Room for the icon and a big label above the phone's own bar. */
const TAB_BAR_HEIGHT = TOUCH_SIZE + 24

const tabIcon = (Icon: LucideIcon) =>
  function TabIcon({ color }: { color: ColorValue }) {
    return <Icon color={typeof color === 'string' ? color : undefined} size={TAB_ICON_SIZE} />
  }

function AppTabs() {
  // Their own bookings live: a coach moving them or the waitlist giving them a place shows up at once.
  useLiveBookings(useMember().data?.client_id)
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.black },
        headerTintColor: COLORS.white,
        headerTitleStyle: { fontSize: FONT.large, fontWeight: '700' },
        headerRight: () => <ProfileButton />,
        tabBarActiveTintColor: COLORS.accent,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle: { fontSize: FONT.small, fontWeight: '600' },
        tabBarStyle: { minHeight: TAB_BAR_HEIGHT },
        tabBarItemStyle: { minHeight: TOUCH_SIZE },
      }}
    >
      <Tabs.Screen name="index" options={{ title: COPY.tabs.myClasses, tabBarIcon: tabIcon(CalendarCheck) }} />
      <Tabs.Screen name="reservar" options={{ title: COPY.tabs.book, tabBarIcon: tabIcon(CalendarPlus) }} />
      <Tabs.Screen name="rutina" options={{ title: COPY.tabs.routine, tabBarIcon: tabIcon(Dumbbell) }} />
    </Tabs>
  )
}

export default function TabsLayout() {
  return (
    <GateGuard allow={['app']}>
      <AppTabs />
    </GateGuard>
  )
}
