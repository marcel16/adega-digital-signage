import Link from "next/link"
import { Wine, Monitor, Image, Megaphone, Calendar, Radio, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const features = [
  { icon: Monitor, title: "Múltiplas TVs", desc: "Gerencie quantas TVs precisar, cada uma com conteúdo personalizado." },
  { icon: Image, title: "Mídias", desc: "Upload de imagens, vídeos e áudios com organização por pastas e tags." },
  { icon: Megaphone, title: "Campanhas", desc: "Crie campanhas visuais com editor avançado e overlays personalizados." },
  { icon: Calendar, title: "Agendamento", desc: "Programe horários e dias da semana para cada campanha." },
  { icon: Radio, title: "IPTV", desc: "Transmita conteúdo IPTV diretamente para suas TVs compatíveis." },
  { icon: Users, title: "Equipe", desc: "Convide membros da equipe e gerencie permissões de acesso." },
]

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Wine className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold">Adega Signage</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/auth/login">
              <Button variant="ghost">Entrar</Button>
            </Link>
            <Link href="/auth/register">
              <Button>Criar Conta</Button>
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <section className="container flex flex-col items-center py-24 text-center">
          <Wine className="h-16 w-16 text-primary mb-6" />
          <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
            Transforme suas TVs em canais de comunicação digital
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
            Gerencie mídias, crie campanhas e transmita conteúdo IPTV para suas TVs
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link href="/auth/login">
              <Button size="lg" className="text-base">Acessar Plataforma</Button>
            </Link>
            <Link href="/dashboard/billing">
              <Button size="lg" variant="outline" className="text-base">Ver Planos</Button>
            </Link>
          </div>
        </section>
        <section className="border-t bg-muted/50 py-20">
          <div className="container">
            <h2 className="mb-12 text-center text-3xl font-bold tracking-tight">Tudo que você precisa</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((f) => {
                const Icon = f.icon
                return (
                  <Card key={f.title} className="border-0 shadow-sm">
                    <CardHeader>
                      <Icon className="h-8 w-8 text-primary" />
                      <CardTitle className="text-lg">{f.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-sm">{f.desc}</CardDescription>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t py-8">
        <div className="container flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Wine className="h-4 w-4" />
            <span>Adega Signage</span>
          </div>
          <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} Adega Signage. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  )
}
