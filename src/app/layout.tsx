import './globals.css'
import type { Metadata } from 'next'

import { Toaster } from 'sonner'

export const metadata: Metadata = {
  title: 'SwipyEat Manager',
  description: 'Restaurant SaaS Dashboard',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        {children}
        <Toaster position="top-right" expand={true} richColors />
      </body>
    </html>
  )
}
