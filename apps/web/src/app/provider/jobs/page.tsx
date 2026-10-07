/**
 * WHAT: Provider jobs page with COD payment handling
 * WHY: 
 * - Show payment method (ONLINE/COD)
 * - For COD: Provider enters collected amount
 * - Different actions based on status
 */

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

    // COD completion modal
    const [codModal, setCodModal] = useState(false)
    const [selectedJob, setSelectedJob] = useState<any>(null)
    const [codAmount, setCodAmount] = useState('')
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
        // If completing COD job, show modal
        if (action === 'complete' && job?.paymentMethod === 'COD') {
            setSelectedJob(job)
            setCodAmount(job.totalAmount.toString())
            setCodModal(true)
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

    const handleCodComplete = async () => {
        if (!selectedJob || !codAmount) return

        setCompleting(true)
        try {
            const res = await apiFetch(`/api/provider/jobs/${selectedJob.id}/status`, {
                method: 'POST',
                body: JSON.stringify({ 
                    action: 'complete',
                    codAmountCollected: parseFloat(codAmount)
                })
            })
            const data = await res.json()

            if (data.success) {
                toast.success(data.message)
                setCodModal(false)
                setSelectedJob(null)
                setCodAmount('')
                fetchJobs()
            } else toast.error(data.error)
        } catch (error) {
            console.error("COD complete error:", error)
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

            {/* COD Completion Modal */}
            <Dialog open={codModal} onOpenChange={setCodModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <IndianRupee className="h-5 w-5" />
                            Confirm COD Collection
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
                                value={codAmount}
                                onChange={(e) => setCodAmount(e.target.value)}
                                placeholder="Enter amount"
                            />
                            <p className="text-xs text-muted-foreground">
                                Enter the exact amount you collected from the customer
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="outline" onClick={() => setCodModal(false)} className="flex-1">
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleCodComplete} 
                            disabled={completing || !codAmount}
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