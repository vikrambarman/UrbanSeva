// src/app/(auth)/provider-forgot-password/page.tsx

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"
import { ArrowLeft, Loader2, AlertCircle, CheckCircle, Lock, Phone, Key } from "lucide-react"
import Link from "next/link"

type Step = 'phone' | 'otp' | 'password'

export default function ProviderForgotPasswordPage() {
    const [step, setStep] = useState<Step>('phone')
    const [loading, setLoading] = useState(false)
    const [phone, setPhone] = useState("")
    const [otp, setOtp] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [error, setError] = useState("")
    const [timer, setTimer] = useState(0)

    // Timer for resend OTP
    const startTimer = () => {
        setTimer(60)
        const interval = setInterval(() => {
            setTimer((prev) => {
                if (prev <= 1) {
                    clearInterval(interval)
                    return 0
                }
                return prev - 1
            })
        }, 1000)
    }

    // Step 1: Send OTP
    const handleSendOTP = async (e?: React.FormEvent) => {
        if (e) e.preventDefault()
        setError("")

        if (phone.length !== 10) {
            setError("Phone number must be 10 digits")
            return
        }

        setLoading(true)

        try {
            const res = await fetch('/api/auth/forgot-password/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, role: 'PROVIDER' })
            })

            const data = await res.json()

            if (data.success) {
                toast.success("OTP sent to your phone!")
                setStep('otp')
                startTimer()
                
                // Development mode - show OTP
                if (process.env.NODE_ENV === 'development' && data.otp) {
                    toast.info(`Dev Mode - OTP: ${data.otp}`, { duration: 10000 })
                }
            } else {
                setError(data.error || "Failed to send OTP")
                toast.error(data.error || "Failed to send OTP")
            }
        } catch (error) {
            console.error('Send OTP error:', error)
            setError("Network error. Please try again.")
            toast.error("Network error. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    // Step 2: Verify OTP
    const handleVerifyOTP = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")

        if (otp.length !== 6) {
            setError("OTP must be 6 digits")
            return
        }

        setLoading(true)

        try {
            const res = await fetch('/api/auth/forgot-password/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, otp })
            })

            const data = await res.json()

            if (data.success) {
                toast.success("OTP verified!")
                setStep('password')
            } else {
                setError(data.error || "Invalid OTP")
                toast.error(data.error || "Invalid OTP")
            }
        } catch (error) {
            console.error('Verify OTP error:', error)
            setError("Verification failed. Please try again.")
            toast.error("Verification failed")
        } finally {
            setLoading(false)
        }
    }

    // Step 3: Reset Password
    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")

        if (password.length < 6) {
            setError("Password must be at least 6 characters")
            return
        }

        if (password !== confirmPassword) {
            setError("Passwords don't match")
            return
        }

        setLoading(true)

        try {
            const res = await fetch('/api/auth/forgot-password/reset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, otp, password })
            })

            const data = await res.json()

            if (data.success) {
                toast.success("Password reset successful! Redirecting to login...")
                setTimeout(() => {
                    window.location.href = '/provider-login'
                }, 1500)
            } else {
                setError(data.error || "Password reset failed")
                toast.error(data.error || "Password reset failed")
            }
        } catch (error) {
            console.error('Reset password error:', error)
            setError("Reset failed. Please try again.")
            toast.error("Reset failed")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 p-4">
            <Card className="w-full max-w-md shadow-xl">
                <CardHeader className="space-y-4 pb-6">
                    <Link 
                        href="/provider-login" 
                        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Login
                    </Link>
                    
                    <div className="flex justify-center">
                        <div className="h-16 w-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                            <Lock className="h-8 w-8 text-white" />
                        </div>
                    </div>
                    
                    <div className="text-center space-y-2">
                        <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
                        <CardDescription>
                            {step === 'phone' && "Enter your registered phone number"}
                            {step === 'otp' && "Enter the 6-digit OTP sent to your phone"}
                            {step === 'password' && "Create a new secure password"}
                        </CardDescription>
                    </div>

                    {/* Progress Indicator */}
                    <div className="flex items-center justify-center gap-2 pt-2">
                        <div className={`h-2 w-2 rounded-full transition-all ${step === 'phone' ? 'bg-primary w-8' : 'bg-primary/30'}`} />
                        <div className={`h-2 w-2 rounded-full transition-all ${step === 'otp' ? 'bg-primary w-8' : 'bg-primary/30'}`} />
                        <div className={`h-2 w-2 rounded-full transition-all ${step === 'password' ? 'bg-primary w-8' : 'bg-primary/30'}`} />
                    </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                    {error && (
                        <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-2">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {/* Step 1: Phone Number */}
                    {step === 'phone' && (
                        <form onSubmit={handleSendOTP} className="space-y-4 animate-in fade-in slide-in-from-right-4">
                            <div className="space-y-2">
                                <Label htmlFor="phone" className="flex items-center gap-2">
                                    <Phone className="h-4 w-4" />
                                    Phone Number
                                </Label>
                                <Input
                                    id="phone"
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => {
                                        setPhone(e.target.value.replace(/\D/g, ''))
                                        setError("")
                                    }}
                                    placeholder="9876543210"
                                    maxLength={10}
                                    required
                                    disabled={loading}
                                    className="text-lg h-12"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Enter the phone number registered with your provider account
                                </p>
                            </div>

                            <Button 
                                type="submit" 
                                className="w-full h-12 text-base font-semibold" 
                                disabled={loading || phone.length !== 10}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Sending OTP...
                                    </>
                                ) : (
                                    <>
                                        <Key className="mr-2 h-5 w-5" />
                                        Send OTP
                                    </>
                                )}
                            </Button>
                        </form>
                    )}

                    {/* Step 2: OTP Verification */}
                    {step === 'otp' && (
                        <form onSubmit={handleVerifyOTP} className="space-y-4 animate-in fade-in slide-in-from-right-4">
                            <div className="space-y-2">
                                <Label htmlFor="otp" className="flex items-center gap-2">
                                    <Key className="h-4 w-4" />
                                    Enter OTP
                                </Label>
                                <Input
                                    id="otp"
                                    type="text"
                                    value={otp}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/\D/g, '')
                                        setOtp(value)
                                        setError("")
                                        // Auto-submit when 6 digits entered
                                        if (value.length === 6) {
                                            // Optional: auto-verify
                                        }
                                    }}
                                    placeholder="• • • • • •"
                                    maxLength={6}
                                    required
                                    disabled={loading}
                                    className="text-center text-3xl tracking-[1em] font-bold h-16 placeholder:tracking-[0.5em]"
                                    autoFocus
                                />
                                <div className="flex items-center justify-between text-xs">
                                    <p className="text-muted-foreground">
                                        OTP sent to {phone}
                                    </p>
                                    {timer > 0 ? (
                                        <p className="text-primary font-medium">
                                            Resend in {timer}s
                                        </p>
                                    ) : null}
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setStep('phone')
                                        setOtp("")
                                        setTimer(0)
                                    }}
                                    className="flex-1 h-12"
                                    disabled={loading}
                                >
                                    Change Number
                                </Button>
                                <Button 
                                    type="submit" 
                                    className="flex-1 h-12 font-semibold" 
                                    disabled={loading || otp.length !== 6}
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                            Verifying...
                                        </>
                                    ) : (
                                        'Verify OTP'
                                    )}
                                </Button>
                            </div>

                            {timer === 0 && (
                                <Button
                                    type="button"
                                    variant="link"
                                    onClick={handleSendOTP}
                                    className="w-full"
                                    disabled={loading}
                                >
                                    Didn't receive OTP? Resend
                                </Button>
                            )}
                        </form>
                    )}

                    {/* Step 3: New Password */}
                    {step === 'password' && (
                        <form onSubmit={handleResetPassword} className="space-y-4 animate-in fade-in slide-in-from-right-4">
                            <Alert className="bg-green-50 border-green-200">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <AlertDescription className="text-green-800">
                                    OTP verified! Now create your new password.
                                </AlertDescription>
                            </Alert>

                            <div className="space-y-2">
                                <Label htmlFor="password" className="flex items-center gap-2">
                                    <Lock className="h-4 w-4" />
                                    New Password
                                </Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value)
                                        setError("")
                                    }}
                                    placeholder="Minimum 6 characters"
                                    required
                                    disabled={loading}
                                    className="h-12"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword" className="flex items-center gap-2">
                                    <Lock className="h-4 w-4" />
                                    Confirm Password
                                </Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => {
                                        setConfirmPassword(e.target.value)
                                        setError("")
                                    }}
                                    placeholder="Re-enter your password"
                                    required
                                    disabled={loading}
                                    className="h-12"
                                />
                            </div>

                            {/* Password strength indicator */}
                            {password.length > 0 && (
                                <div className="space-y-2">
                                    <div className="flex gap-1">
                                        <div className={`h-1 flex-1 rounded ${password.length >= 6 ? 'bg-green-500' : 'bg-gray-200'}`} />
                                        <div className={`h-1 flex-1 rounded ${password.length >= 8 ? 'bg-green-500' : 'bg-gray-200'}`} />
                                        <div className={`h-1 flex-1 rounded ${password.length >= 10 && /[A-Z]/.test(password) ? 'bg-green-500' : 'bg-gray-200'}`} />
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {password.length < 6 ? 'Weak' : password.length < 8 ? 'Good' : 'Strong'} password
                                    </p>
                                </div>
                            )}

                            <Button 
                                type="submit" 
                                className="w-full h-12 text-base font-semibold" 
                                disabled={loading || password.length < 6 || password !== confirmPassword}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Resetting Password...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="mr-2 h-5 w-5" />
                                        Reset Password
                                    </>
                                )}
                            </Button>
                        </form>
                    )}

                    {/* Footer */}
                    <div className="pt-4 text-center">
                        <p className="text-sm text-muted-foreground">
                            Remember your password?{" "}
                            <Link 
                                href="/provider-login" 
                                className="text-primary hover:underline font-medium"
                            >
                                Login here
                            </Link>
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}