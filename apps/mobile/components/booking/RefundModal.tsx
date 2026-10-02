import React, { useState } from 'react'
import {
  View, Text, Modal, TouchableOpacity, StyleSheet,
  TextInput, ActivityIndicator, Alert,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { COLORS } from '@/constants'
import { toast } from '@/lib/toast'
import { bookingAdvancedApi } from '@/lib/api'

interface Props {
  visible: boolean
  onClose: () => void
  bookingId: string
  totalAmount: number
  onSuccess: () => void
}

export default function RefundModal({ visible, onClose, bookingId, totalAmount, onSuccess }: Props) {
  const [reason, setReason] = useState('')
  const [amount, setAmount] = useState(totalAmount.toString())
  const [loading, setLoading] = useState(false)

  const handleSubmit = () => {
    if (!reason.trim()) {
      toast.error('Please provide a reason')
      return
    }
    Alert.alert(
      'Confirm Refund',
      `Refund ₹${amount} to customer wallet?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: doRefund },
      ]
    )
  }

  const doRefund = async () => {
    setLoading(true)
    try {
      const res = await bookingAdvancedApi.refund(bookingId, reason, parseFloat(amount))
      if (res.data.success) {
        toast.success('Refund processed!')
        onSuccess()
        onClose()
      } else toast.error(res.data.error || 'Failed')
    } catch { toast.error('Failed to process refund') }
    finally { setLoading(false) }
  }

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Ionicons name="alert-circle" size={24} color="#EF4444" />
              <Text style={styles.title}>Process Refund</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.amountCard}>
            <Text style={styles.amountLabel}>Total Paid Amount</Text>
            <Text style={styles.amountValue}>₹{totalAmount}</Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Refund Amount (₹)</Text>
            <TextInput
              style={styles.input}
              value={amount}
              onChangeText={setAmount}
              keyboardType="number-pad"
              placeholder="Amount"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Reason for Refund</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={reason}
              onChangeText={setReason}
              placeholder="Why is this refund being processed?"
              placeholderTextColor={COLORS.textMuted}
              multiline
              numberOfLines={3}
            />
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.disabledBtn]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.submitBtnText}>Confirm Refund</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  container: { backgroundColor: COLORS.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '85%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 20, fontWeight: 'bold', color: COLORS.text },
  amountCard: { backgroundColor: '#EF444415', borderRadius: 10, padding: 16, marginBottom: 16, alignItems: 'center', borderWidth: 1, borderColor: '#EF444440' },
  amountLabel: { fontSize: 13, color: COLORS.textMuted },
  amountValue: { fontSize: 28, fontWeight: 'bold', color: '#EF4444', marginTop: 4 },
  field: { marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 6 },
  input: { backgroundColor: COLORS.surface, borderRadius: 10, padding: 12, fontSize: 14, color: COLORS.text, borderWidth: 1, borderColor: COLORS.border },
  textArea: { minHeight: 70, textAlignVertical: 'top' },
  submitBtn: { backgroundColor: '#EF4444', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  disabledBtn: { opacity: 0.7 },
  submitBtnText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
})