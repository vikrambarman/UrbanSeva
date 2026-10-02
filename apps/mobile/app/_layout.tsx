import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useColorScheme } from 'react-native'
import { MD3LightTheme, MD3DarkTheme, PaperProvider } from 'react-native-paper'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { useEffect } from 'react'
import * as SplashScreen from 'expo-splash-screen'
import { useAuthStore } from '@/store/authStore'

SplashScreen.preventAutoHideAsync()

const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#F97316',
    onPrimary: '#FFFFFF',
    primaryContainer: '#FFF7ED',
    secondary: '#1E3A5F',
    onSecondary: '#FFFFFF',
    background: '#FFFFFF',
    surface: '#FFFFFF',
    surfaceVariant: '#F8FAFC',
  },
}

const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#F97316',
    onPrimary: '#FFFFFF',
    primaryContainer: '#431400',
    secondary: '#93C5FD',
    onSecondary: '#1E3A5F',
    background: '#0F172A',
    surface: '#1E293B',
    surfaceVariant: '#334155',
  },
}

export default function RootLayout() {
  const colorScheme = useColorScheme()
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme
  const { initialize } = useAuthStore()

  useEffect(() => {
    const prepare = async () => {
      try {
        await initialize()
      } catch (error) {
        console.error('Auth initialization error:', error)
      } finally {
        await SplashScreen.hideAsync()
      }
    }
    prepare()
  }, [])

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PaperProvider theme={theme}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(customer)" />
            <Stack.Screen name="(provider)" />
            <Stack.Screen name="(admin)" />
            <Stack.Screen name="services" />
            <Stack.Screen name="service-detail" />
            <Stack.Screen name="search" />
            <Stack.Screen name="cart" />
            <Stack.Screen name="booking" />
            <Stack.Screen name="booking-detail" />
          </Stack>
          <StatusBar style="auto" />
        </PaperProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}