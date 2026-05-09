import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { AppSidebar } from "@/components/sidebar"
import { AppHeader } from "@/components/header"
import { useAuth } from "@/auth.context"
import { Spinner } from "@/components/ui/spinner"

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const { isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/login")
    }
  }, [isAuthenticated, isLoading, navigate])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner className="h-8 w-8 text-primary" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <div className="md:pl-64">
        <AppHeader />
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
