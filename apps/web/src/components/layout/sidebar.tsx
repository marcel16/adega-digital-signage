"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  LayoutDashboard, Store, Monitor, Image, Megaphone, PenTool, Calendar,
  ListMusic, Radio, CreditCard, Settings, LogOut, Wine,
} from "lucide-react"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/stores", label: "Minhas Lojas/Adegas", icon: Store },
  { href: "/dashboard/tvs", label: "TVs", icon: Monitor },
  { href: "/dashboard/media", label: "Mídias", icon: Image },
  { href: "/dashboard/campaigns", label: "Campanhas", icon: Megaphone },
  { href: "/dashboard/campaigns/editor", label: "Editor de Campanhas", icon: PenTool },
  { href: "/dashboard/schedules", label: "Agendamentos", icon: Calendar },
  { href: "/dashboard/playlists", label: "Playlists", icon: ListMusic },
  { href: "/dashboard/iptv", label: "IPTV", icon: Radio },
  { href: "/dashboard/billing", label: "Planos/Assinatura", icon: CreditCard },
  { href: "/dashboard/settings", label: "Configurações", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  const handleLogout = () => {
    localStorage.removeItem("@adega:token")
    localStorage.removeItem("@adega:refreshToken")
    localStorage.removeItem("@adega:user")
    window.location.href = "/auth/login"
  }

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r bg-card">
      <div className="flex items-center gap-2 px-6 py-5">
        <Wine className="h-6 w-6 text-primary" />
        <span className="text-lg font-bold tracking-tight">Adega Signage</span>
      </div>
      <Separator />
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))
          return (
            <Link key={item.href} href={item.href}>
              <span
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </span>
            </Link>
          )
        })}
      </nav>
      <Separator />
      <div className="p-3">
        <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
          Sair
        </Button>
      </div>
    </aside>
  )
}
