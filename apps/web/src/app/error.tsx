'use client'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => { console.error(error) }, [error])
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="text-6xl">⚠️</div>
        <h2 className="text-2xl font-bold">Kuch galat ho gaya!</h2>
        <p className="text-muted-foreground">{error.message}</p>
        <Button onClick={reset}>Dobara Try Karo</Button>
      </div>
    </div>
  )
}
