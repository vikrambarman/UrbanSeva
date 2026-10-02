import React, { useState, useEffect, useCallback } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, TextInput, Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { adminApi } from '@/lib/api'
import { COLORS } from '@/constants'
import { toast } from '@/lib/toast'
import type { Booking } from '@/types'

const STATUS_FILTERS = ['ALL', 'PENDING', 'CONFIRMED', 'PROVIDER_ASSIGNED', 'SERVICE_COMPLETED', 'CANCELLED']

export default function AdminBookingsScreen() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')

  const fetchBookings = useCallback(async () => {
    try {
      const params: Record<string, string> = {}
      if (search) params.search = search
      if (statusFilter !== 'ALL') params.status = statusFilter
      const res = await adminApi.getBookings(params)
      if (res.data.success) setBookings(res.data.data.bookings)
    } catch (err) {
      console.error('Bookings error:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [search, statusFilter])

  useEffect(() => {
    const timer = setTimeout(fetchBookings, 400)
    return () => clearTimeout(timer)
  }, [fetchBookings])

  const handleCancel = (booking: Booking) => {
    Alert.alert('Cancel Booking', `Cancel booking #${booking.bookingNumber}?`, [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel', style: 'destructive', onPress: async () => {
          try {
            const res = await adminApi.cancelBooking(booking.id, 'Cancelled by admin')
            if (res.data.success) { toast.success('Booking cancelled'); fetchBookings() }
          } catch { toast.error('Failed') }
        },
      },
    ])
  }

  const getStatusColor = (status: string): string => {
    const c: Record<string, string> = {
      PENDING: '#F59E0B', CONFIRMED: '#3B82F6', PROVIDER_ASSIGNED: '#8B5CF6',
      SERVICE_STARTED: '#F97316', SERVICE_COMPLETED: '#10B981', CANCELLED: '#EF4444',
    }
    return c[status] || '#64748B'
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}><ActivityIndicator size="large" color={COLORS.primary} /></View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bookings</Text>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color={COLORS.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by booking #, customer..."
          placeholderTextColor={COLORS.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
        {STATUS_FILTERS.map((s) => (
          <TouchableOpacity
            key={s}
            style={[styles.filterChip, statusFilter === s && styles.filterChipActive]}
            onPress={() => setStatusFilter(s)}
          >
            <Text style={[styles.filterText, statusFilter === s && styles.filterTextActive]}>
              {s === 'ALL' ? 'All' : s.replace(/_/g, ' ')}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchBookings() }} />}
      >
        {bookings.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="calendar-outline" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>No bookings found</Text>
          </View>
        ) : (
          bookings.map((booking) => (
            <TouchableOpacity
              key={booking.id}
              style={styles.bookingCard}
              onPress={() => router.push(`/booking-detail/${booking.id}`)}
            >
              <View style={styles.bookingTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.serviceName} numberOfLines={1}>{booking.service?.name || 'Service'}</Text>
                  <Text style={styles.bookingNum}>#{booking.bookingNumber}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) + '20' }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(booking.status) }]}>
                    {booking.status.replace(/_/g, ' ')}
                  </Text>
                </View>
              </View>
              <View style={styles.bookingMeta}>
                <View style={styles.metaItem}>
                  <Ionicons name="calendar-outline" size={12} color={COLORS.textMuted} />
                  <Text style={styles.metaText}>{new Date(booking.scheduledDate).toLocaleDateString('en-IN')}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="time-outline" size={12} color={COLORS.textMuted} />
                  <Text style={styles.metaText}>{booking.scheduledTime}</Text>
                </View>
              </View>
              <View style={styles.bookingBottom}>
                <Text style={styles.amount}>₹{booking.totalAmount}</Text>
                {booking.status !== 'CANCELLED' && booking.status !== 'SERVICE_COMPLETED' && (
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => handleCancel(booking)}>
                    <Ionicons name="close-circle" size={14} color="#EF4444" />
                    <Text style={styles.cancelText}>Cancel</Text>
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>
          ))
        )}
        <View style={{ height: 80 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: COLORS.text },
  searchContainer: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 12, paddingHorizontal: 12, backgroundColor: COLORS.surface, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 14, color: COLORS.text },
  filterScroll: { maxHeight: 44, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  filterContent: { paddingHorizontal: 12, paddingVertical: 6, gap: 8, flexDirection: 'row' },
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  filterChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterText: { fontSize: 12, fontWeight: '500', color: COLORS.text },
  filterTextActive: { color: '#FFF' },
  listContent: { padding: 16 },
  bookingCard: { backgroundColor: COLORS.surface, borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: COLORS.border },
  bookingTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  serviceName: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  bookingNum: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '600' },
  bookingMeta: { flexDirection: 'row', gap: 12, marginBottom: 10 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: COLORS.textMuted },
  bookingBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTopWidth: 1, borderTopColor: COLORS.border },
  amount: { fontSize: 18, fontWeight: 'bold', color: COLORS.primary },
  cancelBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#EF444420', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  cancelText: { fontSize: 12, fontWeight: '600', color: '#EF4444' },
  emptyCard: { alignItems: 'center', padding: 40, backgroundColor: COLORS.surface, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border },
  emptyText: { fontSize: 14, color: COLORS.textMuted, marginTop: 8 },
})