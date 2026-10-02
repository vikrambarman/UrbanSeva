import React, { useState, useEffect } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Linking, Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { providerApi } from '@/lib/api'
import { COLORS } from '@/constants'
import { toast } from '@/lib/toast'
import type { ProviderJob } from '@/types'

export default function ProviderJobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [job, setJob] = useState<ProviderJob | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => { if (id) fetchJob() }, [id])

  const fetchJob = async () => {
    try {
      const res = await providerApi.getJobById(id!)
      if (res.data.success) setJob(res.data.data)
      else { toast.error('Job not found'); router.back() }
    } catch { toast.error('Failed to load job') }
    finally { setLoading(false) }
  }

  const handleAction = async (action: string) => {
    if (action === 'reject') {
      Alert.alert('Reject Job', 'Are you sure?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reject', style: 'destructive', onPress: () => doAction(action) },
      ])
      return
    }
    doAction(action)
  }

  const doAction = async (action: string) => {
    setActionLoading(true)
    try {
      const res = await providerApi.updateJobStatus(id!, action)
      if (res.data.success) {
        toast.success(`Job ${action}ed!`)
        fetchJob()
      } else toast.error(res.data.error || 'Failed')
    } catch { toast.error('Action failed') }
    finally { setActionLoading(false) }
  }

  const getStatusColor = (status: string): string => {
    const c: Record<string, string> = {
      PROVIDER_ASSIGNED: '#F59E0B', CONFIRMED: '#3B82F6',
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

  if (!job) return null

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Job Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.card}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(job.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(job.status) }]}>
              {job.status.replace(/_/g, ' ')}
            </Text>
          </View>
          <Text style={styles.serviceName}>{job.service.name}</Text>
          <Text style={styles.bookingNum}>#{job.bookingNumber}</Text>
          <View style={styles.divider} />
          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>Total Amount</Text>
            <Text style={styles.amountValue}>₹{job.totalAmount}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Customer Details</Text>
          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={18} color={COLORS.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Name</Text>
              <Text style={styles.infoValue}>{job.user.name || 'Customer'}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.infoRow} onPress={() => Linking.openURL(`tel:${job.user.phone}`)}>
            <Ionicons name="call-outline" size={18} color={COLORS.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Phone</Text>
              <Text style={styles.infoValue}>{job.user.phone}</Text>
            </View>
            <Ionicons name="call" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Schedule & Location</Text>
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={18} color={COLORS.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Date & Time</Text>
              <Text style={styles.infoValue}>
                {new Date(job.scheduledDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })} at {job.scheduledTime}
              </Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={18} color={COLORS.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Address</Text>
              <Text style={styles.infoValue}>{job.address.fullAddress}</Text>
              {job.address.landmark && <Text style={styles.infoSubtext}>Near: {job.address.landmark}</Text>}
            </View>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={18} color={COLORS.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Duration</Text>
              <Text style={styles.infoValue}>{job.service.duration}</Text>
            </View>
          </View>
        </View>

        {job.specialInstructions && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Special Instructions</Text>
            <Text style={styles.instructionsText}>{job.specialInstructions}</Text>
          </View>
        )}

        {job.review && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Customer Review</Text>
            <View style={styles.ratingRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons key={star} name="star" size={20} color={star <= job.review!.overallRating ? '#FBBF24' : '#E5E7EB'} />
              ))}
              <Text style={styles.ratingValue}>{job.review.overallRating}/5</Text>
            </View>
            {job.review.comment && <Text style={styles.reviewComment}>&quot;{job.review.comment}&quot;</Text>}
          </View>
        )}

        <View style={styles.actionSection}>
          {job.status === 'PROVIDER_ASSIGNED' && (
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.acceptBtn} onPress={() => handleAction('accept')} disabled={actionLoading}>
                {actionLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.acceptBtnText}>✓ Accept Job</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={styles.rejectBtn} onPress={() => handleAction('reject')} disabled={actionLoading}>
                <Text style={styles.rejectBtnText}>✗ Reject</Text>
              </TouchableOpacity>
            </View>
          )}
          {job.status === 'CONFIRMED' && (
            <TouchableOpacity style={styles.startBtn} onPress={() => handleAction('start')} disabled={actionLoading}>
              {actionLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.actionBtnText}>▶ Start Service</Text>}
            </TouchableOpacity>
          )}
          {job.status === 'SERVICE_STARTED' && (
            <TouchableOpacity style={styles.completeBtn} onPress={() => handleAction('complete')} disabled={actionLoading}>
              {actionLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.actionBtnText}>✓ Complete Service</Text>}
            </TouchableOpacity>
          )}
          {job.status === 'SERVICE_COMPLETED' && (
            <View style={styles.completedBadge}>
              <Ionicons name="checkmark-circle" size={24} color="#10B981" />
              <Text style={styles.completedText}>Service Completed!</Text>
            </View>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  scrollView: { flex: 1 },
  card: { backgroundColor: COLORS.surface, margin: 16, marginBottom: 0, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: COLORS.border },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginBottom: 8 },
  statusText: { fontSize: 12, fontWeight: '600' },
  serviceName: { fontSize: 20, fontWeight: 'bold', color: COLORS.text, marginBottom: 4 },
  bookingNum: { fontSize: 13, color: COLORS.textMuted },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 12 },
  amountRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  amountLabel: { fontSize: 14, color: COLORS.textMuted },
  amountValue: { fontSize: 22, fontWeight: 'bold', color: COLORS.primary },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text, marginBottom: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 12 },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 12, color: COLORS.textMuted, marginBottom: 2 },
  infoValue: { fontSize: 14, fontWeight: '500', color: COLORS.text },
  infoSubtext: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  instructionsText: { fontSize: 14, color: COLORS.text, lineHeight: 20 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  ratingValue: { fontSize: 16, fontWeight: 'bold', color: COLORS.text, marginLeft: 8 },
  reviewComment: { fontSize: 14, color: COLORS.text, fontStyle: 'italic', marginTop: 8 },
  actionSection: { padding: 16 },
  actionRow: { flexDirection: 'row', gap: 12 },
  acceptBtn: { flex: 1, backgroundColor: '#10B981', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  acceptBtnText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  rejectBtn: { flex: 1, backgroundColor: '#EF444420', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  rejectBtnText: { color: '#EF4444', fontSize: 16, fontWeight: '600' },
  startBtn: { backgroundColor: COLORS.primary, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  completeBtn: { backgroundColor: '#10B981', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  actionBtnText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  completedBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#10B98120', paddingVertical: 14, borderRadius: 12 },
  completedText: { fontSize: 16, fontWeight: '600', color: '#10B981' },
})