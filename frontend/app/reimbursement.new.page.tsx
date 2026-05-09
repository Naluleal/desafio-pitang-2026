import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
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
import type { Category, Attachment } from "@/lib/types"
import { ArrowLeft, Plus, Trash2, FileText, Image, AlertCircle, Save } from "lucide-react"

export default function NewReimbursementPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Form state
  const [description, setDescription] = useState("")
  const [amount, setAmount] = useState("")
  const [expenseDate, setExpenseDate] = useState("")
  const [category, setCategory] = useState("")
  const [attachments, setAttachments] = useState<Omit<Attachment, "id">[]>([])

  // Attachment form
  const [attachmentFileName, setAttachmentFileName] = useState("")
  const [attachmentFileType, setAttachmentFileType] = useState<"PDF" | "JPG" | "PNG">("PDF")

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await categoriesApi.getAll()
        setCategories(data.filter(c => c.active))
      } catch {
        setError("Erro ao carregar categorias")
      } finally {
        setIsLoading(false)
      }
    }
    loadCategories()
  }, [])

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
        fileName,
        fileUrl: `/files/${fileName}`,
        fileType: attachmentFileType,
      },
    ])
    setAttachmentFileName("")
    setError("")
  }

  const handleRemoveAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    if (!validateForm() || !user) return

    setIsSubmitting(true)

    try {
      const newReimbursement = await reimbursementsApi.create(
        {
          description: description.trim(),
          amount: parseFloat(amount),
          expenseDate,
          category,
          attachments: attachments.map((a, index) => ({ ...a, id: `temp-${index}` })) as Attachment[],
        },
        user
      )
      setSuccess("Solicitação criada com sucesso!")
      setTimeout(() => {
        navigate(`/reimbursements/${newReimbursement.id}`)
      }, 1000)
    } catch {
      setError("Erro ao criar solicitação")
    } finally {
      setIsSubmitting(false)
    }
  }

  const getFileIcon = (fileType: string) => {
    if (fileType === "PDF") return <FileText className="h-4 w-4" />
    return <Image className="h-4 w-4" />
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/dashboard">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Nova Solicitação</h1>
            <p className="text-muted-foreground">Preencha os dados da sua solicitação de reembolso</p>
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
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Spinner className="h-4 w-4" />
                    <span className="text-sm text-muted-foreground">Carregando categorias...</span>
                  </div>
                ) : (
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
                )}
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
                  {attachments.map((attachment, index) => (
                    <div
                      key={index}
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
                        onClick={() => handleRemoveAttachment(index)}
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
              <Link to="/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
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
                  Salvar Rascunho
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  )
}
