"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { IndianRupee, TrendingUp } from "lucide-react"

interface SalesChartProps {
    data: { date: string; revenue: number; bookings: number }[]
    summary: { totalRevenue: number; totalBookings: number; avgOrderValue: number }
}

export function SalesChart({ data, summary }: SalesChartProps) {
    const maxRevenue = Math.max(...data.map(d => d.revenue), 1)

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    Revenue Trend
                </CardTitle>
            </CardHeader>
            <CardContent>
                {/* Summary Cards */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="text-center p-3 bg-muted rounded-lg">
                        <p className="text-xs text-muted-foreground">Total Revenue</p>
                        <p className="text-xl font-bold text-green-600">₹{summary.totalRevenue.toLocaleString()}</p>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                        <p className="text-xs text-muted-foreground">Total Bookings</p>
                        <p className="text-xl font-bold">{summary.totalBookings}</p>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                        <p className="text-xs text-muted-foreground">Avg Order Value</p>
                        <p className="text-xl font-bold">₹{summary.avgOrderValue}</p>
                    </div>
                </div>

                {/* Simple Bar Chart */}
                <div className="flex items-end gap-1 h-48 border-b border-l pl-2 pb-2">
                    {data.map((d, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                            <div
                                className="w-full bg-primary/80 rounded-t-sm hover:bg-primary transition-colors cursor-pointer min-h-[2px]"
                                style={{ height: `${(d.revenue / maxRevenue) * 100}%` }}
                                title={`${d.date}: ₹${d.revenue}`}
                            />
                            {/* Tooltip */}
                            <div className="absolute bottom-full mb-2 hidden group-hover:block bg-popover border rounded-md p-2 text-xs whitespace-nowrap z-10 shadow-md">
                                <p className="font-medium">{d.date}</p>
                                <p>Revenue: ₹{d.revenue.toLocaleString()}</p>
                                <p>Bookings: {d.bookings}</p>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                    <span>{data[0]?.date}</span>
                    <span>{data[data.length - 1]?.date}</span>
                </div>
            </CardContent>
        </Card>
    )
}