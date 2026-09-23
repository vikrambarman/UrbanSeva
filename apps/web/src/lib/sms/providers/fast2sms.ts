import { SMSProvider } from './interface'

export class Fast2SMSProvider implements SMSProvider {
    private apiKey: string

    constructor() {
        this.apiKey = process.env.FAST2SMS_API_KEY || ''
    }

    async sendOTP(phone: string, otp: string) {
        try {
            // Fast2SMS API
            const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
                method: 'POST',
                headers: {
                    'authorization': this.apiKey,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    route: 'otp',
                    variables_values: otp,
                    numbers: phone,
                }),
            })

            const data = await response.json()

            if (data.return) {
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
            console.error('Fast2SMS Error:', error)
            return {
                success: false,
                error: 'Failed to send OTP',
            }
        }
    }
}