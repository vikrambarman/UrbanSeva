import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function Dashboard() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Namaste! 👋</Text>
            <Text style={styles.location}>📍 Ambikapur, CG</Text>
          </View>
        </View>

        {/* Search Bar Placeholder */}
        <View style={styles.searchBar}>
          <Text style={styles.searchText}>🔍 Kaunsi service chahiye?</Text>
        </View>

        {/* Services Placeholder */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Popular Services</Text>
          <View style={styles.grid}>
            {['🧹 Cleaning', '⚡ Electrical', '🔧 Plumbing', '🎨 Painting'].map((s) => (
              <View key={s} style={styles.serviceCard}>
                <Text style={styles.serviceText}>{s}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Status Badge */}
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            🚀 Phase 1 Complete — Dashboard Temp Screen
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 8,
  },
  greeting: { fontSize: 22, fontWeight: 'bold', color: '#111827' },
  location: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  searchBar: {
    margin: 16,
    padding: 14,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchText: { color: '#9CA3AF', fontSize: 15 },
  section: { padding: 16 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  serviceCard: {
    width: '47%',
    backgroundColor: '#FFF7ED',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  serviceText: { fontSize: 14, fontWeight: '600', color: '#EA580C' },
  badge: {
    margin: 16,
    padding: 12,
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  badgeText: { color: '#16A34A', fontSize: 12, textAlign: 'center' },
})
