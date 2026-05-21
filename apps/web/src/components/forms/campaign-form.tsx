"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Campaign, Store } from "@/types"

interface CampaignFormProps {
  campaign?: Campaign | null
  stores: Store[]
  onSubmit: (data: Partial<Campaign>) => Promise<void>
  onCancel: () => void
}

export function CampaignForm({ campaign, stores, onSubmit, onCancel }: CampaignFormProps) {
  const [name, setName] = useState(campaign?.name || "")
  const [description, setDescription] = useState(campaign?.description || "")
  const [type, setType] = useState(campaign?.type || "IMAGE")
  const [priority, setPriority] = useState(campaign?.priority || "NORMAL")
  const [startDate, setStartDate] = useState(campaign?.startDate?.split("T")[0] || "")
  const [endDate, setEndDate] = useState(campaign?.endDate?.split("T")[0] || "")
  const [storeId, setStoreId] = useState(campaign?.storeId || "")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await onSubmit({
      name, description, type, priority,
      startDate: new Date(startDate).toISOString(),
      endDate: endDate ? new Date(endDate).toISOString() : undefined,
      storeId: storeId || undefined,
    })
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="camp-name">Nome *</Label>
        <Input id="camp-name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="camp-desc">Descrição</Label>
        <Input id="camp-desc" value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Tipo</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="IMAGE">Imagem</SelectItem>
              <SelectItem value="VIDEO">Vídeo</SelectItem>
              <SelectItem value="MIXED">Misto</SelectItem>
              <SelectItem value="IPTV">IPTV</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Prioridade</Label>
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="LOW">Baixa</SelectItem>
              <SelectItem value="NORMAL">Normal</SelectItem>
              <SelectItem value="HIGH">Alta</SelectItem>
              <SelectItem value="URGENT">Urgente</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Data Início *</Label>
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label>Data Fim</Label>
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Loja</Label>
        <Select value={storeId} onValueChange={setStoreId}>
          <SelectTrigger><SelectValue placeholder="Todas as lojas" /></SelectTrigger>
          <SelectContent>
            {stores.map((s) => (
              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={loading}>{loading ? "Salvando..." : campaign ? "Atualizar" : "Criar"}</Button>
      </div>
    </form>
  )
}
