import { useState, useEffect, useCallback } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { AppLayout } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"
import { useAuth } from "@/auth.context"
import { reimbursementsApi, categoriesApi } from "@/lib/api"
import type { Category, Attachment, Reimbursement } from "@/lib/types"
import { ArrowLeft, Plus, Trash2, FileText, Image, AlertCircle, Save } from "lucide-react"

export default function EditReimbursementPage() {
  const { id = "" } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [categories, setCategories] = useState<Category[]>([])
  const [reimbursement, setReimbursement] = useState<Reimbursement | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Form state
  const [description, setDescription] = useState("")
  const [amount, setAmount] = useState("")
  const [expenseDate, setExpenseDate] = useState("")
  const [category, setCategory] = useState("")
  const [attachments, setAttachments] = useState<Attachment[]>([])

  // Attachment form
  const [attachmentFileName, setAttachmentFileName] = useState("")
  const [attachmentFileType, setAttachmentFileType] = useState<"PDF" | "JPG" | "PNG">("PDF")

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError("")
      const [reimbursementData, categoriesData] = await Promise.all([
        reimbursementsApi.getById(id),
        categoriesApi.getAll(),
      ])

      if (!reimbursementData) {
        setError("Solicitação não encontrada")
        return
      }

      // Check if user can edit
      if (reimbursementData.status !== "DRAFT" || 
          (user?.role === "EMPLOYEE" && reimbursementData.userId !== user.id)) {
        navigate(`/reimbursements/${id}`)
        return
      }

      setReimbursement(reimbursementData)
      setDescription(reimbursementData.description)
      setAmount(String(reimbursementData.amount))
      setExpenseDate(reimbursementData.expenseDate)
      setCategory(reimbursementData.category)
      setAttachments(reimbursementData.attachments)
      setCategories(categoriesData.filter(c => c.active))
    } catch {
      setError("Erro ao carregar dados")
    } finally {
      setIsLoading(false)
    }
  }, [id, user, navigate])

  useEffect(() => {
    loadData()
  }, [loadData])

  const validateForm = () => {
    if (!description.trim()) {
      setError("Descrição é obrigatória")
      return false
    }
    if (!amount || parseFloat(amount) <= 0) {
      setError("Valor deve ser maior que zero")
      return false
    }
    if (!expenseDate) {
      setError("Data da despesa é obrigatória")
      return false
    }
    if (!category) {
      setError("Categoria é obrigatória")
      return false
    }
    return true
  }

  const handleAddAttachment = () => {
    if (!attachmentFileName.trim()) {
      setError("Nome do arquivo é obrigatório")
      return
    }

    const extension = attachmentFileType.toLowerCase()
    const fileName = attachmentFileName.endsWith(`.${extension}`)
      ? attachmentFileName
      : `${attachmentFileName}.${extension}`

    setAttachments([
      ...attachments,
      {
        id: `temp-${Date.now()}`,
        fileName,
        fileUrl: `/files/${fileName}`,
        fileType: attachmentFileType,
      },
    ])
    setAttachmentFileName("")
    setError("")
  }

  const handleRemoveAttachment = (attachmentId: string) => {
    setAttachments(attachments.filter(a => a.id !== attachmentId))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    if (!validateForm() || !user || !reimbursement) return

    setIsSubmitting(true)

    try {
      await reimbursementsApi.update(
        reimbursement.id,
        {
          description: description.trim(),
          amount: parseFloat(amount),
          expenseDate,
          category,
          attachments,
        },
        user
      )
      setSuccess("Solicitação atualizada com sucesso!")
      setTimeout(() => {
        navigate(`/reimbursements/${reimbursement.id}`)
      }, 1000)
    } catch {
      setError("Erro ao atualizar solicitação")
    } finally {
      setIsSubmitting(false)
    }
  }

  const getFileIcon = (fileType: string) => {
    if (fileType === "PDF") return <FileText className="h-4 w-4" />
    return <Image className="h-4 w-4" />
  }

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-12">
          <Spinner className="h-8 w-8 text-primary" />
        </div>
      </AppLayout>
    )
  }

  if (error && !reimbursement) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="mb-4 h-12 w-12 text-destructive" />
          <h3 className="text-lg font-semibold">{error}</h3>
          <Button asChild className="mt-4">
            <Link to="/dashboard">Voltar ao Dashboard</Link>
          </Button>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to={`/reimbursements/${id}`}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Editar Solicitação</h1>
            <p className="text-muted-foreground">Atualize os dados da sua solicitação de reembolso</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Informações da Despesa</CardTitle>
              <CardDescription>Descreva a despesa que deseja solicitar reembolso</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="border-green-200 bg-green-50 text-green-800">
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="description">Descrição *</Label>
                <Textarea
                  id="description"
                  placeholder="Descreva a despesa..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="amount">Valor (R$) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0,00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expenseDate">Data da Despesa *</Label>
                  <Input
                    id="expenseDate"
                    type="date"
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Categoria *</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.name}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Anexos</CardTitle>
              <CardDescription>Adicione comprovantes da despesa (PDF, JPG ou PNG)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-4 sm:flex-row">
                <div className="flex-1">
                  <Input
                    placeholder="Nome do arquivo"
                    value={attachmentFileName}
                    onChange={(e) => setAttachmentFileName(e.target.value)}
                  />
                </div>
                <Select
                  value={attachmentFileType}
                  onValueChange={(value) => setAttachmentFileType(value as "PDF" | "JPG" | "PNG")}
                >
                  <SelectTrigger className="w-full sm:w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PDF">PDF</SelectItem>
                    <SelectItem value="JPG">JPG</SelectItem>
                    <SelectItem value="PNG">PNG</SelectItem>
                  </SelectContent>
                </Select>
                <Button type="button" variant="secondary" onClick={handleAddAttachment}>
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar
                </Button>
              </div>

              {attachments.length > 0 && (
                <div className="space-y-2">
                  {attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="flex items-center justify-between rounded-lg border bg-muted/50 px-4 py-2"
                    >
                      <div className="flex items-center gap-3">
                        {getFileIcon(attachment.fileType)}
                        <span className="text-sm font-medium">{attachment.fileName}</span>
                        <span className="text-xs text-muted-foreground">{attachment.fileType}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveAttachment(attachment.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" asChild>
              <Link to={`/reimbursements/${id}`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Cancelar
              </Link>
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  )
}
