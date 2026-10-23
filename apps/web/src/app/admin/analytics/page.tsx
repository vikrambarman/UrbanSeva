"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SalesChart } from "@/components/admin/SalesChart"
import { ServiceChart } from "@/components/admin/ServiceChart"
import { CustomerChart } from "@/components/admin/CustomerChart"
import { IndianRupee, TrendingUp, Wallet } from "lucide-react"
import { toast } from "sonner"
import { apiFetch } from "@/lib/api-client"

export default function AdminAnalyticsPage() {
    const [salesData, setSalesData] = useState<any>(null)
    const [serviceData, setServiceData] = useState<any>(null)
    const [customerData, setCustomerData] = useState<any>(null)
    
    // NEW: Financials State
    const [financeData, setFinanceData] = useState<any>(null)
    const [gstData, setGstData] = useState<any>(null)
    
    const [period, setPeriod] = useState("30")
    const [loading, setLoading] = useState(true)

    const fetchAll = async () => {
        setLoading(true)
        try {
            const [salesRes, servicesRes, customersRes, financeRes, gstRes] = await Promise.all([
                apiFetch(`/api/admin/analytics/sales?period=${period}`),
                apiFetch('/api/admin/analytics/services'),
                apiFetch(`/api/admin/analytics/customers?period=${period}`),
                apiFetch(`/api/admin/finance/stats?period=${period}`, { cache: 'no-store' }),
                apiFetch(`/api/ops/gst/report?period=${period}`, { cache: 'no-store' })
            ])
            
            const sales = await salesRes.json()
            const services = await servicesRes.json()
            const customers = await customersRes.json()
            const finance = await financeRes.json()
            const gst = await gstRes.json()
            
            if (sales.success) setSalesData(sales.data)
            if (services.success) setServiceData(services.data)
            if (customers.success) setCustomerData(customers.data)
            if (finance.success) setFinanceData(finance.data)
            if (gst.success) setGstData(gst.data)
        } catch (error) { 
            console.error("Analytics fetch error:", error)
            toast.error("Failed to load analytics") 
        }
        finally { setLoading(false) }
    }

    useEffect(() => { fetchAll() }, [period])

    if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Analytics & Reports</h1>
                    <p className="text-muted-foreground">Platform performance insights and trends.</p>
                </div>
                <Select value={period} onValueChange={setPeriod}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select Period" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="7">Last 7 Days</SelectItem>
                        <SelectItem value="30">Last 30 Days</SelectItem>
                        <SelectItem value="90">Last 90 Days</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <Tabs defaultValue="sales" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="sales">Sales</TabsTrigger>
                    <TabsTrigger value="services">Services</TabsTrigger>
                    <TabsTrigger value="customers">Customers</TabsTrigger>
                    <TabsTrigger value="financials">Financials</TabsTrigger>
                </TabsList>

                <TabsContent value="sales">
                    {salesData && (
                        <SalesChart data={salesData.chartData} summary={salesData.summary} />
                    )}
                </TabsContent>

                <TabsContent value="services">
                    {serviceData && (
                        <ServiceChart topServices={serviceData.topServices} categoryData={serviceData.categoryData} />
                    )}
                </TabsContent>

                <TabsContent value="customers">
                    {customerData && (
                        <CustomerChart data={customerData} />
                    )}
                </TabsContent>

                {/* NEW: Financials Tab */}
                <TabsContent value="financials" className="space-y-6">
                    {financeData && (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                                    <IndianRupee className="h-4 w-4 text-green-600" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">₹{financeData.totalRevenue.toLocaleString()}</div>
                                    <p className="text-xs text-muted-foreground">{financeData.totalBookings} paid bookings</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Platform Commission</CardTitle>
                                    <TrendingUp className="h-4 w-4 text-primary" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-primary">₹{financeData.platformCommission.toLocaleString()}</div>
                                    <p className="text-xs text-muted-foreground">Net platform earnings</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Provider Earnings</CardTitle>
                                    <IndianRupee className="h-4 w-4 text-blue-600" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-blue-600">₹{financeData.providerEarnings.toLocaleString()}</div>
                                    <p className="text-xs text-muted-foreground">Gross: ₹{financeData.grossEarnings.toLocaleString()}</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Pending Payouts</CardTitle>
                                    <Wallet className="h-4 w-4 text-amber-600" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-amber-600">₹{financeData.pendingPayouts.toLocaleString()}</div>
                                    <p className="text-xs text-muted-foreground">To be processed</p>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {gstData && gstData.summary && (
                        <Card>
                            <CardHeader>
                                <CardTitle>GST Collection Summary</CardTitle>
                                <p className="text-sm text-muted-foreground">Intra-state (CGST + SGST) breakdown</p>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="text-center p-4 bg-muted rounded-lg">
                                        <p className="text-xs text-muted-foreground">Total GST Collected</p>
                                        <p className="text-2xl font-bold text-primary">₹{gstData.summary.totalGST.toLocaleString()}</p>
                                    </div>
                                    <div className="text-center p-4 bg-muted rounded-lg">
                                        <p className="text-xs text-muted-foreground">CGST (Central)</p>
                                        <p className="text-2xl font-bold text-blue-600">₹{gstData.summary.totalCGST.toLocaleString()}</p>
                                    </div>
                                    <div className="text-center p-4 bg-muted rounded-lg">
                                        <p className="text-xs text-muted-foreground">SGST (State)</p>
                                        <p className="text-2xl font-bold text-green-600">₹{gstData.summary.totalSGST.toLocaleString()}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {salesData && (
                        <SalesChart data={salesData.chartData} summary={salesData.summary} />
                    )}
                </TabsContent>
            </Tabs>
        </div>
    )
}