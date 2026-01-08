import '../styles/globals.css'
import type { ReactNode } from 'react'

export const metadata = {
  title: 'Cloud Cost Copilot',
  description: 'Detect cloud cost anomalies with alerts.',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
