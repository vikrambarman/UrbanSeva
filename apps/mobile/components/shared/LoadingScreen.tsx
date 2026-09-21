import { View, ActivityIndicator, Text, StyleSheet } from 'react-native'
import { COLORS } from '@/constants'

interface Props {
  message?: string
}

export default function LoadingScreen({
  message = 'Loading...',
}: Props) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={COLORS.primary} />
      <Text style={styles.text}>{message}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
    gap: 12,
  },
  text: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
})
