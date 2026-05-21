"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CampaignForm } from "@/components/forms/campaign-form"
import { Campaign, Store } from "@/types"
import api from "@/lib/api"
import { formatDate } from "@/lib/utils"
import { toast } from "sonner"
import { Plus, Edit, Trash2, Copy, Play, Pause, CheckCircle, XCircle } from "lucide-react"

export default function CampaignsPage() {
  const router = useRouter()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [stores, setStores] = useState<Store[]>([])
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null)
  const [open, setOpen] = useState(false)

  const fetch = async () => {
    try {
      const [campRes, storesRes] = await Promise.all([api.get("/campaigns"), api.get("/stores")])
      setCampaigns(campRes.data.data || campRes.data)
      setStores(storesRes.data.data || storesRes.data)
    } catch { toast.error("Erro ao carregar campanhas") }
  }

  useEffect(() => { fetch() }, [])

  const handleSubmit = async (formData: Partial<Campaign>) => {
    try {
      if (editingCampaign) {
        await api.put(`/campaigns/${editingCampaign.id}`, formData)
        toast.success("Campanha atualizada!")
      } else {
        await api.post("/campaigns", formData)
        toast.success("Campanha criada!")
      }
      setOpen(false)
      setEditingCampaign(null)
      fetch()
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Erro ao salvar")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir campanha?")) return
    try { await api.delete(`/campaigns/${id}`); toast.success("Campanha excluída!"); fetch() }
    catch { toast.error("Erro ao excluir") }
  }

  const handleStatus = async (id: string, status: string) => {
    try { await api.patch(`/campaigns/${id}/status`, { status }); toast.success("Status atualizado!"); fetch() }
    catch { toast.error("Erro ao atualizar status") }
  }

  const handleDuplicate = async (campaign: Campaign) => {
    try {
      const { data } = await api.post(`/campaigns/${campaign.id}/duplicate`)
      toast.success("Campanha duplicada!")
      fetch()
    } catch { toast.error("Erro ao duplicar") }
  }

  const statusVariant: Record<string, "success" | "secondary" | "warning" | "outline" | "destructive"> = {
    ACTIVE: "success", DRAFT: "secondary", PAUSED: "warning", COMPLETED: "outline", CANCELED: "destructive",
  }

  const statusLabel: Record<string, string> = {
    DRAFT: "Rascunho", ACTIVE: "Ativa", PAUSED: "Pausada", COMPLETED: "Concluída", CANCELED: "Cancelada",
  }

  const priorityBadge: Record<string, "outline" | "secondary" | "warning" | "destructive"> = {
    LOW: "outline", NORMAL: "secondary", HIGH: "warning", URGENT: "destructive",
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Campanhas ({campaigns.length})</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push("/dashboard/campaigns/editor")}>
            <Edit className="mr-2 h-4 w-4" /> Editor Avançado
          </Button>
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditingCampaign(null) }}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" /> Nova Campanha</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingCampaign ? "Editar Campanha" : "Nova Campanha"}</DialogTitle>
                <DialogDescription>Configure os detalhes da campanha</DialogDescription>
              </DialogHeader>
              <CampaignForm campaign={editingCampaign} stores={stores} onSubmit={handleSubmit} onCancel={() => { setOpen(false); setEditingCampaign(null) }} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Prioridade</TableHead>
                <TableHead>Datas</TableHead>
                <TableHead>Loja</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell><Badge variant="outline">{c.type}</Badge></TableCell>
                  <TableCell><Badge variant={statusVariant[c.status]}>{statusLabel[c.status]}</Badge></TableCell>
                  <TableCell><Badge variant={priorityBadge[c.priority]}>{c.priority}</Badge></TableCell>
                  <TableCell className="text-xs">{formatDate(c.startDate)}{c.endDate ? ` — ${formatDate(c.endDate)}` : ""}</TableCell>
                  <TableCell>{c.store?.name || "—"}</TableCell>
                  <TableCell className="text-right">
                    {c.status === "DRAFT" && <Button variant="ghost" size="icon" onClick={() => handleStatus(c.id, "ACTIVE")} title="Ativar"><Play className="h-4 w-4 text-emerald-500" /></Button>}
                    {c.status === "ACTIVE" && <Button variant="ghost" size="icon" onClick={() => handleStatus(c.id, "PAUSED")} title="Pausar"><Pause className="h-4 w-4 text-amber-500" /></Button>}
                    {c.status !== "COMPLETED" && c.status !== "CANCELED" && (
                      <>
                        <Button variant="ghost" size="icon" onClick={() => handleStatus(c.id, "COMPLETED")} title="Concluir"><CheckCircle className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleStatus(c.id, "CANCELED")} title="Cancelar"><XCircle className="h-4 w-4 text-destructive" /></Button>
                      </>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => handleDuplicate(c)} title="Duplicar"><Copy className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => { setEditingCampaign(c); setOpen(true) }}><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              ))}
              {campaigns.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Nenhuma campanha</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
