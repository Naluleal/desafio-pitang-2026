import { Badge } from "@/components/ui/badge"
import type { ReimbursementStatus } from "@/lib/types"
import { cn } from "@/lib/utils"

interface StatusBadgeProps {
  status: ReimbursementStatus
  className?: string
}

const statusConfig: Record<ReimbursementStatus, { label: string; className: string }> = {
  DRAFT: { label: "Rascunho", className: "bg-gray-100 text-gray-700 hover:bg-gray-100" },
  SUBMITTED: { label: "Enviado", className: "bg-blue-100 text-blue-700 hover:bg-blue-100" },
  APPROVED: { label: "Aprovado", className: "bg-green-100 text-green-700 hover:bg-green-100" },
  REJECTED: { label: "Rejeitado", className: "bg-red-100 text-red-700 hover:bg-red-100" },
  PAID: { label: "Pago", className: "bg-orange-100 text-orange-700 hover:bg-orange-100" },
  CANCELED: { label: "Cancelado", className: "bg-gray-200 text-gray-600 hover:bg-gray-200" },
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status]
  
  return (
    <Badge variant="secondary" className={cn(config.className, className)}>
      {config.label}
    </Badge>
  )
}
