/**
 * WHAT: SMS Provider Factory - Environment-based provider selection
 * WHY: Development mein test provider (console logs), production mein real SMS providers
 * NOTE: Sirf SMS_PROVIDER env variable change karke provider switch hoga
 */

import { SMSProvider } from './providers/interface'
import { MSG91Provider } from './providers/msg91'
import { Fast2SMSProvider } from './providers/fast2sms'
import { TestSMSProvider } from './providers/test-provider'

let smsProvider: SMSProvider | null = null

/**
 * WHAT: Returns appropriate SMS provider based on environment
 * WHY: Development mein test provider (no cost), production mein real providers
 * @returns SMSProvider instance
 */
export function getSMSProvider(): SMSProvider {
  if (!smsProvider) {
    const provider = process.env.SMS_PROVIDER || 'test' // Default to test for safety
    
    console.log(`[SMS] Initializing provider: ${provider}`)
    
    switch (provider) {
      case 'msg91':
        smsProvider = new MSG91Provider()
        break
      case 'fast2sms':
        smsProvider = new Fast2SMSProvider()
        break
      case 'test':
      default:
        smsProvider = new TestSMSProvider()
        console.log('[SMS] Using TEST provider (development mode)')
        break
    }
  }
  
  return smsProvider
}

/**
 * WHAT: Generate random OTP
 * WHY: OTP generation utility for SMS verification
 * @param length - OTP length (default 6)
 * @returns Random OTP string
 */
export function generateOTP(length: number = 6): string {
  const digits = '0123456789'
  let otp = ''
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * 10)]
  }
  return otp
}

/**
 * WHAT: Reset SMS provider instance (for testing)
 * WHY: Testing mein provider switch karne ke liye
 */
export function resetSMSProvider(): void {
  smsProvider = null
}