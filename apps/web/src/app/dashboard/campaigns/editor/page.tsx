"use client"

import { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Media, Campaign, Overlay } from "@/types"
import api from "@/lib/api"
import { toast } from "sonner"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"
import { Image, Film, Music, Link, Type, DollarSign, QrCode, Tags, Clock, GripVertical, X, Save, Plus } from "lucide-react"

const overlayTypes = [
  { value: "TEXT", label: "Texto", icon: Type },
  { value: "PRICE", label: "Preço", icon: DollarSign },
  { value: "QR_CODE", label: "QR Code", icon: QrCode },
  { value: "BADGE", label: "Badge", icon: Tags },
  { value: "TIMER", label: "Timer", icon: Clock },
]

export default function CampaignEditorPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [selectedCampaignId, setSelectedCampaignId] = useState("")
  const [media, setMedia] = useState<Media[]>([])
  const [campaignMedia, setCampaignMedia] = useState<any[]>([])
  const [overlays, setOverlays] = useState<Overlay[]>([])
  const [selectedOverlay, setSelectedOverlay] = useState<Overlay | null>(null)
  const [addOverlayOpen, setAddOverlayOpen] = useState(false)
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0)
  const [saving, setSaving] = useState(false)

  const fetchCampaigns = async () => {
    try {
      const { data } = await api.get("/campaigns")
      setCampaigns(data.data || data)
    } catch { toast.error("Erro ao carregar campanhas") }
  }

  const fetchMedia = async () => {
    try {
      const { data } = await api.get("/media")
      setMedia(data.data || data)
    } catch { toast.error("Erro ao carregar mídias") }
  }

  const fetchCampaign = useCallback(async () => {
    if (!selectedCampaignId) return
    try {
      const { data } = await api.get(`/campaigns/${selectedCampaignId}`)
      setCampaignMedia(data.mediaItems || [])
      setOverlays(data.overlays || [])
      setCurrentMediaIndex(0)
    } catch { toast.error("Erro ao carregar campanha") }
  }, [selectedCampaignId])

  useEffect(() => { fetchCampaigns(); fetchMedia() }, [])

  useEffect(() => { if (selectedCampaignId) fetchCampaign() }, [selectedCampaignId])

  const addMediaToCampaign = async (m: Media) => {
    if (!selectedCampaignId) { toast.error("Selecione uma campanha primeiro"); return }
    try {
      const { data } = await api.post(`/campaigns/${selectedCampaignId}/media`, {
        mediaId: m.id, order: campaignMedia.length,
      })
      toast.success("Mídia adicionada!")
      fetchCampaign()
    } catch { toast.error("Erro ao adicionar mídia") }
  }

  const removeMedia = async (cmId: string) => {
    try {
      await api.delete(`/campaigns/${selectedCampaignId}/media/${cmId}`)
      toast.success("Mídia removida")
      fetchCampaign()
    } catch { toast.error("Erro ao remover") }
  }

  const reorderMedia = async (sourceIndex: number, destIndex: number) => {
    const items = Array.from(campaignMedia)
    const [removed] = items.splice(sourceIndex, 1)
    items.splice(destIndex, 0, removed)
    setCampaignMedia(items)
    try {
      await api.put(`/campaigns/${selectedCampaignId}/media/reorder`, {
        items: items.map((item: any, idx: number) => ({ id: item.id, order: idx })),
      })
    } catch { toast.error("Erro ao reordenar") }
  }

  const addOverlay = async (type: string) => {
    if (!selectedCampaignId) return
    try {
      await api.post(`/campaigns/${selectedCampaignId}/overlays`, {
        type,
        content: type === "TEXT" ? "Texto" : type === "PRICE" ? "R$ 0,00" : type === "QR_CODE" ? "QR Code" : type === "BADGE" ? "Promoção" : "00:00",
        positionX: 50, positionY: 50,
        style: { color: "#ffffff", fontSize: "24", backgroundColor: "rgba(0,0,0,0.5)" },
      })
      toast.success("Overlay adicionado!")
      fetchCampaign()
    } catch { toast.error("Erro ao adicionar overlay") }
  }

  const updateOverlay = async (overlay: Overlay) => {
    try {
      await api.put(`/campaigns/${selectedCampaignId}/overlays/${overlay.id}`, overlay)
      toast.success("Overlay atualizado")
      fetchCampaign()
    } catch { toast.error("Erro ao atualizar overlay") }
  }

  const removeOverlay = async (id: string) => {
    try {
      await api.delete(`/campaigns/${selectedCampaignId}/overlays/${id}`)
      toast.success("Overlay removido")
      setSelectedOverlay(null)
      fetchCampaign()
    } catch { toast.error("Erro ao remover overlay") }
  }

  const saveCampaign = async () => {
    setSaving(true)
    try {
      await api.put(`/campaigns/${selectedCampaignId}`, {
        mediaItems: campaignMedia.map((cm: any) => cm.id),
        overlays: overlays.map((o) => o.id),
      })
      toast.success("Campanha salva!")
    } catch { toast.error("Erro ao salvar") }
    finally { setSaving(false) }
  }

  const typeIcon = (type: string) => {
    switch (type) {
      case "IMAGE": return <Image className="h-5 w-5" />
      case "VIDEO": return <Film className="h-5 w-5" />
      case "AUDIO": return <Music className="h-5 w-5" />
      default: return <Link className="h-5 w-5" />
    }
  }

  return (
    <div className="flex h-[calc(100vh-7rem)] gap-4">
      {/* Left Panel - Media Library */}
      <Card className="w-64 shrink-0 overflow-y-auto">
        <CardHeader className="p-3">
          <CardTitle className="text-sm">Biblioteca de Mídias</CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0 space-y-2">
          {media.map((m) => (
            <div key={m.id} className="flex cursor-pointer items-center gap-2 rounded-lg p-2 text-sm hover:bg-accent" onClick={() => addMediaToCampaign(m)}>
              {typeIcon(m.type)}
              <span className="truncate flex-1">{m.name}</span>
            </div>
          ))}
          {media.length === 0 && <p className="text-xs text-muted-foreground">Nenhuma mídia disponível</p>}
        </CardContent>
      </Card>

      {/* Center - Canvas + Timeline */}
      <div className="flex flex-1 flex-col gap-4">
        <div className="flex items-center gap-4">
          <Select value={selectedCampaignId} onValueChange={setSelectedCampaignId}>
            <SelectTrigger className="w-64"><SelectValue placeholder="Selecione uma campanha" /></SelectTrigger>
            <SelectContent>
              {campaigns.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={saveCampaign} disabled={!selectedCampaignId || saving}>
            <Save className="mr-2 h-4 w-4" /> {saving ? "Salvando..." : "Salvar Campanha"}
          </Button>
        </div>

        {/* Canvas Preview */}
        <Card className="flex-1 overflow-hidden">
          <div className="relative flex h-full items-center justify-center bg-black">
            {campaignMedia.length > 0 && campaignMedia[currentMediaIndex]?.media ? (
              <>
                {campaignMedia[currentMediaIndex].media.type === "IMAGE" && (
                  <img src={campaignMedia[currentMediaIndex].media.url} alt="" className="max-h-full max-w-full object-contain" />
                )}
                {campaignMedia[currentMediaIndex].media.type === "VIDEO" && (
                  <video src={campaignMedia[currentMediaIndex].media.url} className="max-h-full max-w-full" controls />
                )}
                {/* Overlays canvas */}
                <div className="absolute inset-0 pointer-events-none">
                  {overlays.filter((o) => o.isActive !== false).map((overlay) => (
                    <div
                      key={overlay.id}
                      className="absolute cursor-pointer pointer-events-auto"
                      style={{
                        left: `${overlay.positionX}%`,
                        top: `${overlay.positionY}%`,
                        color: overlay.style?.color || "#fff",
                        fontSize: `${overlay.style?.fontSize || 24}px`,
                        background: overlay.style?.backgroundColor || "transparent",
                        padding: "4px 8px",
                        borderRadius: "4px",
                      }}
                      onClick={() => setSelectedOverlay(overlay)}
                    >
                      {overlay.type === "QR_CODE" ? (
                        <div className="h-16 w-16 bg-white" />
                      ) : (
                        <span>{overlay.content}</span>
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-muted-foreground">Adicione mídias para visualizar</p>
            )}
          </div>
        </Card>

        {/* Timeline */}
        <Card className="h-28 shrink-0">
          <CardContent className="p-3">
            <DragDropContext onDragEnd={(result) => {
              if (!result.destination) return
              reorderMedia(result.source.index, result.destination.index)
            }}>
              <Droppable droppableId="timeline" direction="horizontal">
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps} className="flex gap-2 overflow-x-auto pb-2">
                    {campaignMedia.map((cm: any, idx: number) => (
                      <Draggable key={cm.id} draggableId={cm.id} index={idx}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}
                            className={`flex shrink-0 cursor-pointer flex-col items-center rounded-lg border p-2 text-xs ${idx === currentMediaIndex ? "border-primary bg-primary/10" : ""}`}
                            onClick={() => setCurrentMediaIndex(idx)}
                          >
                            <GripVertical className="h-3 w-3 text-muted-foreground mb-1" />
                            {cm.media && (
                              <>
                                {typeIcon(cm.media.type)}
                                <span className="mt-1 w-16 truncate text-center">{cm.media.name}</span>
                              </>
                            )}
                            <Button variant="ghost" size="icon" className="mt-1 h-5 w-5" onClick={(e) => { e.stopPropagation(); removeMedia(cm.id) }}>
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    {campaignMedia.length === 0 && <p className="text-sm text-muted-foreground p-2">Arraste mídias da biblioteca para a linha do tempo</p>}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </CardContent>
        </Card>
      </div>

      {/* Right Panel - Overlay Editor */}
      <Card className="w-72 shrink-0 overflow-y-auto">
        <CardHeader className="p-3 flex flex-row items-center justify-between">
          <CardTitle className="text-sm">Overlays</CardTitle>
          <Dialog open={addOverlayOpen} onOpenChange={setAddOverlayOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" disabled={!selectedCampaignId}><Plus className="h-4 w-4" /></Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xs">
              <DialogHeader><DialogTitle>Adicionar Overlay</DialogTitle></DialogHeader>
              <div className="grid grid-cols-2 gap-2">
                {overlayTypes.map((ot) => {
                  const Icon = ot.icon
                  return (
                    <Button key={ot.value} variant="outline" className="flex-col gap-1 h-20" onClick={() => { addOverlay(ot.value); setAddOverlayOpen(false) }}>
                      <Icon className="h-5 w-5" />
                      <span className="text-xs">{ot.label}</span>
                    </Button>
                  )
                })}
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="p-3 pt-0 space-y-3">
          {overlays.map((overlay) => (
            <div
              key={overlay.id}
              className={`cursor-pointer rounded-lg border p-2 text-sm transition-colors ${selectedOverlay?.id === overlay.id ? "border-primary" : ""}`}
              onClick={() => setSelectedOverlay(overlay)}
            >
              <div className="flex items-center justify-between">
                <Badge variant="outline">{overlay.type}</Badge>
                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => removeOverlay(overlay.id)}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
              {selectedOverlay?.id === overlay.id && (
                <div className="mt-2 space-y-2">
                  <div>
                    <Label className="text-xs">Conteúdo</Label>
                    <Input size={1} value={overlay.content} onChange={(e) => setSelectedOverlay({ ...overlay, content: e.target.value })} className="h-7 text-xs" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">X (%)</Label>
                      <Input size={1} type="number" value={overlay.positionX} onChange={(e) => setSelectedOverlay({ ...overlay, positionX: Number(e.target.value) })} className="h-7 text-xs" />
                    </div>
                    <div>
                      <Label className="text-xs">Y (%)</Label>
                      <Input size={1} type="number" value={overlay.positionY} onChange={(e) => setSelectedOverlay({ ...overlay, positionY: Number(e.target.value) })} className="h-7 text-xs" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Cor</Label>
                    <Input size={1} value={overlay.style?.color || "#ffffff"} onChange={(e) => setSelectedOverlay({ ...overlay, style: { ...overlay.style, color: e.target.value } })} className="h-7 text-xs" />
                  </div>
                  <div>
                    <Label className="text-xs">Tamanho (px)</Label>
                    <Input size={1} type="number" value={overlay.style?.fontSize || 24} onChange={(e) => setSelectedOverlay({ ...overlay, style: { ...overlay.style, fontSize: e.target.value } })} className="h-7 text-xs" />
                  </div>
                  <Button size="sm" className="w-full" onClick={() => updateOverlay(selectedOverlay)}>Aplicar</Button>
                </div>
              )}
            </div>
          ))}
          {overlays.length === 0 && <p className="text-xs text-muted-foreground">Nenhum overlay</p>}
        </CardContent>
      </Card>
    </div>
  )
}
