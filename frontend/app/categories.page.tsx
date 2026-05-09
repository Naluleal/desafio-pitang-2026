import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { AppLayout } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useAuth } from "@/auth.context"
import { categoriesApi } from "@/lib/api"
import type { Category } from "@/lib/types"
import { Plus, Edit, AlertCircle, Check, FolderOpen } from "lucide-react"

export default function CategoriesPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Create dialog state
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [isCreating, setIsCreating] = useState(false)

  // Edit dialog state
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [editCategoryName, setEditCategoryName] = useState("")
  const [isEditing, setIsEditing] = useState(false)

  // Toggle loading state
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const loadCategories = useCallback(async () => {
    try {
      setIsLoading(true)
      setError("")
      const data = await categoriesApi.getAll()
      setCategories(data)
    } catch {
      setError("Erro ao carregar categorias")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    // Redirect non-admin users
    if (user && user.role !== "ADMIN") {
      navigate("/dashboard")
      return
    }
    loadCategories()
  }, [user, navigate, loadCategories])

  const handleCreate = async () => {
    if (!newCategoryName.trim()) {
      setError("Nome da categoria é obrigatório")
      return
    }

    setIsCreating(true)
    setError("")
    setSuccess("")

    try {
      const newCategory = await categoriesApi.create(newCategoryName.trim())
      setCategories([...categories, newCategory])
      setShowCreateDialog(false)
      setNewCategoryName("")
      setSuccess("Categoria criada com sucesso!")
      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar categoria")
    } finally {
      setIsCreating(false)
    }
  }

  const handleEdit = async () => {
    if (!editingCategory || !editCategoryName.trim()) {
      setError("Nome da categoria é obrigatório")
      return
    }

    setIsEditing(true)
    setError("")
    setSuccess("")

    try {
      const updatedCategory = await categoriesApi.update(editingCategory.id, editCategoryName.trim())
      setCategories(categories.map(c => c.id === updatedCategory.id ? updatedCategory : c))
      setShowEditDialog(false)
      setEditingCategory(null)
      setEditCategoryName("")
      setSuccess("Categoria atualizada com sucesso!")
      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao atualizar categoria")
    } finally {
      setIsEditing(false)
    }
  }

  const handleToggleActive = async (category: Category) => {
    setTogglingId(category.id)
    setError("")
    setSuccess("")

    try {
      const updatedCategory = await categoriesApi.toggleActive(category.id)
      setCategories(categories.map(c => c.id === updatedCategory.id ? updatedCategory : c))
      setSuccess(`Categoria ${updatedCategory.active ? "ativada" : "desativada"} com sucesso!`)
      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao alterar status da categoria")
    } finally {
      setTogglingId(null)
    }
  }

  const openEditDialog = (category: Category) => {
    setEditingCategory(category)
    setEditCategoryName(category.name)
    setShowEditDialog(true)
  }

  if (user?.role !== "ADMIN") {
    return null
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Gestão de Categorias</h1>
            <p className="text-muted-foreground">Gerencie as categorias de reembolso</p>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nova Categoria
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Categoria</DialogTitle>
                <DialogDescription>
                  Adicione uma nova categoria de reembolso
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="new-category-name">Nome da categoria</Label>
                  <Input
                    id="new-category-name"
                    placeholder="Ex: Viagem"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreate} disabled={isCreating}>
                  {isCreating ? (
                    <>
                      <Spinner className="mr-2 h-4 w-4" />
                      Criando...
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Criar
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-200 bg-green-50 text-green-800">
            <Check className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Categorias</CardTitle>
            <CardDescription>
              {categories.length === 0
                ? "Nenhuma categoria cadastrada"
                : `${categories.length} categoria(s) cadastrada(s)`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Spinner className="h-8 w-8 text-primary" />
              </div>
            ) : categories.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FolderOpen className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="text-lg font-semibold">Nenhuma categoria encontrada</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Comece criando sua primeira categoria
                </p>
                <Button className="mt-4" onClick={() => setShowCreateDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Categoria
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ativa</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell>
                        <Badge variant={category.active ? "default" : "secondary"}>
                          {category.active ? "Ativa" : "Inativa"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={category.active}
                          onCheckedChange={() => handleToggleActive(category)}
                          disabled={togglingId === category.id}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(category)}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Categoria</DialogTitle>
              <DialogDescription>
                Altere o nome da categoria
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-category-name">Nome da categoria</Label>
                <Input
                  id="edit-category-name"
                  value={editCategoryName}
                  onChange={(e) => setEditCategoryName(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleEdit} disabled={isEditing}>
                {isEditing ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Salvar
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  )
}
