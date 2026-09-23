import { SMSProvider } from './providers/interface'
import { MSG91Provider } from './providers/msg91'
import { Fast2SMSProvider } from './providers/fast2sms'

let smsProvider: SMSProvider | null = null

export function getSMSProvider(): SMSProvider {
  if (!smsProvider) {
    const provider = process.env.SMS_PROVIDER || 'msg91'
    
    if (provider === 'fast2sms') {
      smsProvider = new Fast2SMSProvider()
    } else {
      smsProvider = new MSG91Provider()
    }
  }
  
  return smsProvider
}

// Helper function to generate OTP
export function generateOTP(length: number = 6): string {
  const digits = '0123456789'
  let otp = ''
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * 10)]
  }
  return otp
}