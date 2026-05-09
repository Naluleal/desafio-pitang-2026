import { useState, useEffect, useCallback } from "react"
import { Link } from "react-router-dom"
import { AppLayout } from "@/components/layout"
import { StatusBadge } from "@/components/status.badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"
import { useAuth } from "@/auth.context"
import { reimbursementsApi, categoriesApi } from "@/lib/api"
import type { Reimbursement, Category } from "@/lib/types"
import { Plus, FileText, Clock, CheckCircle, XCircle, DollarSign, Search, AlertCircle, Eye } from "lucide-react"

const statusOptions: { value: string; label: string }[] = [
  { value: "all", label: "Todos os status" },
  { value: "DRAFT", label: "Rascunho" },
  { value: "SUBMITTED", label: "Enviado" },
  { value: "APPROVED", label: "Aprovado" },
  { value: "REJECTED", label: "Rejeitado" },
  { value: "PAID", label: "Pago" },
  { value: "CANCELED", label: "Cancelado" },
]

export default function DashboardPage() {
  const { user } = useAuth()
  const [reimbursements, setReimbursements] = useState<Reimbursement[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")

  const loadData = useCallback(async () => {
    if (!user) return
    
    try {
      setIsLoading(true)
      setError("")
      const [reimbursementsData, categoriesData] = await Promise.all([
        reimbursementsApi.getAll(user.id, user.role),
        categoriesApi.getAll(),
      ])
      setReimbursements(reimbursementsData)
      setCategories(categoriesData)
    } catch {
      setError("Erro ao carregar dados")
    } finally {
      setIsLoading(false)
    }
  }, [user])

  useEffect(() => {
    loadData()
  }, [loadData])

  const filteredReimbursements = reimbursements.filter((r) => {
    const matchesStatus = statusFilter === "all" || r.status === statusFilter
    const matchesCategory = categoryFilter === "all" || r.category === categoryFilter
    const matchesSearch = searchTerm === "" || 
      r.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.userName.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesStatus && matchesCategory && matchesSearch
  })

  const stats = {
    draft: reimbursements.filter((r) => r.status === "DRAFT").length,
    submitted: reimbursements.filter((r) => r.status === "SUBMITTED").length,
    approved: reimbursements.filter((r) => r.status === "APPROVED").length,
    paid: reimbursements.filter((r) => r.status === "PAID").length,
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR")
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">Gerencie suas solicitações de reembolso</p>
          </div>
          <Button asChild>
            <Link to="/reimbursements/new">
              <Plus className="mr-2 h-4 w-4" />
              Nova Solicitação
            </Link>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rascunhos</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.draft}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Enviados</CardTitle>
              <Clock className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.submitted}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aprovados</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.approved}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pagos</CardTitle>
              <DollarSign className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.paid}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Solicitações de Reembolso</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por descrição ou colaborador..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  {categories.filter(c => c.active).map((category) => (
                    <SelectItem key={category.id} value={category.name}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Spinner className="h-8 w-8 text-primary" />
              </div>
            ) : filteredReimbursements.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <XCircle className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="text-lg font-semibold">Nenhuma solicitação encontrada</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {reimbursements.length === 0
                    ? "Comece criando sua primeira solicitação de reembolso"
                    : "Tente ajustar os filtros de busca"}
                </p>
                {reimbursements.length === 0 && (
                  <Button asChild className="mt-4">
                    <Link to="/reimbursements/new">
                      <Plus className="mr-2 h-4 w-4" />
                      Nova Solicitação
                    </Link>
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Status</TableHead>
                      {user?.role !== "EMPLOYEE" && <TableHead>Colaborador</TableHead>}
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReimbursements.map((reimbursement) => (
                      <TableRow key={reimbursement.id}>
                        <TableCell className="font-medium max-w-[200px] truncate">
                          {reimbursement.description}
                        </TableCell>
                        <TableCell>{reimbursement.category}</TableCell>
                        <TableCell>{formatCurrency(reimbursement.amount)}</TableCell>
                        <TableCell>{formatDate(reimbursement.expenseDate)}</TableCell>
                        <TableCell>
                          <StatusBadge status={reimbursement.status} />
                        </TableCell>
                        {user?.role !== "EMPLOYEE" && (
                          <TableCell>{reimbursement.userName}</TableCell>
                        )}
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" asChild>
                            <Link to={`/reimbursements/${reimbursement.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              Ver
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
