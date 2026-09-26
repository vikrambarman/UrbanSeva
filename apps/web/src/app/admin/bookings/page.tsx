"use client"

import { useEffect, useState, useCallback } from "react"
import { BookingFilters } from "@/components/admin/BookingFilters"
import { BookingTable } from "@/components/admin/BookingTable"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { apiFetch } from "@/lib/api-client"

export default function AdminBookingsPage() {
    const [bookings, setBookings] = useState<any[]>([])
    const [search, setSearch] = useState("")
    const [status, setStatus] = useState("ALL")
    const [loading, setLoading] = useState(true)
    
    const [assignDialogOpen, setAssignDialogOpen] = useState(false)
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
    const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null)
    const [providerId, setProviderId] = useState("")
    const [cancelReason, setCancelReason] = useState("")

    const fetchBookings = useCallback(async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams({ search, status })
            const res = await apiFetch(`/api/admin/bookings?${params.toString()}`)
            const data = await res.json()
            if (data.success) setBookings(data.data.bookings)
            else toast.error(data.error)
        } catch { toast.error("Failed to fetch bookings") } 
        finally { setLoading(false) }
    }, [search, status])

    useEffect(() => {
        const timer = setTimeout(fetchBookings, 500)
        return () => clearTimeout(timer)
    }, [fetchBookings])

    const handleAssign = async () => {
        if (!selectedBookingId || !providerId) return
        try {
            const res = await fetch(`/api/admin/bookings/${selectedBookingId}/assign`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ providerId })
            })
            const data = await res.json()
            if (data.success) {
                toast.success("Provider assigned successfully")
                setAssignDialogOpen(false)
                setProviderId("")
                fetchBookings()
            } else toast.error(data.error)
        } catch { toast.error("Failed to assign") }
    }

    const handleCancel = async () => {
        if (!selectedBookingId) return
        try {
            const res = await fetch(`/api/admin/bookings/${selectedBookingId}/cancel`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason: cancelReason })
            })
            const data = await res.json()
            if (data.success) {
                toast.success("Booking cancelled")
                setCancelDialogOpen(false)
                setCancelReason("")
                fetchBookings()
            } else toast.error(data.error)
        } catch { toast.error("Failed to cancel") }
    }

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Booking Management</h1>
                <p className="text-muted-foreground">View, assign, and manage all customer bookings.</p>
            </div>

            <BookingFilters
                search={search} status={status}
                onSearchChange={setSearch} onStatusChange={setStatus}
                onReset={() => { setSearch(""); setStatus("ALL") }}
                onCreateManual={() => toast.info("Manual booking form will be integrated soon!")}
            />

            {loading ? (
                <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
            ) : (
                <BookingTable
                    bookings={bookings}
                    onAssign={(id) => { setSelectedBookingId(id); setAssignDialogOpen(true) }}
                    onCancel={(id) => { setSelectedBookingId(id); setCancelDialogOpen(true) }}
                />
            )}

            {/* Assign Provider Dialog */}
            <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Assign Provider</DialogTitle>
                        <DialogDescription>Enter the Provider ID to assign to this booking.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Provider ID</Label>
                            <Input value={providerId} onChange={(e) => setProviderId(e.target.value)} placeholder="Enter Provider ID" />
                        </div>
                        <Button onClick={handleAssign} className="w-full">Assign Provider</Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Cancel Booking Dialog */}
            <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Cancel Booking</DialogTitle>
                        <DialogDescription>Are you sure? This will initiate a refund if payment was made.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Reason for Cancellation</Label>
                            <Input value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder="Optional reason" />
                        </div>
                        <Button variant="destructive" onClick={handleCancel} className="w-full">Confirm Cancellation</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}