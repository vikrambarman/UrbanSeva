import { useEffect } from 'react'
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native'
import { router } from 'expo-router'
import * as SecureStore from 'expo-secure-store'

export default function Index() {
  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const token = await SecureStore.getItemAsync('auth_token')
      
      // Small delay for splash
      await new Promise(resolve => setTimeout(resolve, 1000))

      if (token) {
        // Token hai to customer dashboard
        router.replace('/(customer)/dashboard')
      } else {
        // Token nahi hai to login
        router.replace('/(auth)/login')
      }
    } catch (error) {
      router.replace('/(auth)/login')
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>🏠</Text>
      <Text style={styles.title}>ServiceApp</Text>
      <Text style={styles.subtitle}>Your City, Your Services</Text>
      <ActivityIndicator
        size="large"
        color="#F97316"
        style={styles.loader}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#F97316',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 32,
  },
  loader: {
    marginTop: 16,
  },
})
