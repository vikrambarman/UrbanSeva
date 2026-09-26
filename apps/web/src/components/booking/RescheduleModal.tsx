"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar, Clock } from "lucide-react"
import { toast } from "sonner"
import { apiFetch } from "@/lib/api-client"

interface RescheduleModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    bookingId: string
    currentScheduledDate: string
    onSuccess: () => void
}

export function RescheduleModal({ open, onOpenChange, bookingId, currentScheduledDate, onSuccess }: RescheduleModalProps) {
    const [newDate, setNewDate] = useState("")
    const [newTime, setNewTime] = useState("")
    const [reason, setReason] = useState("")
    const [loading, setLoading] = useState(false)

    const handleSubmit = async () => {
        if (!newDate || !newTime) {
            toast.error("Please select new date and time")
            return
        }
        setLoading(true)
        try {
            // ✅ FIX: Response object milega
            const res = await apiFetch(`/api/bookings/${bookingId}/reschedule`, {
                method: 'POST',
                body: JSON.stringify({ newDate, newTime, reason })
            })
            // ✅ FIX: Parse karo
            const data = await res.json()

            if (data.success) {
                toast.success("Booking rescheduled successfully!")
                onOpenChange(false)
                onSuccess()
            } else toast.error(data.error)
        } catch (error) {
            console.error("Reschedule submit error:", error)
            toast.error("Failed to reschedule")
        }
        finally { setLoading(false) }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Reschedule Booking</DialogTitle>
                    <DialogDescription>
                        Current schedule: {new Date(currentScheduledDate).toLocaleDateString()}
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2"><Calendar className="h-4 w-4" /> New Date</Label>
                        <Input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} min={new Date().toISOString().split('T')[0]} />
                    </div>
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2"><Clock className="h-4 w-4" /> New Time</Label>
                        <Input type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label>Reason (Optional)</Label>
                        <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why are you rescheduling?" rows={3} />
                    </div>
                    <Button onClick={handleSubmit} disabled={loading} className="w-full">
                        {loading ? 'Rescheduling...' : 'Confirm Reschedule'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}