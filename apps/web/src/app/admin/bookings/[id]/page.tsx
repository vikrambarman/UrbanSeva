"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, MapPin, User, Calendar } from "lucide-react"
import { toast } from "sonner"
import { apiFetch } from "@/lib/api-client"

export default function AdminBookingDetailPage() {
    const params = useParams()
    const router = useRouter()
    const [booking, setBooking] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchBooking = async () => {
            try {
                const res = await apiFetch(`/api/admin/bookings/${params.id}`)
                const data = await res.json()
                if (data.success) setBooking(data.data)
                else { toast.error(data.error); router.push('/admin/bookings') }
            } catch { toast.error("Failed to fetch details") } 
            finally { setLoading(false) }
        }
        fetchBooking()
    }, [params.id, router])

    if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
    if (!booking) return null

    return (
        <div className="p-6 space-y-6">
            <Button variant="ghost" onClick={() => router.push('/admin/bookings')} className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" /> Back to Bookings
            </Button>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Booking #{booking.bookingNumber}</h1>
                    <p className="text-muted-foreground">Created on {new Date(booking.createdAt).toLocaleString()}</p>
                </div>
                <Badge variant={booking.status === 'CANCELLED' ? 'destructive' : 'default'} className="text-sm px-3 py-1">
                    {booking.status.replace(/_/g, ' ')}
                </Badge>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card className="md:col-span-2">
                    <CardHeader><CardTitle>Service Details</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-4">
                            {booking.service.image && <img src={booking.service.image} alt="" className="w-16 h-16 rounded-md object-cover" />}
                            <div>
                                <h3 className="text-lg font-semibold">{booking.service.name}</h3>
                                <p className="text-sm text-muted-foreground">Duration: {booking.service.duration}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                            <div><p className="text-sm text-muted-foreground">Base Amount</p><p className="font-medium">₹{booking.baseAmount}</p></div>
                            <div><p className="text-sm text-muted-foreground">Add-ons</p><p className="font-medium">₹{booking.addOnAmount}</p></div>
                            <div><p className="text-sm text-muted-foreground">Discount</p><p className="font-medium">-₹{booking.discountAmount}</p></div>
                            <div><p className="text-sm text-muted-foreground">Total Amount</p><p className="text-lg font-bold text-primary">₹{booking.totalAmount}</p></div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>Customer & Location</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-3">
                            <User className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <p className="font-medium">{booking.user.name || "Guest"}</p>
                                <p className="text-sm text-muted-foreground">{booking.user.phone}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div>
                                <p className="font-medium">{booking.address.label}</p>
                                <p className="text-sm text-muted-foreground">{booking.address.fullAddress}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Calendar className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <p className="font-medium">{new Date(booking.scheduledDate).toLocaleDateString()}</p>
                                <p className="text-sm text-muted-foreground">{booking.scheduledTime}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="provider" className="w-full">
                <TabsList>
                    <TabsTrigger value="provider">Provider</TabsTrigger>
                    <TabsTrigger value="payment">Payment</TabsTrigger>
                    <TabsTrigger value="history">Status History</TabsTrigger>
                </TabsList>
                
                <TabsContent value="provider">
                    <Card>
                        <CardHeader><CardTitle>Assigned Provider</CardTitle></CardHeader>
                        <CardContent>
                            {booking.provider ? (
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                        <User className="h-6 w-6 text-primary" />
                                    </div>
                                    <div>
                                        <p className="font-medium">{booking.provider.user.name}</p>
                                        <p className="text-sm text-muted-foreground">{booking.provider.user.phone}</p>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-muted-foreground">No provider assigned yet.</p>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="payment">
                    <Card>
                        <CardHeader><CardTitle>Payment Details</CardTitle></CardHeader>
                        <CardContent>
                            {booking.payment ? (
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Status</span>
                                        <Badge variant={booking.payment.status === 'PAID' ? 'default' : 'secondary'}>{booking.payment.status}</Badge>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Method</span>
                                        <span>{booking.payment.method || 'N/A'}</span>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-muted-foreground">No payment record found.</p>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="history">
                    <Card>
                        <CardHeader><CardTitle>Status History</CardTitle></CardHeader>
                        <CardContent>
                            {booking.statusHistory.length > 0 ? (
                                <div className="space-y-4">
                                    {booking.statusHistory.map((h: any) => (
                                        <div key={h.id} className="flex gap-4 border-l-2 border-primary/20 pl-4 py-1">
                                            <div>
                                                <p className="font-medium">{h.status.replace(/_/g, ' ')}</p>
                                                <p className="text-xs text-muted-foreground">{h.note || 'No notes'}</p>
                                                <p className="text-xs text-muted-foreground mt-1">{new Date(h.createdAt).toLocaleString()}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-muted-foreground">No history available.</p>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}