import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import AdminNav from './AdminNav'

export default async function AdminLayout({
  children
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const auth = cookieStore.get('lume_admin')?.value

  // Get current path to check if it's the login page
  // Login page renders without sidebar
  const isLoginPage = !auth

  if (isLoginPage) {
    return <>{children}</>
  }

  return (
    <div style={{ minHeight: '100vh', background: '#080808', display: 'flex' }}>
      <AdminNav />
      <main style={{ flex: 1, padding: '28px 24px', overflowY: 'auto', color: '#fff' }}>
        {children}
      </main>
    </div>
  )
}
