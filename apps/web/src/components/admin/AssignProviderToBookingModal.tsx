// components/admin/AssignProviderToBookingModal.tsx

'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
// CHANGE: apiFetch import kiya — ye automatically Authorization token attach karta hai
// Pehle raw fetch use ho raha tha jisse 401 Unauthorized aa raha tha
import { apiFetch } from '@/lib/api-client'
import { Search, Loader2, User, Phone, Star, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

interface Provider {
  id: string
  userId: string
  user: {
    id: string
    name: string | null
    phone: string
    email: string | null
    avatar: string | null
  }
  avgRating: number
  totalJobs: number
  isAvailable: boolean
  serviceAreas: string[]
  _count?: {
    services: number
    bookings: number
  }
}

interface AssignProviderToBookingModalProps {
  bookingId: string
  bookingNumber: string
  serviceName: string
  scheduledDate: string
  scheduledTime: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onAssigned: () => void
}

export function AssignProviderToBookingModal({
  bookingId,
  bookingNumber,
  serviceName,
  scheduledDate,
  scheduledTime,
  open,
  onOpenChange,
  onAssigned,
}: AssignProviderToBookingModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [providers, setProviders] = useState<Provider[]>([])
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  // ═══════════════════════════════════════════════════════════════
  // ✅ FIX: fetch() → apiFetch() — Authorization token automatically lagta hai
  // Pehle raw fetch tha jisse 401 Unauthorized aa raha tha
  // ═══════════════════════════════════════════════════════════════
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter a search term')
      return
    }

    setSearching(true)
    setHasSearched(true)
    try {
      // ✅ FIX: apiFetch use kiya — token automatically attach hoga
      const res = await apiFetch(
        `/api/admin/providers/search?q=${encodeURIComponent(searchQuery)}`
      )
      const data = await res.json()

      if (data.success) {
        setProviders(data.data.providers || data.data || [])
        if ((data.data.providers || data.data || []).length === 0) {
          toast.info('No providers found')
        }
      } else {
        toast.error(data.error || 'Search failed')
      }
    } catch (error) {
      console.error('Search error:', error)
      toast.error('Search failed')
    } finally {
      setSearching(false)
    }
  }

  // ✅ FIX: fetch() → apiFetch()
  const handleLoadAll = async () => {
    setSearching(true)
    setHasSearched(true)
    try {
      // ✅ FIX: apiFetch use kiya
      const res = await apiFetch('/api/admin/providers/search?q=')
      const data = await res.json()

      if (data.success) {
        setProviders(data.data.providers || data.data || [])
      }
    } catch (error) {
      console.error('Load all error:', error)
      toast.error('Failed to load providers')
    } finally {
      setSearching(false)
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // ✅ FIX: fetch() → apiFetch() — YE SABSE IMPORTANT FIX HAI
  // /api/admin/bookings/{id}/assign ko admin auth chahiye
  // Pehle raw fetch se token nahi ja raha tha → 401 aa raha tha
  // Ab apiFetch automatically Authorization: Bearer <token> bhejta hai
  // ═══════════════════════════════════════════════════════════════
  const handleAssign = async () => {
    if (!selectedProvider) {
      toast.error('Please select a provider')
      return
    }

    setLoading(true)
    try {
      // ✅ FIX: apiFetch use kiya — Authorization header automatically lagta hai
      const res = await apiFetch(`/api/admin/bookings/${bookingId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId: selectedProvider.id,
          notes: notes || `Provider assigned for booking ${bookingNumber}`,
        }),
      })

      const data = await res.json()

      if (data.success) {
        toast.success(`Provider assigned to booking ${bookingNumber}`)
        onOpenChange(false)
        onAssigned()
      } else {
        toast.error(data.error || 'Failed to assign provider')
      }
    } catch (error) {
      console.error('Assign error:', error)
      toast.error('Failed to assign provider')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setSearchQuery('')
      setProviders([])
      setSelectedProvider(null)
      setNotes('')
      setHasSearched(false)
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Assign Provider
          </DialogTitle>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>Booking: <span className="font-medium text-foreground">#{bookingNumber}</span></p>
            <p>Service: <span className="font-medium text-foreground">{serviceName}</span></p>
            <p>Scheduled: <span className="font-medium text-foreground">
              {new Date(scheduledDate).toLocaleDateString('en-IN', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
              })} at {scheduledTime}
            </span></p>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Section */}
          <div className="space-y-2">
            <Label>Search Provider</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-9"
                />
              </div>
              <Button onClick={handleSearch} disabled={searching}>
                {searching ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </Button>
            </div>
            {!hasSearched && (
              <Button variant="ghost" size="sm" onClick={handleLoadAll} className="text-muted-foreground">
                Or view all providers
              </Button>
            )}
          </div>

          {/* Results */}
          {providers.length > 0 && (
            <div className="space-y-2">
              <Label>Select Provider</Label>
              <div className="space-y-2 max-h-64 overflow-y-auto border rounded-lg p-2">
                {providers.map((provider) => (
                  <div
                    key={provider.id}
                    onClick={() => setSelectedProvider(provider)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedProvider?.id === provider.id
                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                        : 'border-border hover:border-primary/50 hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          {provider.user.avatar ? (
                            <img
                              src={provider.user.avatar}
                              alt={provider.user.name || 'Provider'}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <User className="w-5 h-5 text-primary" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            {provider.user.name || 'Provider'}
                            {selectedProvider?.id === provider.id && (
                              <CheckCircle2 className="w-4 h-4 text-primary" />
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {provider.user.phone}
                            </span>
                            {provider.avgRating > 0 && (
                              <span className="flex items-center gap-1">
                                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                {provider.avgRating}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge
                          variant={provider.isAvailable ? 'default' : 'secondary'}
                          className={provider.isAvailable ? 'bg-green-100 text-green-700 hover:bg-green-100' : ''}
                        >
                          {provider.isAvailable ? 'Available' : 'Busy'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {provider.totalJobs} jobs
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {hasSearched && providers.length === 0 && !searching && (
            <div className="text-center py-8 text-muted-foreground">
              <User className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p>No providers found. Try a different search term.</p>
            </div>
          )}

          {/* Selected Provider */}
          {selectedProvider && (
            <div className="space-y-3 border-t pt-4">
              <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg border border-primary/20">
                <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm">
                    Selected: {selectedProvider.user.name || 'Provider'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedProvider.user.phone} • {selectedProvider.totalJobs} jobs completed
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notes (Optional)</Label>
                <Textarea
                  placeholder="Any special instructions for the provider..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                />
              </div>

              <Button
                onClick={handleAssign}
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/90 text-white"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  <>
                    <User className="w-4 h-4 mr-2" />
                    Assign to Booking #{bookingNumber}
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}