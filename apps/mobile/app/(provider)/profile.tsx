import React, { useState, useEffect } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, TextInput, RefreshControl, Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useAuthStore } from '@/store/authStore'
import { providerApi } from '@/lib/api'
import { COLORS } from '@/constants'
import { toast } from '@/lib/toast'
import type { ProviderProfile } from '@/types'

export default function ProviderProfileScreen() {
  const { user, logout } = useAuthStore()
  const [profile, setProfile] = useState<ProviderProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [editing, setEditing] = useState(false)

  // Editable fields
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [experience, setExperience] = useState('0')
  const [isAvailable, setIsAvailable] = useState(false)
  const [serviceAreas, setServiceAreas] = useState('')

  // Bank details
  const [bankName, setBankName] = useState('')
  const [bankAccount, setBankAccount] = useState('')
  const [bankIFSC, setBankIFSC] = useState('')
  const [upiId, setUpiId] = useState('')

  // Documents
  const [aadharNumber, setAadharNumber] = useState('')
  const [panNumber, setPanNumber] = useState('')

  useEffect(() => { fetchProfile() }, [])

  const fetchProfile = async () => {
    try {
      const [profileRes, bankRes, docRes] = await Promise.all([
        providerApi.getProfile(),
        providerApi.getBankDetails(),
        providerApi.getDocuments(),
      ])
      if (profileRes.data.success) {
        const p = profileRes.data.data
        setProfile(p)
        setName(p.user.name || '')
        setBio(p.bio || '')
        setExperience(p.experience.toString())
        setIsAvailable(p.isAvailable)
        setServiceAreas(p.serviceAreas.join(', '))
      }
      if (bankRes.data.success && bankRes.data.data) {
        setBankName(bankRes.data.data.bankName || '')
        setBankAccount(bankRes.data.data.bankAccount || '')
        setBankIFSC(bankRes.data.data.bankIFSC || '')
        setUpiId(bankRes.data.data.upiId || '')
      }
      if (docRes.data.success && docRes.data.data) {
        setAadharNumber(docRes.data.data.aadharNumber || '')
        setPanNumber(docRes.data.data.panNumber || '')
      }
    } catch (err) {
      console.error('Profile error:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleSaveProfile = async () => {
    try {
      const res = await providerApi.updateProfile({
        name, bio, experience, isAvailable,
        serviceAreas: serviceAreas.split(',').map(s => s.trim()).filter(Boolean),
      })
      if (res.data.success) {
        toast.success('Profile updated!')
        setEditing(false)
        fetchProfile()
      } else toast.error(res.data.error || 'Failed')
    } catch { toast.error('Failed to update') }
  }

  const handleSaveBank = async () => {
    try {
      const res = await providerApi.updateBankDetails({ bankName, bankAccount, bankIFSC, upiId })
      if (res.data.success) toast.success('Bank details saved!')
      else toast.error(res.data.error || 'Failed')
    } catch { toast.error('Failed to save') }
  }

  const handleSaveDocuments = async () => {
    try {
      const res = await providerApi.updateDocuments({ aadharNumber, panNumber })
      if (res.data.success) toast.success('Documents submitted for review!')
      else toast.error(res.data.error || 'Failed')
    } catch { toast.error('Failed to update') }
  }

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
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
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchProfile() }} />}
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(user?.name || user?.phone || 'P').charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.userName}>{user?.name || 'Provider'}</Text>
          <Text style={styles.userPhone}>{user?.phone}</Text>
          {profile && (
            <View style={[
              styles.statusBadge,
              { backgroundColor: profile.status === 'APPROVED' ? '#10B98120' : '#F59E0B20' }
            ]}>
              <Text style={[
                styles.statusText,
                { color: profile.status === 'APPROVED' ? '#10B981' : '#F59E0B' }
              ]}>
                {profile.status.replace('_', ' ')}
              </Text>
            </View>
          )}
        </View>

        {/* Stats */}
        {profile && (
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{profile.totalJobs}</Text>
              <Text style={styles.statLabel}>Jobs</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{profile.avgRating.toFixed(1)}⭐</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>₹{profile.totalEarnings.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Earnings</Text>
            </View>
          </View>
        )}

        {/* Profile Section */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Profile Information</Text>
            <TouchableOpacity onPress={() => editing ? handleSaveProfile() : setEditing(true)}>
              <Text style={styles.editBtn}>{editing ? 'Save' : 'Edit'}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              editable={editing}
              placeholder="Your name"
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Bio</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={bio}
              onChangeText={setBio}
              editable={editing}
              placeholder="Tell about yourself"
              multiline
              numberOfLines={3}
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Experience (years)</Text>
            <TextInput
              style={styles.input}
              value={experience}
              onChangeText={setExperience}
              editable={editing}
              keyboardType="number-pad"
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Service Areas (comma separated)</Text>
            <TextInput
              style={styles.input}
              value={serviceAreas}
              onChangeText={setServiceAreas}
              editable={editing}
              placeholder="Ambikapur, Surguja"
            />
          </View>
          <TouchableOpacity
            style={[styles.toggleRow, !editing && styles.disabledRow]}
            onPress={() => editing && setIsAvailable(!isAvailable)}
            disabled={!editing}
          >
            <Text style={styles.label}>Available for bookings</Text>
            <View style={[styles.toggle, isAvailable && styles.toggleActive]}>
              <View style={styles.toggleKnob} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Documents Section */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Documents & Verification</Text>
          <View style={styles.field}>
            <Text style={styles.label}>Aadhar Number</Text>
            <TextInput
              style={styles.input}
              value={aadharNumber}
              onChangeText={setAadharNumber}
              placeholder="XXXX-XXXX-XXXX"
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>PAN Number</Text>
            <TextInput
              style={styles.input}
              value={panNumber}
              onChangeText={(t) => setPanNumber(t.toUpperCase())}
              placeholder="ABCDE1234F"
              maxLength={10}
            />
          </View>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSaveDocuments}>
            <Text style={styles.saveBtnText}>Submit Documents</Text>
          </TouchableOpacity>
        </View>

        {/* Bank Details Section */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Bank Details</Text>
          <View style={styles.field}>
            <Text style={styles.label}>Bank Name</Text>
            <TextInput style={styles.input} value={bankName} onChangeText={setBankName} placeholder="State Bank of India" />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Account Number</Text>
            <TextInput style={styles.input} value={bankAccount} onChangeText={setBankAccount} placeholder="Account number" />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>IFSC Code</Text>
            <TextInput
              style={styles.input}
              value={bankIFSC}
              onChangeText={(t) => setBankIFSC(t.toUpperCase())}
              placeholder="SBIN0001234"
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>UPI ID (Optional)</Text>
            <TextInput style={styles.input} value={upiId} onChangeText={setUpiId} placeholder="yourname@upi" />
          </View>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSaveBank}>
            <Text style={styles.saveBtnText}>Save Bank Details</Text>
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <View style={{ height: 80 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  profileHeader: { alignItems: 'center', padding: 24, backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.primary + '20', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText: { fontSize: 32, fontWeight: 'bold', color: COLORS.primary },
  userName: { fontSize: 20, fontWeight: 'bold', color: COLORS.text },
  userPhone: { fontSize: 14, color: COLORS.textMuted, marginTop: 4 },
  statusBadge: { marginTop: 10, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 12, fontWeight: '700' },
  statsRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginVertical: 16 },
  statCard: { flex: 1, alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: COLORS.border },
  statValue: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  statLabel: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  card: { backgroundColor: COLORS.surface, marginHorizontal: 16, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: COLORS.border, marginBottom: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  editBtn: { fontSize: 14, fontWeight: '600', color: COLORS.primary },
  field: { marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 6 },
  input: { backgroundColor: COLORS.background, borderRadius: 10, padding: 12, fontSize: 14, color: COLORS.text, borderWidth: 1, borderColor: COLORS.border },
  textArea: { minHeight: 70, textAlignVertical: 'top' },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  disabledRow: { opacity: 0.6 },
  toggle: { width: 44, height: 24, borderRadius: 12, backgroundColor: COLORS.border, justifyContent: 'center', paddingHorizontal: 2 },
  toggleActive: { backgroundColor: COLORS.primary },
  toggleKnob: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#FFF' },
  saveBtn: { backgroundColor: COLORS.primary, paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginTop: 8 },
  saveBtnText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginHorizontal: 16, paddingVertical: 14, borderRadius: 12, backgroundColor: '#EF444420', marginBottom: 16 },
  logoutText: { fontSize: 16, fontWeight: '600', color: '#EF4444' },
})