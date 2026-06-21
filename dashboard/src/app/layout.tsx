import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Medical Diagnosis Dashboard',
  description: 'Enterprise-grade Medical ML BI Dashboard',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
