import React, { useState, useEffect, useCallback } from 'react'
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator,
  RefreshControl, TouchableOpacity, Dimensions,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { providerApi } from '@/lib/api'
import { COLORS } from '@/constants'
import { toast } from '@/lib/toast'
import type { ProviderEarning } from '@/types'

const { width } = Dimensions.get('window')

interface EarningsData {
  earnings: ProviderEarning[]
  stats: {
    totalGross: number
    totalCommission: number
    totalNet: number
    totalJobs: number
    pendingPayout: number
  }
}

export default function ProviderEarningsScreen() {
  const [data, setData] = useState<EarningsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [period, setPeriod] = useState('all')

  const fetchData = useCallback(async () => {
    try {
      const res = await providerApi.getEarnings(period)
      if (res.data.success) setData(res.data.data)
    } catch (err) {
      console.error('Earnings error:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [period])

  useEffect(() => { fetchData() }, [fetchData])

  const onRefresh = () => { setRefreshing(true); fetchData() }

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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Earnings</Text>
          <TouchableOpacity style={styles.payoutBtn} onPress={() => router.push('/(provider)/earnings/payouts')}>
            <Ionicons name="wallet-outline" size={18} color={COLORS.primary} />
            <Text style={styles.payoutBtnText}>Payouts</Text>
          </TouchableOpacity>
        </View>

        {/* Period Selector */}
        <View style={styles.periodSelector}>
          {['all', 'week', 'month'].map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.periodChip, period === p && styles.periodChipActive]}
              onPress={() => setPeriod(p)}
            >
              <Text style={[styles.periodText, period === p && styles.periodTextActive]}>
                {p === 'all' ? 'All Time' : p === 'week' ? 'This Week' : 'This Month'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Stats Cards */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Ionicons name="cash-outline" size={24} color="#10B981" />
            <Text style={styles.statValue}>₹{(data?.stats.totalNet || 0).toLocaleString()}</Text>
            <Text style={styles.statLabel}>Net Earnings</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="trending-up-outline" size={24} color="#3B82F6" />
            <Text style={styles.statValue}>₹{(data?.stats.totalGross || 0).toLocaleString()}</Text>
            <Text style={styles.statLabel}>Gross Amount</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="pricetag-outline" size={24} color="#F59E0B" />
            <Text style={styles.statValue}>₹{(data?.stats.totalCommission || 0).toLocaleString()}</Text>
            <Text style={styles.statLabel}>Commission</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="time-outline" size={24} color="#8B5CF6" />
            <Text style={styles.statValue}>₹{(data?.stats.pendingPayout || 0).toLocaleString()}</Text>
            <Text style={styles.statLabel}>Pending Payout</Text>
          </View>
        </View>

        {/* Earnings List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Earnings</Text>
          {data?.earnings.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="receipt-outline" size={40} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>No earnings yet</Text>
            </View>
          ) : (
            data?.earnings.map((earning) => (
              <View key={earning.id} style={styles.earningCard}>
                <View style={styles.earningLeft}>
                  <Text style={styles.earningAmount}>₹{earning.net}</Text>
                  <Text style={styles.earningMeta}>
                    Gross: ₹{earning.gross} • Commission: ₹{earning.commission}
                  </Text>
                  <Text style={styles.earningDate}>
                    {new Date(earning.createdAt).toLocaleDateString('en-IN')}
                  </Text>
                </View>
                <View style={[
                  styles.earningStatus,
                  { backgroundColor: earning.status === 'PAID' ? '#10B98120' : earning.status === 'PENDING' ? '#F59E0B20' : '#3B82F620' }
                ]}>
                  <Text style={[
                    styles.earningStatusText,
                    { color: earning.status === 'PAID' ? '#10B981' : earning.status === 'PENDING' ? '#F59E0B' : '#3B82F6' }
                  ]}>
                    {earning.status}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: COLORS.text },
  payoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.primary + '15', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  payoutBtnText: { fontSize: 13, fontWeight: '600', color: COLORS.primary },
  periodSelector: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 16 },
  periodChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  periodChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  periodText: { fontSize: 13, fontWeight: '500', color: COLORS.text },
  periodTextActive: { color: '#FFF' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 8, marginBottom: 20 },
  statCard: { width: (width - 40) / 2, backgroundColor: COLORS.surface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: 'bold', color: COLORS.text, marginTop: 8 },
  statLabel: { fontSize: 12, color: COLORS.textMuted, marginTop: 4 },
  section: { paddingHorizontal: 16 },
  sectionTitle: { fontSize: 17, fontWeight: 'bold', color: COLORS.text, marginBottom: 12 },
  emptyCard: { alignItems: 'center', padding: 32, backgroundColor: COLORS.surface, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border },
  emptyText: { fontSize: 14, color: COLORS.textMuted, marginTop: 8 },
  earningCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: COLORS.border },
  earningLeft: { flex: 1 },
  earningAmount: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  earningMeta: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  earningDate: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  earningStatus: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  earningStatusText: { fontSize: 11, fontWeight: '600' },
})