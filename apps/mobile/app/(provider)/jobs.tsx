import React, { useState, useEffect, useCallback } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { providerApi } from '@/lib/api'
import { COLORS } from '@/constants'
import { toast } from '@/lib/toast'
import type { ProviderJob } from '@/types'

const STATUS_FILTERS = [
  { key: 'ALL', label: 'All' },
  { key: 'PROVIDER_ASSIGNED', label: 'Pending' },
  { key: 'CONFIRMED', label: 'Upcoming' },
  { key: 'SERVICE_STARTED', label: 'In Progress' },
  { key: 'SERVICE_COMPLETED', label: 'Done' },
]

export default function ProviderJobsScreen() {
  const [jobs, setJobs] = useState<ProviderJob[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filter, setFilter] = useState('ALL')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchJobs = useCallback(async () => {
    try {
      const res = await providerApi.getJobs(filter)
      if (res.data.success) setJobs(res.data.data)
    } catch (err) {
      console.error('Fetch jobs error:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [filter])

  useEffect(() => { fetchJobs() }, [fetchJobs])

  const handleAction = async (jobId: string, action: string) => {
    if (action === 'reject') {
      Alert.alert('Reject Job', 'Are you sure you want to reject this job?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reject', style: 'destructive', onPress: () => doAction(jobId, action) },
      ])
    } else {
      doAction(jobId, action)
    }
  }

  const doAction = async (jobId: string, action: string) => {
    setActionLoading(jobId)
    try {
      const res = await providerApi.updateJobStatus(jobId, action)
      if (res.data.success) {
        toast.success(`Job ${action}ed!`)
        fetchJobs()
      } else {
        toast.error(res.data.error || 'Action failed')
      }
    } catch {
      toast.error('Action failed')
    } finally {
      setActionLoading(null)
    }
  }

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      PROVIDER_ASSIGNED: '#F59E0B', CONFIRMED: '#3B82F6',
      SERVICE_STARTED: '#F97316', SERVICE_COMPLETED: '#10B981', CANCELLED: '#EF4444',
    }
    return colors[status] || '#64748B'
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
        <Text style={styles.headerTitle}>My Jobs</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
        {STATUS_FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterChip, filter === f.key && styles.filterChipActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[styles.filterChipText, filter === f.key && styles.filterChipTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchJobs() }} />}
      >
        {jobs.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="briefcase-outline" size={64} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>No jobs found</Text>
            <Text style={styles.emptyText}>Jobs will appear here when assigned to you</Text>
          </View>
        ) : (
          jobs.map((job) => {
            const isActionLoading = actionLoading === job.id
            return (
              <TouchableOpacity
                key={job.id}
                style={styles.jobCard}
                onPress={() => router.push(`/(provider)/jobs/${job.id}`)}
                activeOpacity={0.8}
              >
                <View style={styles.jobTopRow}>
                  <View style={styles.jobLeft}>
                    <Text style={styles.serviceName} numberOfLines={1}>{job.service.name}</Text>
                    <Text style={styles.bookingNum}>#{job.bookingNumber}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(job.status) + '20' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(job.status) }]}>
                      {job.status.replace(/_/g, ' ')}
                    </Text>
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <View style={styles.infoItem}>
                    <Ionicons name="person-outline" size={14} color={COLORS.textMuted} />
                    <Text style={styles.infoText}>{job.user.name || 'Customer'}</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Ionicons name="calendar-outline" size={14} color={COLORS.textMuted} />
                    <Text style={styles.infoText}>{new Date(job.scheduledDate).toLocaleDateString('en-IN')}</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Ionicons name="time-outline" size={14} color={COLORS.textMuted} />
                    <Text style={styles.infoText}>{job.scheduledTime}</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Ionicons name="location-outline" size={14} color={COLORS.textMuted} />
                    <Text style={styles.infoText} numberOfLines={1}>{job.address.area}</Text>
                  </View>
                </View>

                <View style={styles.jobBottomRow}>
                  <Text style={styles.amount}>₹{job.totalAmount}</Text>
                  <View style={styles.actionButtons}>
                    {job.status === 'PROVIDER_ASSIGNED' && (
                      <>
                        <TouchableOpacity
                          style={styles.acceptBtn}
                          onPress={() => handleAction(job.id, 'accept')}
                          disabled={isActionLoading}
                        >
                          {isActionLoading ? (
                            <ActivityIndicator size="small" color="#FFF" />
                          ) : (
                            <Text style={styles.acceptBtnText}>Accept</Text>
                          )}
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.rejectBtn}
                          onPress={() => handleAction(job.id, 'reject')}
                          disabled={isActionLoading}
                        >
                          <Text style={styles.rejectBtnText}>Reject</Text>
                        </TouchableOpacity>
                      </>
                    )}
                    {job.status === 'CONFIRMED' && (
                      <TouchableOpacity
                        style={styles.startBtn}
                        onPress={() => handleAction(job.id, 'start')}
                        disabled={isActionLoading}
                      >
                        {isActionLoading ? (
                          <ActivityIndicator size="small" color="#FFF" />
                        ) : (
                          <Text style={styles.startBtnText}>▶ Start Job</Text>
                        )}
                      </TouchableOpacity>
                    )}
                    {job.status === 'SERVICE_STARTED' && (
                      <TouchableOpacity
                        style={styles.completeBtn}
                        onPress={() => handleAction(job.id, 'complete')}
                        disabled={isActionLoading}
                      >
                        {isActionLoading ? (
                          <ActivityIndicator size="small" color="#FFF" />
                        ) : (
                          <Text style={styles.completeBtnText}>✓ Complete</Text>
                        )}
                      </TouchableOpacity>
                    )}
                    {job.status === 'SERVICE_COMPLETED' && job.review && (
                      <View style={styles.ratingBadge}>
                        <Ionicons name="star" size={14} color="#FBBF24" />
                        <Text style={styles.ratingText}>{job.review.overallRating}/5</Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            )
          })
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
  filterScroll: { maxHeight: 48, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  filterContent: { paddingHorizontal: 12, paddingVertical: 8, gap: 8, flexDirection: 'row' },
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  filterChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterChipText: { fontSize: 13, fontWeight: '500', color: COLORS.text },
  filterChipTextActive: { color: '#FFF' },
  listContent: { padding: 16 },
  jobCard: { backgroundColor: COLORS.surface, borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
  jobTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  jobLeft: { flex: 1, marginRight: 8 },
  serviceName: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  bookingNum: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '600' },
  infoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  infoText: { fontSize: 12, color: COLORS.textMuted },
  jobBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTopWidth: 1, borderTopColor: COLORS.border },
  amount: { fontSize: 18, fontWeight: 'bold', color: COLORS.primary },
  actionButtons: { flexDirection: 'row', gap: 8 },
  acceptBtn: { backgroundColor: '#10B981', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  acceptBtnText: { color: '#FFF', fontSize: 13, fontWeight: '600' },
  rejectBtn: { backgroundColor: '#EF444420', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  rejectBtnText: { color: '#EF4444', fontSize: 13, fontWeight: '600' },
  startBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 8 },
  startBtnText: { color: '#FFF', fontSize: 13, fontWeight: '600' },
  completeBtn: { backgroundColor: '#10B981', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 8 },
  completeBtnText: { color: '#FFF', fontSize: 13, fontWeight: '600' },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FBBF2420', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  ratingText: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  emptyText: { fontSize: 14, color: COLORS.textMuted },
})