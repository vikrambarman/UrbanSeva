"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star } from "lucide-react"

interface ServiceChartProps {
    topServices: any[]
    categoryData: { name: string; bookings: number }[]
}

export function ServiceChart({ topServices, categoryData }: ServiceChartProps) {
    const maxBookings = Math.max(...categoryData.map(c => c.bookings), 1)

    return (
        <div className="grid gap-6 md:grid-cols-2">
            {/* Top Services */}
            <Card>
                <CardHeader>
                    <CardTitle>Top Services</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {topServices.map((service, i) => (
                            <div key={service.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted">
                                <span className="text-sm font-bold text-muted-foreground w-6">#{i + 1}</span>
                                {service.image && (
                                    <img src={service.image} alt="" className="w-10 h-10 rounded object-cover" />
                                )}
                                <div className="flex-1">
                                    <p className="font-medium text-sm">{service.name}</p>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <span>{service._count.bookings} bookings</span>
                                        <span>•</span>
                                        <span className="flex items-center gap-0.5">
                                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                            {service.avgRating.toFixed(1)}
                                        </span>
                                    </div>
                                </div>
                                <span className="font-bold text-sm">₹{service.basePrice}</span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Category Distribution */}
            <Card>
                <CardHeader>
                    <CardTitle>Category Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {categoryData.map((cat) => (
                            <div key={cat.name} className="space-y-1">
                                <div className="flex justify-between text-sm">
                                    <span className="font-medium">{cat.name}</span>
                                    <span className="text-muted-foreground">{cat.bookings} bookings</span>
                                </div>
                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-primary rounded-full transition-all"
                                        style={{ width: `${(cat.bookings / maxBookings) * 100}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}