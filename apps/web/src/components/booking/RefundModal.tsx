"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import { apiFetch } from "@/lib/api-client"

interface RefundModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    bookingId: string
    totalAmount: number
    onSuccess: () => void
}

export function RefundModal({ open, onOpenChange, bookingId, totalAmount, onSuccess }: RefundModalProps) {
    const [reason, setReason] = useState("")
    const [amount, setAmount] = useState(totalAmount.toString())
    const [loading, setLoading] = useState(false)

    const handleSubmit = async () => {
    if (!reason.trim()) {
        toast.error("Please provide a reason for refund")
        return
    }
    setLoading(true)
    try {
        // ✅ FIX: Response object milega
        const res = await apiFetch(`/api/bookings/${bookingId}/refund`, {
            method: 'POST',
            body: JSON.stringify({ reason, amount: parseFloat(amount) })
        })
        // ✅ FIX: Parse karo
        const data = await res.json()

        if (data.success) {
            toast.success("Refund processed! Amount credited to wallet.")
            onOpenChange(false)
            onSuccess()
        } else toast.error(data.error)
    } catch (error) { 
        console.error("Refund submit error:", error)
        toast.error("Failed to process refund") 
    }
    finally { setLoading(false) }
}

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-destructive" /> Process Refund
                    </DialogTitle>
                    <DialogDescription>
                        The refund amount will be credited to the customer&apos;s wallet.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="p-3 bg-muted rounded-md">
                        <p className="text-sm text-muted-foreground">Total Paid Amount</p>
                        <p className="text-2xl font-bold">₹{totalAmount}</p>
                    </div>
                    <div className="space-y-2">
                        <Label>Refund Amount (₹)</Label>
                        <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} max={totalAmount} min={0} />
                    </div>
                    <div className="space-y-2">
                        <Label>Reason for Refund</Label>
                        <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why is this refund being processed?" rows={3} />
                    </div>
                    <Button variant="destructive" onClick={handleSubmit} disabled={loading} className="w-full">
                        {loading ? 'Processing...' : 'Confirm Refund'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}