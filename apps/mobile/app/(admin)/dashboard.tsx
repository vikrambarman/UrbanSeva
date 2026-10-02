import React, { useState, useEffect, useCallback } from 'react'
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator,
  RefreshControl, TouchableOpacity, Dimensions,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useAuthStore } from '@/store/authStore'
import { adminApi } from '@/lib/api'
import { COLORS } from '@/constants'
import type { AdminDashboardStats } from '@/types'

const { width } = Dimensions.get('window')

export default function AdminDashboard() {
  const { user } = useAuthStore()
  const [stats, setStats] = useState<AdminDashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const res = await adminApi.getDashboard()
      if (res.data.success) setStats(res.data.data)
    } catch (err) {
      console.error('Dashboard error:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData() }} />}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome, {user?.name || 'Admin'} 👋</Text>
            <Text style={styles.subGreeting}>Platform overview at a glance</Text>
          </View>
          <TouchableOpacity style={styles.notifBtn}>
            <Ionicons name="notifications-outline" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <TouchableOpacity style={styles.statCard} onPress={() => router.push('/(admin)/users')}>
            <View style={[styles.statIcon, { backgroundColor: '#3B82F620' }]}>
              <Ionicons name="people" size={22} color="#3B82F6" />
            </View>
            <Text style={styles.statValue}>{stats?.totalUsers || 0}</Text>
            <Text style={styles.statLabel}>Total Users</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.statCard} onPress={() => router.push('/(admin)/providers')}>
            <View style={[styles.statIcon, { backgroundColor: '#8B5CF620' }]}>
              <Ionicons name="briefcase" size={22} color="#8B5CF6" />
            </View>
            <Text style={styles.statValue}>{stats?.totalProviders || 0}</Text>
            <Text style={styles.statLabel}>Providers</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.statCard} onPress={() => router.push('/(admin)/bookings')}>
            <View style={[styles.statIcon, { backgroundColor: '#10B98120' }]}>
              <Ionicons name="calendar" size={22} color="#10B981" />
            </View>
            <Text style={styles.statValue}>{stats?.totalBookings || 0}</Text>
            <Text style={styles.statLabel}>Bookings</Text>
          </TouchableOpacity>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#F59E0B20' }]}>
              <Ionicons name="time" size={22} color="#F59E0B" />
            </View>
            <Text style={styles.statValue}>{stats?.pendingBookings || 0}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
        </View>

        {/* Revenue Card */}
        <View style={styles.revenueCard}>
          <View style={styles.revenueHeader}>
            <Ionicons name="cash-outline" size={28} color="#10B981" />
            <View style={{ flex: 1 }}>
              <Text style={styles.revenueLabel}>Total Revenue</Text>
              <Text style={styles.revenueValue}>₹{(stats?.totalRevenue || 0).toLocaleString()}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.financeBtn} onPress={() => router.push('/(admin)/finance')}>
            <Text style={styles.financeBtnText}>View Finance Details →</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Bookings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Bookings</Text>
            <TouchableOpacity onPress={() => router.push('/(admin)/bookings')}>
              <Text style={styles.seeAll}>View All →</Text>
            </TouchableOpacity>
          </View>
          {stats?.recentBookings?.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="calendar-outline" size={40} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>No bookings yet</Text>
            </View>
          ) : (
            stats?.recentBookings?.slice(0, 5).map((booking) => (
              <TouchableOpacity
                key={booking.id}
                style={styles.bookingCard}
                onPress={() => router.push(`/booking-detail/${booking.id}`)}
              >
                <View style={styles.bookingLeft}>
                  <Text style={styles.bookingService} numberOfLines={1}>
                    {booking.service?.name || 'Service'}
                  </Text>
                  <Text style={styles.bookingMeta}>
                    #{booking.bookingNumber} • {new Date(booking.scheduledDate).toLocaleDateString('en-IN')}
                  </Text>
                </View>
                <View style={styles.bookingRight}>
                  <Text style={styles.bookingAmount}>₹{booking.totalAmount}</Text>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(booking.status) + '20' }
                  ]}>
                    <Text style={[styles.statusText, { color: getStatusColor(booking.status) }]}>
                      {booking.status.replace(/_/g, ' ')}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickGrid}>
            <TouchableOpacity style={styles.quickBtn} onPress={() => router.push('/(admin)/providers')}>
              <Ionicons name="person-add" size={24} color={COLORS.primary} />
              <Text style={styles.quickBtnText}>Approve Providers</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickBtn} onPress={() => router.push('/(admin)/bookings')}>
              <Ionicons name="calendar" size={24} color={COLORS.primary} />
              <Text style={styles.quickBtnText}>Manage Bookings</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickBtn} onPress={() => router.push('/(admin)/finance')}>
              <Ionicons name="wallet" size={24} color={COLORS.primary} />
              <Text style={styles.quickBtnText}>Finance</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickBtn} onPress={() => router.push('/(admin)/users')}>
              <Ionicons name="people" size={24} color={COLORS.primary} />
              <Text style={styles.quickBtnText}>Users</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    PENDING: '#F59E0B', CONFIRMED: '#3B82F6', PROVIDER_ASSIGNED: '#8B5CF6',
    SERVICE_STARTED: '#F97316', SERVICE_COMPLETED: '#10B981', CANCELLED: '#EF4444',
  }
  return colors[status] || '#64748B'
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 },
  greeting: { fontSize: 22, fontWeight: 'bold', color: COLORS.text },
  subGreeting: { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
  notifBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 8, marginBottom: 16 },
  statCard: { width: (width - 40) / 2, backgroundColor: COLORS.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: COLORS.border },
  statIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  statValue: { fontSize: 24, fontWeight: 'bold', color: COLORS.text },
  statLabel: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  revenueCard: { backgroundColor: COLORS.surface, marginHorizontal: 16, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: COLORS.border, marginBottom: 20 },
  revenueHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  revenueLabel: { fontSize: 13, color: COLORS.textMuted },
  revenueValue: { fontSize: 28, fontWeight: 'bold', color: '#10B981' },
  financeBtn: { backgroundColor: '#10B98120', paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  financeBtnText: { color: '#10B981', fontWeight: '600', fontSize: 13 },
  section: { paddingHorizontal: 16, marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontWeight: 'bold', color: COLORS.text },
  seeAll: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },
  bookingCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: COLORS.border },
  bookingLeft: { flex: 1, marginRight: 12 },
  bookingService: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  bookingMeta: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  bookingRight: { alignItems: 'flex-end', gap: 4 },
  bookingAmount: { fontSize: 16, fontWeight: 'bold', color: COLORS.primary },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: '600' },
  emptyCard: { alignItems: 'center', padding: 32, backgroundColor: COLORS.surface, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border },
  emptyText: { fontSize: 14, color: COLORS.textMuted, marginTop: 8 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  quickBtn: { width: (width - 42) / 2, alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: COLORS.border, gap: 6 },
  quickBtnText: { fontSize: 12, fontWeight: '600', color: COLORS.text },
})