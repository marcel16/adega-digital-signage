'use client';

import { usePathname } from 'next/navigation';
import { Sun, Moon, LogOut, User } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const routeNames: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/dashboard/estabelecimentos': 'Estabelecimentos',
  '/dashboard/tvs': 'TVs',
  '/dashboard/midias': 'Mídias',
  '/dashboard/campanhas': 'Campanhas',
  '/dashboard/agendamentos': 'Agendamentos',
  '/dashboard/playlists': 'Playlists',
  '/dashboard/iptv': 'IPTV',
  '/dashboard/planos': 'Planos',
  '/dashboard/configuracoes': 'Configurações',
};

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [userName, setUserName] = useState('');

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    setUserName(localStorage.getItem('userNome') || 'Usuário');
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    router.push('/auth/login');
  };

  const pageName = Object.entries(routeNames).find(([path]) => pathname.startsWith(path))?.[1] || 'Dashboard';

  return (
    <header className="sticky top-0 z-30 bg-background border-b px-4 lg:px-6 h-16 flex items-center justify-between">
      <div>
        <h1 className="text-xl font-semibold">{pageName}</h1>
        <p className="text-sm text-muted-foreground">{pathname}</p>
      </div>

      <div className="flex items-center gap-2">
        {mounted && (
          <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium">
                {userName.charAt(0).toUpperCase()}
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span>{userName}</span>
                <span className="text-xs text-muted-foreground font-normal">{localStorage.getItem('userEmail')}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/dashboard/configuracoes')}>
              <User className="h-4 w-4 mr-2" /> Configurações
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" /> Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}