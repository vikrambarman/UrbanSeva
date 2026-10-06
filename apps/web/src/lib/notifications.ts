/**
 * WHAT: Complete Notification System - In-app + SMS
 * WHY: Production-ready notification system with multiple channels
 * NOTE: Existing sendNotification() function backward compatible hai
 */

import { db } from './db'
import { getSMSProvider, generateOTP } from './sms'

// ═══════════════════════════════
// TYPES
// ═══════════════════════════════

interface NotificationData {
  userId: string
  title: string
  body: string
  type: 'BOOKING_CONFIRMED' | 'BOOKING_ASSIGNED' | 'PROVIDER_TRAVELLING' | 'SERVICE_STARTED' | 'SERVICE_COMPLETED' | 'PAYMENT_SUCCESS' | 'PAYMENT_FAILED' | 'REVIEW_REQUEST' | 'OFFER' | 'GENERAL' | 'BOOKING_RECEIVED' | 'RESCHEDULE_REQUESTED' | 'PROVIDER_ON_THE_WAY'
  referenceId?: string
}

interface SMSNotificationData {
  phone: string
  message: string
  type: 'OTP' | 'BOOKING_RECEIVED' | 'BOOKING_CONFIRMED' | 'RESCHEDULE_REQUEST' | 'PROVIDER_ASSIGNED' | 'GENERAL'
}

// ═══════════════════════════════
// IN-APP NOTIFICATIONS (EXISTING - BACKWARD COMPATIBLE)
// ═══════════════════════════════

/**
 * WHAT: Save notification to database (in-app)
 * WHY: User ko app/website pe notification dikhega
 * NOTE: Ye function existing code ke saath compatible hai
 */
export async function sendNotification(data: NotificationData) {
  try {
    await db.notification.create({
      data: {
        userId: data.userId,
        title: data.title,
        body: data.body,
        type: data.type,
        referenceId: data.referenceId,
      },
    })

    console.log('[Notification] In-app notification sent:', data.title)
    return { success: true }
  } catch (error) {
    console.error('[Notification] Error:', error)
    return { success: false, error: 'Failed to send notification' }
  }
}

// ═══════════════════════════════
// SMS NOTIFICATIONS (NEW)
// ═══════════════════════════════

/**
 * WHAT: Send SMS via configured provider
 * WHY: Customer ko real SMS milega (OTP, booking updates)
 */
export async function sendSMS(data: SMSNotificationData) {
  try {
    const provider = getSMSProvider()
    
    if (data.type === 'OTP') {
      // Extract OTP from message (format: "Your OTP is: 123456")
      const otpMatch = data.message.match(/OTP is: (\d+)/)
      const otp = otpMatch ? otpMatch[1] : generateOTP()
      
      const result = await provider.sendOTP(data.phone, otp)
      
      console.log('[SMS] OTP sent:', { phone: data.phone, success: result.success })
      return result
    } else {
      // For non-OTP messages, use sendOTP method (can be enhanced later)
      const result = await provider.sendOTP(data.phone, data.message)
      
      console.log('[SMS] Message sent:', { phone: data.phone, type: data.type, success: result.success })
      return result
    }
  } catch (error) {
    console.error('[SMS] Error:', error)
    return { success: false, error: 'Failed to send SMS' }
  }
}

// ═══════════════════════════════
// BOOKING NOTIFICATIONS (PRODUCTION FLOW)
// ═══════════════════════════════

/**
 * WHAT: Booking received notification (payment done, waiting OPS confirmation)
 * WHY: Customer ko pata chalega ki payment successful hai, but booking abhi confirm nahi hui
 */
export async function sendBookingReceived(
  userId: string,
  phone: string,
  bookingNumber: string,
  amount: number
) {
  // In-app notification
  await sendNotification({
    userId,
    title: 'Booking Received!',
    body: `Your booking #${bookingNumber} has been received. We're verifying your slot and will confirm shortly.`,
    type: 'BOOKING_RECEIVED',
    referenceId: bookingNumber,
  })

  // SMS notification
  await sendSMS({
    phone,
    message: `Your booking #${bookingNumber} of Rs.${amount} received. We'll confirm your slot shortly. - HomeServices`,
    type: 'BOOKING_RECEIVED',
  })

  return { success: true }
}

/**
 * WHAT: Booking confirmed notification (OPS verified, provider assigned)
 * WHY: Customer ko final confirmation milega with provider details
 */
