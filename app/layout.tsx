export const metadata = {
  title: 'Next.js i18n Server Action Bug Demo',
  description: 'Demonstrating pathname issues with server actions and i18n rewrites',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html>
      <body>{children}</body>
    </html>
  )
}
