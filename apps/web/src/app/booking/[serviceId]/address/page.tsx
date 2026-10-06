/**
 * WHAT: Address selection page - Step 2 of booking flow
 * WHY: Customer selects existing address or creates new one
 * NOTE: Fetches addresses from API, allows selection or add new
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useCartStore } from '@/store/cartStore'
import { useAuthStore } from '@/store/authStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { MapPin, Plus, ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface Address {
  id: string
  label: string
  fullAddress: string
  area: string
  landmark?: string
  pincode: string
  isDefault: boolean
}

export default function AddressPage() {
  const router = useRouter()
  const params = useParams()
  const { items, addressId, setAddress } = useCartStore()
  const { isAuthenticated, token } = useAuthStore()

  const [addresses, setAddresses] = useState<Address[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(addressId)
  const [showAddForm, setShowAddForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // New address form
  const [newAddress, setNewAddress] = useState({
    label: 'Home',
    fullAddress: '',
    area: '',
    landmark: '',
    pincode: '',
  })

  // Auth check
  useEffect(() => {
    if (!isAuthenticated) {
      const returnUrl = encodeURIComponent(`/booking/${params.serviceId}/address`)
      router.push(`/login?redirect=${returnUrl}`)
    }
  }, [isAuthenticated, router, params.serviceId])

  // Fetch addresses
  useEffect(() => {
    const fetchAddresses = async () => {
      if (!token) return

      try {
        const response = await fetch('/api/addresses', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        const data = await response.json()

        if (data.success) {
          setAddresses(data.data)
          // Auto-select default address if none selected
          if (!selectedAddressId && data.data.length > 0) {
            const defaultAddr = data.data.find((a: Address) => a.isDefault) || data.data[0]
            setSelectedAddressId(defaultAddr.id)
          }
        }
      } catch (error) {
        console.error('Fetch addresses error:', error)
        toast.error('Failed to load addresses')
      } finally {
        setLoading(false)
      }
    }

    fetchAddresses()
  }, [token, selectedAddressId])

  // Cart check
  useEffect(() => {
    if (items.length === 0) {
      toast.error('Your cart is empty')
      router.push('/services')
    }
  }, [items, router])

  const handleAddAddress = async () => {
    if (!newAddress.fullAddress || !newAddress.area || !newAddress.pincode) {
      toast.error('Please fill all required fields')
      return
    }

    if (!token) return

    setSaving(true)

    try {
      const response = await fetch('/api/addresses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newAddress),
      })

      const data = await response.json()

      if (data.success) {
        setAddresses([...addresses, data.data])
        setSelectedAddressId(data.data.id)
        setShowAddForm(false)
        setNewAddress({
          label: 'Home',
          fullAddress: '',
          area: '',
          landmark: '',
          pincode: '',
        })
        toast.success('Address added successfully')
      } else {
        toast.error('Failed to add address')
      }
    } catch (error) {
      console.error('Add address error:', error)
      toast.error('Failed to add address')
    } finally {
      setSaving(false)
    }
  }

  const handleContinue = () => {
    if (!selectedAddressId) {
      toast.error('Please select an address')
      return
    }

    setAddress(selectedAddressId)
    router.push(`/booking/${params.serviceId}/review`)
  }

  if (loading || items.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push(`/booking/${params.serviceId}/schedule`)}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Schedule
          </Button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Service Address</h1>
              <p className="text-muted-foreground text-sm mt-0.5">
                Where should we provide the service?
              </p>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center gap-4">
            {[
              { num: 1, label: 'Schedule', active: false },
              { num: 2, label: 'Address', active: true },
              { num: 3, label: 'Review', active: false },
              { num: 4, label: 'Payment', active: false },
            ].map((step, idx) => (
              <div key={step.num} className="flex items-center">
                <div
                  className={`flex items-center gap-2 px-4 py-2 rounded-full ${
                    step.active
                      ? 'bg-primary text-white'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  <span className="text-sm font-medium">{step.num}</span>
                  <span className="text-sm font-medium hidden sm:inline">{step.label}</span>
                </div>
                {idx < 3 && (
                  <div className={`w-8 sm:w-12 h-0.5 mx-2 ${step.active ? 'bg-primary' : 'bg-muted'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="max-w-4xl mx-auto space-y-4">
          {/* Existing Addresses */}
          {addresses.length > 0 && !showAddForm && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Select Address</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddForm(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add New
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {addresses.map((address) => (
                  <div
                    key={address.id}
                    onClick={() => setSelectedAddressId(address.id)}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedAddressId === address.id
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        selectedAddressId === address.id
                          ? 'border-primary bg-primary'
                          : 'border-gray-300'
                      }`}>
                        {selectedAddressId === address.id && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">{address.label}</span>
                          {address.isDefault && (
                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{address.fullAddress}</p>
                        <p className="text-sm text-muted-foreground">
                          {address.area}{address.landmark && `, ${address.landmark}`} - {address.pincode}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Add New Address Form */}
          {(showAddForm || addresses.length === 0) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{addresses.length === 0 ? 'Add Your Address' : 'Add New Address'}</span>
                  {addresses.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAddForm(false)}
                    >
                      Cancel
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Address Label *</Label>
                  <Input
                    value={newAddress.label}
                    onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
                    placeholder="Home, Office, etc."
                  />
                </div>

                <div>
                  <Label>Full Address *</Label>
                  <Textarea
                    value={newAddress.fullAddress}
                    onChange={(e) => setNewAddress({ ...newAddress, fullAddress: e.target.value })}
                    placeholder="House no., Street, Society name"
                    rows={3}
                  />
                </div>

                <div>
                  <Label>Area/Locality *</Label>
                  <Input
                    value={newAddress.area}
                    onChange={(e) => setNewAddress({ ...newAddress, area: e.target.value })}
                    placeholder="e.g., Civil Lines, Gandhi Nagar"
                  />
                </div>

                <div>
                  <Label>Landmark (Optional)</Label>
                  <Input
                    value={newAddress.landmark}
                    onChange={(e) => setNewAddress({ ...newAddress, landmark: e.target.value })}
                    placeholder="Near temple, opposite to school"
                  />
                </div>

                <div>
                  <Label>Pincode *</Label>
                  <Input
                    value={newAddress.pincode}
                    onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                    placeholder="497001"
                    maxLength={6}
                  />
                </div>

                <Button
                  onClick={handleAddAddress}
                  disabled={saving || !newAddress.fullAddress || !newAddress.area || !newAddress.pincode}
                  className="w-full bg-primary hover:bg-primary/90 text-white"
                  size="lg"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Save Address
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Continue Button */}
          {selectedAddressId && !showAddForm && (
            <Button
              onClick={handleContinue}
              className="w-full bg-primary hover:bg-primary/90 text-white"
              size="lg"
            >
              Continue to Review
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}