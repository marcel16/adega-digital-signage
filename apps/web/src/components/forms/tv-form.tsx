"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TV, Store } from "@/types"

interface TVFormProps {
  tv?: TV | null
  stores: Store[]
  onSubmit: (data: Partial<TV>) => Promise<void>
  onCancel: () => void
}

export function TVForm({ tv, stores, onSubmit, onCancel }: TVFormProps) {
  const [name, setName] = useState(tv?.name || "")
  const [description, setDescription] = useState(tv?.description || "")
  const [model, setModel] = useState(tv?.model || "")
  const [resolution, setResolution] = useState(tv?.resolution || "")
  const [orientation, setOrientation] = useState(tv?.orientation || "LANDSCAPE")
  const [storeId, setStoreId] = useState(tv?.storeId || "")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await onSubmit({ name, description, model, resolution, orientation, storeId: storeId || undefined })
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="tv-name">Nome *</Label>
        <Input id="tv-name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="tv-desc">Descrição</Label>
        <Input id="tv-desc" value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="model">Modelo</Label>
          <Input id="model" value={model} onChange={(e) => setModel(e.target.value)} placeholder="Ex: Samsung 43\" QLED" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="resolution">Resolução</Label>
          <Select value={resolution} onValueChange={setResolution}>
            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="1920x1080">Full HD (1920x1080)</SelectItem>
              <SelectItem value="3840x2160">4K (3840x2160)</SelectItem>
              <SelectItem value="1280x720">HD (1280x720)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="orientation">Orientação</Label>
          <Select value={orientation} onValueChange={setOrientation}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="LANDSCAPE">Paisagem</SelectItem>
              <SelectItem value="PORTRAIT">Retrato</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="store">Loja</Label>
          <Select value={storeId} onValueChange={setStoreId}>
            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              {stores.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={loading}>{loading ? "Salvando..." : tv ? "Atualizar" : "Criar"}</Button>
      </div>
    </form>
  )
}
