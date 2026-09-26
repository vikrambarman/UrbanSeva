"use client"

import { useEffect, useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SalesChart } from "@/components/admin/SalesChart"
import { ServiceChart } from "@/components/admin/ServiceChart"
import { CustomerChart } from "@/components/admin/CustomerChart"
import { toast } from "sonner"
import { apiFetch } from "@/lib/api-client"

export default function AdminAnalyticsPage() {
    const [salesData, setSalesData] = useState<any>(null)
    const [serviceData, setServiceData] = useState<any>(null)
    const [customerData, setCustomerData] = useState<any>(null)
    const [period, setPeriod] = useState("30")
    const [loading, setLoading] = useState(true)

    const fetchAll = async () => {
        setLoading(true)
        try {
            const [salesRes, servicesRes, customersRes] = await Promise.all([
                apiFetch(`/api/admin/analytics/sales?period=${period}`),
                apiFetch('/api/admin/analytics/services'),
                apiFetch(`/api/admin/analytics/customers?period=${period}`),
            ])
            
            // ✅ FIX: Ab .json() call karna hoga
            const sales = await salesRes.json()
            const services = await servicesRes.json()
            const customers = await customersRes.json()
            
            if (sales.success) setSalesData(sales.data)
            if (services.success) setServiceData(services.data)
            if (customers.success) setCustomerData(customers.data)
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
            </Tabs>
        </div>
    )
}