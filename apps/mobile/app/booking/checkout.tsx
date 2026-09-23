import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { WebView } from 'react-native-webview'
import { useAuthStore } from '@/store/authStore'
import { COLORS } from '@/constants'
import { Ionicons } from '@expo/vector-icons'
import { toast } from '@/lib/toast'
import * as SecureStore from 'expo-secure-store'
import { useCartStore } from '@/lib/cartStore'

export default function CheckoutScreen() {
  const { items, getTotalAmount, clearCart } = useCartStore()
  const { user, token } = useAuthStore()
  
  const [currentStep, setCurrentStep] = useState(1)
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')
  const [address, setAddress] = useState({
    label: 'Home',
    fullAddress: '',
    area: '',
    landmark: '',
    pincode: '',
  })
  const [loading, setLoading] = useState(false)
  const [showPayment, setShowPayment] = useState(false)
  const [paymentHTML, setPaymentHTML] = useState('')

  const totalAmount = getTotalAmount()
  const gst = totalAmount * 0.18
  const finalTotal = totalAmount + gst

  // Generate dates
  const availableDates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() + i + 1)
    return date.toISOString().split('T')[0]
  })

  const timeSlots = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00']

  const handleCreateBooking = async () => {
    if (!scheduledDate || !scheduledTime) {
      toast.error('Please select date and time')
      return
    }
    if (!address.fullAddress || !address.area || !address.pincode) {
      toast.error('Please fill complete address')
      return
    }

    setLoading(true)
    try {
      const authToken = await SecureStore.getItemAsync('auth_token')
      if (!authToken) {
        toast.error('Please login again')
        router.replace('/(auth)/login')
        return
      }

      // Create bookings
      const bookings = await Promise.all(
        items.map(async (item) => {
          const response = await fetch('http://192.168.29.16:3000/api/bookings/create', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify({
              serviceId: item.serviceId,
              scheduledDate,
              scheduledTime,
              address,
              baseAmount: item.selectedPrice * item.quantity,
              addOnAmount: item.addOns.reduce((sum, a) => sum + a.price, 0) * item.quantity,
              totalAmount: (item.selectedPrice + item.addOns.reduce((sum, a) => sum + a.price, 0)) * item.quantity,
            }),
          })
          return response.json()
        })
      )

      const allSuccess = bookings.every(b => b.success)
      if (!allSuccess) {
        toast.error('Some bookings failed')
        return
      }

      const bookingIds = bookings.map(b => b.data.id)

      // Create payment order
      const orderResponse = await fetch('http://192.168.29.16:3000/api/payments/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ bookingIds }),
      })

      const orderData = await orderResponse.json()

      if (!orderData.success) {
        toast.error('Failed to create payment order')
        return
      }

      // Open Razorpay WebView
      const razorpayHTML = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
          </head>
          <body>
            <script>
              var options = {
                key: "${orderData.data.keyId}",
                amount: ${orderData.data.amount},
                currency: "${orderData.data.currency}",
                name: "ServiceApp",
                description: "Service Booking Payment",
                order_id: "${orderData.data.orderId}",
                handler: function(response) {
                  window.ReactNativeWebView.postMessage(JSON.stringify(response));
                },
                prefill: {
                  name: "${user?.name || ''}",
                  contact: "${user?.phone || ''}"
                },
                theme: { color: "#F97316" },
                modal: {
                  ondismiss: function() {
                    window.ReactNativeWebView.postMessage(JSON.stringify({dismissed: true}));
                  }
                }
              };
              var rzp = new Razorpay(options);
              rzp.open();
            </script>
          </body>
        </html>
      `

      setPaymentHTML(razorpayHTML)
      setShowPayment(true)
    } catch (error) {
      console.error('Booking error:', error)
      toast.error('Failed to create bookings')
    } finally {
      setLoading(false)
    }
  }

  const handlePaymentResponse = async (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data)
      
      if (data.dismissed) {
        setShowPayment(false)
        toast.info('Payment cancelled')
        return
      }

      const authToken = await SecureStore.getItemAsync('auth_token')
      const bookingIds = items.map(() => '') // Get from state

      // Verify payment
      const verifyResponse = await fetch('http://192.168.29.16:3000/api/payments/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          razorpayOrderId: data.razorpay_order_id,
          razorpayPaymentId: data.razorpay_payment_id,
          razorpaySignature: data.razorpay_signature,
          bookingIds: [], // Get from state
        }),
      })

      const verifyData = await verifyResponse.json()

      if (verifyData.success) {
        toast.success('Payment successful!')
        clearCart()
        setShowPayment(false)
        router.replace('/booking/confirmation')
      } else {
        toast.error('Payment verification failed')
      }
    } catch (error) {
      console.error('Payment response error:', error)
    }
  }

  if (showPayment) {
    return (
      <WebView
        source={{ html: paymentHTML }}
        onMessage={handlePaymentResponse}
        style={styles.webview}
      />
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Checkout</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Steps */}
        <View style={styles.stepsContainer}>
          {[1, 2, 3].map((step) => (
            <View key={step} style={styles.stepItem}>
              <View style={[styles.stepCircle, currentStep >= step && styles.stepCircleActive]}>
                <Text style={[styles.stepText, currentStep >= step && styles.stepTextActive]}>
                  {step}
                </Text>
              </View>
              {step < 3 && <View style={[styles.stepLine, currentStep > step && styles.stepLineActive]} />}
            </View>
          ))}
        </View>

        {/* Step 1: Schedule */}
        {currentStep === 1 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Date & Time</Text>
            
            <Text style={styles.label}>Select Date</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.datesRow}>
              {availableDates.map((date) => {
                const dateObj = new Date(date)
                return (
                  <TouchableOpacity
                    key={date}
                    style={[styles.dateCard, scheduledDate === date && styles.dateCardActive]}
                    onPress={() => setScheduledDate(date)}
                  >
                    <Text style={[styles.dateText, scheduledDate === date && styles.dateTextActive]}>
                      {dateObj.toLocaleDateString('en-US', { weekday: 'short' })}
                    </Text>
                    <Text style={[styles.dateNum, scheduledDate === date && styles.dateNumActive]}>
                      {dateObj.getDate()}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </ScrollView>

            <Text style={styles.label}>Select Time</Text>
            <View style={styles.timeGrid}>
              {timeSlots.map((time) => (
                <TouchableOpacity
                  key={time}
                  style={[styles.timeCard, scheduledTime === time && styles.timeCardActive]}
                  onPress={() => setScheduledTime(time)}
                >
                  <Text style={[styles.timeText, scheduledTime === time && styles.timeTextActive]}>
                    {time}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.button, (!scheduledDate || !scheduledTime) && styles.buttonDisabled]}
              onPress={() => setCurrentStep(2)}
              disabled={!scheduledDate || !scheduledTime}
            >
              <Text style={styles.buttonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Step 2: Address */}
        {currentStep === 2 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Service Address</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Address Label (Home, Office)"
              value={address.label}
              onChangeText={(text) => setAddress({ ...address, label: text })}
            />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Full Address *"
              value={address.fullAddress}
              onChangeText={(text) => setAddress({ ...address, fullAddress: text })}
              multiline
            />
            <TextInput
              style={styles.input}
              placeholder="Area/Locality *"
              value={address.area}
              onChangeText={(text) => setAddress({ ...address, area: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Pincode *"
              value={address.pincode}
              onChangeText={(text) => setAddress({ ...address, pincode: text.replace(/\D/g, '').slice(0, 6) })}
              keyboardType="number-pad"
            />

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.buttonOutline]}
                onPress={() => setCurrentStep(1)}
              >
                <Text style={styles.buttonOutlineText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, (!address.fullAddress || !address.area || !address.pincode) && styles.buttonDisabled]}
                onPress={() => setCurrentStep(3)}
                disabled={!address.fullAddress || !address.area || !address.pincode}
              >
                <Text style={styles.buttonText}>Review</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Step 3: Confirm */}
        {currentStep === 3 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Review & Confirm</Text>
            
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Schedule</Text>
              <Text style={styles.summaryText}>{scheduledDate} at {scheduledTime}</Text>
            </View>

            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Address</Text>
              <Text style={styles.summaryText}>{address.fullAddress}</Text>
              <Text style={styles.summaryText}>{address.area}, {address.pincode}</Text>
            </View>

            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Total Amount</Text>
              <Text style={styles.summaryAmount}>₹{finalTotal.toFixed(0)}</Text>
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.buttonOutline]}
                onPress={() => setCurrentStep(2)}
              >
                <Text style={styles.buttonOutlineText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.button}
                onPress={handleCreateBooking}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.buttonText}>Confirm & Pay</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollView: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  stepsContainer: { flexDirection: 'row', justifyContent: 'center', padding: 24, alignItems: 'center' },
  stepItem: { flexDirection: 'row', alignItems: 'center' },
  stepCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.textMuted + '30', justifyContent: 'center', alignItems: 'center' },
  stepCircleActive: { backgroundColor: COLORS.primary },
  stepText: { fontSize: 14, fontWeight: '600', color: COLORS.textMuted },
  stepTextActive: { color: '#FFF' },
  stepLine: { width: 40, height: 2, backgroundColor: COLORS.textMuted + '30', marginHorizontal: 8 },
  stepLineActive: { backgroundColor: COLORS.primary },
  section: { padding: 16 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.text, marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 8, marginTop: 16 },
  datesRow: { marginBottom: 16 },
  dateCard: { width: 70, height: 80, borderRadius: 12, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  dateCardActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  dateText: { fontSize: 12, color: COLORS.textMuted },
  dateTextActive: { color: '#FFF' },
  dateNum: { fontSize: 20, fontWeight: 'bold', color: COLORS.text, marginTop: 4 },
  dateNumActive: { color: '#FFF' },
  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  timeCard: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 8, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  timeCardActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  timeText: { fontSize: 14, color: COLORS.text },
  timeTextActive: { color: '#FFF' },
  input: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: 14, fontSize: 15, color: COLORS.text, marginBottom: 12 },
  textArea: { height: 100, textAlignVertical: 'top' },
  button: { backgroundColor: COLORS.primary, paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 16 },
  buttonDisabled: { opacity: 0.5 },
  buttonOutline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: COLORS.border },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  buttonOutlineText: { color: COLORS.text, fontSize: 16, fontWeight: '600' },
  buttonRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  summaryCard: { backgroundColor: COLORS.surface, borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
  summaryLabel: { fontSize: 12, color: COLORS.textMuted, marginBottom: 4 },
  summaryText: { fontSize: 14, color: COLORS.text },
  summaryAmount: { fontSize: 24, fontWeight: 'bold', color: COLORS.primary },
  webview: { flex: 1 },
})