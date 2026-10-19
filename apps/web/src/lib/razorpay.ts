import Razorpay from 'razorpay'
import crypto from 'node:crypto'

let razorpayInstance: Razorpay | null = null

function getRazorpayInstance(): Razorpay {
  if (!razorpayInstance) {
    const keyId = process.env.RAZORPAY_KEY_ID
    const keySecret = process.env.RAZORPAY_KEY_SECRET

    console.log('═══════════════════════════════════════')
    console.log('🔑 Razorpay Initialization')
    console.log('═══════════════════════════════════════')
    console.log('Key ID:', keyId ? `${keyId.substring(0, 8)}...` : '❌ MISSING')
    console.log('Key Secret:', keySecret ? '✅ Present' : '❌ MISSING')
    console.log('═══════════════════════════════════════')

    if (!keyId || !keySecret) {
      throw new Error('Razorpay credentials missing. Please check .env.local file')
    }

    if (!keyId.startsWith('rzp_')) {
      throw new Error('Invalid Razorpay Key ID format. Should start with "rzp_"')
    }

    razorpayInstance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    })
  }

  return razorpayInstance
}

export async function createOrder(amount: number, currency: string = 'INR') {
  try {
    console.log('═══════════════════════════════════════')
    console.log('💳 Creating Razorpay Order')
    console.log('═══════════════════════════════════════')
    console.log('Amount (₹):', amount)
    console.log('Currency:', currency)

    if (!amount || amount <= 0) {
      throw new Error(`Invalid amount: ${amount}. Amount must be greater than 0`)
    }

    if (amount < 1) {
      throw new Error(`Amount too small: ₹${amount}. Minimum amount is ₹1`)
    }

    const razorpay = getRazorpayInstance()
    const amountInPaise = Math.round(amount * 100)

    console.log('Amount (Paise):', amountInPaise)

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency,
      receipt: `receipt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      payment_capture: true, // ✅ FIX: boolean instead of 1 (number) — fixes overload resolution
    })

    console.log('✅ Order Created:', order.id)
    console.log('═══════════════════════════════════════')

    return {
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    }
  } catch (error: any) {
    console.error('❌ Razorpay Order Creation Error:', error.message)

    if (error.statusCode === 401) {
      console.error('❌ AUTHENTICATION FAILED - Check your Razorpay credentials')
    }

    return {
      success: false,
      error: error.message || 'Failed to create Razorpay order',
      details: error.description || error.error?.description || 'Unknown error',
      statusCode: error.statusCode,
    }
  }
}

export function verifySignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  try {
    const keySecret = process.env.RAZORPAY_KEY_SECRET

    if (!keySecret) {
      console.error('❌ RAZORPAY_KEY_SECRET not found in environment')
      return false
    }

    console.log('Verifying signature for order:', orderId)

    const generatedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex')

    const isValid = generatedSignature === signature

    console.log('Signature verification:', isValid ? '✅ SUCCESS' : '❌ FAILED')

    return isValid
  } catch (error) {
    console.error('Signature verification error:', error)
    return false
  }
}

// ═══════════════════════════════════════════════════════════════
// ✅ NEW: Refund Function with proper types
// ═══════════════════════════════════════════════════════════════
export async function processRefund(
  paymentId: string,
  amount: number,
  speed: 'normal' | 'optimum' = 'optimum'
) {
  try {
    console.log('═══════════════════════════════════════')
    console.log('💰 Processing Razorpay Refund')
    console.log('═══════════════════════════════════════')

    if (!paymentId) throw new Error('Payment ID is required for refund')
    if (!amount || amount <= 0) throw new Error(`Invalid refund amount: ${amount}`)

    const razorpay = getRazorpayInstance()
    const amountInPaise = Math.round(amount * 100)

    // ✅ FIX: Cast to any to bypass strict Razorpay SDK typing issues
    const refund: any = await razorpay.payments.refund(paymentId, {
      amount: amountInPaise,
      speed,
    })

    console.log('✅ Refund Processed:', refund.id)

    return {
      success: true,
      refundId: refund.id,
      amount: refund.amount ? refund.amount / 100 : amount,
      status: refund.status || 'processed',
    }
  } catch (error: any) {
    console.error('❌ Razorpay Refund Error:', error.message)
    return {
      success: false,
      error: error.message || 'Failed to process refund',
      details: error.description || 'Unknown error',
      statusCode: error.statusCode,
    }
  }
}


// ═══════════════════════════════════════════════════════════════
// ✅ NEW: Payment Link Creation for POD/COD
// ═══════════════════════════════════════════════════════════════
export async function createPaymentLink(
  amount: number, 
  currency: string = 'INR', 
  customerPhone: string, 
  customerName: string, 
  bookingNumber: string,
  customerEmail?: string
) {
  try {
    console.log('🔗 Creating Razorpay Payment Link')

    if (!amount || amount <= 0) {
      throw new Error(`Invalid amount: ${amount}`)
    }

    const razorpay = getRazorpayInstance()
    const amountInPaise = Math.round(amount * 100)

    const paymentLink = await razorpay.paymentLink.create({
      amount: amountInPaise,
      currency,
      accept_partial: false,
      description: `Payment for Booking #${bookingNumber}`,
      customer: {
        name: customerName || 'Customer',
        contact: customerPhone,
        email: customerEmail || 'customer@example.com'
      },
      notify: { sms: true, email: true },
      reminder_enable: true,
      notes: { bookingNumber: bookingNumber, source: 'provider_panel' },
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/booking/confirmation?booking=${bookingNumber}`,
      callback_method: 'get'
    })

    console.log('✅ Payment Link Created:', paymentLink.id)

    return {
      success: true,
      paymentLinkId: paymentLink.id,
      paymentLinkUrl: paymentLink.short_url,
      amount: Number(paymentLink.amount) / 100   // ✅ FIX: wrapped with Number()
    }
  } catch (error: any) {
    console.error('❌ Razorpay Payment Link Error:', error.message)
    return {
      success: false,
      error: error.message || 'Failed to create payment link',
      details: error.description || error.error?.description || 'Unknown error',
      statusCode: error.statusCode,
    }
  }
}