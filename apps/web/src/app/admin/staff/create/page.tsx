// app/admin/staff/create/page.tsx
// KYA: Admin naya calling team member create kare — name, phone, password, categories
// KYUN: Staff create karte time admin categories bhi assign karega

"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft, Loader2, Headphones, Save } from "lucide-react"
import { apiFetch } from "@/lib/api-client"
import { toast } from "sonner"
import Link from "next/link"

interface Category {
    id: string
    name: string
    slug: string
}

export default function AdminStaffCreatePage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [categories, setCategories] = useState<Category[]>([])
    const [loadingCategories, setLoadingCategories] = useState(true)

    // Form state
    const [name, setName] = useState('')
    const [phone, setPhone] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [selectedCategories, setSelectedCategories] = useState<string[]>([])

    // Fetch all categories
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await apiFetch('/api/categories')
                const data = await res.json()
                if (data.success) {
                    setCategories(data.data)
                }
            } catch (error) {
                console.error('Failed to fetch categories:', error)
            } finally {
                setLoadingCategories(false)
            }
        }
        fetchCategories()
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // Validation
        if (!name.trim()) {
            toast.error('Name is required')
            return
        }
        if (phone.length !== 10) {
            toast.error('Phone must be 10 digits')
            return
        }
        if (password.length < 6) {
            toast.error('Password must be at least 6 characters')
            return
        }
        if (password !== confirmPassword) {
            toast.error('Passwords do not match')
            return
        }
        if (selectedCategories.length === 0) {
            toast.error('Please select at least one category')
            return
        }

        setLoading(true)
        try {
            const res = await apiFetch('/api/admin/staff', {
                method: 'POST',
                body: JSON.stringify({
                    name: name.trim(),
                    phone,
                    email: email.trim() || undefined,
                    password,
                    categoryIds: selectedCategories,
                }),
            })

            const data = await res.json()

            if (data.success) {
                toast.success('Staff member created successfully!')
                router.push('/admin/staff')
            } else {
                toast.error(data.error || 'Failed to create staff')
            }
        } catch {
            toast.error('Failed to create staff member')
        } finally {
            setLoading(false)
        }
    }

    const toggleCategory = (catId: string) => {
        setSelectedCategories(prev =>
            prev.includes(catId)
                ? prev.filter(id => id !== catId)
                : [...prev, catId]
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/admin/staff">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Headphones className="h-6 w-6 text-primary" />
                        Create Staff Member
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Add a new calling team member and assign categories
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left — Basic Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Basic Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name *</Label>
                                <Input
                                    id="name"
                                    placeholder="e.g., Rahul Sharma"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    disabled={loading}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone Number *</Label>
                                <div className="flex gap-2">
                                    <div className="flex items-center px-3 border rounded-lg bg-muted">
                                        <span className="text-sm font-medium">+91</span>
                                    </div>
                                    <Input
                                        id="phone"
                                        type="tel"
                                        placeholder="10-digit phone number"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                        maxLength={10}
                                        disabled={loading}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Email (Optional)</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="staff@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={loading}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">Password *</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="Minimum 6 characters"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={loading}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirm Password *</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    placeholder="Re-enter password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    disabled={loading}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Right — Category Assignment */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Assign Categories *</CardTitle>
                            <p className="text-sm text-muted-foreground">
                                Staff member will only see bookings from assigned categories
                            </p>
                        </CardHeader>
                        <CardContent>
                            {loadingCategories ? (
                                <div className="space-y-3">
                                    {[...Array(5)].map((_, i) => (
                                        <Skeleton key={i} className="h-10 w-full" />
                                    ))}
                                </div>
                            ) : categories.length === 0 ? (
                                <p className="text-muted-foreground text-center py-4">
                                    No categories available
                                </p>
                            ) : (
                                <div className="space-y-3">
                                    {categories.map((cat) => (
                                        <div
                                            key={cat.id}
                                            className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                                            onClick={() => toggleCategory(cat.id)}
                                        >
                                            <Checkbox
                                                id={`cat-${cat.id}`}
                                                checked={selectedCategories.includes(cat.id)}
                                                onCheckedChange={() => toggleCategory(cat.id)}
                                            />
                                            <Label
                                                htmlFor={`cat-${cat.id}`}
                                                className="flex-1 cursor-pointer"
                                            >
                                                {cat.name}
                                            </Label>
                                        </div>
                                    ))}

                                    {selectedCategories.length > 0 && (
                                        <div className="pt-3 border-t">
                                            <p className="text-sm text-muted-foreground">
                                                {selectedCategories.length} category/categories selected
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Submit */}
                <div className="flex items-center gap-4 mt-6">
                    <Button type="submit" disabled={loading}>
                        {loading ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Creating...
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4 mr-2" />
                                Create Staff Member
                            </>
                        )}
                    </Button>
                    <Link href="/admin/staff">
                        <Button type="button" variant="outline">
                            Cancel
                        </Button>
                    </Link>
                </div>
            </form>
        </div>
    )
}