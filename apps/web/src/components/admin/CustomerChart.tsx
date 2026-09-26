"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, UserPlus, Repeat } from "lucide-react"

interface CustomerChartProps {
    data: {
        newUsers: number
        activeUsers: number
        tierDistribution: { tier: string; count: number }[]
        retention: { repeat: number; new: number; retentionRate: number }
    }
}

export function CustomerChart({ data }: CustomerChartProps) {
    const totalTierUsers = data.tierDistribution.reduce((sum, t) => sum + t.count, 0) || 1

    const tierColors: Record<string, string> = {
        BRONZE: 'bg-amber-700',
        SILVER: 'bg-gray-400',
        GOLD: 'bg-yellow-500',
        PLATINUM: 'bg-purple-500',
    }

    return (
        <div className="grid gap-6 md:grid-cols-2">
            {/* Customer Stats */}
            <Card>
                <CardHeader>
                    <CardTitle>Customer Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-muted rounded-lg text-center">
                            <UserPlus className="h-5 w-5 mx-auto mb-1 text-blue-600" />
                            <p className="text-2xl font-bold">{data.newUsers}</p>
                            <p className="text-xs text-muted-foreground">New Users</p>
                        </div>
                        <div className="p-3 bg-muted rounded-lg text-center">
                            <Users className="h-5 w-5 mx-auto mb-1 text-green-600" />
                            <p className="text-2xl font-bold">{data.activeUsers}</p>
                            <p className="text-xs text-muted-foreground">Active Users</p>
                        </div>
                    </div>

                    <div className="p-3 bg-muted rounded-lg text-center">
                        <Repeat className="h-5 w-5 mx-auto mb-1 text-purple-600" />
                        <p className="text-2xl font-bold">{data.retention.retentionRate}%</p>
                        <p className="text-xs text-muted-foreground">Retention Rate</p>
                        <p className="text-xs text-muted-foreground mt-1">
                            {data.retention.repeat} repeat • {data.retention.new} new
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Loyalty Tier Distribution */}
            <Card>
                <CardHeader>
                    <CardTitle>Loyalty Tier Distribution</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {data.tierDistribution.map((tier) => (
                        <div key={tier.tier} className="space-y-1">
                            <div className="flex justify-between text-sm">
                                <span className="font-medium">{tier.tier}</span>
                                <span className="text-muted-foreground">
                                    {tier.count} ({Math.round((tier.count / totalTierUsers) * 100)}%)
                                </span>
                            </div>
                            <div className="h-3 bg-muted rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all ${tierColors[tier.tier] || 'bg-primary'}`}
                                    style={{ width: `${(tier.count / totalTierUsers) * 100}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    )
}