import { Metadata } from 'next'
import { User, Mail, Phone, MapPin } from 'lucide-react'

// ✅ NEW FILE — Placeholder
// /profile route pehle 404 de raha tha kyunki folder exist karta tha
// lekin page.tsx nahi tha. Ye minimal placeholder hai jab tak
// actual profile page develop nahi ho jata.
// Design: container-width consistent (max-w-[1400px]), Lucide icons (no emoji)
export const metadata: Metadata = {
  title: 'My Profile',
}

export default function ProfilePage() {
  return (
    <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-8 md:py-12">
      <h1 className="text-2xl font-semibold text-gray-900">My Profile</h1>
      <p className="mt-2 text-sm text-gray-500">
        Manage your personal information and account settings.
      </p>

      {/* Placeholder card — actual content baad mein aayega */}
      <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6 md:p-8">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-teal-50">
            <User className="h-6 w-6 text-teal-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900">Profile details</p>
            <p className="text-sm text-gray-500">This section is under construction.</p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <div className="flex items-center gap-3 text-sm text-gray-400">
            <Mail className="h-4 w-4" />
            <span>Email information will appear here</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-400">
            <Phone className="h-4 w-4" />
            <span>Phone number will appear here</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-400">
            <MapPin className="h-4 w-4" />
            <span>Default address will appear here</span>
          </div>
        </div>
      </div>
    </div>
  )
}