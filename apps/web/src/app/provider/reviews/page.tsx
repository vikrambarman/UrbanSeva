"use client"

import { useEffect, useState } from "react"
import { ReviewCard } from "@/components/provider/ReviewCard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Star, MessageSquare, TrendingUp } from "lucide-react"
import { toast } from "sonner"
import { apiFetch } from "@/lib/api-client"

export default function ProviderReviewsPage() {
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    const fetchReviews = async () => {
    try {
        // ✅ FIX: Response object milega
        const res = await apiFetch('/api/provider/reviews')
        // ✅ FIX: Parse karo
        const data = await res.json()
        
        if (data.success) setData(data.data)
        else toast.error(data.error)
    } catch (error) { 
        console.error("Reviews fetch error:", error)
        toast.error("Failed to fetch reviews") 
    }
    finally { setLoading(false) }
}

    useEffect(() => { fetchReviews() }, [])

    if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">My Reviews</h1>
                <p className="text-muted-foreground">See what customers say about your services.</p>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
                        <Star className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold flex items-center gap-2">
                            {data?.stats?.avgRating || 0}
                            <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                        </div>
                        <p className="text-xs text-muted-foreground">{data?.stats?.totalReviews || 0} total reviews</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">5-Star Reviews</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">
                            {data?.stats?.ratingBreakdown?.[0]?.count || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {data?.stats?.ratingBreakdown?.[0]?.percentage?.toFixed(0) || 0}% of total
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Replied</CardTitle>
                        <MessageSquare className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">
                            {data?.reviews?.filter((r: any) => r.providerReply).length || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">out of {data?.stats?.totalReviews || 0} reviews</p>
                    </CardContent>
                </Card>
            </div>

            {/* Rating Breakdown Bar */}
            {data?.stats?.ratingBreakdown && (
                <Card>
                    <CardHeader><CardTitle>Rating Breakdown</CardTitle></CardHeader>
                    <CardContent className="space-y-2">
                        {data.stats.ratingBreakdown.map((item: any) => (
                            <div key={item.star} className="flex items-center gap-3">
                                <span className="text-sm font-medium w-8">{item.star} ★</span>
                                <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-yellow-400 rounded-full transition-all"
                                        style={{ width: `${item.percentage}%` }}
                                    />
                                </div>
                                <span className="text-sm text-muted-foreground w-12 text-right">{item.count}</span>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            {/* Reviews List */}
            <div className="space-y-4">
                <h2 className="text-xl font-semibold">All Reviews</h2>
                {data?.reviews?.length > 0 ? (
                    data.reviews.map((review: any) => (
                        <ReviewCard key={review.id} review={review} onReplySubmit={fetchReviews} />
                    ))
                ) : (
                    <Card>
                        <CardContent className="py-12 text-center text-muted-foreground">
                            No reviews yet. Complete more jobs to receive reviews!
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}