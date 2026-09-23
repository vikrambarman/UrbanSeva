'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2, CheckCircle } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

export default function VerifyPage() {
    const router = useRouter()
    const { setUser } = useAuthStore()
    const [otp, setOtp] = useState(['', '', '', '', '', ''])
    const [phone, setPhone] = useState('')
    const [loading, setLoading] = useState(false)
    const [resendTimer, setResendTimer] = useState(30)
    const inputRefs = useRef<(HTMLInputElement | null)[]>([])

    useEffect(() => {
        // Get phone from localStorage
        const storedPhone = localStorage.getItem('pendingPhone')
        if (!storedPhone) {
            router.push('/login')
            return
        }
        setPhone(storedPhone)

        // Resend timer
        const timer = setInterval(() => {
            setResendTimer((prev) => {
                if (prev <= 0) {
                    clearInterval(timer)
                    return 0
                }
                return prev - 1
            })
        }, 1000)

        return () => clearInterval(timer)
    }, [router])

    const handleOtpChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return

        const newOtp = [...otp]
        newOtp[index] = value.slice(0, 1)
        setOtp(newOtp)

        // Auto-focus next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus()
        }
    }

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus()
        }
    }

    const handleVerifyOTP = async (e: React.FormEvent) => {
        e.preventDefault()

        const otpString = otp.join('')
        if (otpString.length !== 6) {
            toast.error('Please enter complete 6-digit OTP')
            return
        }

        setLoading(true)
        try {
            const response = await fetch('/api/auth/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, otp: otpString }),
            })

            const data = await response.json()

            if (data.success) {
                toast.success('Login successful!')

                // Store token in localStorage AND auth store
                localStorage.setItem('token', data.data.token)
                setUser(data.data.user, data.data.token) // ← token bhi pass karo

                // Clear pending phone
                localStorage.removeItem('pendingPhone')

                // Redirect based on role
                const role = data.data.user.role
                if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
                    router.push('/admin/dashboard')
                } else if (role === 'PROVIDER') {
                    router.push('/provider/dashboard')
                } else {
                    router.push('/')
                }
            } else {
                toast.error(data.error || 'Invalid OTP')
            }
        } catch (error) {
            toast.error('Failed to verify OTP')
        } finally {
            setLoading(false)
        }
    }

    const handleResendOTP = async () => {
        if (resendTimer > 0) return

        try {
            const response = await fetch('/api/auth/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone }),
            })

            const data = await response.json()

            if (data.success) {
                toast.success('OTP resent successfully!')
                setResendTimer(30)

                if (data.devOtp) {
                    toast.info(`Dev OTP: ${data.devOtp}`, {
                        duration: 10000,
                    })
                }
            } else {
                toast.error(data.error || 'Failed to resend OTP')
            }
        } catch (error) {
            toast.error('Failed to resend OTP')
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-background p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <CardTitle className="text-2xl">Verify OTP</CardTitle>
                    <CardDescription>
                        Humne +91 {phone} pe 6-digit OTP bheja hai
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleVerifyOTP} className="space-y-6">
                        {/* OTP Inputs */}
                        <div className="flex justify-center gap-2">
                            {otp.map((digit, index) => (
                                <Input
                                    key={index}
                                    ref={(el) => (inputRefs.current[index] = el)}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) => handleOtpChange(index, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(index, e)}
                                    className="w-12 h-12 text-center text-xl font-semibold"
                                    disabled={loading}
                                />
                            ))}
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-primary hover:bg-primary/90"
                            disabled={loading || otp.join('').length !== 6}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Verifying...
                                </>
                            ) : (
                                'Verify & Login'
                            )}
                        </Button>
                    </form>

                    {/* Resend OTP */}
                    <div className="mt-6 text-center">
                        {resendTimer > 0 ? (
                            <p className="text-sm text-muted-foreground">
                                Resend OTP in <span className="font-semibold text-foreground">{resendTimer}s</span>
                            </p>
                        ) : (
                            <Button
                                variant="link"
                                onClick={handleResendOTP}
                                className="text-sm"
                            >
                                Resend OTP
                            </Button>
                        )}
                    </div>

                    {/* Change Phone */}
                    <div className="mt-4 text-center">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                localStorage.removeItem('pendingPhone')
                                router.push('/login')
                            }}
                            className="text-sm text-muted-foreground"
                        >
                            Change Phone Number
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}