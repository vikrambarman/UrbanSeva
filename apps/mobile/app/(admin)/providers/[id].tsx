import React, { useState, useEffect } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { adminApi } from '@/lib/api'
import { COLORS } from '@/constants'
import { toast } from '@/lib/toast'

export default function AdminProviderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [provider, setProvider] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (id) fetchProvider() }, [id])

  const fetchProvider = async () => {
    try {
      const res = await adminApi.getProviderById(id!)
      if (res.data.success) setProvider(res.data.data)
      else { toast.error('Provider not found'); router.back() }
    } catch { toast.error('Failed to load') }
    finally { setLoading(false) }
  }

  const handleApprove = () => {
    Alert.alert('Approve Provider', 'Approve this provider?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Approve', onPress: async () => {
          try {
            const res = await adminApi.approveProvider(id!)
            if (res.data.success) { toast.success('Approved!'); fetchProvider() }
          } catch { toast.error('Failed') }
        },
      },
    ])
  }

  const handleReject = () => {
    Alert.alert('Reject Provider', 'Reject this provider?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject', style: 'destructive', onPress: async () => {
          try {
            const res = await adminApi.rejectProvider(id!)
            if (res.data.success) { toast.success('Rejected!'); fetchProvider() }
          } catch { toast.error('Failed') }
        },
      },
    ])
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}><ActivityIndicator size="large" color={COLORS.primary} /></View>
      </SafeAreaView>
    )
  }

  if (!provider) return null

  const getStatusColor = (status: string): string => {
    const c: Record<string, string> = {
      APPROVED: '#10B981', PENDING: '#F59E0B', UNDER_REVIEW: '#3B82F6',
      REJECTED: '#EF4444', SUSPENDED: '#DC2626',
    }
    return c[status] || '#64748B'
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Provider Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView>
        {/* Profile */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(provider.user.name || provider.user.phone).charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.name}>{provider.user.name || 'Unnamed'}</Text>
          <Text style={styles.phone}>{provider.user.phone}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(provider.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(provider.status) }]}>
              {provider.status.replace('_', ' ')}
            </Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>₹{provider.totalEarnings}</Text>
            <Text style={styles.statLabel}>Earnings</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{provider.totalJobs}</Text>
            <Text style={styles.statLabel}>Jobs</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{provider.avgRating.toFixed(1)}⭐</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{provider.commissionRate}%</Text>
            <Text style={styles.statLabel}>Commission</Text>
          </View>
        </View>

        {/* Documents */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Documents</Text>
          <View style={styles.docRow}>
            <Ionicons name="card-outline" size={18} color={COLORS.primary} />
            <View style={styles.docInfo}>
              <Text style={styles.docLabel}>Aadhar</Text>
              <Text style={styles.docValue}>{provider.aadharNumber || 'Not provided'}</Text>
            </View>
            {provider.aadharImage && <Ionicons name="checkmark-circle" size={20} color="#10B981" />}
          </View>
          <View style={styles.docRow}>
            <Ionicons name="card-outline" size={18} color={COLORS.primary} />
            <View style={styles.docInfo}>
              <Text style={styles.docLabel}>PAN</Text>
              <Text style={styles.docValue}>{provider.panNumber || 'Not provided'}</Text>
            </View>
            {provider.panImage && <Ionicons name="checkmark-circle" size={20} color="#10B981" />}
          </View>
          <View style={styles.docRow}>
            <Ionicons name="shield-checkmark-outline" size={18} color={COLORS.primary} />
            <View style={styles.docInfo}>
              <Text style={styles.docLabel}>Police Verified</Text>
              <Text style={styles.docValue}>{provider.policeVerified ? 'Yes' : 'No'}</Text>
            </View>
          </View>
        </View>

        {/* Bank Details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Bank Details</Text>
          <View style={styles.docRow}>
            <Ionicons name="business-outline" size={18} color={COLORS.primary} />
            <View style={styles.docInfo}>
              <Text style={styles.docLabel}>Bank</Text>
              <Text style={styles.docValue}>{provider.bankName || 'Not provided'}</Text>
            </View>
          </View>
          <View style={styles.docRow}>
            <Ionicons name="card-outline" size={18} color={COLORS.primary} />
            <View style={styles.docInfo}>
              <Text style={styles.docLabel}>Account</Text>
              <Text style={styles.docValue}>{provider.bankAccount || 'Not provided'}</Text>
            </View>
          </View>
          {provider.upiId && (
            <View style={styles.docRow}>
              <Ionicons name="phone-portrait-outline" size={18} color={COLORS.primary} />
              <View style={styles.docInfo}>
                <Text style={styles.docLabel}>UPI ID</Text>
                <Text style={styles.docValue}>{provider.upiId}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Assigned Services */}
        {provider.services?.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Assigned Services ({provider.services.length})</Text>
            {provider.services.map((ps: any) => (
              <View key={ps.id} style={styles.serviceRow}>
                <Ionicons name="construct-outline" size={16} color={COLORS.primary} />
                <Text style={styles.serviceName}>{ps.service.name}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Actions */}
        {provider.status === 'PENDING' && (
          <View style={styles.actionSection}>
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.approveBtn} onPress={handleApprove}>
                <Ionicons name="checkmark" size={20} color="#FFF" />
                <Text style={styles.approveBtnText}>Approve</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.rejectBtn} onPress={handleReject}>
                <Ionicons name="close" size={20} color="#EF4444" />
                <Text style={styles.rejectBtnText}>Reject</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

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
  profileCard: { alignItems: 'center', padding: 24, backgroundColor: COLORS.surface, margin: 16, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#8B5CF620', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText: { fontSize: 28, fontWeight: 'bold', color: '#8B5CF6' },
  name: { fontSize: 20, fontWeight: 'bold', color: COLORS.text },
  phone: { fontSize: 14, color: COLORS.textMuted, marginTop: 4, marginBottom: 12 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 12, fontWeight: '700' },
  statsRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  statCard: { flex: 1, minWidth: '45%', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: COLORS.border },
  statValue: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  statLabel: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  card: { backgroundColor: COLORS.surface, marginHorizontal: 16, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: COLORS.border, marginBottom: 16 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text, marginBottom: 12 },
  docRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  docInfo: { flex: 1 },
  docLabel: { fontSize: 12, color: COLORS.textMuted },
  docValue: { fontSize: 14, fontWeight: '500', color: COLORS.text, marginTop: 2 },
  serviceRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  serviceName: { fontSize: 13, color: COLORS.text },
  actionSection: { padding: 16 },
  actionRow: { flexDirection: 'row', gap: 12 },
  approveBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#10B981', paddingVertical: 14, borderRadius: 12 },
  approveBtnText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  rejectBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#EF444420', paddingVertical: 14, borderRadius: 12 },
  rejectBtnText: { color: '#EF4444', fontSize: 16, fontWeight: '600' },
})