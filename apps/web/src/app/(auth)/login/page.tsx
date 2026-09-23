'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2, Phone } from 'lucide-react'
import Link from 'next/link'

export default function LoginPage() {
    const router = useRouter()
    const [phone, setPhone] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSendOTP = async (e: React.FormEvent) => {
        e.preventDefault()

        // Validate phone
        if (!/^\d{10}$/.test(phone)) {
            toast.error('Please enter a valid 10-digit phone number')
            return
        }

        setLoading(true)
        try {
            const response = await fetch('/api/auth/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone }),
            })

            const data = await response.json()

            if (data.success) {
                toast.success('OTP sent successfully!')

                // Store phone in localStorage for verify page
                localStorage.setItem('pendingPhone', phone)

                // Show dev OTP in development
                if (data.devOtp) {
                    toast.info(`Dev OTP: ${data.devOtp}`, {
                        duration: 10000,
                    })
                }

                // Redirect to verify page
                router.push('/verify')
            } else {
                toast.error(data.error || 'Failed to send OTP')
            }
        } catch (error) {
            toast.error('Failed to send OTP')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-background p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                        <Phone className="w-8 h-8 text-primary" />
                    </div>
                    <CardTitle className="text-2xl">Welcome to ServiceApp</CardTitle>
                    <CardDescription>
                        Ambikapur ki har zaroorat, ek jagah
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSendOTP} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <div className="flex gap-2">
                                <div className="flex items-center px-3 border rounded-lg bg-muted">
                                    <span className="text-sm font-medium">+91</span>
                                </div>
                                <Input
                                    id="phone"
                                    type="tel"
                                    placeholder="Enter 10-digit number"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                    maxLength={10}
                                    className="flex-1"
                                    disabled={loading}
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Hum aapko verification OTP bhejenge
                            </p>
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-primary hover:bg-primary/90"
                            disabled={loading || phone.length !== 10}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Sending OTP...
                                </>
                            ) : (
                                'Send OTP'
                            )}
                        </Button>
                    </form>

                    <div className="mt-6 text-center text-sm text-muted-foreground">
                        <p>
                            Login karke aap hamare{' '}
                            <Link href="/terms" className="text-primary hover:underline">
                                Terms & Conditions
                            </Link>{' '}
                            aur{' '}
                            <Link href="/privacy" className="text-primary hover:underline">
                                Privacy Policy
                            </Link>{' '}
                            se agree karte hain
                        </p>
                    </div>

                    {/* Admin Login Link */}
                    <div className="mt-4 pt-4 border-t text-center">
                        <Link
                            href="/admin/login"
                            className="text-sm text-muted-foreground hover:text-primary transition-colors"
                        >
                            Admin Login →
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}