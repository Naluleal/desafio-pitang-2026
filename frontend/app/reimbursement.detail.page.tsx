import { useCallback, useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import {
  AlertCircle,
  ArrowLeft,
  Ban,
  CheckCircle,
  CreditCard,
  Edit,
  FileText,
  Send,
  XCircle,
} from "lucide-react"
import { useAuth } from "@/auth.context"
import { AppLayout } from "@/components/layout"
import { StatusBadge } from "@/components/status.badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { reimbursementsApi } from "@/lib/api"
import type { Reimbursement } from "@/lib/types"

const historyLabels: Record<string, string> = {
  CREATED: "Criado",
  UPDATED: "Atualizado",
  SUBMITTED: "Enviado",
  APPROVED: "Aprovado",
  REJECTED: "Rejeitado",
  PAID: "Pago",
  CANCELED: "Cancelado",
  ATTACHMENT_ADDED: "Anexo adicionado",
}

export default function ReimbursementDetailPage() {
  const { id = "" } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [reimbursement, setReimbursement] = useState<Reimbursement | null>(null)
  const [rejectReason, setRejectReason] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isActionLoading, setIsActionLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const loadReimbursement = useCallback(async () => {
    try {
      setIsLoading(true)
      setError("")
      const data = await reimbursementsApi.getById(id)
      setReimbursement(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar reembolso")
    } finally {
      setIsLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadReimbursement()
  }, [loadReimbursement])

  const runAction = async (action: () => Promise<Reimbursement>, message: string) => {
    try {
      setIsActionLoading(true)
      setError("")
      setSuccess("")
      await action()
      const updatedReimbursement = await reimbursementsApi.getById(id)
      setReimbursement(updatedReimbursement)
      setSuccess(message)
      setRejectReason("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao executar ação")
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleReject = () => {
    if (!rejectReason.trim()) {
      setError("Informe o motivo da rejeição")
      return
    }

    runAction(
      () => reimbursementsApi.reject(id, rejectReason.trim()),
      "Solicitação rejeitada com sucesso!",
    )
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-"
    return new Date(dateString).toLocaleDateString("pt-BR")
  }

  const canEdit =
    reimbursement?.status === "DRAFT" &&
    user?.role === "EMPLOYEE" &&
    reimbursement.userId === user.id

  const canManageAsEmployee = canEdit
  const canManageAsManager = user?.role === "MANAGER" && reimbursement?.status === "SUBMITTED"
  const canManageAsFinancial = user?.role === "FINANCIAL" && reimbursement?.status === "APPROVED"

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-12">
          <Spinner className="h-8 w-8 text-primary" />
        </div>
      </AppLayout>
    )
  }

  if (!reimbursement) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle className="mb-4 h-12 w-12 text-destructive" />
          <h1 className="text-lg font-semibold">{error || "Reembolso não encontrado"}</h1>
          <Button className="mt-4" onClick={() => navigate("/dashboard")}>
            Voltar ao Dashboard
          </Button>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/dashboard">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold text-foreground">Detalhes do Reembolso</h1>
                <StatusBadge status={reimbursement.status} />
              </div>
              <p className="mt-1 text-muted-foreground">{reimbursement.description}</p>
            </div>
          </div>

          {canEdit && (
            <Button variant="outline" asChild>
              <Link to={`/reimbursements/${reimbursement.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </Link>
            </Button>
          )}
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-200 bg-green-50 text-green-800">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações da Despesa</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm text-muted-foreground">Valor</dt>
                    <dd className="mt-1 text-xl font-semibold">{formatCurrency(reimbursement.amount)}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">Data da despesa</dt>
                    <dd className="mt-1 font-medium">{formatDate(reimbursement.expenseDate)}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">Categoria</dt>
                    <dd className="mt-1 font-medium">{reimbursement.category}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">Colaborador</dt>
                    <dd className="mt-1 font-medium">{reimbursement.userName}</dd>
                  </div>
                </dl>

                {reimbursement.rejectionReason && (
                  <Alert variant="destructive" className="mt-6">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>{reimbursement.rejectionReason}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Anexos</CardTitle>
              </CardHeader>
              <CardContent>
                {reimbursement.attachments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum anexo cadastrado.</p>
                ) : (
                  <div className="space-y-2">
                    {reimbursement.attachments.map((attachment) => (
                      <a
                        key={attachment.id}
                        href={attachment.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between rounded-lg border bg-muted/40 px-4 py-3 text-sm hover:bg-muted"
                      >
                        <span className="flex items-center gap-3 font-medium">
                          <FileText className="h-4 w-4 text-primary" />
                          {attachment.fileName}
                        </span>
                        <span className="text-muted-foreground">{attachment.fileType}</span>
                      </a>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Histórico</CardTitle>
              </CardHeader>
              <CardContent>
                {!reimbursement.histories?.length ? (
                  <p className="text-sm text-muted-foreground">Nenhum histórico disponível.</p>
                ) : (
                  <div className="space-y-3">
                    {reimbursement.histories.map((history) => (
                      <div key={history.id} className="border-l-2 border-primary/30 pl-4">
                        <p className="text-sm font-medium">{historyLabels[history.action] ?? history.action}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(history.createdAt)}
                          {history.user?.name ? ` por ${history.user.name}` : ""}
                        </p>
                        {history.note && <p className="mt-1 text-sm text-muted-foreground">{history.note}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="h-fit">
            <CardHeader>
              <CardTitle>Acoes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {canManageAsEmployee && (
                <>
                  <Button
                    className="w-full"
                    disabled={isActionLoading}
                    onClick={() => runAction(() => reimbursementsApi.submit(id), "Solicitação enviada com sucesso!")}
                  >
                    {isActionLoading ? <Spinner className="h-4 w-4" /> : <Send className="h-4 w-4" />}
                    Enviar para aprovação
                  </Button>
                  <Button
                    className="w-full"
                    variant="outline"
                    disabled={isActionLoading}
                    onClick={() => runAction(() => reimbursementsApi.cancel(id), "Solicitação cancelada com sucesso!")}
                  >
                    <Ban className="h-4 w-4" />
                    Cancelar rascunho
                  </Button>
                </>
              )}

              {canManageAsManager && (
                <>
                  <Button
                    className="w-full"
                    disabled={isActionLoading}
                    onClick={() => runAction(() => reimbursementsApi.approve(id), "Solicitação aprovada com sucesso!")}
                  >
                    {isActionLoading ? <Spinner className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                    Aprovar
                  </Button>
                  <div className="space-y-2">
                    <Label htmlFor="rejectReason">Motivo da rejeição</Label>
                    <Textarea
                      id="rejectReason"
                      value={rejectReason}
                      onChange={(event) => setRejectReason(event.target.value)}
                      rows={3}
                    />
                    <Button className="w-full" variant="destructive" disabled={isActionLoading} onClick={handleReject}>
                      <XCircle className="h-4 w-4" />
                      Rejeitar
                    </Button>
                  </div>
                </>
              )}

              {canManageAsFinancial && (
                <Button
                  className="w-full"
                  disabled={isActionLoading}
                  onClick={() => runAction(() => reimbursementsApi.pay(id), "Solicitação marcada como paga!")}
                >
                  {isActionLoading ? <Spinner className="h-4 w-4" /> : <CreditCard className="h-4 w-4" />}
                  Marcar como pago
                </Button>
              )}

              {!canManageAsEmployee && !canManageAsManager && !canManageAsFinancial && (
                <p className="text-sm text-muted-foreground">Nenhuma ação disponível para este status.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  )
}