export async function sendBookingConfirmed(
  userId: string,
  phone: string,
  bookingNumber: string,
  providerName: string,
  scheduledDate: string,
  scheduledTime: string
) {
  // In-app notification
  await sendNotification({
    userId,
    title: 'Booking Confirmed!',
    body: `Your booking #${bookingNumber} is confirmed! ${providerName} will arrive on ${scheduledDate} at ${scheduledTime}.`,
    type: 'BOOKING_CONFIRMED',
    referenceId: bookingNumber,
  })

  // SMS notification
  await sendSMS({
    phone,
    message: `Booking #${bookingNumber} confirmed! ${providerName} will arrive on ${scheduledDate} at ${scheduledTime}. - HomeServices`,
    type: 'BOOKING_CONFIRMED',
  })

  return { success: true }
}

/**
 * WHAT: Reschedule request notification (OTP-based confirmation)
 * WHY: OPS ne naya slot propose kiya, customer ko OTP se confirm karna hai
 */
export async function sendRescheduleRequest(
  userId: string,
  phone: string,
  bookingNumber: string,
  newDate: string,
  newTime: string,
  otp: string
) {
  // In-app notification
  await sendNotification({
    userId,
    title: 'Reschedule Request',
    body: `Your booking #${bookingNumber} reschedule request: New slot ${newDate} at ${newTime}. OTP: ${otp} (valid for 10 mins)`,
    type: 'RESCHEDULE_REQUESTED',
    referenceId: bookingNumber,
  })

  // SMS notification with OTP
  await sendSMS({
    phone,
    message: `Reschedule request for booking #${bookingNumber}. New slot: ${newDate} ${newTime}. OTP: ${otp} (valid 10 mins). - HomeServices`,
    type: 'RESCHEDULE_REQUEST',
  })

  return { success: true }
}

/**
 * WHAT: Provider assigned notification
 * WHY: Customer ko provider details milegi
 */
export async function sendProviderAssigned(
  userId: string,
  phone: string,
  bookingNumber: string,
  providerName: string,
  providerPhone: string
) {
  // In-app notification
  await sendNotification({
    userId,
    title: 'Provider Assigned',
    body: `${providerName} has been assigned to your booking #${bookingNumber}. Contact: ${providerPhone}`,
    type: 'BOOKING_ASSIGNED',
    referenceId: bookingNumber,
  })

  // SMS notification
  await sendSMS({
    phone,
    message: `Provider ${providerName} assigned to booking #${bookingNumber}. Contact: ${providerPhone}. - HomeServices`,
    type: 'PROVIDER_ASSIGNED',
  })

  return { success: true }
}

// ═══════════════════════════════
// LEGACY FUNCTIONS (BACKWARD COMPATIBLE)
// ═══════════════════════════════

/**
 * WHAT: Legacy booking confirmation (kept for backward compatibility)
 * WHY: Existing code ko break nahi karna hai
 * NOTE: New code should use sendBookingReceived() or sendBookingConfirmed()
 */
export async function sendBookingConfirmation(userId: string, bookingId: string, bookingNumber: string) {
  return sendNotification({
    userId,
    title: 'Booking Confirmed!',
    body: `Your booking #${bookingNumber} has been confirmed. We'll assign a professional soon.`,
    type: 'BOOKING_CONFIRMED',
    referenceId: bookingId,
  })
}

/**
 * WHAT: Legacy payment success notification
 * WHY: Existing code compatibility
 */
export async function sendPaymentSuccess(userId: string, bookingId: string, amount: number) {
  return sendNotification({
    userId,
    title: 'Payment Successful',
    body: `Payment of Rs.${amount} received successfully. Thank you!`,
    type: 'PAYMENT_SUCCESS',
    referenceId: bookingId,
  })
}

// ═══════════════════════════════
// OTP UTILITIES
// ═══════════════════════════════

/**
 * WHAT: Generate and send OTP for reschedule confirmation
 * WHY: Security - customer ki permission ke bina reschedule nahi hoga
 * @returns OTP string (4 digits)
 */
export async function generateAndSendRescheduleOTP(
  userId: string,
  phone: string,
  bookingNumber: string,
  newDate: string,
  newTime: string
): Promise<{ otp: string; expiresAt: Date }> {
  const otp = generateOTP(4) // 4-digit OTP for reschedule
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

  await sendRescheduleRequest(userId, phone, bookingNumber, newDate, newTime, otp)

  return { otp, expiresAt }
}