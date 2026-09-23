import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { COLORS } from '@/constants'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useCartStore } from '@/lib/cartStore'

export default function CustomerLayout() {
  const { getTotalItems } = useCartStore()
  const cartItemsCount = getTotalItems()

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="services"
        options={{
          title: 'Services',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: 'Bookings',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
          tabBarBadge: cartItemsCount > 0 ? cartItemsCount : undefined,
          tabBarBadgeStyle: cartItemsCount > 0 ? styles.cartBadge : undefined,
        }}
      />
    </Tabs>
  )
}

const styles = StyleSheet.create({
  cartBadge: {
    backgroundColor: COLORS.primary,
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    lineHeight: 18,
  },
})