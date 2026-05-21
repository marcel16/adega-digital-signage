"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Store } from "@/types"

interface StoreFormProps {
  store?: Store | null
  onSubmit: (data: Partial<Store>) => Promise<void>
  onCancel: () => void
}

export function StoreForm({ store, onSubmit, onCancel }: StoreFormProps) {
  const [name, setName] = useState(store?.name || "")
  const [document, setDocument] = useState(store?.document || "")
  const [address, setAddress] = useState(store?.address || "")
  const [city, setCity] = useState(store?.city || "")
  const [state, setState] = useState(store?.state || "")
  const [phone, setPhone] = useState(store?.phone || "")
  const [manager, setManager] = useState(store?.manager || "")
  const [isActive, setIsActive] = useState(store?.isActive ?? true)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await onSubmit({ name, document, address, city, state, phone, manager, isActive })
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nome *</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="document">CNPJ/CPF</Label>
          <Input id="document" value={document} onChange={(e) => setDocument(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Telefone</Label>
          <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="address">Endereço</Label>
        <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="city">Cidade</Label>
          <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="state">Estado</Label>
          <Input id="state" value={state} onChange={(e) => setState(e.target.value)} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="manager">Gerente</Label>
        <Input id="manager" value={manager} onChange={(e) => setManager(e.target.value)} />
      </div>
      <div className="flex items-center gap-2">
        <Switch id="isActive" checked={isActive} onCheckedChange={setIsActive} />
        <Label htmlFor="isActive">Ativo</Label>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={loading}>{loading ? "Salvando..." : store ? "Atualizar" : "Criar"}</Button>
      </div>
    </form>
  )
}
