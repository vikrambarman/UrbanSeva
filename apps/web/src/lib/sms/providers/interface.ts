export interface SMSProvider {
    sendOTP(phone: string, otp: string): Promise<{
        success: boolean
        messageId?: string
        error?: string
    }>

    verifyOTP?(phone: string, otp: string): Promise<boolean>
}

export interface SMSConfig {
    provider: 'msg91' | 'fast2sms'
    // MSG91 specific
    msg91AuthKey?: string
    msg91TemplateId?: string
    msg91SenderId?: string
    // Fast2SMS specific
    fast2smsApiKey?: string
}