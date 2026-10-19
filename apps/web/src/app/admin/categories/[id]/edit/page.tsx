// apps/web/src/app/admin/categories/[id]/edit/page.tsx
/**
 * WHAT: Admin Category Edit Page
 * WHY: Admin can edit category details including GST settings
 * NOTE: Full edit access for admin, GST-only for OPS
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, 
  Loader2, 
  Save, 
  FolderOpen,
  Tag,
  AlertCircle
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/authStore'
import Link from 'next/link'

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
}

export default function EditCategoryPage() {
  const router = useRouter()
  const params = useParams()
  const { token } = useAuthStore()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [category, setCategory] = useState<Category | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    image: '',
    icon: '',
    description: '',
    isActive: true,
    gstEnabled: false,
    gstPercentage: 18,
    sortOrder: 0
  })

  useEffect(() => {
    fetchCategory()
  }, [params.id])

  const fetchCategory = async () => {
    if (!token) return

    try {
      const response = await fetch(`/api/admin/categories/${params.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      const data = await response.json()

      if (data.success) {
        setCategory(data.data)
        setFormData({
          name: data.data.name || '',
          slug: data.data.slug || '',
          image: data.data.image || '',
          icon: data.data.icon || '',
          description: data.data.description || '',
          isActive: data.data.isActive ?? true,
          gstEnabled: data.data.gstEnabled ?? false,
          gstPercentage: data.data.gstPercentage ?? 18,
          sortOrder: data.data.sortOrder ?? 0
        })
      } else {
        toast.error('Category not found')
        router.push('/admin/categories')
      }
    } catch (error) {
      console.error('Fetch category error:', error)
      toast.error('Failed to fetch category')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!token || !formData.name.trim()) {
      toast.error('Category name is required')
      return
    }

    setSaving(true)
    try {
      const response = await fetch(`/api/admin/categories/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Category updated successfully')
        router.push('/admin/categories')
      } else {
        toast.error(data.error || 'Failed to update category')
      }
    } catch (error) {
      console.error('Update category error:', error)
      toast.error('Failed to update category')
    } finally {
      setSaving(false)
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
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Category not found</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon">
          <Link href="/admin/categories">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Category</h1>
          <p className="text-muted-foreground">Update category details and GST settings</p>
        </div>
      </div>

      {/* Info Banner */}
      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="flex items-start gap-3 p-4">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800">
            <p className="font-semibold mb-1">GST Configuration</p>
            <p>
              Enable GST for categories where tax is applicable. 
              Customer will see inclusive pricing (no extra GST added at checkout).
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Edit Form */}
      <Card>
        <CardHeader>
          <CardTitle>Category Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Name & Slug */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Category Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Home Cleaning"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug (URL)</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="e.g., home-cleaning"
              />
            </div>
          </div>

          {/* Image & Icon */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="image">Image URL</Label>
              <Input
                id="image"
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="icon">Icon (Emoji)</Label>
              <Input
                id="icon"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                placeholder="e.g., "
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description about this category..."
              rows={3}
            />
          </div>

          {/* Sort Order & Status */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sortOrder">Sort Order</Label>
              <Input
                id="sortOrder"
                type="number"
                value={formData.sortOrder}
                onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) })}
                min="0"
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <div className="flex items-center gap-3 pt-2">
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
                <Badge variant={formData.isActive ? 'default' : 'secondary'}>
                  {formData.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Tag className="w-5 h-5 text-primary" />
              GST Settings
            </h3>

            {/* GST Toggle */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Tag className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Enable GST</p>
                  <p className="text-sm text-muted-foreground">
                    Apply GST to all services in this category
                  </p>
                </div>
              </div>
              <Switch
                checked={formData.gstEnabled}
                onCheckedChange={(checked) => setFormData({ ...formData, gstEnabled: checked })}
              />
            </div>

            {/* GST Percentage */}
            {formData.gstEnabled && (
              <div className="mt-4 p-4 border rounded-lg bg-primary/5">
                <Label htmlFor="gstPercentage">GST Rate (%)</Label>
                <select
                  id="gstPercentage"
                  value={formData.gstPercentage}
                  onChange={(e) => setFormData({ ...formData, gstPercentage: Number(e.target.value) })}
                  className="mt-2 w-full md:w-48 px-3 py-2 border rounded-lg text-sm font-medium bg-background"
                >
                  <option value={5}>5%</option>
                  <option value={12}>12%</option>
                  <option value={18}>18%</option>
                  <option value={28}>28%</option>
                </select>
                <p className="text-xs text-muted-foreground mt-2">
                  This rate will be applied to all services under this category
                </p>
              </div>
            )}
          </div>

          {/* Save Button */}
          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}