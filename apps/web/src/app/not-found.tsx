import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="text-8xl font-bold text-primary/20">404</div>
        <h2 className="text-2xl font-bold">Page nahi mila!</h2>
        <p className="text-muted-foreground">Jo page dhundh rahe ho wo exist nahi karta.</p>
        <Button asChild>
          <Link href="/">Ghar Wapas Jao</Link>
        </Button>
      </div>
    </div>
  )
}
