"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Ban, CheckCircle, Mail, Phone, Wallet } from "lucide-react"
import { toast } from "sonner"
import { apiFetch } from "@/lib/api-client"

export default function AdminUserDetailPage() {
    const params = useParams()
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await apiFetch(`/api/admin/users/${params.id}`)
                const data = await res.json()
                if (data.success) {
                    setUser(data.data)
                } else {
                    toast.error(data.error)
                    router.push('/admin/users')
                }
            } catch (error) {
                toast.error("Failed to fetch user details")
            } finally {
                setLoading(false)
            }
        }
        fetchUser()
    }, [params.id, router])

    if (loading) {
        return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
    }

    if (!user) return null

    return (
        <div className="p-6 space-y-6">
            <Button variant="ghost" onClick={() => router.push('/admin/users')} className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" /> Back to Users
            </Button>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold">{user.name || "Unnamed User"}</h1>
                    <div className="flex items-center gap-4 mt-2 text-muted-foreground">
                        <span className="flex items-center gap-1"><Phone className="h-4 w-4" /> {user.phone}</span>
                        {user.email && <span className="flex items-center gap-1"><Mail className="h-4 w-4" /> {user.email}</span>}
                    </div>
                </div>
                <div className="flex gap-2">
                    <Badge variant={user.isActive ? 'default' : 'destructive'} className="text-sm px-3 py-1">
                        {user.isActive ? 'Active' : 'Blocked'}
                    </Badge>
                    <Badge variant="secondary" className="text-sm px-3 py-1">{user.role}</Badge>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Wallet Balance</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold flex items-center gap-2">
                            <Wallet className="h-5 w-5 text-green-600" />
                            ₹{user.walletBalance.toFixed(2)}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Loyalty Tier</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{user.loyaltyTier}</div>
                        <p className="text-xs text-muted-foreground">{user.loyaltyPoints} points</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Account Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold flex items-center gap-2">
                            {user.isVerified ? <CheckCircle className="h-5 w-5 text-green-600" /> : <Ban className="h-5 w-5 text-red-600" />}
                            {user.isVerified ? 'Verified' : 'Not Verified'}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Bookings */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Bookings</CardTitle>
                    <CardDescription>Last 5 bookings by this user.</CardDescription>
                </CardHeader>
                <CardContent>
                    {user.bookings.length > 0 ? (
                        <div className="space-y-2">
                            {user.bookings.map((booking: any) => (
                                <div key={booking.id} className="flex justify-between items-center p-3 border rounded-md">
                                    <div>
                                        <p className="font-medium">{booking.service.name}</p>
                                        <p className="text-xs text-muted-foreground">{new Date(booking.scheduledDate).toLocaleDateString()}</p>
                                    </div>
                                    <Badge variant={booking.status === 'COMPLETED' ? 'default' : 'secondary'}>
                                        {booking.status}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-muted-foreground text-center py-4">No bookings found.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}