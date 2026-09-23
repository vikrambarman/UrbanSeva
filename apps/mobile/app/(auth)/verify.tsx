import React, { useState, useEffect, useRef } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { COLORS } from '@/constants'
import { Ionicons } from '@expo/vector-icons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useAuthStore } from '@/store/authStore'
import { toast } from '@/lib/toast'

export default function VerifyScreen() {
  const { setUser } = useAuthStore()
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendTimer, setResendTimer] = useState(30)
  const inputRefs = useRef<(TextInput | null)[]>([])

  useEffect(() => {
    // Load phone from storage
    const loadPhone = async () => {
      const storedPhone = await AsyncStorage.getItem('pendingPhone')
      if (!storedPhone) {
        router.replace('/(auth)/login')
        return
      }
      setPhone(storedPhone)
    }
    loadPhone()

    // Resend timer
    const timer = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 0) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return

    const newOtp = [...otp]
    newOtp[index] = value.slice(0, 1)
    setOtp(newOtp)

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyPress = (index: number, key: string) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleVerifyOTP = async () => {
    const otpString = otp.join('')
    if (otpString.length !== 6) {
      toast.error('Please enter complete 6-digit OTP')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('http://192.168.29.16:3000/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp: otpString }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Login successful!')
        
        // Store token and user
        await setUser(data.data.user, data.data.token)
        
        // Clear pending phone
        await AsyncStorage.removeItem('pendingPhone')

        // Navigate based on role
        const role = data.data.user.role
        if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
          router.replace('/(admin)/dashboard')
        } else if (role === 'PROVIDER') {
          router.replace('/(provider)/dashboard')
        } else {
          router.replace('/(customer)/dashboard')
        }
      } else {
        toast.error(data.error || 'Invalid OTP')
      }
    } catch (error) {
      console.error('Verify OTP error:', error)
      toast.error('Failed to verify OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleResendOTP = async () => {
    if (resendTimer > 0) return

    try {
      const response = await fetch('http://192.168.29.16:3000/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success('OTP resent successfully!')
        setResendTimer(30)
        
        if (data.devOtp) {
          toast.info(`Dev OTP: ${data.devOtp}`)
        }
      } else {
        toast.error(data.error || 'Failed to resend OTP')
      }
    } catch (error) {
      toast.error('Failed to resend OTP')
    }
  }

  const handleChangePhone = async () => {
    await AsyncStorage.removeItem('pendingPhone')
    router.replace('/(auth)/login')
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <View style={[styles.iconCircle, { backgroundColor: '#10B981' + '20' }]}>
              <Ionicons name="checkmark-circle" size={40} color="#10B981" />
            </View>
          </View>

          {/* Title */}
          <Text style={styles.title}>Verify OTP</Text>
          <Text style={styles.subtitle}>
            Humne +91 {phone} pe 6-digit OTP bheja hai
          </Text>

          {/* OTP Inputs */}
          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                style={styles.otpInput}
                keyboardType="number-pad"
                maxLength={1}
                value={digit}
                onChangeText={(value) => handleOtpChange(index, value)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(index, nativeEvent.key)}
              />
            ))}
          </View>

          {/* Verify Button */}
          <TouchableOpacity
            style={[
              styles.button,
              (loading || otp.join('').length !== 6) && styles.buttonDisabled,
            ]}
            onPress={handleVerifyOTP}
            disabled={loading || otp.join('').length !== 6}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.buttonText}>Verify & Login</Text>
            )}
          </TouchableOpacity>

          {/* Resend OTP */}
          <View style={styles.resendContainer}>
            {resendTimer > 0 ? (
              <Text style={styles.resendText}>
                Resend OTP in <Text style={styles.timerText}>{resendTimer}s</Text>
              </Text>
            ) : (
              <TouchableOpacity onPress={handleResendOTP}>
                <Text style={styles.resendLink}>Resend OTP</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Change Phone */}
          <TouchableOpacity onPress={handleChangePhone} style={styles.changePhone}>
            <Text style={styles.changePhoneText}>Change Phone Number</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: 32,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 32,
  },
  otpInput: {
    width: 48,
    height: 56,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.text,
    backgroundColor: COLORS.surface,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  resendContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  resendText: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  timerText: {
    fontWeight: '600',
    color: COLORS.text,
  },
  resendLink: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  changePhone: {
    marginTop: 16,
    alignItems: 'center',
  },
  changePhoneText: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
})