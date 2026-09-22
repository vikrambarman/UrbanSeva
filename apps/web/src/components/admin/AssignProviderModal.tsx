'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Search, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface Provider {
  id: string
  userId: string
  user: {
    id: string
    name: string | null
    phone: string
  }
}

interface AssignProviderModalProps {
  serviceId: string
  serviceName: string
}

export function AssignProviderModal({ serviceId, serviceName }: AssignProviderModalProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [providers, setProviders] = useState<Provider[]>([])
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null)
  const [customPrice, setCustomPrice] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setSearching(true)
    try {
      const response = await fetch(
        `/api/admin/providers/search?q=${encodeURIComponent(searchQuery)}`
      )
      const data = await response.json()

      if (data.success) {
        setProviders(data.data)
      } else {
        toast.error(data.error || 'Search failed')
      }
    } catch (error) {
      toast.error('Search failed')
    } finally {
      setSearching(false)
    }
  }

  const handleAssign = async () => {
    if (!selectedProvider) {
      toast.error('Please select a provider')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/admin/services/${serviceId}/providers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId: selectedProvider.id,
          customPrice: customPrice ? parseFloat(customPrice) : null,
          notes: notes || null,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Provider assigned successfully')
        setOpen(false)
        window.location.reload()
      } else {
        toast.error(data.error || 'Failed to assign provider')
      }
    } catch (error) {
      toast.error('Failed to assign provider')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          Add Provider
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Assign Provider to {serviceName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="space-y-2">
            <Label>Search Provider</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Search by name or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch} disabled={searching}>
                {searching ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Results */}
          {providers.length > 0 && (
            <div className="space-y-2">
              <Label>Select Provider</Label>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {providers.map((provider) => (
                  <div
                    key={provider.id}
                    onClick={() => setSelectedProvider(provider)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedProvider?.id === provider.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="font-medium">{provider.user.name || 'Provider'}</div>
                    <div className="text-sm text-muted-foreground">
                      📞 {provider.user.phone}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Custom Price */}
          {selectedProvider && (
            <>
              <div className="space-y-2">
                <Label>Custom Price (Optional)</Label>
                <Input
                  type="number"
                  placeholder="Leave empty for default price"
                  value={customPrice}
                  onChange={(e) => setCustomPrice(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Notes (Optional)</Label>
                <Textarea
                  placeholder="Any special notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <Button
                onClick={handleAssign}
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/90"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  'Assign Provider'
                )}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}