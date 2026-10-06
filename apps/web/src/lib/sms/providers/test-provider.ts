/**
 * WHAT: Test SMS Provider for development environment
 * WHY: Development mein actual SMS nahi bhejenge - console + DB logs se kaam chalenge
 *      Production mein sirf SMS_PROVIDER env variable change karke real provider enable hoga
 * NOTE: Ye provider hamesha success return karega (testing ke liye)
 */

import { SMSProvider } from './interface'
import { db } from '@/lib/db'

export class TestSMSProvider implements SMSProvider {
  /**
   * WHAT: OTP send karta hai (test mode - console + DB)
   * WHY: Development mein actual SMS nahi bhejenge, but OTP track karenge
   * @param phone - Recipient phone number
   * @param otp - OTP to send
   * @returns Success status with test message ID
   */
  async sendOTP(phone: string, otp: string): Promise<{
    success: boolean
    messageId?: string
    error?: string
  }> {
    try {
      // Console log for development visibility
      console.log('═══════════════════════════════════════')
      console.log('📱 [TEST SMS] OTP Generated')
      console.log(`   Phone: ${phone}`)
      console.log(`   OTP: ${otp}`)
      console.log(`   Time: ${new Date().toLocaleString('en-IN')}`)
      console.log('═══════════════════════════════════════')

      // Log to database for verification (optional)
      // Uncomment if you want to track test OTPs in database
      /*
      await db.notification.create({
        data: {
          userId: 'test-user', // Replace with actual user lookup if needed
          title: 'Test OTP Sent',
          body: `OTP ${otp} sent to ${phone} (TEST MODE)`,
          type: 'GENERAL',
          referenceId: `test_otp_${Date.now()}`,
        },
      })
      */

      // Return success with test message ID
      return {
        success: true,
        messageId: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      }
    } catch (error) {
      console.error('[TEST SMS] Error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * WHAT: OTP verify karta hai (test mode - always returns true)
   * WHY: Development mein OTP verification always pass hoga (testing easy)
   * @param phone - Phone number
   * @param otp - OTP to verify
   * @returns Always true in test mode
   */
  async verifyOTP(phone: string, otp: string): Promise<boolean> {
    console.log(`🔍 [TEST SMS] Verifying OTP for ${phone}: ${otp}`)
    // In test mode, always return true (for easy testing)
    return true
  }
}