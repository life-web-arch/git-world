import './globals.css'
import { Providers } from '@/components/Providers'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="overflow-hidden m-0 p-0 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
