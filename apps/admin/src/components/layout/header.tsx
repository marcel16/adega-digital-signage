'use client';

import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Sun, Moon, User } from 'lucide-react';
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

const breadcrumbs: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/dashboard/clientes': 'Clientes',
  '/dashboard/adegas': 'Adegas/Lojas',
  '/dashboard/stores': 'Estabelecimentos',
  '/dashboard/tvs': 'TVs',
  '/dashboard/planos': 'Planos',
  '/dashboard/pagamentos': 'Pagamentos',
  '/dashboard/cupons': 'Cupons',
  '/dashboard/usuarios': 'Usuários Admin',
  '/dashboard/tokens-api': 'Tokens API',
  '/dashboard/logs': 'Logs',
  '/dashboard/auditoria': 'Auditoria',
  '/dashboard/webhooks': 'Webhooks',
  '/dashboard/configuracoes': 'Configurações',
};

export function Header() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  const segments = pathname.split('/').filter(Boolean);
  const currentLabel = breadcrumbs[pathname] || segments[segments.length - 1] || 'Dashboard';

  const handleLogout = () => {
    localStorage.removeItem('adminAccessToken');
    localStorage.removeItem('adminRefreshToken');
    localStorage.removeItem('adminUser');
    router.push('/auth/login');
  };

  const user = typeof window !== 'undefined'
    ? JSON.parse(localStorage.getItem('adminUser') || '{}')
    : {};

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-background px-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">{currentLabel}</span>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium">
                {user.name ? user.name.charAt(0).toUpperCase() : <User className="h-4 w-4" />}
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span>{user.name || 'Admin'}</span>
                <span className="text-xs font-normal text-muted-foreground">{user.email || ''}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
