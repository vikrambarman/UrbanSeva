import { Stack } from 'expo-router'
import { COLORS } from '@/constants'

export default function ServicesLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.background },
      }}
    />
  )
}
