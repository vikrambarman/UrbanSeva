import React, { useState, useEffect, useCallback } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { adminApi } from '@/lib/api'
import { COLORS } from '@/constants'
import { toast } from '@/lib/toast'
import type { AdminProvider } from '@/types'

export default function AdminProvidersScreen() {
  const [providers, setProviders] = useState<AdminProvider[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchProviders = useCallback(async () => {
    try {
      const params: Record<string, string> = {}
      if (statusFilter !== 'ALL') params.status = statusFilter
      const res = await adminApi.getProviders(params)
      if (res.data.success) setProviders(res.data.data.providers)
    } catch (err) {
      console.error('Providers error:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [statusFilter])

  useEffect(() => { fetchProviders() }, [fetchProviders])

  const handleApprove = (id: string) => {
    Alert.alert('Approve Provider', 'Approve this provider?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Approve', onPress: async () => {
          setActionLoading(id)
          try {
            const res = await adminApi.approveProvider(id)
            if (res.data.success) { toast.success('Provider approved!'); fetchProviders() }
          } catch { toast.error('Failed') }
          finally { setActionLoading(null) }
        },
      },
    ])
  }

  const handleReject = (id: string) => {
    Alert.alert('Reject Provider', 'Reject this provider?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject', style: 'destructive', onPress: async () => {
          setActionLoading(id)
          try {
            const res = await adminApi.rejectProvider(id)
            if (res.data.success) { toast.success('Provider rejected!'); fetchProviders() }
          } catch { toast.error('Failed') }
          finally { setActionLoading(null) }
        },
      },
    ])
  }

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      APPROVED: '#10B981', PENDING: '#F59E0B', UNDER_REVIEW: '#3B82F6',
      REJECTED: '#EF4444', SUSPENDED: '#DC2626',
    }
    return colors[status] || '#64748B'
  }

  const statuses = ['ALL', 'PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED']

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
        <Text style={styles.headerTitle}>Provider Management</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
        {statuses.map((s) => (
          <TouchableOpacity
            key={s}
            style={[styles.filterChip, statusFilter === s && styles.filterChipActive]}
            onPress={() => setStatusFilter(s)}
          >
            <Text style={[styles.filterText, statusFilter === s && styles.filterTextActive]}>
              {s === 'ALL' ? 'All' : s.replace('_', ' ')}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchProviders() }} />}
      >
        {providers.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="briefcase-outline" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>No providers found</Text>
          </View>
        ) : (
          providers.map((provider) => (
            <TouchableOpacity
              key={provider.id}
              style={styles.providerCard}
              onPress={() => router.push(`/(admin)/providers/${provider.id}`)}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{(provider.user.name || provider.user.phone).charAt(0).toUpperCase()}</Text>
              </View>
              <View style={styles.providerInfo}>
                <Text style={styles.providerName} numberOfLines={1}>{provider.user.name || 'Unnamed'}</Text>
                <Text style={styles.providerPhone}>{provider.user.phone}</Text>
                <View style={styles.metaRow}>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(provider.status) + '20' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(provider.status) }]}>
                      {provider.status.replace('_', ' ')}
                    </Text>
                  </View>
                  <View style={styles.ratingRow}>
                    <Ionicons name="star" size={12} color="#FBBF24" />
                    <Text style={styles.ratingText}>{provider.avgRating.toFixed(1)}</Text>
                  </View>
                  <Text style={styles.metaText}>{provider.totalJobs} jobs</Text>
                </View>
              </View>
              {provider.status === 'PENDING' && (
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.approveBtn}
                    onPress={() => handleApprove(provider.id)}
                    disabled={actionLoading === provider.id}
                  >
                    {actionLoading === provider.id ? (
                      <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                      <Ionicons name="checkmark" size={16} color="#FFF" />
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.rejectBtn}
                    onPress={() => handleReject(provider.id)}
                    disabled={actionLoading === provider.id}
                  >
                    <Ionicons name="close" size={16} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              )}
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
  filterScroll: { maxHeight: 44, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  filterContent: { paddingHorizontal: 12, paddingVertical: 6, gap: 8, flexDirection: 'row' },
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  filterChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterText: { fontSize: 12, fontWeight: '500', color: COLORS.text },
  filterTextActive: { color: '#FFF' },
  listContent: { padding: 16 },
  providerCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 12, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: COLORS.border },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#8B5CF620', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { fontSize: 18, fontWeight: 'bold', color: '#8B5CF6' },
  providerInfo: { flex: 1 },
  providerName: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  providerPhone: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: '700' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  ratingText: { fontSize: 11, fontWeight: '600', color: COLORS.text },
  metaText: { fontSize: 11, color: COLORS.textMuted },
  actionButtons: { flexDirection: 'row', gap: 6 },
  approveBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#10B981', justifyContent: 'center', alignItems: 'center' },
  rejectBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#EF444420', justifyContent: 'center', alignItems: 'center' },
  emptyCard: { alignItems: 'center', padding: 40, backgroundColor: COLORS.surface, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border },
  emptyText: { fontSize: 14, color: COLORS.textMuted, marginTop: 8 },
})