import { SMSProvider } from './interface'

export class MSG91Provider implements SMSProvider {
    private authKey: string
    private templateId: string
    private senderId: string

    constructor() {
        this.authKey = process.env.MSG91_AUTH_KEY || ''
        this.templateId = process.env.MSG91_TEMPLATE_ID || ''
        this.senderId = process.env.MSG91_SENDER_ID || ''
    }

    async sendOTP(phone: string, otp: string) {
        try {
            // MSG91 OTP API
            const response = await fetch('https://control.msg91.com/api/v5/otp', {
                method: 'POST',
                headers: {
                    'authkey': this.authKey,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    otp: otp,
                    otp_length: 6,
                    mobile: `91${phone}`, // Add India country code
                    template_id: this.templateId,
                    sender: this.senderId,
                }),
            })

            const data = await response.json()

            if (data.type === 'success') {
                return {
                    success: true,
                    messageId: data.request_id,
                }
            } else {
                return {
                    success: false,
                    error: data.message || 'Failed to send OTP',
                }
            }
        } catch (error) {
            console.error('MSG91 Error:', error)
            return {
                success: false,
                error: 'Failed to send OTP',
            }
        }
    }

    async verifyOTP(phone: string, otp: string): Promise<boolean> {
        try {
            const response = await fetch(
                `https://control.msg91.com/api/v5/otp/verify?mobile=91${phone}&otp=${otp}`,
                {
                    method: 'POST',
                    headers: {
                        'authkey': this.authKey,
                    },
                }
            )

            const data = await response.json()
            return data.type === 'success'
        } catch (error) {
            console.error('MSG91 Verify Error:', error)
            return false
        }
    }
}