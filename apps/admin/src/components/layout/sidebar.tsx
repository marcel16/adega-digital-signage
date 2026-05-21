'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  Store,
  Monitor,
  CreditCard,
  DollarSign,
  Tag,
  Shield,
  Key,
  FileText,
  Search,
  Webhook,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useState } from 'react';

const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/clientes', label: 'Clientes', icon: Users },
  { href: '/dashboard/adegas', label: 'Adegas/Lojas', icon: Store },
  { href: '/dashboard/stores', label: 'Estabelecimentos', icon: Store },
  { href: '/dashboard/tvs', label: 'TVs', icon: Monitor },
  { href: '/dashboard/planos', label: 'Planos', icon: CreditCard },
  { href: '/dashboard/pagamentos', label: 'Pagamentos', icon: DollarSign },
  { href: '/dashboard/cupons', label: 'Cupons', icon: Tag },
  { href: '/dashboard/usuarios', label: 'Usuários Admin', icon: Shield },
  { href: '/dashboard/tokens-api', label: 'Tokens API', icon: Key },
  { href: '/dashboard/logs', label: 'Logs', icon: FileText },
  { href: '/dashboard/auditoria', label: 'Auditoria', icon: Search },
  { href: '/dashboard/webhooks', label: 'Webhooks', icon: Webhook },
  { href: '/dashboard/configuracoes', label: 'Configurações', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('adminAccessToken');
    localStorage.removeItem('adminRefreshToken');
    localStorage.removeItem('adminUser');
    router.push('/auth/login');
  };

  return (
    <aside
      className={cn(
        'flex flex-col border-r bg-card transition-all duration-300',
        collapsed ? 'w-16' : 'w-64',
      )}
    >
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <Shield className="h-6 w-6 text-primary shrink-0" />
        {!collapsed && (
          <span className="font-bold text-sm truncate">Adega Signage Admin</span>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto h-6 w-6"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      <nav className="flex-1 overflow-y-auto p-2 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                collapsed && 'justify-center px-2',
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <Separator />

      <div className="p-2">
        {!collapsed && (
          <div className="mb-2 px-3 py-2 text-xs text-muted-foreground truncate">
            {typeof window !== 'undefined' && JSON.parse(localStorage.getItem('adminUser') || '{}')?.name}
          </div>
        )}
        <Button
          variant="ghost"
          className={cn('w-full justify-start text-muted-foreground', collapsed && 'justify-center px-2')}
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span className="ml-3">Sair</span>}
        </Button>
      </div>
    </aside>
  );
}
