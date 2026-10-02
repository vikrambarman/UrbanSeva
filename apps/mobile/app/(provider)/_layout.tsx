import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { COLORS } from '@/constants'

export default function ProviderLayout() {
    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: COLORS.primary,
                tabBarInactiveTintColor: COLORS.textMuted,
                headerShown: false,
                tabBarStyle: { borderTopWidth: 1, borderTopColor: COLORS.border },
            }}
        >
            <Tabs.Screen name="dashboard" options={{
                title: 'Dashboard',
                tabBarIcon: ({ color, size }) => <Ionicons name="grid" size={size} color={color} />,
            }} />
            <Tabs.Screen name="jobs" options={{
                title: 'Jobs',
                tabBarIcon: ({ color, size }) => <Ionicons name="briefcase" size={size} color={color} />,
            }} />
            <Tabs.Screen name="earnings" options={{
                title: 'Earnings',
                tabBarIcon: ({ color, size }) => <Ionicons name="wallet" size={size} color={color} />,
            }} />
            <Tabs.Screen name="reviews" options={{
                title: 'Reviews',
                tabBarIcon: ({ color, size }) => <Ionicons name="star" size={size} color={color} />,
            }} />
            <Tabs.Screen name="profile" options={{
                title: 'Profile',
                tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />,
            }} />
        </Tabs>
    )
}