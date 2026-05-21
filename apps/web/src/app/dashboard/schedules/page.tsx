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
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Schedule, TV, Campaign } from "@/types"
import api from "@/lib/api"
import { formatDate } from "@/lib/utils"
import { toast } from "sonner"
import { Plus, Edit, Trash2, Play, CheckCircle, XCircle, AlertTriangle, Radio } from "lucide-react"

const DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [tvs, setTvs] = useState<TV[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Schedule | null>(null)
  const [selectedTvForNow, setSelectedTvForNow] = useState("")

  // Form state
  const [formName, setFormName] = useState("")
  const [formTvId, setFormTvId] = useState("")
  const [formCampaignId, setFormCampaignId] = useState("")
  const [formDays, setFormDays] = useState<number[]>([])
  const [formStartTime, setFormStartTime] = useState("08:00")
  const [formEndTime, setFormEndTime] = useState("18:00")
  const [formStartDate, setFormStartDate] = useState("")
  const [formEndDate, setFormEndDate] = useState("")
  const [formRecurring, setFormRecurring] = useState(true)

  const fetch = async () => {
    try {
      const [schedRes, tvsRes, campRes] = await Promise.all([
        api.get("/schedules"), api.get("/tvs"), api.get("/campaigns"),
      ])
      setSchedules(schedRes.data.data || schedRes.data)
      setTvs(tvsRes.data.data || tvsRes.data)
      setCampaigns(campRes.data.data || campRes.data)
    } catch { toast.error("Erro ao carregar agendamentos") }
  }

  useEffect(() => { fetch() }, [])

  const resetForm = () => {
    setFormName(""); setFormTvId(""); setFormCampaignId(""); setFormDays([])
    setFormStartTime("08:00"); setFormEndTime("18:00")
    setFormStartDate(""); setFormEndDate(""); setFormRecurring(true)
    setEditing(null)
  }

  const openEdit = (s: Schedule) => {
    setEditing(s)
    setFormName(s.name); setFormTvId(s.tvId); setFormCampaignId(s.campaignId || "")
    setFormDays(s.daysOfWeek); setFormStartTime(s.startTime); setFormEndTime(s.endTime)
    setFormStartDate(s.startDate.split("T")[0]); setFormEndDate(s.endDate?.split("T")[0] || "")
    setFormRecurring(s.isRecurring)
    setOpen(true)
  }

  const toggleDay = (day: number) => {
    setFormDays((prev) => prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort())
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formDays.length === 0) { toast.error("Selecione pelo menos um dia da semana"); return }
    try {
      const payload = {
        name: formName, tvId: formTvId, campaignId: formCampaignId || undefined,
        daysOfWeek: formDays, startTime: formStartTime, endTime: formEndTime,
        startDate: new Date(formStartDate).toISOString(),
        endDate: formEndDate ? new Date(formEndDate).toISOString() : undefined,
        isRecurring: formRecurring,
      }
      if (editing) {
        await api.put(`/schedules/${editing.id}`, payload)
        toast.success("Agendamento atualizado!")
      } else {
        await api.post("/schedules", payload)
        toast.success("Agendamento criado!")
      }
      setOpen(false); resetForm(); fetch()
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Erro ao salvar")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir?")) return
    try { await api.delete(`/schedules/${id}`); toast.success("Excluído!"); fetch() }
    catch { toast.error("Erro") }
  }

  const handleStatus = async (id: string, status: string) => {
    try { await api.patch(`/schedules/${id}/status`, { status }); toast.success("Atualizado!"); fetch() }
    catch { toast.error("Erro") }
  }

  const statusVariant: Record<string, "success" | "secondary" | "destructive"> = {
    ACTIVE: "success", COMPLETED: "secondary", CANCELED: "destructive",
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Agendamentos ({schedules.length})</CardTitle>
            <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm() }}>
              <DialogTrigger asChild>
                <Button><Plus className="mr-2 h-4 w-4" /> Novo Agendamento</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>{editing ? "Editar" : "Novo"} Agendamento</DialogTitle>
                  <DialogDescription>Configure o agendamento de exibição</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nome *</Label>
                    <Input value={formName} onChange={(e) => setFormName(e.target.value)} required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>TV *</Label>
                      <Select value={formTvId} onValueChange={setFormTvId} required>
                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>
                          {tvs.map((tv) => <SelectItem key={tv.id} value={tv.id}>{tv.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Campanha</Label>
                      <Select value={formCampaignId} onValueChange={setFormCampaignId}>
                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>
                          {campaigns.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Dias da Semana</Label>
                    <div className="flex gap-1">
                      {DAYS.map((day, idx) => (
                        <div key={idx} className="flex flex-col items-center gap-1">
                          <span className="text-[10px] text-muted-foreground">{day}</span>
                          <Checkbox checked={formDays.includes(idx)} onCheckedChange={() => toggleDay(idx)} />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Início</Label>
                      <Input type="time" value={formStartTime} onChange={(e) => setFormStartTime(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Fim</Label>
                      <Input type="time" value={formEndTime} onChange={(e) => setFormEndTime(e.target.value)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Data Início</Label>
                      <Input type="date" value={formStartDate} onChange={(e) => setFormStartDate(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Data Fim</Label>
                      <Input type="date" value={formEndDate} onChange={(e) => setFormEndDate(e.target.value)} />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={formRecurring} onCheckedChange={setFormRecurring} />
                    <Label>Recorrente (semanal)</Label>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => { setOpen(false); resetForm() }}>Cancelar</Button>
                    <Button type="submit">{editing ? "Atualizar" : "Criar"}</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>TV</TableHead>
                  <TableHead>Dias</TableHead>
                  <TableHead>Horário</TableHead>
                  <TableHead>Datas</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedules.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell>{s.tv?.name || "—"}</TableCell>
                    <TableCell className="text-xs">{s.daysOfWeek.sort().map((d) => DAYS[d]).join(", ")}</TableCell>
                    <TableCell className="text-xs">{s.startTime} — {s.endTime}</TableCell>
                    <TableCell className="text-xs">{formatDate(s.startDate)}{s.endDate ? ` — ${formatDate(s.endDate)}` : ""}</TableCell>
                    <TableCell><Badge variant={statusVariant[s.status]}>{s.status === "ACTIVE" ? "Ativo" : s.status === "COMPLETED" ? "Concluído" : "Cancelado"}</Badge></TableCell>
                    <TableCell className="text-right">
                      {s.status === "ACTIVE" ? (
                        <Button variant="ghost" size="icon" onClick={() => handleStatus(s.id, "COMPLETED")}><CheckCircle className="h-4 w-4" /></Button>
                      ) : s.status === "COMPLETED" ? null : (
                        <Button variant="ghost" size="icon" onClick={() => handleStatus(s.id, "ACTIVE")}><Play className="h-4 w-4 text-emerald-500" /></Button>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => openEdit(s)}><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(s.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
                {schedules.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Nenhum agendamento</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Now Playing Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm"><Radio className="h-4 w-4" /> O que está tocando agora?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Selecione uma TV</Label>
              <Select value={selectedTvForNow} onValueChange={setSelectedTvForNow}>
                <SelectTrigger><SelectValue placeholder="TV..." /></SelectTrigger>
                <SelectContent>
                  {tvs.map((tv) => <SelectItem key={tv.id} value={tv.id}>{tv.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {selectedTvForNow && (
              <div className="rounded-lg border p-3 text-sm space-y-2">
                <p><strong>Status:</strong> <Badge variant="success">Online</Badge></p>
                <p><strong>Conteúdo:</strong> Campanha ativa em execução</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3 text-amber-500" /> Verifique conflitos de horário
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
