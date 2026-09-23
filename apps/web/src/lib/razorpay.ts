import Razorpay from 'razorpay'
import crypto from 'crypto'

let razorpayInstance: Razorpay | null = null

function getRazorpayInstance(): Razorpay {
  if (!razorpayInstance) {
    const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
    const keySecret = process.env.RAZORPAY_KEY_SECRET

    console.log('Initializing Razorpay with key:', keyId?.substring(0, 8) + '...')

    if (!keyId || !keySecret) {
      throw new Error('Razorpay credentials missing. Please check .env.local')
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
    console.log('Creating Razorpay order:', { amount, currency })

    const razorpay = getRazorpayInstance()
    const amountInPaise = Math.round(amount * 100)

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency,
      receipt: `receipt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      payment_capture: true as any,
    })

    console.log('Razorpay order created:', order.id)

    return {
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    }
  } catch (error: any) {
    console.error('Razorpay Order Creation Error:', error)
    
    if (error.statusCode === 401) {
      console.error('❌ Authentication failed - Check your Razorpay credentials')
    }

    return {
      success: false,
      error: error.message || 'Failed to create Razorpay order',
      details: error.description || error.error?.description,
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
    console.log('Expected:', generatedSignature)
    console.log('Received:', signature)

    return isValid
  } catch (error) {
    console.error('Signature verification error:', error)
    return false
  }
}