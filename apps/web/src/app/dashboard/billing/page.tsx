"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tenant, Invoice } from "@/types"
import api from "@/lib/api"
import { formatCurrency, formatDate } from "@/lib/utils"
import { toast } from "sonner"
import { CreditCard, Check, Star } from "lucide-react"

const plans = [
  {
    name: "Free",
    price: 0,
    period: "/mês",
    features: ["1 loja", "1 TV", "100 MB armazenamento", "Mídias ilimitadas", "Suporte por email"],
    key: "FREE",
  },
  {
    name: "Starter",
    price: 29.90,
    period: "/mês",
    features: ["3 lojas", "5 TVs", "1 GB armazenamento", "Campanhas ilimitadas", "Agendamento básico", "Suporte prioritário"],
    key: "STARTER",
    popular: true,
  },
  {
    name: "Professional",
    price: 79.90,
    period: "/mês",
    features: ["10 lojas", "20 TVs", "10 GB armazenamento", "Editor de campanhas", "IPTV completo", "Overlays", "Suporte 24/7"],
    key: "PROFESSIONAL",
  },
  {
    name: "Enterprise",
    price: 199.90,
    period: "/mês",
    features: ["Lojas ilimitadas", "TVs ilimitadas", "100 GB armazenamento", "Todas as funcionalidades", "API dedicada", "Gerente de conta", "SLA garantido"],
    key: "ENTERPRISE",
  },
]

export default function BillingPage() {
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [coupon, setCoupon] = useState("")

  useEffect(() => {
    Promise.all([
      api.get("/tenant").then(({ data }) => setTenant(data)),
      api.get("/invoices").then(({ data }) => setInvoices(data.data || data)),
    ]).catch(() => toast.error("Erro ao carregar dados"))
  }, [])

  const handleUpgrade = async (plan: string) => {
    try {
      await api.post("/tenant/upgrade", { plan })
      toast.success(`Plano alterado para ${plan}!`)
      const { data } = await api.get("/tenant")
      setTenant(data)
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Erro ao alterar plano")
    }
  }

  const handleCoupon = async () => {
    if (!coupon) return
    try {
      await api.post("/tenant/coupon", { code: coupon })
      toast.success("Cupom aplicado!")
      setCoupon("")
    } catch { toast.error("Cupom inválido") }
  }

  const planStatusLabel: Record<string, string> = {
    ACTIVE: "Ativo", TRIAL: "Trial", EXPIRED: "Expirado", CANCELED: "Cancelado",
  }

  const planStatusVariant: Record<string, "success" | "warning" | "destructive" | "secondary"> = {
    ACTIVE: "success", TRIAL: "warning", EXPIRED: "destructive", CANCELED: "secondary",
  }

  const invoiceStatusVariant: Record<string, "success" | "warning" | "destructive" | "secondary"> = {
    PAID: "success", PENDING: "warning", CANCELED: "secondary", REFUNDED: "info",
  }

  return (
    <div className="space-y-6">
      {tenant && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Plano Atual</CardTitle>
              <CardDescription>Seu plano e status de assinatura</CardDescription>
            </div>
            <Badge variant={planStatusVariant[tenant.planStatus]} className="text-sm px-3 py-1">
              {planStatusLabel[tenant.planStatus]}
            </Badge>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold">{tenant.plan}</p>
              <p className="text-sm text-muted-foreground">
                {tenant.planRenewalAt ? `Renova em ${formatDate(tenant.planRenewalAt)}` : tenant.trialEndsAt ? `Trial até ${formatDate(tenant.trialEndsAt)}` : "Sem data de renovação"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Armazenamento</p>
              <p className="text-sm font-medium">{Math.round((tenant.storageUsed / (1024 * 1024)) * 100) / 100} MB / {Math.round((tenant.storageLimit / (1024 * 1024)) * 100) / 100} MB</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {plans.map((plan) => {
          const isCurrent = tenant?.plan === plan.key
          return (
            <Card key={plan.key} className={`relative flex flex-col ${plan.popular ? "border-primary shadow-md" : ""}`}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground"><Star className="mr-1 h-3 w-3" /> Mais Popular</Badge>
                </div>
              )}
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription className="mt-2">
                  <span className="text-3xl font-bold text-foreground">{plan.price === 0 ? "Grátis" : formatCurrency(plan.price)}</span>
                  {plan.period && <span className="text-muted-foreground">{plan.period}</span>}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col">
                <ul className="mb-6 flex-1 space-y-2">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 text-emerald-500 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full"
                  variant={isCurrent ? "secondary" : plan.popular ? "default" : "outline"}
                  disabled={isCurrent}
                  onClick={() => handleUpgrade(plan.key)}
                >
                  {isCurrent ? "Plano Atual" : plan.price === 0 ? "Começar Grátis" : "Assinar"}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cupom de Desconto</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Input placeholder="Digite o código do cupom" value={coupon} onChange={(e) => setCoupon(e.target.value)} />
            <Button onClick={handleCoupon} variant="secondary">Aplicar</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Histórico de Faturas</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="text-xs">{formatDate(inv.dueDate)}</TableCell>
                    <TableCell>{inv.plan}</TableCell>
                    <TableCell>{formatCurrency(inv.amount)}</TableCell>
                    <TableCell><Badge variant={invoiceStatusVariant[inv.status]}>{inv.status}</Badge></TableCell>
                  </TableRow>
                ))}
                {invoices.length === 0 && (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-4">Nenhuma fatura</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
