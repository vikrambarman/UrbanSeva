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
import type { AdminUser } from '@/types'

export default function AdminUsersScreen() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchUsers = useCallback(async () => {
    try {
      const params: Record<string, string> = { page: '1', limit: '50' }
      if (search) params.search = search
      if (roleFilter !== 'ALL') params.role = roleFilter
      const res = await adminApi.getUsers(params)
      if (res.data.success) setUsers(res.data.data.users)
    } catch (err) {
      console.error('Users error:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [search, roleFilter])

  useEffect(() => {
    const timer = setTimeout(fetchUsers, 400)
    return () => clearTimeout(timer)
  }, [fetchUsers])

  const handleBlockToggle = async (user: AdminUser) => {
    const action = user.isActive ? 'block' : 'unblock'
    Alert.alert(
      `${action === 'block' ? 'Block' : 'Unblock'} User`,
      `Are you sure you want to ${action} ${user.name || user.phone}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action === 'block' ? 'Block' : 'Unblock',
          style: action === 'block' ? 'destructive' : 'default',
          onPress: async () => {
            setActionLoading(user.id)
            try {
              const fn = user.isActive ? adminApi.blockUser : adminApi.unblockUser
              const res = await fn(user.id)
              if (res.data.success) {
                toast.success(`User ${action}ed!`)
                fetchUsers()
              } else toast.error(res.data.error || 'Failed')
            } catch { toast.error('Action failed') }
            finally { setActionLoading(null) }
          },
        },
      ]
    )
  }

  const roles = ['ALL', 'CUSTOMER', 'PROVIDER', 'ADMIN']

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
        <Text style={styles.headerTitle}>User Management</Text>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color={COLORS.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, phone, email..."
          placeholderTextColor={COLORS.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Role Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
        {roles.map((r) => (
          <TouchableOpacity
            key={r}
            style={[styles.filterChip, roleFilter === r && styles.filterChipActive]}
            onPress={() => setRoleFilter(r)}
          >
            <Text style={[styles.filterText, roleFilter === r && styles.filterTextActive]}>
              {r === 'ALL' ? 'All Roles' : r}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Users List */}
      <ScrollView
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchUsers() }} />}
      >
        <Text style={styles.countText}>{users.length} users found</Text>
        {users.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="people-outline" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>No users found</Text>
          </View>
        ) : (
          users.map((user) => (
            <TouchableOpacity
              key={user.id}
              style={styles.userCard}
              onPress={() => router.push(`/(admin)/users/${user.id}`)}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {(user.name || user.phone).charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName} numberOfLines={1}>{user.name || 'Unnamed'}</Text>
                <Text style={styles.userPhone}>{user.phone}</Text>
                <View style={styles.userMeta}>
                  <View style={[styles.roleBadge, { backgroundColor: getRoleColor(user.role) + '20' }]}>
                    <Text style={[styles.roleText, { color: getRoleColor(user.role) }]}>{user.role}</Text>
                  </View>
                  <Text style={styles.metaText}>{user._count.bookings} bookings</Text>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.blockBtn, { backgroundColor: user.isActive ? '#EF444420' : '#10B98120' }]}
                onPress={() => handleBlockToggle(user)}
                disabled={actionLoading === user.id}
              >
                {actionLoading === user.id ? (
                  <ActivityIndicator size="small" />
                ) : (
                  <Ionicons
                    name={user.isActive ? 'ban' : 'checkmark-circle'}
                    size={18}
                    color={user.isActive ? '#EF4444' : '#10B981'}
                  />
                )}
              </TouchableOpacity>
            </TouchableOpacity>
          ))
        )}
        <View style={{ height: 80 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const getRoleColor = (role: string): string => {
  const colors: Record<string, string> = {
    CUSTOMER: '#3B82F6', PROVIDER: '#8B5CF6', ADMIN: '#EF4444', SUPER_ADMIN: '#DC2626',
  }
  return colors[role] || '#64748B'
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
  countText: { fontSize: 12, color: COLORS.textMuted, marginBottom: 12 },
  userCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 12, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: COLORS.border },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary + '20', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { fontSize: 18, fontWeight: 'bold', color: COLORS.primary },
  userInfo: { flex: 1 },
  userName: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  userPhone: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  userMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  roleBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  roleText: { fontSize: 10, fontWeight: '700' },
  metaText: { fontSize: 11, color: COLORS.textMuted },
  blockBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  emptyCard: { alignItems: 'center', padding: 40, backgroundColor: COLORS.surface, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border },
  emptyText: { fontSize: 14, color: COLORS.textMuted, marginTop: 8 },
})
