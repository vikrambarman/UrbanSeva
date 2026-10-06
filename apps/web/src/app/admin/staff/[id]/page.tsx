// app/admin/staff/[id]/page.tsx
// KYA: Admin existing staff member ko edit kare — name, password, categories
// KYUN: Staff ki details update karne ka option chahiye — categories add/remove, password reset, etc.

"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
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

interface StaffData {
    id: string
    name: string | null
    phone: string
    email: string | null
    isActive: boolean
    categories: Category[]
}

export default function AdminStaffEditPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter()
    const [staffId, setStaffId] = useState<string>('')
    const [loading, setLoading] = useState(false)
    const [loadingData, setLoadingData] = useState(true)
    const [categories, setCategories] = useState<Category[]>([])
    const [loadingCategories, setLoadingCategories] = useState(true)

    // Staff data
    const [staff, setStaff] = useState<StaffData | null>(null)

    // Form state
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [isActive, setIsActive] = useState(true)
    const [selectedCategories, setSelectedCategories] = useState<string[]>([])

    useEffect(() => {
        params.then(p => setStaffId(p.id))
    }, [params])

    useEffect(() => {
        if (staffId) {
            fetchStaff()
            fetchCategories()
        }
    }, [staffId])

    const fetchStaff = async () => {
        try {
            const res = await apiFetch(`/api/admin/staff/${staffId}`)
            const data = await res.json()
            if (data.success) {
                setStaff(data.data)
                setName(data.data.name || '')
                setEmail(data.data.email || '')
                setIsActive(data.data.isActive)
                setSelectedCategories(data.data.categories.map((c: Category) => c.id))
            } else {
                toast.error(data.error || 'Failed to load staff')
                router.push('/admin/staff')
            }
        } catch {
            toast.error('Failed to load staff')
        } finally {
            setLoadingData(false)
        }
    }

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // Validation
        if (!name.trim()) {
            toast.error('Name is required')
            return
        }
        if (password && password.length < 6) {
            toast.error('Password must be at least 6 characters')
            return
        }
        if (password && password !== confirmPassword) {
            toast.error('Passwords do not match')
            return
        }
        if (selectedCategories.length === 0) {
            toast.error('Please select at least one category')
            return
        }

        setLoading(true)
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const updateData: any = {
                name: name.trim(),
                email: email.trim() || null,
                isActive,
                categoryIds: selectedCategories,
            }

            if (password) {
                updateData.password = password
            }

            const res = await apiFetch(`/api/admin/staff/${staffId}`, {
                method: 'PUT',
                body: JSON.stringify(updateData),
            })

            const data = await res.json()

            if (data.success) {
                toast.success('Staff member updated successfully!')
                router.push('/admin/staff')
            } else {
                toast.error(data.error || 'Failed to update staff')
            }
        } catch {
            toast.error('Failed to update staff member')
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

    if (loadingData) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-8 w-48" />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Skeleton className="h-96" />
                    <Skeleton className="h-96" />
                </div>
            </div>
        )
    }

    if (!staff) {
        return (
            <div className="text-center py-12">
                <p className="text-muted-foreground">Staff member not found</p>
                <Button onClick={() => router.push('/admin/staff')} className="mt-4">
                    Back to Staff
                </Button>
            </div>
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
                        Edit Staff Member
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Update details and manage categories for {staff.name}
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
                                <Label>Phone Number</Label>
                                <Input value={staff.phone} disabled className="bg-muted" />
                                <p className="text-xs text-muted-foreground">
                                    Phone number cannot be changed
                                </p>
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
                                <Label htmlFor="password">New Password (Leave blank to keep current)</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="Minimum 6 characters"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={loading}
                                />
                            </div>

                            {password && (
                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                                    <Input
                                        id="confirmPassword"
                                        type="password"
                                        placeholder="Re-enter new password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        disabled={loading}
                                    />
                                </div>
                            )}

                            <div className="flex items-center space-x-2 pt-4 border-t">
                                <Switch
                                    id="isActive"
                                    checked={isActive}
                                    onCheckedChange={setIsActive}
                                    disabled={loading}
                                />
                                <Label htmlFor="isActive" className="cursor-pointer">
                                    Active Status
                                </Label>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {isActive 
                                    ? 'Staff member can login and access ops portal' 
                                    : 'Staff member cannot login — account is deactivated'
                                }
                            </p>
                        </CardContent>
                    </Card>

                    {/* Right — Category Assignment */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Assigned Categories *</CardTitle>
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
                                Updating...
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4 mr-2" />
                                Update Staff Member
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