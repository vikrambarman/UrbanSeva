import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useAuthStore } from '@/store/authStore'
import { COLORS } from '@/constants'
import { Ionicons } from '@expo/vector-icons'
import * as SecureStore from 'expo-secure-store'

interface WalletData {
  balance: number
  loyaltyPoints: number
  loyaltyTier: string
  transactions: Array<{
    id: string
    type: 'CREDIT' | 'DEBIT' | 'REFUND' | 'REFERRAL_BONUS' | 'CASHBACK'
    amount: number
    description: string
    createdAt: string
  }>
}

export default function WalletScreen() {
  const [walletData, setWalletData] = useState<WalletData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchWallet()
  }, [])

  const fetchWallet = async () => {
    try {
      const token = await SecureStore.getItemAsync('auth_token')
      const response = await fetch('http://192.168.29.16:3000/api/wallet', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      if (data.success) {
        setWalletData(data.data)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const onRefresh = () => {
    setRefreshing(true)
    fetchWallet()
  }

  const getTransactionIcon = (type: string) => {
    const icons: Record<string, string> = {
      CREDIT: 'arrow-down-circle',
      DEBIT: 'arrow-up-circle',
      REFUND: 'refresh-circle',
      REFERRAL_BONUS: 'gift',
      CASHBACK: 'cash',
    }
    return icons[type] || 'help-circle'
  }

  const getTransactionColor = (type: string) => {
    const colors: Record<string, string> = {
      CREDIT: '#10B981',
      DEBIT: '#EF4444',
      REFUND: '#F59E0B',
      REFERRAL_BONUS: '#8B5CF6',
      CASHBACK: '#06B6D4',
    }
    return colors[type] || '#64748B'
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
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Wallet</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Balance Cards */}
        <View style={styles.balanceCards}>
          <View style={styles.balanceCard}>
            <View style={styles.balanceIcon}>
              <Ionicons name="wallet-outline" size={24} color={COLORS.primary} />
            </View>
            <Text style={styles.balanceLabel}>Wallet Balance</Text>
            <Text style={styles.balanceValue}>₹{walletData?.balance || 0}</Text>
            <Text style={styles.balanceSubtext}>Available balance</Text>
          </View>

          <View style={styles.balanceCard}>
            <View style={[styles.balanceIcon, { backgroundColor: '#8B5CF6' + '20' }]}>
              <Ionicons name="star-outline" size={24} color="#8B5CF6" />
            </View>
            <Text style={styles.balanceLabel}>Loyalty Points</Text>
            <Text style={styles.balanceValue}>{walletData?.loyaltyPoints || 0}</Text>
            <Text style={styles.balanceSubtext}>Points earned</Text>
          </View>

          <View style={styles.balanceCard}>
            <View style={[styles.balanceIcon, { backgroundColor: '#F59E0B' + '20' }]}>
              <Ionicons name="trophy-outline" size={24} color="#F59E0B" />
            </View>
            <Text style={styles.balanceLabel}>Tier</Text>
            <Text style={styles.balanceValue}>{walletData?.loyaltyTier || 'BRONZE'}</Text>
            <Text style={styles.balanceSubtext}>Your tier level</Text>
          </View>
        </View>

        {/* Transactions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          {walletData?.transactions?.length === 0 ? (
            <View style={styles.emptyTransactions}>
              <Ionicons name="receipt-outline" size={48} color={COLORS.muted} />
              <Text style={styles.emptyText}>No transactions yet</Text>
            </View>
          ) : (
            <View style={styles.transactionsList}>
              {walletData?.transactions?.map((txn) => (
                <View key={txn.id} style={styles.transactionItem}>
                  <View
                    style={[
                      styles.transactionIcon,
                      { backgroundColor: getTransactionColor(txn.type) + '20' },
                    ]}
                  >
                    <Ionicons
                      name={getTransactionIcon(txn.type) as any}
                      size={20}
                      color={getTransactionColor(txn.type)}
                    />
                  </View>
                  <View style={styles.transactionDetails}>
                    <Text style={styles.transactionDescription}>{txn.description}</Text>
                    <Text style={styles.transactionDate}>
                      {new Date(txn.createdAt).toLocaleDateString('en-IN')}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.transactionAmount,
                      { color: txn.type === 'CREDIT' ? '#10B981' : '#EF4444' },
                    ]}
                  >
                    {txn.type === 'CREDIT' ? '+' : '-'}₹{txn.amount}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  scrollView: { flex: 1 },
  balanceCards: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  balanceCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  balanceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  balanceLabel: { fontSize: 12, color: COLORS.muted, marginBottom: 4 },
  balanceValue: { fontSize: 24, fontWeight: 'bold', color: COLORS.text, marginBottom: 4 },
  balanceSubtext: { fontSize: 11, color: COLORS.muted },
  section: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
  },
  emptyTransactions: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyText: { fontSize: 14, color: COLORS.muted, marginTop: 12 },
  transactionsList: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionDetails: { flex: 1 },
  transactionDescription: { fontSize: 14, fontWeight: '500', color: COLORS.text, marginBottom: 2 },
  transactionDate: { fontSize: 12, color: COLORS.muted },
  transactionAmount: { fontSize: 16, fontWeight: 'bold' },
})