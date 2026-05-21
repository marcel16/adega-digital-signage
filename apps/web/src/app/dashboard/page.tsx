"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Store, Monitor, Image, HardDrive, Plus, TrendingUp, Clock } from "lucide-react"
import { formatBytes } from "@/lib/utils"
import api from "@/lib/api"
import { toast } from "sonner"

interface DashboardStats {
  stores: number
  tvsOnline: number
  tvsOffline: number
  totalTvs: number
  mediaCount: number
  storageUsed: number
  storageLimit: number
  campaignsByStatus: { status: string; count: number }[]
  recentActivity: { action: string; target: string; createdAt: string }[]
}

export default function DashboardPage() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)

  useEffect(() => {
    api.get("/dashboard").then(({ data }) => setStats(data)).catch(() => toast.error("Erro ao carregar dashboard"))
  }, [])

  if (!stats) {
    return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
  }

  const cards = [
    { label: "Lojas/Adegas", value: stats.stores, icon: Store, href: "/dashboard/stores" },
    { label: "TVs Online", value: stats.tvsOnline, icon: Monitor, href: "/dashboard/tvs", color: "text-emerald-500" },
    { label: "TVs Offline", value: stats.tvsOffline, icon: Monitor, href: "/dashboard/tvs", color: "text-muted-foreground" },
    { label: "Mídias", value: stats.mediaCount, icon: Image, href: "/dashboard/media" },
    { label: "Armazenamento", value: formatBytes(stats.storageUsed), icon: HardDrive, subtitle: `de ${formatBytes(stats.storageLimit)}`, href: "/dashboard/media" },
  ]

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {cards.map((c) => {
          const Icon = c.icon
          return (
            <Card key={c.label} className="cursor-pointer transition-shadow hover:shadow-md" onClick={() => router.push(c.href)}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{c.label}</CardTitle>
                <Icon className={`h-4 w-4 ${c.color || "text-primary"}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{c.value}</div>
                {c.subtitle && <p className="text-xs text-muted-foreground">{c.subtitle}</p>}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><TrendingUp className="h-4 w-4" /> Campanhas por Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.campaignsByStatus.map((c) => (
                <div key={c.status} className="flex items-center justify-between">
                  <Badge variant={c.status === "ACTIVE" ? "success" : c.status === "PAUSED" ? "warning" : c.status === "DRAFT" ? "secondary" : "outline"}>
                    {c.status === "ACTIVE" ? "Ativa" : c.status === "PAUSED" ? "Pausada" : c.status === "DRAFT" ? "Rascunho" : c.status === "COMPLETED" ? "Concluída" : "Cancelada"}
                  </Badge>
                  <span className="font-semibold">{c.count}</span>
                </div>
              ))}
              {stats.campaignsByStatus.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma campanha criada</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Clock className="h-4 w-4" /> Atividades Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recentActivity.map((a, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{a.action} <strong>{a.target}</strong></span>
                  <span className="text-xs text-muted-foreground">{new Date(a.createdAt).toLocaleString("pt-BR")}</span>
                </div>
              ))}
              {stats.recentActivity.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma atividade recente</p>}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button onClick={() => router.push("/dashboard/media")}><Plus className="mr-2 h-4 w-4" /> Nova Mídia</Button>
          <Button onClick={() => router.push("/dashboard/campaigns")} variant="secondary"><Plus className="mr-2 h-4 w-4" /> Nova Campanha</Button>
          <Button onClick={() => router.push("/dashboard/tvs")} variant="outline"><Plus className="mr-2 h-4 w-4" /> Nova TV</Button>
        </CardContent>
      </Card>
    </div>
  )
}
