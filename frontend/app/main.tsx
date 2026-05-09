import React from "react"
import ReactDOM from "react-dom/client"
import { BrowserRouter, Route, Routes } from "react-router-dom"
import { AuthProvider } from "./auth.context"
import HomePage from "./app.page"
import CategoriesPage from "./categories.page"
import DashboardPage from "./dashboard.page"
import LoginPage from "./login.page"
import RegisterPage from "./register.page"
import ReimbursementDetailPage from "./reimbursement.detail.page"
import EditReimbursementPage from "./reimbursement.edit.page"
import NewReimbursementPage from "./reimbursement.new.page"
import "./globals.css"

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/reimbursements/new" element={<NewReimbursementPage />} />
          <Route path="/reimbursements/:id" element={<ReimbursementDetailPage />} />
          <Route path="/reimbursements/:id/edit" element={<EditReimbursementPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
