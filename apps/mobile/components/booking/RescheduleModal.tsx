import React, { useState } from 'react'
import {
  View, Text, Modal, TouchableOpacity, StyleSheet,
  TextInput, ActivityIndicator, Platform,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { COLORS } from '@/constants'
import { toast } from '@/lib/toast'
import { bookingAdvancedApi } from '@/lib/api'

interface Props {
  visible: boolean
  onClose: () => void
  bookingId: string
  currentDate: string
  currentTime: string
  onSuccess: () => void
}

export default function RescheduleModal({ visible, onClose, bookingId, currentDate, currentTime, onSuccess }: Props) {
  const [newDate, setNewDate] = useState('')
  const [newTime, setNewTime] = useState('')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!newDate || !newTime) {
      toast.error('Please select new date and time')
      return
    }
    setLoading(true)
    try {
      const res = await bookingAdvancedApi.reschedule(bookingId, newDate, newTime, reason)
      if (res.data.success) {
        toast.success('Booking rescheduled!')
        onSuccess()
        onClose()
      } else toast.error(res.data.error || 'Failed')
    } catch { toast.error('Failed to reschedule') }
    finally { setLoading(false) }
  }

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Reschedule Booking</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.currentInfo}>
            <Text style={styles.currentLabel}>Current Schedule</Text>
            <Text style={styles.currentValue}>{currentDate} at {currentTime}</Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>New Date (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              value={newDate}
              onChangeText={setNewDate}
              placeholder="2025-01-15"
              placeholderTextColor={COLORS.textMuted}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>New Time (HH:MM)</Text>
            <TextInput
              style={styles.input}
              value={newTime}
              onChangeText={setNewTime}
              placeholder="14:30"
              placeholderTextColor={COLORS.textMuted}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Reason (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={reason}
              onChangeText={setReason}
              placeholder="Why are you rescheduling?"
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
              <Text style={styles.submitBtnText}>Confirm Reschedule</Text>
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
  title: { fontSize: 20, fontWeight: 'bold', color: COLORS.text },
  currentInfo: { backgroundColor: COLORS.surface, borderRadius: 10, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: COLORS.border },
  currentLabel: { fontSize: 12, color: COLORS.textMuted },
  currentValue: { fontSize: 15, fontWeight: '600', color: COLORS.text, marginTop: 2 },
  field: { marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 6 },
  input: { backgroundColor: COLORS.surface, borderRadius: 10, padding: 12, fontSize: 14, color: COLORS.text, borderWidth: 1, borderColor: COLORS.border },
  textArea: { minHeight: 70, textAlignVertical: 'top' },
  submitBtn: { backgroundColor: COLORS.primary, paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  disabledBtn: { opacity: 0.7 },
  submitBtnText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
})