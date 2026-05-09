import type {
  Attachment,
  Category,
  LoginCredentials,
  RegisterData,
  Reimbursement,
  User,
} from "@/lib/types"

const API_URL = import.meta.env.VITE_API_URL ?? "/api"

function getToken() {
  return localStorage.getItem("pitang_token")
}

async function request<T>(path: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers)
  const token = getToken()

  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json")
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`)
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  })

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(data?.message ?? "Request failed")
  }

  return data as T
}

function mapCategory(category: { id: string; name: string; isActive?: boolean; active?: boolean }): Category {
  return {
    ...category,
    active: category.active ?? category.isActive ?? true,
  }
}

function mapReimbursement(data: any): Reimbursement {
  return {
    id: data.id,
    description: data.description,
    amount: Number(data.amount),
    expenseDate: String(data.expenseDate).slice(0, 10),
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    status: data.status,
    rejectionReason: data.rejectionReason,
    userId: data.userId,
    userName: data.user?.name ?? data.userName ?? "Usuário",
    categoryId: data.categoryId,
    category: data.category?.name ?? data.category ?? "",
    attachments: data.attachments ?? [],
    histories: data.histories ?? [],
  }
}

async function findCategoryId(categoryNameOrId: string) {
  const categories = await categoriesApi.getAll()
  const category = categories.find((item) => item.id === categoryNameOrId || item.name === categoryNameOrId)

  if (!category) {
    throw new Error("Categoria não encontrada")
  }

  return category.id
}

export const authApi = {
  async login(credentials: LoginCredentials) {
    const data = await request<{ token: string; user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    })

    localStorage.setItem("pitang_token", data.token)
    return { ...data.user, token: data.token }
  },

  async register(data: RegisterData) {
    return request<User>("/users", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },
}

export const categoriesApi = {
  async getAll() {
    const categories = await request<Array<{ id: string; name: string; isActive: boolean }>>("/categories")
    return categories.map(mapCategory)
  },

  async create(name: string) {
    const category = await request<{ id: string; name: string; isActive: boolean }>("/categories", {
      method: "POST",
      body: JSON.stringify({ name }),
    })

    return mapCategory(category)
  },

  async update(id: string, name: string) {
    const category = await request<{ id: string; name: string; isActive: boolean }>(`/categories/${id}`, {
      method: "PUT",
      body: JSON.stringify({ name }),
    })

    return mapCategory(category)
  },

  async toggleActive(id: string) {
    const categories = await categoriesApi.getAll()
    const currentCategory = categories.find((category) => category.id === id)

    if (!currentCategory) {
      throw new Error("Categoria não encontrada")
    }

    const category = await request<{ id: string; name: string; isActive: boolean }>(`/categories/${id}`, {
      method: "PUT",
      body: JSON.stringify({ isActive: !currentCategory.active }),
    })

    return mapCategory(category)
  },

  async remove(id: string) {
    const category = await request<{ id: string; name: string; isActive: boolean }>(`/categories/${id}`, {
      method: "DELETE",
    })

    return mapCategory(category)
  },
}

export const reimbursementsApi = {
  async getAll(_userId?: string, _role?: string) {
    const reimbursements = await request<any[]>("/reimbursements")
    return reimbursements.map(mapReimbursement)
  },

  async getById(id: string) {
    const reimbursement = await request<any>(`/reimbursements/${id}`)
    return mapReimbursement(reimbursement)
  },

  async create(
    data: {
      description: string
      amount: number
      expenseDate: string
      category: string
      attachments?: Attachment[]
    },
    _user: User,
  ) {
    const categoryId = await findCategoryId(data.category)
    const reimbursement = await request<any>("/reimbursements", {
      method: "POST",
      body: JSON.stringify({
        description: data.description,
        amount: data.amount,
        expenseDate: data.expenseDate,
        categoryId,
      }),
    })

    const mapped = mapReimbursement(reimbursement)

    if (data.attachments?.length) {
      const attachments = await Promise.all(
        data.attachments.map((attachment) =>
          request<Attachment>(`/reimbursements/${mapped.id}/attachments`, {
            method: "POST",
            body: JSON.stringify({
              fileName: attachment.fileName,
              fileUrl: `${API_URL}/files/${encodeURIComponent(attachment.fileName)}`,
              fileType: attachment.fileType,
            }),
          }),
        ),
      )
      return { ...mapped, attachments }
    }

    return mapped
  },

  async update(
    id: string,
    data: {
      description: string
      amount: number
      expenseDate: string
      category: string
      attachments?: Attachment[]
    },
    _user: User,
  ) {
    const categoryId = await findCategoryId(data.category)
    const reimbursement = await request<any>(`/reimbursements/${id}`, {
      method: "PUT",
      body: JSON.stringify({
        description: data.description,
        amount: data.amount,
        expenseDate: data.expenseDate,
        categoryId,
      }),
    })

    return mapReimbursement(reimbursement)
  },

  async submit(id: string) {
    const reimbursement = await request<any>(`/reimbursements/${id}/submit`, {
      method: "POST",
    })

    return mapReimbursement(reimbursement)
  },

  async cancel(id: string) {
    const reimbursement = await request<any>(`/reimbursements/${id}/cancel`, {
      method: "POST",
    })

    return mapReimbursement(reimbursement)
  },

  async approve(id: string) {
    const reimbursement = await request<any>(`/reimbursements/${id}/approve`, {
      method: "POST",
    })

    return mapReimbursement(reimbursement)
  },

  async reject(id: string, rejectionReason: string) {
    const reimbursement = await request<any>(`/reimbursements/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({ rejectionReason }),
    })

    return mapReimbursement(reimbursement)
  },

  async pay(id: string) {
    const reimbursement = await request<any>(`/reimbursements/${id}/pay`, {
      method: "POST",
    })

    return mapReimbursement(reimbursement)
  },

  async remove(id: string) {
    const reimbursement = await request<any>(`/reimbursements/${id}`, {
      method: "DELETE",
    })

    return mapReimbursement(reimbursement)
  },
}
