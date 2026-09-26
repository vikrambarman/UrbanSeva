// app/provider/dashboard/page.tsx

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
        // Check authentication
        const token = localStorage.getItem('token')
        const userData = localStorage.getItem('user')

        if (!token || !userData) {
            toast.error("Please login to continue")
            router.push('/provider-login')
            return
        }

        try {
            const parsedUser = JSON.parse(userData)
            
            // Check if user is a provider
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

            // Check for 401 (session expired)
            if (!earningsRes || !jobsRes) {
                throw new Error('Network error')
            }

            if (earningsRes.status === 401 || jobsRes.status === 401) {
                toast.error("Session expired. Please login again.")
                localStorage.removeItem('token')
                localStorage.removeItem('user')
                router.push('/provider-login')
                return
            }

            const earningsData = await earningsRes.json()
            const jobsData = await jobsRes.json()

            if (earningsData.success) {
                setStats(earningsData.data.stats)
            } else {
                setError(earningsData.error || "Failed to load earnings data")
            }

            if (jobsData.success) {
                setRecentJobs(jobsData.data.slice(0, 5))
            } else {
                console.error('Jobs error:', jobsData.error)
            }
        } catch (error) { 
            console.error("Dashboard fetch error:", error)
            setError("Failed to load dashboard data")
            toast.error("Failed to load dashboard") 
        } finally { 
            setLoading(false) 
        }
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
            {/* Welcome Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">
                    Welcome back, {providerInfo?.name || 'Provider'}!
                </h1>
                <p className="text-muted-foreground">
                    Here's your performance overview for this month.
                </p>
            </div>

            {/* Error Alert */}
            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Provider Status Banner */}
            {providerInfo && (
                <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                                    <User className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <p className="font-medium">Account Status</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Badge variant="default">
                                            {providerInfo.provider?.status || 'APPROVED'}
                                        </Badge>
                                        <Badge variant={providerInfo.provider?.isAvailable ? 'default' : 'secondary'}>
                                            {providerInfo.provider?.isAvailable ? 'Available' : 'Unavailable'}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-muted-foreground">Commission Rate</p>
                                <p className="text-2xl font-bold">{providerInfo.provider?.commissionRate || 15}%</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
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
                        <CardTitle className="text-sm font-medium">Pending Payout</CardTitle>
                        <Wallet className="h-4 w-4 text-yellow-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{(stats?.pendingPayout || 0).toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">Available to withdraw</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
                        <Briefcase className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {recentJobs.filter(j => ['CONFIRMED', 'SERVICE_STARTED'].includes(j.status)).length}
                        </div>
                        <p className="text-xs text-muted-foreground">In progress</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Upcoming Jobs</CardTitle>
                        <Calendar className="h-4 w-4 text-purple-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {recentJobs.filter(j => j.status === 'PROVIDER_ASSIGNED').length}
                        </div>
                        <p className="text-xs text-muted-foreground">Awaiting confirmation</p>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Stats */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Star className="h-4 w-4 text-yellow-500" />
                            Average Rating
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold flex items-center gap-2">
                            {providerInfo?.provider?.avgRating?.toFixed(1) || '0.0'}
                            <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Briefcase className="h-4 w-4 text-blue-500" />
                            Total Jobs
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">
                            {providerInfo?.provider?.totalJobs || 0}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-green-500" />
                            Lifetime Earnings
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">
                            ₹{(providerInfo?.provider?.totalEarnings || 0).toLocaleString()}
                        </div>
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
                        <Link href="/provider/jobs">
                            View All <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </CardHeader>
                <CardContent>
                    {recentJobs.length > 0 ? (
                        <div className="space-y-3">
                            {recentJobs.map((job) => (
                                <Link 
                                    key={job.id} 
                                    href={`/provider/jobs/${job.id}`}
                                    className="block hover:bg-muted/50 transition-colors rounded-lg"
                                >
                                    <div className="flex items-center justify-between p-3 border rounded-md">
                                        <div className="flex items-center gap-3">
                                            {job.service.image && (
                                                <img 
                                                    src={job.service.image} 
                                                    alt={job.service.name} 
                                                    className="w-12 h-12 rounded object-cover" 
                                                />
                                            )}
                                            <div>
                                                <p className="font-medium">{job.service.name}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {job.user.name} • {new Date(job.scheduledDate).toLocaleDateString('en-IN')}
                                                </p>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    Booking #{job.bookingNumber}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="text-right">
                                                <p className="font-bold">₹{job.totalAmount}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {new Date(job.scheduledDate).toLocaleTimeString('en-IN', { 
                                                        hour: '2-digit', 
                                                        minute: '2-digit' 
                                                    })}
                                                </p>
                                            </div>
                                            <Badge variant={
                                                job.status === 'SERVICE_COMPLETED' ? 'default' :
                                                job.status === 'CANCELLED' ? 'destructive' : 'secondary'
                                            }>
                                                {job.status.replace(/_/g, ' ')}
                                            </Badge>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <Briefcase className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                            <p className="text-muted-foreground">No jobs yet.</p>
                            <p className="text-sm text-muted-foreground">Jobs will appear here once assigned.</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push('/provider/profile')}>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                                <User className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="font-medium">Update Profile</p>
                                <p className="text-sm text-muted-foreground">Edit your information</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push('/provider/earnings')}>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                                <Wallet className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                                <p className="font-medium">View Earnings</p>
                                <p className="text-sm text-muted-foreground">Check your income</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}