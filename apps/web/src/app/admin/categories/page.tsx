// apps/web/src/app/admin/categories/page.tsx
/**
 * WHAT: Admin Category Management Page
 * WHY: Admin ko categories manage karne ke liye - especially GST settings
 * NOTE: GST enable/disable toggle + percentage dropdown
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { 
  Loader2, 
  Settings, 
  ChevronRight, 
  Tag,
  FolderOpen,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/authStore'

interface Category {
  id: string
  name: string
  slug: string
  image: string | null
  icon: string | null
  isActive: boolean
  gstEnabled: boolean
  gstPercentage: number
  subCategories: {
    id: string
    name: string
    services: { id: string }[]
  }[]
  _count?: {
    subCategories: number
  }
}

export default function CategoriesPage() {
  const router = useRouter()
  const { token } = useAuthStore()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    if (!token) return

    try {
      const response = await fetch('/api/admin/categories', {
        headers: { Authorization: `Bearer ${token}` },
      })

      const data = await response.json()

      if (data.success) {
        setCategories(data.data)
      } else {
        toast.error('Failed to fetch categories')
      }
    } catch (error) {
      console.error('Fetch categories error:', error)
      toast.error('Failed to fetch categories')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleGST = async (categoryId: string, enabled: boolean) => {
    if (!token) return
    setUpdatingId(categoryId)

    try {
      const response = await fetch(`/api/admin/categories/${categoryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ gstEnabled: enabled }),
      })

      const data = await response.json()

      if (data.success) {
        setCategories(prev =>
          prev.map(cat =>
            cat.id === categoryId ? { ...cat, gstEnabled: enabled } : cat
          )
        )
        toast.success(`GST ${enabled ? 'enabled' : 'disabled'} successfully`)
      } else {
        toast.error(data.error || 'Failed to update GST')
      }
    } catch (error) {
      console.error('Toggle GST error:', error)
      toast.error('Failed to update GST')
    } finally {
      setUpdatingId(null)
    }
  }

  const handleUpdatePercentage = async (categoryId: string, percentage: number) => {
    if (!token) return
    setUpdatingId(categoryId)

    try {
      const response = await fetch(`/api/admin/categories/${categoryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ gstPercentage: percentage }),
      })

      const data = await response.json()

      if (data.success) {
        setCategories(prev =>
          prev.map(cat =>
            cat.id === categoryId ? { ...cat, gstPercentage: percentage } : cat
          )
        )
        toast.success(`GST rate updated to ${percentage}%`)
      } else {
        toast.error(data.error || 'Failed to update GST rate')
      }
    } catch (error) {
      console.error('Update percentage error:', error)
      toast.error('Failed to update GST rate')
    } finally {
      setUpdatingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <FolderOpen className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Category Management</h1>
            <p className="text-sm text-muted-foreground">
              Manage categories and GST settings
            </p>
          </div>
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
              GST rates: 0%, 5%, 12%, 18%, 28%
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Categories List */}
      <div className="space-y-4">
        {categories.map((category) => (
          <Card key={category.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                {/* Category Info */}
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    {category.image ? (
                      <img 
                        src={category.image} 
                        alt={category.name}
                        className="w-full h-full rounded-xl object-cover"
                      />
                    ) : (
                      <FolderOpen className="w-7 h-7 text-primary" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{category.name}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <Badge variant={category.isActive ? 'default' : 'secondary'}>
                        {category.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {category.subCategories?.length || 0} subcategories
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {category.subCategories?.reduce((acc, sc) => acc + (sc.services?.length || 0), 0) || 0} services
                      </span>
                    </div>
                  </div>
                </div>

                {/* GST Controls */}
                <div className="flex items-center gap-6 lg:gap-8">
                  {/* GST Toggle */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">GST</span>
                    </div>
                    <Switch
                      checked={category.gstEnabled}
                      onCheckedChange={(checked) => handleToggleGST(category.id, checked)}
                      disabled={updatingId === category.id}
                    />
                    <Badge variant={category.gstEnabled ? 'default' : 'outline'}>
                      {category.gstEnabled ? 'ON' : 'OFF'}
                    </Badge>
                  </div>

                  {/* GST Percentage */}
                  {category.gstEnabled && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Rate:</span>
                      <select
                        value={category.gstPercentage}
                        onChange={(e) => handleUpdatePercentage(category.id, Number(e.target.value))}
                        disabled={updatingId === category.id}
                        className="px-3 py-1.5 border rounded-lg text-sm font-medium bg-background"
                      >
                        <option value={5}>5%</option>
                        <option value={12}>12%</option>
                        <option value={18}>18%</option>
                        <option value={28}>28%</option>
                      </select>
                    </div>
                  )}

                  {/* Edit Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/admin/categories/${category.id}/edit`)}
                  >
                    <Settings className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {categories.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FolderOpen className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No categories found</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}