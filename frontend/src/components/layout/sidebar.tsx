'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Store, Monitor, Image, Megaphone,
  Calendar, List, Radio, CreditCard, Settings, LogOut,
  Wine, Menu, ChevronLeft, User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Estabelecimentos', href: '/dashboard/estabelecimentos', icon: Store },
  { name: 'TVs', href: '/dashboard/tvs', icon: Monitor },
  { name: 'Mídias', href: '/dashboard/midias', icon: Image },
  { name: 'Campanhas', href: '/dashboard/campanhas', icon: Megaphone },
  { name: 'Agendamentos', href: '/dashboard/agendamentos', icon: Calendar },
  { name: 'Playlists', href: '/dashboard/playlists', icon: List },
  { name: 'IPTV', href: '/dashboard/iptv', icon: Radio },
  { name: 'Planos', href: '/dashboard/planos', icon: CreditCard },
  { name: 'Configurações', href: '/dashboard/configuracoes', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const name = localStorage.getItem('userNome') || 'Usuário';
    setUserName(name);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    router.push('/auth/login');
  };

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Wine className="h-6 w-6 text-primary" />
          {!collapsed && <span className="font-bold text-lg">Adega Signage</span>}
        </Link>
        <Button variant="ghost" size="icon" onClick={() => setCollapsed(!collapsed)} className="hidden lg:flex">
          <ChevronLeft className={cn('h-4 w-4 transition-transform', collapsed && 'rotate-180')} />
        </Button>
      </div>

      <nav className="flex-1 overflow-y-auto p-2 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted text-foreground',
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-3 space-y-2">
        {!collapsed && (
          <div className="flex items-center gap-2 px-3 py-2">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="text-sm truncate">
              <p className="font-medium truncate">{userName}</p>
            </div>
          </div>
        )}
        <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-2" />
          {!collapsed && 'Sair'}
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <Button variant="ghost" size="icon" className="lg:hidden fixed top-3 left-3 z-50" onClick={() => setMobileOpen(!mobileOpen)}>
        <Menu className="h-5 w-5" />
      </Button>

      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 bg-card border-r transition-all duration-300',
          collapsed ? 'w-16' : 'w-64',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}