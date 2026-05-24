import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Roll For It 🎲',
  description: 'Let the dice decide.',
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