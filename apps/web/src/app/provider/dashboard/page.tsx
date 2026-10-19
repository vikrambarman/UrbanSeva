// apps/web/src/app/provider/dashboard/page.tsx

"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
    Briefcase, IndianRupee, Star, Calendar, TrendingUp, 
    ArrowRight, Wallet, User, AlertCircle 
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"
import { apiFetch } from "@/lib/api-client"
import Link from "next/link"

export default function ProviderDashboardPage() {
    const router = useRouter()
    const [stats, setStats] = useState<any>(null)
    const [recentJobs, setRecentJobs] = useState<any[]>([])
    const [providerInfo, setProviderInfo] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    useEffect(() => {
        const token = localStorage.getItem('token')
        const userData = localStorage.getItem('user')

        if (!token || !userData) {
            toast.error("Please login to continue")
            router.push('/provider-login')
            return
        }

        try {
            const parsedUser = JSON.parse(userData)
            if (parsedUser.role !== 'PROVIDER') {
                toast.error("Unauthorized access")
                localStorage.removeItem('token')
                localStorage.removeItem('user')
                router.push('/provider-login')
                return
            }

            setProviderInfo(parsedUser)
            fetchDashboard()
        } catch (error) {
            console.error('Auth error:', error)
            toast.error("Authentication failed")
            router.push('/provider-login')
        }
    }, [router])

    const fetchDashboard = async () => {
        try {
            const [earningsRes, jobsRes] = await Promise.all([
                apiFetch('/api/provider/earnings?period=month'),
                apiFetch('/api/provider/jobs?status=ALL')
            ])

            if (earningsRes.status === 401 || jobsRes.status === 401) {
                toast.error("Session expired. Please login again.")
                localStorage.removeItem('token')
                localStorage.removeItem('user')
                router.push('/provider-login')
                return
            }

            const earningsData = await earningsRes.json()
            const jobsData = await jobsRes.json()

            if (earningsData.success) setStats(earningsData.data.stats)
            else setError(earningsData.error || "Failed to load earnings data")

            if (jobsData.success) setRecentJobs(jobsData.data.slice(0, 5))
        } catch (error) { 
            console.error("Dashboard fetch error:", error)
            setError("Failed to load dashboard data")
            toast.error("Failed to load dashboard") 
        } finally { setLoading(false) }
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center h-96">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
            </div>
        )
    }

    return (
        <div className="p-6 space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Welcome back, {providerInfo?.name || 'Provider'}!</h1>
                <p className="text-muted-foreground">Here's your performance overview for this month.</p>
            </div>

            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">This Month Earnings</CardTitle>
                        <IndianRupee className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{(stats?.totalNet || 0).toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">{stats?.totalJobs || 0} jobs completed</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
                        <Briefcase className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {recentJobs.filter(j => ['CONFIRMED', 'SERVICE_STARTED', 'PROVIDER_TRAVELLING'].includes(j.status)).length}
                        </div>
                        <p className="text-xs text-muted-foreground">In progress</p>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Jobs */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Recent Jobs</CardTitle>
                        <p className="text-sm text-muted-foreground">Your latest service bookings.</p>
                    </div>
                    <Button asChild variant="outline" size="sm">
                        <Link href="/provider/jobs">View All <ArrowRight className="ml-2 h-4 w-4" /></Link>
                    </Button>
                </CardHeader>
                <CardContent>
                    {recentJobs.length > 0 ? (
                        <div className="space-y-3">
                            {recentJobs.map((job) => (
                                <Link key={job.id} href={`/provider/jobs/${job.id}`} className="block hover:bg-muted/50 transition-colors rounded-lg">
                                    <div className="flex items-center justify-between p-3 border rounded-md">
                                        <div className="flex items-center gap-3">
                                            <div>
                                                <p className="font-medium">{job.service.name}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {job.user.name} • {new Date(job.scheduledDate).toLocaleDateString('en-IN')}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="text-right">
                                                <p className="font-bold">₹{job.totalAmount}</p>
                                                <Badge variant={job.paymentMethod === 'POD' ? 'secondary' : 'outline'} className="text-[10px]">
                                                    {job.paymentMethod}
                                                </Badge>
                                            </div>
                                            <Badge variant={job.status === 'SERVICE_COMPLETED' ? 'default' : 'secondary'}>
                                                {job.status.replace(/_/g, ' ')}
                                            </Badge>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-muted-foreground">No jobs yet.</div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}