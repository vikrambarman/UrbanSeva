import React, { useState, useEffect, useCallback } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Dimensions, Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { adminApi } from '@/lib/api'
import { COLORS } from '@/constants'
import { toast } from '@/lib/toast'
import type { FinanceStats } from '@/types'

const { width } = Dimensions.get('window')

export default function AdminFinanceScreen() {
  const [stats, setStats] = useState<FinanceStats | null>(null)
  const [payouts, setPayouts] = useState<any[]>([])
  const [refunds, setRefunds] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [period, setPeriod] = useState('all')
  const [activeTab, setActiveTab] = useState<'overview' | 'payouts' | 'refunds'>('overview')

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, payoutsRes, refundsRes] = await Promise.all([
        adminApi.getFinanceStats(period),
        adminApi.getPayouts(),
        adminApi.getRefunds(),
      ])
      if (statsRes.data.success) setStats(statsRes.data.data)
      if (payoutsRes.data.success) setPayouts(payoutsRes.data.data)
      if (refundsRes.data.success) setRefunds(refundsRes.data.data)
    } catch (err) {
      console.error('Finance error:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [period])

  useEffect(() => { fetchData() }, [fetchData])

  const handleProcessPayout = (payoutId: string) => {
    Alert.alert('Process Payout', 'Mark this payout as completed?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Process', onPress: async () => {
          try {
            const res = await adminApi.processPayout(payoutId)
            if (res.data.success) { toast.success('Payout processed!'); fetchData() }
          } catch { toast.error('Failed') }
        },
      },
    ])
  }

  const handleProcessRefund = (bookingId: string) => {
    Alert.alert('Process Refund', 'Process this refund to customer wallet?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Process', onPress: async () => {
          try {
            const res = await adminApi.processRefund(bookingId)
            if (res.data.success) { toast.success('Refund processed!'); fetchData() }
          } catch { toast.error('Failed') }
        },
      },
    ])
  }

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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Finance</Text>
      </View>

      {/* Period Selector */}
      <View style={styles.periodSelector}>
        {['all', 'today', 'week', 'month'].map((p) => (
          <TouchableOpacity
            key={p}
            style={[styles.periodChip, period === p && styles.periodChipActive]}
            onPress={() => setPeriod(p)}
          >
            <Text style={[styles.periodText, period === p && styles.periodTextActive]}>
              {p === 'all' ? 'All Time' : p === 'today' ? 'Today' : p === 'week' ? '7 Days' : '30 Days'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {(['overview', 'payouts', 'refunds'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData() }} />}
      >
        {activeTab === 'overview' && stats && (
          <>
            {/* Revenue Card */}
            <View style={styles.revenueCard}>
              <Ionicons name="cash-outline" size={28} color="#10B981" />
              <Text style={styles.revenueLabel}>Total Revenue</Text>
              <Text style={styles.revenueValue}>₹{stats.totalRevenue.toLocaleString()}</Text>
              <Text style={styles.revenueSubtext}>{stats.totalBookings} paid bookings</Text>
            </View>

            {/* Stats Grid */}
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Ionicons name="trending-up-outline" size={22} color="#3B82F6" />
                <Text style={styles.statValue}>₹{stats.platformCommission.toLocaleString()}</Text>
                <Text style={styles.statLabel}>Platform Commission</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="wallet-outline" size={22} color="#8B5CF6" />
                <Text style={styles.statValue}>₹{stats.providerEarnings.toLocaleString()}</Text>
                <Text style={styles.statLabel}>Provider Earnings</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="time-outline" size={22} color="#F59E0B" />
                <Text style={styles.statValue}>₹{stats.pendingPayouts.toLocaleString()}</Text>
                <Text style={styles.statLabel}>Pending Payouts</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="refresh-outline" size={22} color="#EF4444" />
                <Text style={styles.statValue}>₹{stats.totalRefunds.toLocaleString()}</Text>
                <Text style={styles.statLabel}>{stats.refundCount} Refunds</Text>
              </View>
            </View>
          </>
        )}

        {activeTab === 'payouts' && (
          <View style={styles.listContent}>
            <Text style={styles.listTitle}>Payout Requests ({payouts.length})</Text>
            {payouts.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="wallet-outline" size={40} color={COLORS.textMuted} />
                <Text style={styles.emptyText}>No payouts</Text>
              </View>
            ) : (
              payouts.map((payout) => (
                <View key={payout.id} style={styles.itemCard}>
                  <View style={styles.itemLeft}>
                    <Text style={styles.itemTitle}>₹{payout.amount.toLocaleString()}</Text>
                    <Text style={styles.itemMeta}>
                      {payout.method} • {new Date(payout.createdAt).toLocaleDateString('en-IN')}
                    </Text>
                  </View>
                  <View style={styles.itemRight}>
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(payout.status) + '20' }
                    ]}>
                      <Text style={[styles.statusText, { color: getStatusColor(payout.status) }]}>
                        {payout.status}
                      </Text>
                    </View>
                    {payout.status === 'PENDING' && (
                      <TouchableOpacity
                        style={styles.processBtn}
                        onPress={() => handleProcessPayout(payout.id)}
                      >
                        <Text style={styles.processBtnText}>Process</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {activeTab === 'refunds' && (
          <View style={styles.listContent}>
            <Text style={styles.listTitle}>Refund Requests ({refunds.length})</Text>
            {refunds.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="refresh-outline" size={40} color={COLORS.textMuted} />
                <Text style={styles.emptyText}>No refunds</Text>
              </View>
            ) : (
              refunds.map((refund) => (
                <TouchableOpacity
                  key={refund.id}
                  style={styles.itemCard}
                  onPress={() => router.push(`/booking-detail/${refund.id}`)}
                >
                  <View style={styles.itemLeft}>
                    <Text style={styles.itemTitle}>₹{refund.totalAmount.toLocaleString()}</Text>
                    <Text style={styles.itemMeta}>
                      #{refund.bookingNumber} • {new Date(refund.createdAt).toLocaleDateString('en-IN')}
                    </Text>
                  </View>
                  <View style={styles.itemRight}>
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: refund.paymentStatus === 'REFUNDED' ? '#10B98120' : '#F59E0B20' }
                    ]}>
                      <Text style={[
                        styles.statusText,
                        { color: refund.paymentStatus === 'REFUNDED' ? '#10B981' : '#F59E0B' }
                      ]}>
                        {refund.paymentStatus.replace('_', ' ')}
                      </Text>
                    </View>
                    {refund.paymentStatus === 'REFUND_INITIATED' && (
                      <TouchableOpacity
                        style={styles.processBtn}
                        onPress={() => handleProcessRefund(refund.id)}
                      >
                        <Text style={styles.processBtnText}>Refund</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        <View style={{ height: 80 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const getStatusColor = (status: string): string => {
  const c: Record<string, string> = {
    PENDING: '#F59E0B', PROCESSING: '#3B82F6', COMPLETED: '#10B981', FAILED: '#EF4444',
  }
  return c[status] || '#64748B'
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: COLORS.text },
  periodSelector: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 12 },
  periodChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  periodChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  periodText: { fontSize: 12, fontWeight: '500', color: COLORS.text },
  periodTextActive: { color: '#FFF' },
  tabs: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: COLORS.surface, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  tabActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tabText: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  tabTextActive: { color: '#FFF' },
  revenueCard: { alignItems: 'center', backgroundColor: '#10B98115', marginHorizontal: 16, borderRadius: 16, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#10B98140' },
  revenueLabel: { fontSize: 13, color: COLORS.textMuted, marginTop: 8 },
  revenueValue: { fontSize: 32, fontWeight: 'bold', color: '#10B981', marginTop: 4 },
  revenueSubtext: { fontSize: 12, color: COLORS.textMuted, marginTop: 4 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 8, marginBottom: 16 },
  statCard: { width: (width - 40) / 2, backgroundColor: COLORS.surface, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: 'bold', color: COLORS.text, marginTop: 6 },
  statLabel: { fontSize: 11, color: COLORS.textMuted, marginTop: 2, textAlign: 'center' },
  listContent: { paddingHorizontal: 16 },
  listTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text, marginBottom: 12 },
  itemCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: COLORS.border },
  itemLeft: { flex: 1 },
  itemTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  itemMeta: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  itemRight: { alignItems: 'flex-end', gap: 6 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '600' },
  processBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  processBtnText: { color: '#FFF', fontSize: 12, fontWeight: '600' },
  emptyCard: { alignItems: 'center', padding: 40, backgroundColor: COLORS.surface, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border },
  emptyText: { fontSize: 14, color: COLORS.textMuted, marginTop: 8 },
})