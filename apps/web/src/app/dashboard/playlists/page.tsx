"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Playlist, PlaylistItem, Media } from "@/types"
import api from "@/lib/api"
import { toast } from "sonner"
import { Plus, Edit, Trash2, ArrowUp, ArrowDown, Download, ListMusic } from "lucide-react"

export default function PlaylistsPage() {
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [media, setMedia] = useState<Media[]>([])
  const [open, setOpen] = useState(false)
  const [manageOpen, setManageOpen] = useState(false)
  const [editing, setEditing] = useState<Playlist | null>(null)
  const [managing, setManaging] = useState<Playlist | null>(null)

  // Form
  const [formName, setFormName] = useState("")
  const [formDesc, setFormDesc] = useState("")

  const fetch = async () => {
    try {
      const [playRes, mediaRes] = await Promise.all([api.get("/playlists"), api.get("/media")])
      setPlaylists(playRes.data.data || playRes.data)
      setMedia(mediaRes.data.data || mediaRes.data)
    } catch { toast.error("Erro ao carregar playlists") }
  }

  useEffect(() => { fetch() }, [])

  const resetForm = () => { setFormName(""); setFormDesc(""); setEditing(null) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editing) {
        await api.put(`/playlists/${editing.id}`, { name: formName, description: formDesc })
        toast.success("Playlist atualizada!")
      } else {
        await api.post("/playlists", { name: formName, description: formDesc })
        toast.success("Playlist criada!")
      }
      setOpen(false); resetForm(); fetch()
    } catch (err: any) { toast.error(err.response?.data?.message || "Erro") }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir playlist?")) return
    try { await api.delete(`/playlists/${id}`); toast.success("Excluída!"); fetch() }
    catch { toast.error("Erro") }
  }

  const addMediaToPlaylist = async (mediaId: string) => {
    if (!managing) return
    try {
      const items = managing.items || []
      await api.post(`/playlists/${managing.id}/items`, {
        mediaId, order: items.length, duration: 10,
      })
      toast.success("Mídia adicionada!")
      const { data } = await api.get(`/playlists/${managing.id}`)
      setManaging(data)
    } catch { toast.error("Erro") }
  }

  const removeItem = async (itemId: string) => {
    if (!managing) return
    try {
      await api.delete(`/playlists/${managing.id}/items/${itemId}`)
      toast.success("Removido!")
      const { data } = await api.get(`/playlists/${managing.id}`)
      setManaging(data)
    } catch { toast.error("Erro") }
  }

  const moveItem = async (itemId: string, direction: "up" | "down") => {
    if (!managing) return
    try {
      await api.patch(`/playlists/${managing.id}/items/${itemId}/move`, { direction })
      const { data } = await api.get(`/playlists/${managing.id}`)
      setManaging(data)
    } catch { toast.error("Erro") }
  }

  const setDuration = async (itemId: string, duration: number) => {
    if (!managing) return
    try {
      await api.patch(`/playlists/${managing.id}/items/${itemId}`, { duration })
      const { data } = await api.get(`/playlists/${managing.id}`)
      setManaging(data)
    } catch { toast.error("Erro") }
  }

  const downloadM3U = async (playlist: Playlist) => {
    try {
      const { data } = await api.get(`/playlists/${playlist.id}/m3u`, { responseType: "blob" })
      const url = URL.createObjectURL(new Blob([data]))
      const a = document.createElement("a")
      a.href = url; a.download = `${playlist.name}.m3u`; a.click()
      URL.revokeObjectURL(url)
      toast.success("M3U baixado!")
    } catch { toast.error("Erro ao baixar") }
  }

  const items = managing?.items || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Playlists ({playlists.length})</h2>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm() }}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Nova Playlist</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Editar" : "Nova"} Playlist</DialogTitle>
              <DialogDescription>Nome e descrição da playlist</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input value={formName} onChange={(e) => setFormName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Input value={formDesc} onChange={(e) => setFormDesc(e.target.value)} />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => { setOpen(false); resetForm() }}>Cancelar</Button>
                <Button type="submit">{editing ? "Atualizar" : "Criar"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Qtd Itens</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {playlists.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell className="text-muted-foreground">{p.description || "—"}</TableCell>
                  <TableCell>{p.items?.length || 0}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => { setManaging(p) }} title="Gerenciar itens">
                      <ListMusic className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => downloadM3U(p)} title="Download M3U">
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => { setEditing(p); setFormName(p.name); setFormDesc(p.description || ""); setOpen(true) }}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {playlists.length === 0 && (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">Nenhuma playlist</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!managing} onOpenChange={(v) => { if (!v) setManaging(null) }}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Gerenciar Itens — {managing?.name}</DialogTitle>
            <DialogDescription>Adicione e organize as mídias da playlist</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="mb-2 block">Mídias Disponíveis</Label>
              <div className="max-h-80 space-y-1 overflow-y-auto">
                {media.map((m) => (
                  <div key={m.id} className="flex cursor-pointer items-center gap-2 rounded p-2 text-sm hover:bg-accent" onClick={() => addMediaToPlaylist(m.id)}>
                    <span className="truncate flex-1">{m.name}</span>
                    <Badge variant="outline" className="text-[10px]">{m.type}</Badge>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <Label className="mb-2 block">Itens da Playlist</Label>
              <div className="max-h-80 space-y-2 overflow-y-auto">
                {items.map((item, idx) => (
                  <div key={item.id} className="flex items-center gap-2 rounded-lg border p-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded bg-muted text-xs font-bold">{idx + 1}</span>
                    <span className="flex-1 truncate text-sm">{item.media?.name || "Mídia"}</span>
                    <Input
                      type="number" className="h-7 w-14 text-xs"
                      value={item.duration || 10}
                      onChange={(e) => setDuration(item.id, Number(e.target.value))}
                      min={1}
                    />
                    <span className="text-[10px] text-muted-foreground">seg</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveItem(item.id, "up")} disabled={idx === 0}>
                      <ArrowUp className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveItem(item.id, "down")} disabled={idx === items.length - 1}>
                      <ArrowDown className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeItem(item.id)}>
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                ))}
                {items.length === 0 && <p className="text-sm text-muted-foreground">Nenhum item</p>}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
