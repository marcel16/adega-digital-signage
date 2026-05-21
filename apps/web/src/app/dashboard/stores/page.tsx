"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { StoreForm } from "@/components/forms/store-form"
import { Store } from "@/types"
import api from "@/lib/api"
import { toast } from "sonner"
import { Plus, Search, Copy, Edit, Trash2 } from "lucide-react"

export default function StoresPage() {
  const [stores, setStores] = useState<Store[]>([])
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [editingStore, setEditingStore] = useState<Store | null>(null)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const limit = 10

  const fetchStores = async () => {
    setLoading(true)
    try {
      const { data } = await api.get("/stores", { params: { page, limit, search } })
      setStores(data.data || data)
      setTotal(data.total || data.length)
    } catch {
      toast.error("Erro ao carregar lojas")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchStores() }, [page, search])

  const handleSubmit = async (formData: Partial<Store>) => {
    try {
      if (editingStore) {
        await api.put(`/stores/${editingStore.id}`, formData)
        toast.success("Loja atualizada!")
      } else {
        await api.post("/stores", formData)
        toast.success("Loja criada!")
      }
      setOpen(false)
      setEditingStore(null)
      fetchStores()
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Erro ao salvar loja")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta loja?")) return
    try {
      await api.delete(`/stores/${id}`)
      toast.success("Loja excluída!")
      fetchStores()
    } catch {
      toast.error("Erro ao excluir loja")
    }
  }

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    toast.success("Código copiado!")
  }

  const filtered = stores.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.code?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Buscar lojas..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="w-72"
          />
          <Button variant="outline" size="icon"><Search className="h-4 w-4" /></Button>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditingStore(null) }}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Nova Loja</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingStore ? "Editar Loja" : "Nova Loja"}</DialogTitle>
              <DialogDescription>Preencha os dados da loja/adega</DialogDescription>
            </DialogHeader>
            <StoreForm store={editingStore} onSubmit={handleSubmit} onCancel={() => { setOpen(false); setEditingStore(null) }} />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lojas / Adegas ({total})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Código</TableHead>
                <TableHead>Documento</TableHead>
                <TableHead>Cidade/Estado</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((store) => (
                <TableRow key={store.id}>
                  <TableCell className="font-medium">{store.name}</TableCell>
                  <TableCell>
                    <code className="rounded bg-muted px-2 py-0.5 text-sm">{store.code}</code>
                    <Button variant="ghost" size="icon" className="ml-1 h-6 w-6" onClick={() => copyCode(store.code)}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  </TableCell>
                  <TableCell>{store.document || "—"}</TableCell>
                  <TableCell>{store.city ? `${store.city}${store.state ? `/${store.state}` : ""}` : "—"}</TableCell>
                  <TableCell><Badge variant={store.isActive ? "success" : "secondary"}>{store.isActive ? "Ativo" : "Inativo"}</Badge></TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => { setEditingStore(store); setOpen(true) }}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(store.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhuma loja encontrada</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
