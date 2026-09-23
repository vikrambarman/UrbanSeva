import { useEffect } from 'react'
import { View, ActivityIndicator, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { useAuthStore } from '@/store/authStore'
import { COLORS } from '@/constants'

export default function Index() {
  const { isAuthenticated, isInitialized } = useAuthStore()

  useEffect(() => {
    if (isInitialized) {
      if (isAuthenticated) {
        router.replace('/(customer)/dashboard')
      } else {
        router.replace('/(auth)/login')
      }
    }
  }, [isInitialized, isAuthenticated])

  if (!isInitialized) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    )
  }

  return null
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
})