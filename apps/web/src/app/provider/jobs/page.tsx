"use client"

import { useEffect, useState } from "react"
import { JobCard } from "@/components/provider/JobCard"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { apiFetch } from "@/lib/api-client"
import { toast } from "sonner"

export default function ProviderJobsPage() {
    const [jobs, setJobs] = useState<any[]>([])
    const [status, setStatus] = useState("ALL")
    const [loading, setLoading] = useState(true)

    const fetchJobs = async () => {
        setLoading(true)
        try {
            // ✅ FIX: Response object milega
            const res = await apiFetch(`/api/provider/jobs?status=${status}`)
            // ✅ FIX: Parse karo
            const data = await res.json()

            if (data.success) setJobs(data.data)
            else toast.error(data.error)
        } catch (error) {
            console.error("Jobs fetch error:", error)
            toast.error("Failed to fetch jobs")
        }
        finally { setLoading(false) }
    }

    useEffect(() => { fetchJobs() }, [status])

    const handleAction = async (id: string, action: string) => {
        try {
            // ✅ FIX: Response object milega
            const res = await apiFetch(`/api/provider/jobs/${id}/status`, {
                method: 'POST',
                body: JSON.stringify({ action })
            })
            // ✅ FIX: Parse karo
            const data = await res.json()

            if (data.success) {
                toast.success(`Job ${action}ed successfully!`)
                fetchJobs()
            } else toast.error(data.error)
        } catch (error) {
            console.error("Job action error:", error)
            toast.error("Action failed")
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
                        <SelectItem value="SERVICE_STARTED">In Progress</SelectItem>
                        <SelectItem value="SERVICE_COMPLETED">Completed</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {loading ? (
                <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
            ) : jobs.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">No jobs found.</div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2">
                    {jobs.map((job) => (
                        <JobCard key={job.id} job={job} onAction={handleAction} />
                    ))}
                </div>
            )}
        </div>
    )
}