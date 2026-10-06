// app/(ops)/login/page.tsx
// KYA: Calling team members ka login page — phone + password
// KYUN: Admin login se alag hai — ops portal ka separate entry point
//       Design admin-login se similar hai but Headphones icon + "Ops" branding

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2, Headphones } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

export default function OpsLoginPage() {
    const router = useRouter()
    const { setUser } = useAuthStore()
    const [phone, setPhone] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!phone || !password) {
            toast.error('Please enter phone and password')
            return
        }

        setLoading(true)
        try {
            const response = await fetch('/api/ops/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, password }),
            })

            const data = await response.json()

            if (data.success) {
                const token = data.data?.token

                if (!token) {
                    console.error('❌ No token in response:', data)
                    toast.error('Login failed: No token received')
                    return
                }

                // Token + user store karo
                setUser(data.data.user, token)

                toast.success('Login successful! Welcome to Ops Panel')

                setTimeout(() => {
                    router.push('/ops/dashboard')
                }, 100)
            } else {
                toast.error(data.error || 'Invalid credentials')
            }
        } catch (error) {
            console.error('Login error:', error)
            toast.error('Failed to login. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-background p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                        <Headphones className="w-8 h-8 text-primary" />
                    </div>
                    <CardTitle className="text-2xl">Ops Panel Login</CardTitle>
                    <CardDescription>
                        Calling Team — Booking Management Portal
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <div className="flex gap-2">
                                <div className="flex items-center px-3 border rounded-lg bg-muted">
                                    <span className="text-sm font-medium">+91</span>
                                </div>
                                <Input
                                    id="phone"
                                    type="tel"
                                    placeholder="Your phone number"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                    maxLength={10}
                                    className="flex-1"
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={loading}
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-primary hover:bg-primary/90"
                            disabled={loading || !phone || !password}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Logging in...
                                </>
                            ) : (
                                'Login to Ops Panel'
                            )}
                        </Button>
                    </form>

                    <div className="mt-6 text-center space-y-2">
                        <p className="text-xs text-muted-foreground">
                            Contact admin if you don&apos;t have credentials
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}