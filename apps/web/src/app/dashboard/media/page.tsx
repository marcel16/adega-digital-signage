"use client"

import { useEffect, useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Media } from "@/types"
import api from "@/lib/api"
import { cn, formatBytes, formatDate } from "@/lib/utils"
import { toast } from "sonner"
import { Upload, Image as ImageIcon, Film, Music, Link, Trash2, Search, X } from "lucide-react"

export default function MediaPage() {
  const [media, setMedia] = useState<Media[]>([])
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("ALL")
  const [uploadOpen, setUploadOpen] = useState(false)
  const [previewMedia, setPreviewMedia] = useState<Media | null>(null)
  const [uploadName, setUploadName] = useState("")
  const [uploadTags, setUploadTags] = useState("")
  const [uploadFolder, setUploadFolder] = useState("")
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const [storageInfo, setStorageInfo] = useState({ used: 0, limit: 0 })

  const fetchMedia = async () => {
    try {
      const { data } = await api.get("/media", { params: { search, type: typeFilter !== "ALL" ? typeFilter : undefined } })
      setMedia(data.data || data)
    } catch { toast.error("Erro ao carregar mídias") }
  }

  const fetchStorage = async () => {
    try {
      const { data } = await api.get("/tenant/storage")
      setStorageInfo(data)
    } catch { /* ignore */ }
  }

  useEffect(() => { fetchMedia() }, [search, typeFilter])
  useEffect(() => { fetchStorage() }, [])

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setUploading(true)
    const formData = new FormData()
    formData.append("file", files[0])
    if (uploadName) formData.append("name", uploadName)
    if (uploadTags) formData.append("tags", uploadTags)
    if (uploadFolder) formData.append("folder", uploadFolder)
    try {
      await api.post("/media/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      toast.success("Mídia enviada!")
      setUploadOpen(false)
      setUploadName("")
      setUploadTags("")
      fetchMedia()
      fetchStorage()
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Erro no upload")
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir esta mídia?")) return
    try {
      await api.delete(`/media/${id}`)
      toast.success("Mídia excluída!")
      fetchMedia()
      fetchStorage()
    } catch { toast.error("Erro ao excluir") }
  }

  const storagePercent = storageInfo.limit > 0 ? (storageInfo.used / storageInfo.limit) * 100 : 0

  const typeIcon = (type: string) => {
    switch (type) {
      case "IMAGE": return <ImageIcon className="h-8 w-8" />
      case "VIDEO": return <Film className="h-8 w-8" />
      case "AUDIO": return <Music className="h-8 w-8" />
      default: return <Link className="h-8 w-8" />
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Armazenamento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min(storagePercent, 100)}%` }} />
            </div>
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              {formatBytes(storageInfo.used)} / {formatBytes(storageInfo.limit)}
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-56" />
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos</SelectItem>
              <SelectItem value="IMAGE">Imagens</SelectItem>
              <SelectItem value="VIDEO">Vídeos</SelectItem>
              <SelectItem value="AUDIO">Áudios</SelectItem>
              <SelectItem value="URL">URLs</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
          <DialogTrigger asChild>
            <Button><Upload className="mr-2 h-4 w-4" /> Upload</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Upload de Mídia</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div
                className={cn(
                  "flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-10 transition-colors",
                  dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25"
                )}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); handleUpload(e.dataTransfer.files) }}
              >
                <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Arraste um arquivo ou clique para selecionar</p>
                <input ref={fileRef} type="file" className="hidden" onChange={(e) => handleUpload(e.target.files)} accept="image/*,video/*,audio/*" />
                <Button variant="outline" size="sm" className="mt-4" onClick={() => fileRef.current?.click()}>Selecionar Arquivo</Button>
              </div>
              <div className="space-y-2">
                <Label>Nome (opcional)</Label>
                <Input value={uploadName} onChange={(e) => setUploadName(e.target.value)} placeholder="Nome da mídia" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tags</Label>
                  <Input value={uploadTags} onChange={(e) => setUploadTags(e.target.value)} placeholder="tag1, tag2" />
                </div>
                <div className="space-y-2">
                  <Label>Pasta</Label>
                  <Input value={uploadFolder} onChange={(e) => setUploadFolder(e.target.value)} placeholder="minha-pasta" />
                </div>
              </div>
              {uploading && <p className="text-sm text-center text-muted-foreground">Enviando...</p>}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {media.map((m) => (
          <Card key={m.id} className="group cursor-pointer overflow-hidden transition-shadow hover:shadow-md" onClick={() => setPreviewMedia(m)}>
            <div className="flex aspect-video items-center justify-center bg-muted text-muted-foreground">
              {m.thumbnailUrl ? (
                <img src={m.thumbnailUrl} alt={m.name} className="h-full w-full object-cover" />
              ) : (
                typeIcon(m.type)
              )}
            </div>
            <CardContent className="p-3">
              <p className="truncate text-sm font-medium">{m.name}</p>
              <div className="mt-1 flex items-center gap-2">
                <Badge variant="outline" className="text-[10px]">{m.type}</Badge>
                <span className="text-[10px] text-muted-foreground">{formatBytes(m.size)}</span>
              </div>
            </CardContent>
          </Card>
        ))}
        {media.length === 0 && (
          <div className="col-span-full py-20 text-center text-muted-foreground">
            <Upload className="mx-auto mb-4 h-12 w-12" />
            <p>Nenhuma mídia encontrada. Faça upload de arquivos.</p>
          </div>
        )}
      </div>

      <Dialog open={!!previewMedia} onOpenChange={(v) => { if (!v) setPreviewMedia(null) }}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{previewMedia?.name}</DialogTitle>
          </DialogHeader>
          {previewMedia && (
            <div className="space-y-4">
              {previewMedia.type === "IMAGE" && (
                <img src={previewMedia.url} alt={previewMedia.name} className="max-h-[60vh] w-full rounded-lg object-contain" />
              )}
              {previewMedia.type === "VIDEO" && (
                <video controls className="max-h-[60vh] w-full rounded-lg" src={previewMedia.url} />
              )}
              {previewMedia.type === "AUDIO" && (
                <audio controls className="w-full" src={previewMedia.url} />
              )}
              {previewMedia.type === "URL" && (
                <a href={previewMedia.url} target="_blank" rel="noopener noreferrer" className="text-primary underline">{previewMedia.url}</a>
              )}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><strong>Tipo:</strong> {previewMedia.type}</div>
                <div><strong>Tamanho:</strong> {formatBytes(previewMedia.size)}</div>
                {previewMedia.tags && <div><strong>Tags:</strong> {previewMedia.tags.join(", ")}</div>}
                {previewMedia.folder && <div><strong>Pasta:</strong> {previewMedia.folder}</div>}
                <div><strong>Criado em:</strong> {formatDate(previewMedia.createdAt)}</div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
