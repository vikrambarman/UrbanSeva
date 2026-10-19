// apps/web/src/app/ops/categories/[id]/page.tsx
/**
 * WHAT: OPS Category Detail Page - View Only + GST Management
 * WHY: OPS can view category details and manage GST settings only
 * NOTE: Cannot edit category name, image, etc. - GST only
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { 
  ArrowLeft, 
  Loader2, 
  Tag,
  FolderOpen,
  AlertCircle,
  Wrench,
  CheckCircle2
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/authStore'
import Link from 'next/link'
import { apiFetch } from '@/lib/api-client'

interface Category {
  id: string
  name: string
  slug: string
  image: string | null
  icon: string | null
  description: string | null
  isActive: boolean
  gstEnabled: boolean
  gstPercentage: number
  sortOrder: number
  createdAt: string
  subCategories: {
    id: string
    name: string
    slug: string
    services: { id: string; name: string }[]
  }[]
}

export default function OpsCategoryDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { token } = useAuthStore()
  
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [category, setCategory] = useState<Category | null>(null)

  useEffect(() => {
    fetchCategory()
  }, [params.id])

  const fetchCategory = async () => {
    if (!token) return

    try {
      const response = await apiFetch(`/api/admin/categories/${params.id}`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-store'
        },
      })

      const data = await response.json()

      if (data.success) {
        setCategory(data.data)
      } else {
        toast.error('Category not found')
        router.push('/ops/categories')
      }
    } catch (error) {
      console.error('Fetch category error:', error)
      toast.error('Failed to fetch category')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleGST = async (enabled: boolean) => {
    if (!token || !category) return
    setUpdating(true)

    try {
      const response = await apiFetch(`/api/admin/categories/${category.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ gstEnabled: enabled }),
      })

      const data = await response.json()

      if (data.success) {
        setCategory({ ...category, gstEnabled: enabled })
        toast.success(`GST ${enabled ? 'enabled' : 'disabled'} successfully`)
      } else {
        toast.error(data.error || 'Failed to update GST')
      }
    } catch (error) {
      console.error('Toggle GST error:', error)
      toast.error('Failed to update GST')
    } finally {
      setUpdating(false)
    }
  }

  const handleUpdatePercentage = async (percentage: number) => {
    if (!token || !category) return
    setUpdating(true)

    try {
      const response = await apiFetch(`/api/admin/categories/${category.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ gstPercentage: percentage }),
      })

      const data = await response.json()

      if (data.success) {
        setCategory({ ...category, gstPercentage: percentage })
        toast.success(`GST rate updated to ${percentage}%`)
      } else {
        toast.error(data.error || 'Failed to update GST rate')
      }
    } catch (error) {
      console.error('Update percentage error:', error)
      toast.error('Failed to update GST rate')
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!category) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Category not found</p>
        <Button onClick={() => router.push('/ops/categories')} className="mt-4">
          Back to Categories
        </Button>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon">
          <Link href="/ops/categories">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Category Details</h1>
          <p className="text-muted-foreground">View details and manage GST settings</p>
        </div>
      </div>

      {/* Info Banner */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="flex items-start gap-3 p-4">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">OPS Access - View Only</p>
            <p>
              You can view category details and manage GST settings. 
              To edit category name, image, or other details, contact Admin.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Category Details Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-primary" />
              Category Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Image */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                {category.image ? (
                  <img 
                    src={category.image} 
                    alt={category.name}
                    className="w-full h-full rounded-xl object-cover"
                  />
                ) : (
                  <FolderOpen className="w-8 h-8 text-primary" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-lg">{category.name}</h3>
                <p className="text-sm text-muted-foreground">/{category.slug}</p>
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span className="text-sm font-medium">Status</span>
              <Badge variant={category.isActive ? 'default' : 'secondary'}>
                {category.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>

            {/* Description */}
            {category.description && (
              <div className="p-3 border rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Description</p>
                <p className="text-sm">{category.description}</p>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 border rounded-lg">
                <p className="text-xs text-muted-foreground">Subcategories</p>
                <p className="text-lg font-bold">{category.subCategories?.length || 0}</p>
              </div>
              <div className="p-3 border rounded-lg">
                <p className="text-xs text-muted-foreground">Total Services</p>
                <p className="text-lg font-bold">
                  {category.subCategories?.reduce((acc, sc) => acc + (sc.services?.length || 0), 0) || 0}
                </p>
              </div>
            </div>

            {/* Created Date */}
            <div className="text-xs text-muted-foreground">
              Created: {new Date(category.createdAt).toLocaleDateString('en-IN')}
            </div>
          </CardContent>
        </Card>

        {/* GST Settings Card */}
        <Card className="border-primary/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="w-5 h-5 text-primary" />
              GST Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* GST Toggle */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Tag className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Enable GST</p>
                  <p className="text-sm text-muted-foreground">
                    Apply GST to all services in this category
                  </p>
                </div>
              </div>
              <Switch
                checked={category.gstEnabled}
                onCheckedChange={handleToggleGST}
                disabled={updating}
              />
            </div>

            {/* GST Percentage */}
            {category.gstEnabled ? (
              <div className="p-4 border rounded-lg bg-primary/5">
                <Label htmlFor="gstPercentage">GST Rate (%)</Label>
                <select
                  id="gstPercentage"
                  value={category.gstPercentage}
                  onChange={(e) => handleUpdatePercentage(Number(e.target.value))}
                  disabled={updating}
                  className="mt-2 w-full px-3 py-2 border rounded-lg text-sm font-medium bg-background"
                >
                  <option value={5}>5%</option>
                  <option value={12}>12%</option>
                  <option value={18}>18%</option>
                  <option value={28}>28%</option>
                </select>
                <div className="flex items-center gap-2 mt-3 text-sm text-green-700">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>GST is active at {category.gstPercentage}%</span>
                </div>
              </div>
            ) : (
              <div className="p-4 border rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <AlertCircle className="w-4 h-4" />
                  <span>GST is currently disabled for this category</span>
                </div>
              </div>
            )}

            {/* Info */}
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs text-amber-800">
                <strong>Note:</strong> GST is calculated as inclusive pricing. 
                Customer sees final price with GST already included.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subcategories & Services */}
      {category.subCategories && category.subCategories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="w-5 h-5 text-primary" />
              Services in this Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {category.subCategories.map((subCat) => (
                <div key={subCat.id} className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-3">{subCat.name}</h4>
                  {subCat.services.length > 0 ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {subCat.services.map((service) => (
                        <div 
                          key={service.id}
                          className="flex items-center gap-2 p-2 bg-muted/50 rounded text-sm"
                        >
                          <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                          <span className="truncate">{service.name}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No services in this subcategory</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Back Button */}
      <div className="flex justify-end">
        <Button onClick={() => router.push('/ops/categories')} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Categories
        </Button>
      </div>
    </div>
  )
}