import { db } from './db'

interface NotificationData {
  userId: string
  title: string
  body: string
  type: 'BOOKING_CONFIRMED' | 'BOOKING_ASSIGNED' | 'PROVIDER_TRAVELLING' | 'SERVICE_STARTED' | 'SERVICE_COMPLETED' | 'PAYMENT_SUCCESS' | 'PAYMENT_FAILED' | 'REVIEW_REQUEST' | 'OFFER' | 'GENERAL'
  referenceId?: string
}

export async function sendNotification(data: NotificationData) {
  try {
    // Save to database
    await db.notification.create({
      data: {
        userId: data.userId,
        title: data.title,
        body: data.body,
        type: data.type,
        referenceId: data.referenceId,
      },
    })

    // TODO: Integrate with MSG91/Firebase for actual SMS/Push
    console.log('Notification sent:', data.title)

    return { success: true }
  } catch (error) {
    console.error('Notification error:', error)
    return { success: false, error: 'Failed to send notification' }
  }
}

export async function sendBookingConfirmation(userId: string, bookingId: string, bookingNumber: string) {
  return sendNotification({
    userId,
    title: 'Booking Confirmed! ✅',
    body: `Your booking #${bookingNumber} has been confirmed. We'll assign a professional soon.`,
    type: 'BOOKING_CONFIRMED',
    referenceId: bookingId,
  })
}

export async function sendPaymentSuccess(userId: string, bookingId: string, amount: number) {
  return sendNotification({
    userId,
    title: 'Payment Successful 💰',
    body: `Payment of ₹${amount} received successfully. Thank you!`,
    type: 'PAYMENT_SUCCESS',
    referenceId: bookingId,
  })
}