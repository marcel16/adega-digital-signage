"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { TV } from "@/types"
import api from "@/lib/api"
import { toast } from "sonner"
import { Copy, Radio, Monitor, Smartphone, Tv, MonitorSmartphone } from "lucide-react"

export default function IPTVPage() {
  const [tvs, setTvs] = useState<TV[]>([])
  const [selectedTvId, setSelectedTvId] = useState("")

  useEffect(() => {
    api.get("/tvs").then(({ data }) => setTvs(data.data || data)).catch(() => toast.error("Erro ao carregar TVs"))
  }, [])

  const selectedTv = tvs.find((tv) => tv.id === selectedTvId)

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Copiado!")
  }

  const getM3uUrl = (tv: TV) => {
    return tv.m3uUrl || `${window.location.origin}/api/tvs/${tv.id}/m3u`
  }

  const instructions = [
    { name: "VLC Media Player", icon: Tv, steps: ["Abra o VLC", "Clique em 'Mídia' > 'Abrir fluxo de rede'", "Cole a URL M3U", "Clique em 'Reproduzir'"] },
    { name: "IPTV Smarters", icon: Smartphone, steps: ["Abra o IPTV Smarters", "Vá em 'Adicionar Playlist'", "Selecione 'URL'", "Cole a URL M3U e salve"] },
    { name: "TiviMate", icon: MonitorSmartphone, steps: ["Abra o TiviMate", "Vá em 'Configurações' > 'Playlists'", "Clique em 'Adicionar playlist'", "Cole a URL M3U"] },
    { name: "Android TV", icon: Monitor, steps: ["Baixe o 'IPTV Pro' ou 'TiviMate' na Play Store", "Abra o aplicativo", "Adicione a playlist via URL M3U", "Cole a URL M3U"] },
  ]

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><Radio className="h-4 w-4" /> Configuração IPTV</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Selecione a TV</label>
                <Select value={selectedTvId} onValueChange={setSelectedTvId}>
                  <SelectTrigger className="w-72"><SelectValue placeholder="Escolha uma TV..." /></SelectTrigger>
                  <SelectContent>
                    {tvs.map((tv) => (
                      <SelectItem key={tv.id} value={tv.id}>
                        {tv.name} {tv.store ? `(${tv.store.name})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedTv && (
                <div className="space-y-4">
                  <div className="rounded-lg border p-4">
                    <label className="text-sm font-medium">URL M3U</label>
                    <div className="mt-1 flex items-center gap-2">
                      <code className="flex-1 truncate rounded bg-muted px-3 py-2 text-sm">{getM3uUrl(selectedTv)}</code>
                      <Button variant="outline" size="icon" onClick={() => copyText(getM3uUrl(selectedTv))}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-lg border p-4">
                    <label className="text-sm font-medium">QR Code</label>
                    <div className="mt-2 flex items-center justify-center">
                      <div className="flex h-32 w-32 items-center justify-center rounded-lg border bg-white">
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=128x128&data=${encodeURIComponent(getM3uUrl(selectedTv))}`}
                          alt="QR Code M3U URL"
                          className="h-28 w-28"
                        />
                      </div>
                    </div>
                    <p className="mt-2 text-center text-xs text-muted-foreground">Escaneie com o celular para acessar o link M3U</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Instruções de Conexão</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              {instructions.map((inst) => {
                const Icon = inst.icon
                return (
                  <div key={inst.name} className="rounded-lg border p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">{inst.name}</span>
                    </div>
                    <ol className="list-inside list-decimal space-y-1 text-xs text-muted-foreground">
                      {inst.steps.map((step, i) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ol>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm"><Radio className="h-4 w-4" /> Status da TV</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedTv ? (
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Nome</span>
                    <span className="font-medium">{selectedTv.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <Badge variant={selectedTv.status === "ONLINE" ? "success" : "secondary"}>
                      {selectedTv.status === "ONLINE" ? "Online" : "Offline"}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Modelo</span>
                    <span>{selectedTv.model || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Resolução</span>
                    <span>{selectedTv.resolution || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Orientação</span>
                    <span>{selectedTv.orientation === "PORTRAIT" ? "Retrato" : "Paisagem"}</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Selecione uma TV</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">O que está tocando agora?</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedTv ? (
                <div className="space-y-2 text-sm">
                  <p><strong>Campanha:</strong> Campanha ativa</p>
                  <p><strong>Playlist:</strong> Playlist padrão</p>
                  <p className="text-xs text-muted-foreground">Última atualização: {new Date().toLocaleString("pt-BR")}</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Selecione uma TV</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Todas as TVs — URLs M3U</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>TV</TableHead>
                <TableHead>Loja</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>URL M3U</TableHead>
                <TableHead className="text-right">Copiar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tvs.map((tv) => (
                <TableRow key={tv.id}>
                  <TableCell className="font-medium">{tv.name}</TableCell>
                  <TableCell>{tv.store?.name || "—"}</TableCell>
                  <TableCell><Badge variant={tv.status === "ONLINE" ? "success" : "secondary"}>{tv.status}</Badge></TableCell>
                  <TableCell>
                    <code className="truncate block max-w-[300px] rounded bg-muted px-2 py-0.5 text-xs">{getM3uUrl(tv)}</code>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => copyText(getM3uUrl(tv))}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {tvs.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nenhuma TV cadastrada</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
