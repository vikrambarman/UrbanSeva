import MainLayout from '@/components/layout/MainLayout'

// ✅ NEW FILE — CRITICAL FIX
// (customer) route group ka apna layout pehle exist hi nahi karta tha.
// Iski wajah se /addresses, /my-bookings, /profile, /wallet, /referral
// jaise SAARE customer pages par Navbar, Footer, MobileNav bilkul render
// nahi ho rahe the — sirf root layout apply hota tha (jo sirf ThemeProvider
// + Toaster wrap karta hai, koi layout wrapper nahi).
//
// Ab MainLayout wrap karne se sab customer pages par consistent navigation
// milega — exactly jaisa (public) pages par milta hai.
//
// NOTE: Auth protection (redirect to /login if not authenticated) yahan
// add nahi kiya hai kyunki:
// 1. middleware.ts already handle kar raha hoga (exist karta hai tree mein)
// 2. Agar middleware mein nahi hai, to baad mein alag se add karenge
// 3. Abhi priority sirf "Navbar dikhe" fix karna hai
export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <MainLayout>{children}</MainLayout>
}