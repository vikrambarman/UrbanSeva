"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Star, MessageSquare, Send } from "lucide-react"
import { toast } from "sonner"
import { apiFetch } from "@/lib/api-client"

interface ReviewCardProps {
    review: any
    onReplySubmit?: () => void
}

export function ReviewCard({ review, onReplySubmit }: ReviewCardProps) {
    const [showReply, setShowReply] = useState(false)
    const [replyText, setReplyText] = useState(review.providerReply || "")
    const [loading, setLoading] = useState(false)

    const handleReply = async () => {
    if (!replyText.trim()) return
    setLoading(true)
    try {
        // ✅ FIX: Response object milega
        const res = await apiFetch(`/api/provider/reviews/${review.id}/reply`, {
            method: 'POST',
            body: JSON.stringify({ reply: replyText })
        })
        // ✅ FIX: Parse karo
        const data = await res.json()

        if (data.success) {
            toast.success("Reply posted!")
            setShowReply(false)
            onReplySubmit?.()
        } else toast.error(data.error)
    } catch (error) { 
        console.error("Reply submit error:", error)
        toast.error("Failed to post reply") 
    }
    finally { setLoading(false) }
}

    return (
        <Card>
            <CardContent className="pt-6">
                <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-bold text-primary">
                                {review.user.name?.charAt(0) || 'C'}
                            </span>
                        </div>
                        <div>
                            <p className="font-medium">{review.user.name || 'Customer'}</p>
                            <p className="text-xs text-muted-foreground">
                                {review.service.name} • {new Date(review.createdAt).toLocaleDateString('en-IN')}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-bold">{review.overallRating}</span>
                    </div>
                </div>

                {/* Rating Breakdown */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                    {review.punctualityRating && (
                        <Badge variant="outline" className="text-xs">Punctuality: {review.punctualityRating}/5</Badge>
                    )}
                    {review.qualityRating && (
                        <Badge variant="outline" className="text-xs">Quality: {review.qualityRating}/5</Badge>
                    )}
                    {review.behaviourRating && (
                        <Badge variant="outline" className="text-xs">Behaviour: {review.behaviourRating}/5</Badge>
                    )}
                    {review.valueRating && (
                        <Badge variant="outline" className="text-xs">Value: {review.valueRating}/5</Badge>
                    )}
                </div>

                {/* Comment */}
                {review.comment && (
                    <p className="text-sm mb-3 text-muted-foreground">&quot;{review.comment}&quot;</p>
                )}

                {/* Photos */}
                {review.photos?.length > 0 && (
                    <div className="flex gap-2 mb-3">
                        {review.photos.map((photo: string, i: number) => (
                            <img key={i} src={photo} alt={`Review photo ${i + 1}`} className="w-16 h-16 rounded-md object-cover" />
                        ))}
                    </div>
                )}

                {/* Existing Reply */}
                {review.providerReply && !showReply && (
                    <div className="bg-muted p-3 rounded-md mt-3">
                        <div className="flex items-center gap-2 mb-1">
                            <MessageSquare className="h-3 w-3 text-primary" />
                            <span className="text-xs font-medium text-primary">Your Reply</span>
                        </div>
                        <p className="text-sm">{review.providerReply}</p>
                    </div>
                )}

                {/* Reply Form */}
                {showReply && (
                    <div className="mt-3 space-y-2">
                        <Textarea
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Write your reply..."
                            rows={3}
                        />
                        <div className="flex gap-2">
                            <Button size="sm" onClick={handleReply} disabled={loading}>
                                <Send className="h-3 w-3 mr-1" /> {loading ? 'Posting...' : 'Post Reply'}
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setShowReply(false)}>Cancel</Button>
                        </div>
                    </div>
                )}

                                {/* Reply Button */}
                {!showReply && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2"
                        onClick={() => setShowReply(true)}
                    >
                        <MessageSquare className="h-3 w-3 mr-1" />
                        {review.providerReply ? 'Edit Reply' : 'Reply to Review'}
                    </Button>
                )}
            </CardContent>
        </Card>
    )
}
        