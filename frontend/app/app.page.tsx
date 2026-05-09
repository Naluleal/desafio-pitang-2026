import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/auth.context"
import { Spinner } from "@/components/ui/spinner"

export default function HomePage() {
  const { isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoading) {
      navigate(isAuthenticated ? "/dashboard" : "/login", { replace: true })
    }
  }, [isAuthenticated, isLoading, navigate])

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Spinner className="h-8 w-8 text-primary" />
    </div>
  )
}
