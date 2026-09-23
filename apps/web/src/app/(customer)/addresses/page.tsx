'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { MapPin, Plus, Trash2, Edit } from 'lucide-react'
import { toast } from 'sonner'

interface Address {
  id: string
  label: string
  fullAddress: string
  area: string
  landmark: string | null
  pincode: string
  isDefault: boolean
}

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    label: 'Home',
    fullAddress: '',
    area: '',
    landmark: '',
    pincode: '',
    isDefault: false,
  })

  useEffect(() => {
    fetchAddresses()
  }, [])

  const fetchAddresses = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/addresses', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      if (data.success) {
        setAddresses(data.data)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddAddress = async () => {
    if (!formData.fullAddress || !formData.area || !formData.pincode) {
      toast.error('Please fill all required fields')
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/addresses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      })
      const data = await response.json()
      
      if (data.success) {
        toast.success('Address added successfully')
        setDialogOpen(false)
        setFormData({ label: 'Home', fullAddress: '', area: '', landmark: '', pincode: '', isDefault: false })
        fetchAddresses()
      }
    } catch (error) {
      toast.error('Failed to add address')
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">My Addresses</h1>
            <p className="text-muted-foreground mt-1">Manage your saved addresses</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                Add Address
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Address</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Label</Label>
                  <Input
                    value={formData.label}
                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                    placeholder="Home, Office, etc."
                  />
                </div>
                <div>
                  <Label>Full Address *</Label>
                  <Textarea
                    value={formData.fullAddress}
                    onChange={(e) => setFormData({ ...formData, fullAddress: e.target.value })}
                    placeholder="House no., Street, Society"
                    rows={3}
                  />
                </div>
                <div>
                  <Label>Area *</Label>
                  <Input
                    value={formData.area}
                    onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                    placeholder="e.g., Civil Lines"
                  />
                </div>
                <div>
                  <Label>Landmark</Label>
                  <Input
                    value={formData.landmark}
                    onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                    placeholder="Near temple, opposite school"
                  />
                </div>
                <div>
                  <Label>Pincode *</Label>
                  <Input
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                    placeholder="497001"
                    maxLength={6}
                  />
                </div>
                <Button onClick={handleAddAddress} className="w-full bg-primary">
                  Add Address
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : addresses.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-6xl mb-4">📍</div>
              <h3 className="text-lg font-semibold mb-2">No addresses saved</h3>
              <p className="text-muted-foreground">Add your first address to get started</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {addresses.map((address) => (
              <Card key={address.id} className={address.isDefault ? 'border-primary' : ''}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-primary" />
                      <h3 className="font-semibold text-lg">{address.label}</h3>
                      {address.isDefault && (
                        <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                          Default
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">{address.fullAddress}</p>
                  <p className="text-sm text-muted-foreground">
                    {address.area}{address.landmark && `, ${address.landmark}`}
                  </p>
                  <p className="text-sm text-muted-foreground">{address.pincode}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}