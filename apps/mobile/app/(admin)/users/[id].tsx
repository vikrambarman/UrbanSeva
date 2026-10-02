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
import type { AdminUser } from '@/types'

export default function AdminUserDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [user, setUser] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (id) fetchUser() }, [id])

  const fetchUser = async () => {
    try {
      const res = await adminApi.getUserById(id!)
      if (res.data.success) setUser(res.data.data)
      else { toast.error('User not found'); router.back() }
    } catch { toast.error('Failed to load user') }
    finally { setLoading(false) }
  }

  const handleBlockToggle = () => {
    if (!user) return
    const action = user.isActive ? 'block' : 'unblock'
    Alert.alert(`${action} User`, `Are you sure?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: action === 'block' ? 'Block' : 'Unblock',
        style: action === 'block' ? 'destructive' : 'default',
        onPress: async () => {
          try {
            const fn = user.isActive ? adminApi.blockUser : adminApi.unblockUser
            const res = await fn(user.id)
            if (res.data.success) {
              toast.success(`User ${action}ed!`)
              fetchUser()
            }
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

  if (!user) return null

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>User Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(user.name || user.phone).charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.userName}>{user.name || 'Unnamed User'}</Text>
          <Text style={styles.userPhone}>{user.phone}</Text>
          {user.email && <Text style={styles.userEmail}>{user.email}</Text>}
          <View style={styles.badges}>
            <View style={[styles.roleBadge, { backgroundColor: '#3B82F620' }]}>
              <Text style={[styles.roleText, { color: '#3B82F6' }]}>{user.role}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: user.isActive ? '#10B98120' : '#EF444420' }]}>
              <Text style={[styles.statusText, { color: user.isActive ? '#10B981' : '#EF4444' }]}>
                {user.isActive ? 'Active' : 'Blocked'}
              </Text>
            </View>
            {user.isVerified && (
              <View style={[styles.statusBadge, { backgroundColor: '#3B82F620' }]}>
                <Text style={[styles.statusText, { color: '#3B82F6' }]}>✓ Verified</Text>
              </View>
            )}
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="wallet-outline" size={22} color="#10B981" />
            <Text style={styles.statValue}>₹{user.walletBalance}</Text>
            <Text style={styles.statLabel}>Wallet</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="trophy-outline" size={22} color="#F59E0B" />
            <Text style={styles.statValue}>{user.loyaltyTier}</Text>
            <Text style={styles.statLabel}>Tier</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="calendar-outline" size={22} color="#3B82F6" />
            <Text style={styles.statValue}>{user._count.bookings}</Text>
            <Text style={styles.statLabel}>Bookings</Text>
          </View>
        </View>

        {/* Joined Info */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={18} color={COLORS.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Joined On</Text>
              <Text style={styles.infoValue}>{new Date(user.createdAt).toLocaleDateString('en-IN')}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="star-outline" size={18} color={COLORS.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Loyalty Points</Text>
              <Text style={styles.infoValue}>{user.loyaltyPoints}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="ribbon-outline" size={18} color={COLORS.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Referral Code</Text>
              <Text style={styles.infoValue}>{user.referralCode}</Text>
            </View>
          </View>
        </View>

        {/* Action Button */}
        <View style={styles.actionSection}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: user.isActive ? '#EF4444' : '#10B981' }]}
            onPress={handleBlockToggle}
          >
            <Ionicons name={user.isActive ? 'ban' : 'checkmark-circle'} size={20} color="#FFF" />
            <Text style={styles.actionBtnText}>
              {user.isActive ? 'Block User' : 'Unblock User'}
            </Text>
          </TouchableOpacity>
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
  profileCard: { alignItems: 'center', padding: 24, backgroundColor: COLORS.surface, margin: 16, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.primary + '20', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText: { fontSize: 32, fontWeight: 'bold', color: COLORS.primary },
  userName: { fontSize: 20, fontWeight: 'bold', color: COLORS.text },
  userPhone: { fontSize: 14, color: COLORS.textMuted, marginTop: 4 },
  userEmail: { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
  badges: { flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap', justifyContent: 'center' },
  roleBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  roleText: { fontSize: 11, fontWeight: '700' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '600' },
  statsRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 16 },
  statCard: { flex: 1, alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: COLORS.border },
  statValue: { fontSize: 18, fontWeight: 'bold', color: COLORS.text, marginTop: 6 },
  statLabel: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  infoCard: { backgroundColor: COLORS.surface, marginHorizontal: 16, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: COLORS.border, marginBottom: 16 },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 12, color: COLORS.textMuted },
  infoValue: { fontSize: 14, fontWeight: '500', color: COLORS.text, marginTop: 2 },
  actionSection: { padding: 16 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12 },
  actionBtnText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
})