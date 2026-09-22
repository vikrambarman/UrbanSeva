import { db } from '@/lib/db'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Briefcase, Star, TrendingUp, Calendar } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Provider Dashboard | ServiceApp',
}

// NOTE: Ye page authentication ke baad properly kaam karega
// Abhi ke liye placeholder hai

export default async function ProviderDashboardPage() {
  // TODO: Authentication ke baad providerId session se lenge
  // const providerId = session?.user?.providerId

  // Temporary: Show message
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 md:py-8">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold">Provider Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome to your service provider dashboard
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
              <Briefcase className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Jobs completed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Rating</CardTitle>
              <Star className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">N/A</div>
              <p className="text-xs text-muted-foreground">Average rating</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Earnings</CardTitle>
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹0</div>
              <p className="text-xs text-muted-foreground">Total earnings</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
              <Calendar className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Scheduled jobs</p>
            </CardContent>
          </Card>
        </div>

        {/* My Assigned Services */}
        <Card>
          <CardHeader>
            <CardTitle>My Assigned Services</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔧</div>
              <h3 className="text-lg font-semibold mb-2">No services assigned yet</h3>
              <p className="text-muted-foreground">
                Authentication ke baad aapko services assign ki jayengi
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Info Banner */}
        <div className="mt-6 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 p-4">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Note:</strong> Ye dashboard Phase 9 mein fully functional hoga with authentication. 
            Abhi ye placeholder hai structure dikhane ke liye.
          </p>
        </div>
      </div>
    </div>
  )
}