"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import api from "@/lib/api"
import { toast } from "sonner"
import { User, Building, Shield } from "lucide-react"

interface UserData {
  id: string
  name: string
  email: string
  phone?: string
}

interface TenantData {
  id: string
  name: string
  slug: string
  document?: string
  plan: string
  planStatus: string
}

export default function SettingsPage() {
  const [user, setUser] = useState<UserData | null>(null)
  const [tenant, setTenant] = useState<TenantData | null>(null)

  // Profile form
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [savingProfile, setSavingProfile] = useState(false)

  // Security form
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [savingPassword, setSavingPassword] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem("@adega:user")
    if (stored) {
      try {
        const u = JSON.parse(stored)
        setUser(u)
        setName(u.name || "")
        setEmail(u.email || "")
        setPhone(u.phone || "")
      } catch { /* ignore */ }
    }
    api.get("/tenant").then(({ data }) => setTenant(data)).catch(() => {})
  }, [])

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingProfile(true)
    try {
      const { data } = await api.put("/users/profile", { name, email, phone })
      localStorage.setItem("@adega:user", JSON.stringify(data))
      setUser(data)
      toast.success("Perfil atualizado!")
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Erro ao atualizar")
    } finally {
      setSavingProfile(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      toast.error("Senhas não conferem")
      return
    }
    setSavingPassword(true)
    try {
      await api.put("/users/password", { currentPassword, newPassword })
      toast.success("Senha alterada!")
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("")
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Erro ao alterar senha")
    } finally {
      setSavingPassword(false)
    }
  }

  const planStatusLabel: Record<string, string> = {
    ACTIVE: "Ativo", TRIAL: "Trial", EXPIRED: "Expirado", CANCELED: "Cancelado",
  }
  const planStatusVariant: Record<string, "success" | "warning" | "destructive" | "secondary"> = {
    ACTIVE: "success", TRIAL: "warning", EXPIRED: "destructive", CANCELED: "secondary",
  }

  return (
    <div className="max-w-3xl">
      <Tabs defaultValue="profile">
        <TabsList className="mb-6">
          <TabsTrigger value="profile"><User className="mr-2 h-4 w-4" /> Perfil</TabsTrigger>
          <TabsTrigger value="account"><Building className="mr-2 h-4 w-4" /> Conta</TabsTrigger>
          <TabsTrigger value="security"><Shield className="mr-2 h-4 w-4" /> Segurança</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Perfil</CardTitle>
              <CardDescription>Gerencie suas informações pessoais</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="s-name">Nome</Label>
                  <Input id="s-name" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="s-email">Email</Label>
                  <Input id="s-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="s-phone">Telefone</Label>
                  <Input id="s-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
                <Button type="submit" disabled={savingProfile}>
                  {savingProfile ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>Conta</CardTitle>
              <CardDescription>Informações da sua conta e plano</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {tenant && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground text-xs">Nome da Conta</Label>
                      <p className="font-medium">{tenant.name}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">Slug</Label>
                      <p className="font-medium">{tenant.slug}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">Documento</Label>
                      <p className="font-medium">{tenant.document || "—"}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">Plano</Label>
                      <p className="font-medium">{tenant.plan}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">Status</Label>
                      <Badge variant={planStatusVariant[tenant.planStatus]}>{planStatusLabel[tenant.planStatus]}</Badge>
                    </div>
                  </div>
                  <Button variant="outline" onClick={() => window.location.href = "/dashboard/billing"}>
                    Gerenciar Plano
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Segurança</CardTitle>
              <CardDescription>Altere sua senha</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-pw">Senha Atual</Label>
                  <Input id="current-pw" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-pw">Nova Senha</Label>
                  <Input id="new-pw" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-pw">Confirmar Nova Senha</Label>
                  <Input id="confirm-pw" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                </div>
                <Button type="submit" disabled={savingPassword}>
                  {savingPassword ? "Alterando..." : "Alterar Senha"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
