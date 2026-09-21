import { View, Text, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function Wallet() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Wallet</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.balanceLabel}>Available Balance</Text>
        <Text style={styles.balance}>₹0.00</Text>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { padding: 20, backgroundColor: '#FFFFFF' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#111827' },
  card: {
    margin: 16,
    padding: 24,
    backgroundColor: '#F97316',
    borderRadius: 16,
    alignItems: 'center',
  },
  balanceLabel: { color: '#FFF7ED', fontSize: 14, marginBottom: 8 },
  balance: { color: '#FFFFFF', fontSize: 36, fontWeight: 'bold' },
})
