import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const features = [
  {
    title: 'Digital Signage',
    description:
      'Gerencie telas e displays com conteúdo dinâmico e agendamentos inteligentes.',
  },
  {
    title: 'IPTV Corporativo',
    description:
      'Transmita canais ao vivo e conteúdo multimídia para toda a sua rede.',
  },
  {
    title: 'Gestão de Mídias',
    description:
      'Faça upload, organize e distribua imagens, vídeos e áudios com facilidade.',
  },
];

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <span className="text-xl font-bold text-primary">Adega Signage</span>
          <Link href="/auth/login">
            <Button variant="outline">Entrar</Button>
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <section className="flex flex-col items-center justify-center px-4 py-24 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Adega Signage
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
            Plataforma completa de Digital Signage e IPTV corporativo. Gerencie
            TVs, mídias e campanhas em um só lugar.
          </p>
          <Link href="/auth/login" className="mt-8">
            <Button size="lg">Acessar Plataforma</Button>
          </Link>
        </section>

        <section className="container mx-auto grid gap-6 px-4 pb-24 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.title}>
              <CardHeader>
                <CardTitle>{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </section>
      </main>

      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} Adega Signage. Todos os direitos
        reservados.
      </footer>
    </div>
  );
}