// app/provider-login/page.tsx

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"
import { ArrowLeft, Loader2, Briefcase, AlertCircle } from "lucide-react"
import Link from "next/link"

export default function ProviderLoginPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [formData, setFormData] = useState({
        phone: "",
        password: ""
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        
        // Validation
        if (!formData.phone || !formData.password) {
            setError("Please fill all fields")
            return
        }

        if (formData.phone.length !== 10) {
            setError("Phone number must be 10 digits")
            return
        }

        setLoading(true)

        try {
            const res = await fetch('/api/auth/provider-login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            const data = await res.json()

            if (data.success) {
                // Store token
                localStorage.setItem('token', data.token)
                localStorage.setItem('user', JSON.stringify(data.user))
                
                toast.success("Login successful! Welcome back.")
                
                // Redirect to provider dashboard
                router.push('/provider/dashboard')
            } else {
                setError(data.error || "Login failed")
                toast.error(data.error || "Login failed")
            }
        } catch (error) {
            console.error('Login error:', error)
            setError("Network error. Please try again.")
            toast.error("Something went wrong")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-100 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-4">
                    <Link 
                        href="/" 
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Home
                    </Link>
                    
                    <div className="flex items-center justify-center">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <Briefcase className="h-6 w-6 text-primary" />
                        </div>
                    </div>
                    
                    <div className="text-center">
                        <CardTitle className="text-2xl">Provider Login</CardTitle>
                        <CardDescription>
                            Login to access your provider dashboard
                        </CardDescription>
                    </div>
                </CardHeader>
                
                <CardContent>
                    {error && (
                        <Alert variant="destructive" className="mb-4">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input
                                id="phone"
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => {
                                    const value = e.target.value.replace(/\D/g, '')
                                    setFormData({ ...formData, phone: value })
                                    setError("")
                                }}
                                placeholder="9876543210"
                                maxLength={10}
                                required
                                disabled={loading}
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password">Password</Label>
                                <Link 
                                    href="/provider-forgot-password" 
                                    className="text-xs text-primary hover:underline"
                                >
                                    Forgot password?
                                </Link>
                            </div>
                            <Input
                                id="password"
                                type="password"
                                value={formData.password}
                                onChange={(e) => {
                                    setFormData({ ...formData, password: e.target.value })
                                    setError("")
                                }}
                                placeholder="••••••••"
                                required
                                disabled={loading}
                            />
                        </div>

                        <Button 
                            type="submit" 
                            className="w-full" 
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Logging in...
                                </>
                            ) : (
                                'Login'
                            )}
                        </Button>
                    </form>

                    <div className="mt-6 space-y-3">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background px-2 text-muted-foreground">
                                    New to platform?
                                </span>
                            </div>
                        </div>

                        <Button 
                            asChild 
                            variant="outline" 
                            className="w-full"
                        >
                            <Link href="/become-provider">
                                Apply to Become Provider
                            </Link>
                        </Button>
                    </div>

                    <p className="mt-4 text-center text-xs text-muted-foreground">
                        Looking for customer login?{" "}
                        <Link href="/login" className="text-primary hover:underline">
                            Login here
                        </Link>
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}