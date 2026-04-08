import './globals.css'
import { Cairo } from 'next/font/google'

const cairo = Cairo({ 
  subsets: ['arabic'],
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap'
})

export const metadata = {
  title: 'نظام تتبع طلبات شوبيفاي',
  description: 'لوحة التحكم وإدارة تتبع الطلبات من شوبيفاي',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className={cairo.className}>{children}</body>
    </html>
  )
}
