import '../styles/globals.css'
import React from 'react'
export const metadata = {
  title: 'Cloud Cost Copilot',
  description: 'Detecta anomalias de custos cloud com alertas.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <div className="min-h-screen">{children}</div>
      </body>
    </html>
  )
}

