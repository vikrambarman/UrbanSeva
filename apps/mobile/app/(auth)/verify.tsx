import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native'
import { useState } from 'react'
import { router } from 'expo-router'

export default function VerifyScreen() {
  const [otp, setOtp] = useState('')

  const handleVerify = () => {
    if (otp.length === 6) {
      router.replace('/(customer)/dashboard')
    }
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Verify OTP</Text>
      <Text style={styles.subtitle}>
        Enter 6-digit OTP sent to your mobile
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Enter OTP"
        keyboardType="numeric"
        maxLength={6}
        value={otp}
        onChangeText={setOtp}
        textAlign="center"
      />

      <TouchableOpacity
        style={[styles.button, otp.length !== 6 && styles.buttonDisabled]}
        onPress={handleVerify}
        disabled={otp.length !== 6}
      >
        <Text style={styles.buttonText}>Verify & Continue</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.resend}>
        <Text style={styles.resendText}>Resend OTP in 30s</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 24,
    paddingTop: 60,
  },
  backButton: {
    marginBottom: 32,
  },
  backText: {
    fontSize: 16,
    color: '#F97316',
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 32,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#F97316',
    borderRadius: 12,
    padding: 16,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
    letterSpacing: 8,
    backgroundColor: '#FFF7ED',
  },
  button: {
    backgroundColor: '#F97316',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    backgroundColor: '#FED7AA',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  resend: {
    alignItems: 'center',
  },
  resendText: {
    color: '#6B7280',
    fontSize: 14,
  },
})
