"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Save, Building2, DollarSign, Bell } from "lucide-react"
import { toast } from "sonner"
import { apiFetch } from "@/lib/api-client"

export default function AdminSettingsPage() {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    
    // General State
    const [platformName, setPlatformName] = useState("")
    const [supportEmail, setSupportEmail] = useState("")
    const [supportPhone, setSupportPhone] = useState("")
    const [address, setAddress] = useState("")

    // Financial State
    const [defaultCommission, setDefaultCommission] = useState("20")
    const [minPayout, setMinPayout] = useState("500")
    const [walletEnabled, setWalletEnabled] = useState(true)

    // Notifications State
    const [smsEnabled, setSmsEnabled] = useState(true)
    const [otpProvider, setOtpProvider] = useState("MSG91")

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await apiFetch('/api/admin/settings')
                const data = await res.json()
                if (data.success) {
                    const s = data.data
                    setPlatformName(s.PLATFORM_NAME || "HomeServ")
                    setSupportEmail(s.SUPPORT_EMAIL || "")
                    setSupportPhone(s.SUPPORT_PHONE || "")
                    setAddress(s.PLATFORM_ADDRESS || "")
                    
                    setDefaultCommission(s.DEFAULT_COMMISSION || "20")
                    setMinPayout(s.MIN_PAYOUT_AMOUNT || "500")
                    setWalletEnabled(s.WALLET_ENABLED !== "false")
                    
                    setSmsEnabled(s.SMS_ENABLED !== "false")
                    setOtpProvider(s.OTP_PROVIDER || "MSG91")
                }
            } catch { toast.error("Failed to load settings") } 
            finally { setLoading(false) }
        }
        fetchSettings()
    }, [])

    const handleSave = async () => {
        setSaving(true)
        try {
            const res = await apiFetch('/api/admin/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    PLATFORM_NAME: platformName,
                    SUPPORT_EMAIL: supportEmail,
                    SUPPORT_PHONE: supportPhone,
                    PLATFORM_ADDRESS: address,
                    DEFAULT_COMMISSION: defaultCommission,
                    MIN_PAYOUT_AMOUNT: minPayout,
                    WALLET_ENABLED: walletEnabled.toString(),
                    SMS_ENABLED: smsEnabled.toString(),
                    OTP_PROVIDER: otpProvider,
                })
            })
            const data = await res.json()
            if (data.success) toast.success("Settings saved successfully!")
            else toast.error(data.error)
        } catch { toast.error("Failed to save settings") } 
        finally { setSaving(false) }
    }

    if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Platform Settings</h1>
                    <p className="text-muted-foreground">Manage global configurations for your marketplace.</p>
                </div>
                <Button onClick={handleSave} disabled={saving}>
                    <Save className="h-4 w-4 mr-2" /> {saving ? 'Saving...' : 'Save Changes'}
                </Button>
            </div>

            <Tabs defaultValue="general" className="space-y-6">
                <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
                    <TabsTrigger value="general" className="flex items-center gap-2"><Building2 className="h-4 w-4" /> General</TabsTrigger>
                    <TabsTrigger value="financial" className="flex items-center gap-2"><DollarSign className="h-4 w-4" /> Financial</TabsTrigger>
                    <TabsTrigger value="notifications" className="flex items-center gap-2"><Bell className="h-4 w-4" /> Notifications</TabsTrigger>
                </TabsList>

                {/* General Tab */}
                <TabsContent value="general">
                    <Card>
                        <CardHeader>
                            <CardTitle>General Information</CardTitle>
                            <CardDescription>Basic details about your platform.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Platform Name</Label>
                                    <Input value={platformName} onChange={(e) => setPlatformName(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Support Phone</Label>
                                    <Input value={supportPhone} onChange={(e) => setSupportPhone(e.target.value)} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Support Email</Label>
                                <Input type="email" value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Office Address</Label>
                                <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Ambikapur, Chhattisgarh" />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Financial Tab */}
                <TabsContent value="financial">
                    <Card>
                        <CardHeader>
                            <CardTitle>Financial Configuration</CardTitle>
                            <CardDescription>Default commission rates and payout limits.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Default Commission (%)</Label>
                                    <Input type="number" value={defaultCommission} onChange={(e) => setDefaultCommission(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Minimum Payout Amount (₹)</Label>
                                    <Input type="number" value={minPayout} onChange={(e) => setMinPayout(e.target.value)} />
                                </div>
                            </div>
                            <div className="flex items-center justify-between p-4 border rounded-lg">
                                <div>
                                    <Label>Enable Customer Wallet</Label>
                                    <p className="text-sm text-muted-foreground">Allow customers to use wallet balance for bookings.</p>
                                </div>
                                <Switch checked={walletEnabled} onCheckedChange={setWalletEnabled} />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Notifications Tab */}
                <TabsContent value="notifications">
                    <Card>
                        <CardHeader>
                            <CardTitle>Notification & OTP Settings</CardTitle>
                            <CardDescription>Configure SMS gateways and OTP providers.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4">
                            <div className="flex items-center justify-between p-4 border rounded-lg">
                                <div>
                                    <Label>Enable SMS Notifications</Label>
                                    <p className="text-sm text-muted-foreground">Send booking updates via SMS to customers and providers.</p>
                                </div>
                                <Switch checked={smsEnabled} onCheckedChange={setSmsEnabled} />
                            </div>
                            <div className="space-y-2">
                                <Label>OTP Provider Gateway</Label>
                                <div className="flex gap-2">
                                    <Button variant={otpProvider === 'MSG91' ? 'default' : 'outline'} onClick={() => setOtpProvider('MSG91')}>MSG91</Button>
                                    <Button variant={otpProvider === 'FAST2SMS' ? 'default' : 'outline'} onClick={() => setOtpProvider('FAST2SMS')}>Fast2SMS</Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}