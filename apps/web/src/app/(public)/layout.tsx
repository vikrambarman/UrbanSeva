import MainLayout from '@/components/layout/MainLayout'
import Script from 'next/script'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
      />
      <MainLayout>{children}</MainLayout>
    </>
  )
}