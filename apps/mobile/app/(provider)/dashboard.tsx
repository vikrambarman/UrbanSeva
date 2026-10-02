import React, { useState, useEffect, useCallback } from 'react'
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator,
  RefreshControl, TouchableOpacity, Dimensions,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useAuthStore } from '@/store/authStore'
import { providerApi } from '@/lib/api'
import { COLORS } from '@/constants'
import type { ProviderJob, ProviderEarning } from '@/types'

const { width } = Dimensions.get('window')

interface DashboardData {
  earnings: ProviderEarning[]
  stats: {
    totalGross: number
    totalCommission: number
    totalNet: number
    totalJobs: number
    pendingPayout: number
  }
}

export default function ProviderDashboard() {
  const { user } = useAuthStore()
  const [dashData, setDashData] = useState<DashboardData | null>(null)
  const [jobs, setJobs] = useState<ProviderJob[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const [earnRes, jobsRes] = await Promise.all([
        providerApi.getEarnings('month'),
        providerApi.getJobs('ALL'),
      ])
      if (earnRes.data.success) setDashData(earnRes.data.data)
      if (jobsRes.data.success) setJobs(jobsRes.data.data)
    } catch (err) {
      console.error('Dashboard error:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const onRefresh = () => { setRefreshing(true); fetchData() }

  const activeJobs = jobs.filter(j => ['CONFIRMED', 'SERVICE_STARTED', 'PROVIDER_ASSIGNED'].includes(j.status))
  const pendingJobs = jobs.filter(j => j.status === 'PROVIDER_ASSIGNED')
  const completedThisMonth = dashData?.stats.totalJobs || 0

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
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Namaste, {user?.name || 'Provider'}! 👋</Text>
            <Text style={styles.subGreeting}>Here&apos;s your today&apos;s overview</Text>
          </View>
          <TouchableOpacity style={styles.notifBtn}>
            <Ionicons name="notifications-outline" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#10B98120' }]}>
              <Ionicons name="wallet-outline" size={22} color="#10B981" />
            </View>
            <Text style={styles.statValue}>₹{(dashData?.stats.totalNet || 0).toLocaleString()}</Text>
            <Text style={styles.statLabel}>This Month</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#F59E0B20' }]}>
              <Ionicons name="time-outline" size={22} color="#F59E0B" />
            </View>
            <Text style={styles.statValue}>₹{(dashData?.stats.pendingPayout || 0).toLocaleString()}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#3B82F620' }]}>
              <Ionicons name="briefcase-outline" size={22} color="#3B82F6" />
            </View>
            <Text style={styles.statValue}>{activeJobs.length}</Text>
            <Text style={styles.statLabel}>Active Jobs</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#8B5CF620' }]}>
              <Ionicons name="star-outline" size={22} color="#8B5CF6" />
            </View>
            <Text style={styles.statValue}>{completedThisMonth}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
        </View>

        {/* Pending Actions */}
        {pendingJobs.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>⚡ Pending Actions</Text>
              <TouchableOpacity onPress={() => router.push('/(provider)/jobs')}>
                <Text style={styles.seeAll}>View All →</Text>
              </TouchableOpacity>
            </View>
            {pendingJobs.slice(0, 3).map((job) => (
              <TouchableOpacity
                key={job.id}
                style={styles.jobCard}
                onPress={() => router.push(`/(provider)/jobs/${job.id}`)}
              >
                <View style={styles.jobIcon}>
                  <Ionicons name="alert-circle" size={24} color="#F59E0B" />
                </View>
                <View style={styles.jobInfo}>
                  <Text style={styles.jobServiceName}>{job.service.name}</Text>
                  <Text style={styles.jobMeta}>
                    {job.user.name} • {new Date(job.scheduledDate).toLocaleDateString('en-IN')}
                  </Text>
                </View>
                <View style={styles.jobAmount}>
                  <Text style={styles.jobAmountText}>₹{job.totalAmount}</Text>
                  <Text style={styles.actionText}>Accept →</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Recent Jobs */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Jobs</Text>
            <TouchableOpacity onPress={() => router.push('/(provider)/jobs')}>
              <Text style={styles.seeAll}>View All →</Text>
            </TouchableOpacity>
          </View>
          {jobs.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="briefcase-outline" size={40} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>No jobs yet</Text>
            </View>
          ) : (
            jobs.slice(0, 5).map((job) => (
              <TouchableOpacity
                key={job.id}
                style={styles.recentJobCard}
                onPress={() => router.push(`/(provider)/jobs/${job.id}`)}
              >
                <View style={styles.recentJobLeft}>
                  <Text style={styles.recentJobName} numberOfLines={1}>{job.service.name}</Text>
                  <Text style={styles.recentJobMeta}>
                    {new Date(job.scheduledDate).toLocaleDateString('en-IN')} • {job.scheduledTime}
                  </Text>
                </View>
                <View style={[
                  styles.statusDot,
                  { backgroundColor: job.status === 'SERVICE_COMPLETED' ? '#10B981' : job.status === 'CANCELLED' ? '#EF4444' : '#F59E0B' }
                ]} />
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.quickBtn} onPress={() => router.push('/(provider)/earnings')}>
              <Ionicons name="wallet" size={24} color={COLORS.primary} />
              <Text style={styles.quickBtnText}>Earnings</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickBtn} onPress={() => router.push('/(provider)/reviews')}>
              <Ionicons name="star" size={24} color={COLORS.primary} />
              <Text style={styles.quickBtnText}>Reviews</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickBtn} onPress={() => router.push('/(provider)/profile')}>
              <Ionicons name="settings" size={24} color={COLORS.primary} />
              <Text style={styles.quickBtnText}>Settings</Text>
            </TouchableOpacity>
          </View>
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
  greeting: { fontSize: 22, fontWeight: 'bold', color: COLORS.text },
  subGreeting: { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
  notifBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 8, marginBottom: 20 },
  statCard: { width: (width - 40) / 2, backgroundColor: COLORS.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: COLORS.border },
  statIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  statValue: { fontSize: 22, fontWeight: 'bold', color: COLORS.text },
  statLabel: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  section: { paddingHorizontal: 16, marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontWeight: 'bold', color: COLORS.text },
  seeAll: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },
  jobCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF7ED', borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#FED7AA' },
  jobIcon: { marginRight: 12 },
  jobInfo: { flex: 1 },
  jobServiceName: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  jobMeta: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  jobAmount: { alignItems: 'flex-end' },
  jobAmountText: { fontSize: 16, fontWeight: 'bold', color: COLORS.primary },
  actionText: { fontSize: 12, color: COLORS.primary, fontWeight: '600', marginTop: 2 },
  recentJobCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.surface, borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: COLORS.border },
  recentJobLeft: { flex: 1 },
  recentJobName: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  recentJobMeta: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  emptyCard: { alignItems: 'center', padding: 32, backgroundColor: COLORS.surface, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border },
  emptyText: { fontSize: 14, color: COLORS.textMuted, marginTop: 8 },
  quickActions: { flexDirection: 'row', gap: 10 },
  quickBtn: { flex: 1, alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: COLORS.border, gap: 6 },
  quickBtnText: { fontSize: 12, fontWeight: '600', color: COLORS.text },
})