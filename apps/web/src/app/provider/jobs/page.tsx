// apps/web/src/app/provider/jobs/page.tsx

"use client"

import { useEffect, useState } from "react"
import { JobCard } from "@/components/provider/JobCard"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { apiFetch } from "@/lib/api-client"
import { toast } from "sonner"
import { IndianRupee } from "lucide-react"

export default function ProviderJobsPage() {
    const [jobs, setJobs] = useState<any[]>([])
    const [status, setStatus] = useState("ALL")
    const [loading, setLoading] = useState(true)

    // CASH completion modal (Only for pure CASH, not POD/Online)
    const [cashModal, setCashModal] = useState(false)
    const [selectedJob, setSelectedJob] = useState<any>(null)
    const [cashAmount, setCashAmount] = useState('')
    const [completing, setCompleting] = useState(false)

    const fetchJobs = async () => {
        setLoading(true)
        try {
            const res = await apiFetch(`/api/provider/jobs?status=${status}`, { cache: 'no-store' })
            const data = await res.json()

            if (data.success) setJobs(data.data)
            else toast.error(data.error)
        } catch (error) {
            console.error("Jobs fetch error:", error)
            toast.error("Failed to fetch jobs")
        } finally { setLoading(false) }
    }

    useEffect(() => { fetchJobs() }, [status])

    const handleAction = async (id: string, action: string, job?: any) => {
        // ✅ FIX: Only show modal for pure CASH payments. 
        // POD/ONLINE jobs will be completed directly (POD payment is handled via link in detail page)
        if (action === 'complete' && job?.paymentMethod === 'CASH') {
            setSelectedJob(job)
            setCashAmount(job.totalAmount.toString())
            setCashModal(true)
            return
        }

        try {
            const res = await apiFetch(`/api/provider/jobs/${id}/status`, {
                method: 'POST',
                body: JSON.stringify({ action })
            })
            const data = await res.json()

            if (data.success) {
                toast.success(data.message || `Job ${action}ed successfully!`)
                fetchJobs()
            } else toast.error(data.error)
        } catch (error) {
            console.error("Job action error:", error)
            toast.error("Action failed")
        }
    }

    const handleCashComplete = async () => {
        if (!selectedJob || !cashAmount) return

        setCompleting(true)
        try {
            const res = await apiFetch(`/api/provider/jobs/${selectedJob.id}/status`, {
                method: 'POST',
                body: JSON.stringify({ 
                    action: 'complete',
                    codAmountCollected: parseFloat(cashAmount) // Reusing backend field for cash collection
                })
            })
            const data = await res.json()

            if (data.success) {
                toast.success(data.message)
                setCashModal(false)
                setSelectedJob(null)
                setCashAmount('')
                fetchJobs()
            } else toast.error(data.error)
        } catch (error) {
            console.error("Cash complete error:", error)
            toast.error("Failed to complete job")
        } finally {
            setCompleting(false)
        }
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">My Jobs</h1>
                    <p className="text-muted-foreground">Manage your service bookings.</p>
                </div>
                <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">All Jobs</SelectItem>
                        <SelectItem value="PROVIDER_ASSIGNED">Pending</SelectItem>
                        <SelectItem value="CONFIRMED">Upcoming</SelectItem>
                        <SelectItem value="PROVIDER_TRAVELLING">On The Way</SelectItem>
                        <SelectItem value="SERVICE_STARTED">In Progress</SelectItem>
                        <SelectItem value="SERVICE_COMPLETED">Completed</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            ) : jobs.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">No jobs found.</div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2">
                    {jobs.map((job) => (
                        <JobCard key={job.id} job={job} onAction={handleAction} />
                    ))}
                </div>
            )}

            {/* CASH Completion Modal (Only for pure CASH) */}
            <Dialog open={cashModal} onOpenChange={setCashModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <IndianRupee className="h-5 w-5" />
                            Confirm Cash Collection
                        </DialogTitle>
                        <DialogDescription>
                            Enter the amount collected from customer for booking #{selectedJob?.bookingNumber}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="p-4 bg-muted rounded-lg">
                            <p className="text-sm text-muted-foreground">Booking Amount</p>
                            <p className="text-2xl font-bold">₹{selectedJob?.totalAmount}</p>
                        </div>
                        <div className="space-y-2">
                            <Label>Amount Collected from Customer *</Label>
                            <Input
                                type="number"
                                value={cashAmount}
                                onChange={(e) => setCashAmount(e.target.value)}
                                placeholder="Enter amount"
                            />
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="outline" onClick={() => setCashModal(false)} className="flex-1">
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleCashComplete} 
                            disabled={completing || !cashAmount}
                            className="flex-1"
                        >
                            {completing ? 'Completing...' : 'Confirm & Complete'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}