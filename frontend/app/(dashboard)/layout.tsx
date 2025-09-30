import './styles/globals.css'
import type { ReactNode } from 'react'

export const metadata = {
  title: 'Cloud Cost Copilot',
  description: 'Detecta anomalias de custos cloud com alertas.',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt">
      <body>{children}</body>
    </html>
  )
}
