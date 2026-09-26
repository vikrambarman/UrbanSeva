// app/become-provider/page.tsx

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { ArrowLeft, Loader2, CheckCircle, Phone, Mail, Briefcase } from "lucide-react"
import Link from "next/link"

export default function BecomeProviderPage() {
    const [loading, setLoading] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        email: "",
        experience: "",
        services: "",
        city: "",
        message: "",
        agreeToTerms: false
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        
        // Basic Validation
        if (!formData.name || !formData.phone) {
            toast.error("Please fill all required fields")
            return
        }

        if (formData.phone.length !== 10) {
            toast.error("Phone number must be 10 digits")
            return
        }

        if (!formData.agreeToTerms) {
            toast.error("Please accept terms and conditions")
            return
        }

        setLoading(true)

        try {
            const res = await fetch('/api/provider-inquiry', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            const data = await res.json()

            if (data.success) {
                setSubmitted(true)
                toast.success("Application submitted successfully!")
            } else {
                toast.error(data.error || "Submission failed")
            }
        } catch (error) {
            console.error('Submission error:', error)
            toast.error("Something went wrong")
        } finally {
            setLoading(false)
        }
    }

    if (submitted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
                <Card className="w-full max-w-md text-center">
                    <CardContent className="pt-6">
                        <div className="flex justify-center mb-4">
                            <div className="rounded-full bg-green-100 p-3">
                                <CheckCircle className="h-12 w-12 text-green-600" />
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold mb-2">Application Submitted!</h2>
                        <p className="text-muted-foreground mb-6">
                            Thank you for your interest. Our team will review your application and contact you within 24-48 hours.
                        </p>
                        <div className="space-y-3">
                            <Button asChild className="w-full">
                                <Link href="/">Back to Home</Link>
                            </Button>
                            <Button asChild variant="outline" className="w-full">
                                <Link href="/provider-login">Already have an account? Login</Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
            <div className="max-w-4xl mx-auto">
                <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Home
                </Link>

                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold mb-2">Become a Service Provider</h1>
                    <p className="text-lg text-muted-foreground">
                        Join our platform and grow your business
                    </p>
                </div>

                {/* Benefits */}
                <div className="grid md:grid-cols-3 gap-4 mb-8">
                    <Card>
                        <CardContent className="pt-6 text-center">
                            <Phone className="h-8 w-8 mx-auto mb-3 text-blue-600" />
                            <h3 className="font-semibold mb-1">Direct Leads</h3>
                            <p className="text-sm text-muted-foreground">Get customer requests directly</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6 text-center">
                            <Briefcase className="h-8 w-8 mx-auto mb-3 text-green-600" />
                            <h3 className="font-semibold mb-1">Flexible Work</h3>
                            <p className="text-sm text-muted-foreground">Work on your own schedule</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6 text-center">
                            <Mail className="h-8 w-8 mx-auto mb-3 text-purple-600" />
                            <h3 className="font-semibold mb-1">Quick Payouts</h3>
                            <p className="text-sm text-muted-foreground">Fast and secure payments</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Application Form */}
                <Card>
                    <CardHeader>
                        <CardTitle>Submit Your Application</CardTitle>
                        <CardDescription>
                            Fill out the form below and our team will get back to you shortly
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Personal Details */}
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Full Name *</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="John Doe"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone Number *</Label>
                                    <Input
                                        id="phone"
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })}
                                        placeholder="9876543210"
                                        maxLength={10}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="john@example.com"
                                />
                            </div>

                            {/* Professional Details */}
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="experience">Years of Experience</Label>
                                    <Input
                                        id="experience"
                                        type="number"
                                        value={formData.experience}
                                        onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                                        placeholder="5"
                                        min="0"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="city">City</Label>
                                    <Input
                                        id="city"
                                        value={formData.city}
                                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                        placeholder="Ambikapur"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="services">Services You Offer</Label>
                                <Input
                                    id="services"
                                    value={formData.services}
                                    onChange={(e) => setFormData({ ...formData, services: e.target.value })}
                                    placeholder="e.g., Plumbing, Electrical, Cleaning"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="message">Tell Us About Yourself</Label>
                                <Textarea
                                    id="message"
                                    value={formData.message}
                                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                    placeholder="Brief description of your skills and experience..."
                                    rows={4}
                                />
                            </div>

                            {/* Terms */}
                            <div className="flex items-start space-x-2">
                                <Checkbox
                                    id="terms"
                                    checked={formData.agreeToTerms}
                                    onCheckedChange={(checked) => 
                                        setFormData({ ...formData, agreeToTerms: checked as boolean })
                                    }
                                />
                                <label htmlFor="terms" className="text-sm leading-none cursor-pointer">
                                    I agree to the{" "}
                                    <Link href="/terms" className="text-primary hover:underline">
                                        Terms & Conditions
                                    </Link>
                                    {" "}and{" "}
                                    <Link href="/privacy" className="text-primary hover:underline">
                                        Privacy Policy
                                    </Link>
                                </label>
                            </div>

                            <Button type="submit" className="w-full" size="lg" disabled={loading}>
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Submitting...
                                    </>
                                ) : (
                                    'Submit Application'
                                )}
                            </Button>

                            <p className="text-center text-sm text-muted-foreground">
                                Already registered?{" "}
                                <Link href="/provider-login" className="text-primary hover:underline">
                                    Login here
                                </Link>
                            </p>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}