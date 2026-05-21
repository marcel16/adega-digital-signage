"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { TVForm } from "@/components/forms/tv-form"
import { TV, Store } from "@/types"
import api from "@/lib/api"
import { toast } from "sonner"
import { Plus, Search, Copy, Edit, Trash2, QrCode, RefreshCw } from "lucide-react"

export default function TVsPage() {
  const [tvs, setTvs] = useState<TV[]>([])
  const [stores, setStores] = useState<Store[]>([])
  const [search, setSearch] = useState("")
  const [editingTV, setEditingTV] = useState<TV | null>(null)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const fetch = async () => {
    setLoading(true)
    try {
      const [tvsRes, storesRes] = await Promise.all([
        api.get("/tvs"),
        api.get("/stores"),
      ])
      setTvs(tvsRes.data.data || tvsRes.data)
      setStores(storesRes.data.data || storesRes.data)
    } catch {
      toast.error("Erro ao carregar TVs")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetch() }, [])

  const handleSubmit = async (formData: Partial<TV>) => {
    try {
      if (editingTV) {
        await api.put(`/tvs/${editingTV.id}`, formData)
        toast.success("TV atualizada!")
      } else {
        await api.post("/tvs", formData)
        toast.success("TV criada!")
      }
      setOpen(false)
      setEditingTV(null)
      fetch()
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Erro ao salvar TV")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza?")) return
    try {
      await api.delete(`/tvs/${id}`)
      toast.success("TV excluída!")
      fetch()
    } catch {
      toast.error("Erro ao excluir TV")
    }
  }

  const regenerateCode = async (tv: TV) => {
    try {
      const { data } = await api.post(`/tvs/${tv.id}/regenerate-code`)
      toast.success("Novo código gerado!")
      fetch()
    } catch {
      toast.error("Erro ao gerar código")
    }
  }

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copiado!`)
  }

  const statusVariant: Record<string, "success" | "secondary" | "warning" | "destructive"> = {
    ONLINE: "success", OFFLINE: "secondary", PAUSED: "warning", ERROR: "destructive",
  }

  const statusLabel: Record<string, string> = {
    ONLINE: "Online", OFFLINE: "Offline", PAUSED: "Pausada", ERROR: "Erro",
  }

  const filtered = tvs.filter((tv) =>
    tv.name.toLowerCase().includes(search.toLowerCase()) ||
    tv.pairingCode.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Input placeholder="Buscar TVs..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-72" />
          <Button variant="outline" size="icon"><Search className="h-4 w-4" /></Button>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditingTV(null) }}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Nova TV</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingTV ? "Editar TV" : "Nova TV"}</DialogTitle>
              <DialogDescription>Configure a TV para exibição</DialogDescription>
            </DialogHeader>
            <TVForm tv={editingTV} stores={stores} onSubmit={handleSubmit} onCancel={() => { setOpen(false); setEditingTV(null) }} />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>TVs ({tvs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Código Pareamento</TableHead>
                <TableHead>Loja</TableHead>
                <TableHead>Modelo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Último Ping</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((tv) => (
                <TableRow key={tv.id}>
                  <TableCell className="font-medium">{tv.name}</TableCell>
                  <TableCell>
                    <code className="rounded bg-muted px-2 py-0.5 text-sm">{tv.pairingCode}</code>
                    <Button variant="ghost" size="icon" className="ml-1 h-6 w-6" onClick={() => copyText(tv.pairingCode, "Código")}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  </TableCell>
                  <TableCell>{tv.store?.name || "—"}</TableCell>
                  <TableCell>{tv.model || "—"}</TableCell>
                  <TableCell><Badge variant={statusVariant[tv.status]}>{statusLabel[tv.status]}</Badge></TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {tv.lastPingAt ? new Date(tv.lastPingAt).toLocaleString("pt-BR") : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => copyText(tv.m3uUrl || `${window.location.origin}/api/tvs/${tv.id}/m3u`, "M3U")} title="Copiar M3U URL">
                      <QrCode className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => regenerateCode(tv)} title="Novo código">
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => { setEditingTV(tv); setOpen(true) }}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(tv.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Nenhuma TV encontrada</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
