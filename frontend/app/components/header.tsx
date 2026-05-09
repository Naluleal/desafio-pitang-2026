import { useAuth } from "@/auth.context"
import { Badge } from "@/components/ui/badge"
import { User } from "lucide-react"

const roleLabels: Record<string, string> = {
  EMPLOYEE: "Colaborador",
  MANAGER: "Gestor",
  FINANCIAL: "Financeiro",
  ADMIN: "Administrador",
}

export function AppHeader() {
  const { user } = useAuth()

  if (!user) return null

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background px-6">
      <div className="md:hidden w-10" />
      <div className="flex-1" />
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-medium">{user.name}</p>
          <Badge variant="secondary" className="text-xs">
            {roleLabels[user.role] || user.role}
          </Badge>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <User className="h-5 w-5" />
        </div>
      </div>
    </header>
  )
}
