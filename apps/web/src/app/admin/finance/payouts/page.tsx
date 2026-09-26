"use client"

import { useEffect, useState } from "react"
import { PayoutTable } from "@/components/admin/PayoutTable"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { apiFetch } from "@/lib/api-client"

export default function AdminPayoutsPage() {
    const [payouts, setPayouts] = useState<any[]>([])
    const [status, setStatus] = useState("ALL")
    const [loading, setLoading] = useState(true)

    const fetchPayouts = async () => {
        setLoading(true)
        try {
            const res = await apiFetch(`/api/admin/finance/payouts?status=${status}`)
            const data = await res.json()
            if (data.success) setPayouts(data.data)
            else toast.error(data.error)
        } catch { toast.error("Failed to fetch payouts") } 
        finally { setLoading(false) }
    }

    useEffect(() => { fetchPayouts() }, [status])

    const handleProcessPayout = async (id: string) => {
        if (!confirm("Mark this payout as completed?")) return
        try {
            const res = await apiFetch('/api/admin/finance/payouts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ payoutId: id })
            })
            const data = await res.json()
            if (data.success) { toast.success("Payout marked as paid"); fetchPayouts() }
            else toast.error(data.error)
        } catch { toast.error("Failed to process payout") }
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center gap-4">
                <Button asChild variant="ghost" size="icon">
                    <Link href="/admin/finance"><ArrowLeft className="h-4 w-4" /></Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Payout Management</h1>
                    <p className="text-muted-foreground">Process and track provider payouts.</p>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">All Statuses</SelectItem>
                        <SelectItem value="PENDING">Pending</SelectItem>
                        <SelectItem value="PROCESSING">Processing</SelectItem>
                        <SelectItem value="COMPLETED">Completed</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {loading ? (
                <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
            ) : (
                <PayoutTable payouts={payouts} onProcess={handleProcessPayout} />
            )}
        </div>
    )
}