import { useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Users, GraduationCap, School, Wallet, Receipt, Send, Megaphone,
  CalendarCheck, BookOpen, Award, CalendarDays, Bell, BarChart3, Settings, Menu, X,
  LogOut, Home, User, IndianRupee,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth, type Role } from "@/lib/auth";
import { SCHOOL_NAME } from "@/lib/format";
import { Button } from "@/components/ui/button";

type NavItem = { to: string; label: string; icon: typeof Home };

const ADMIN_NAV: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/students", label: "Students", icon: Users },
  { to: "/teachers", label: "Teachers", icon: GraduationCap },
  { to: "/classes", label: "Classes", icon: School },
  { to: "/fees", label: "Fees", icon: Wallet },
  { to: "/payments", label: "Payments", icon: Receipt },
  { to: "/reminders", label: "Fee Reminders", icon: Send },
  { to: "/notices", label: "Notice Board", icon: Megaphone },
  { to: "/attendance", label: "Attendance", icon: CalendarCheck },
  { to: "/homework", label: "Homework", icon: BookOpen },
  { to: "/exams", label: "Exams & Results", icon: Award },
  { to: "/calendar", label: "Calendar", icon: CalendarDays },
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/reports", label: "Reports", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: Settings },
];

const TEACHER_NAV: NavItem[] = [
  { to: "/teacher", label: "Dashboard", icon: LayoutDashboard },
  { to: "/attendance", label: "Attendance", icon: CalendarCheck },
  { to: "/homework", label: "Homework", icon: BookOpen },
  { to: "/exams", label: "Marks & Results", icon: Award },
  { to: "/notices", label: "Notice Board", icon: Megaphone },
  { to: "/calendar", label: "Calendar", icon: CalendarDays },
];

const PARENT_NAV: NavItem[] = [
  { to: "/parent", label: "Home", icon: Home },
  { to: "/parent/fees", label: "Fees", icon: IndianRupee },
  { to: "/parent/attendance", label: "Attendance", icon: CalendarCheck },
  { to: "/parent/homework", label: "Homework", icon: BookOpen },
  { to: "/parent/results", label: "Results", icon: Award },
  { to: "/parent/notices", label: "Notices", icon: Megaphone },
  { to: "/parent/calendar", label: "Calendar", icon: CalendarDays },
  { to: "/parent/profile", label: "Profile", icon: User },
];

const PARENT_TABS = PARENT_NAV.filter((n) =>
  ["/parent", "/parent/fees", "/parent/attendance", "/parent/notices", "/parent/profile"].includes(n.to),
);

function navFor(role: Role | null): NavItem[] {
  if (role === "admin") return ADMIN_NAV;
  if (role === "teacher") return TEACHER_NAV;
  return PARENT_NAV;
}

function Brand({ compact }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span className="brand-gradient flex size-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-primary-foreground">
        RM
      </span>
      {!compact ? (
        <span className="leading-tight">
          <span className="block text-sm font-bold">RAJNISH MEMORIAL</span>
          <span className="block text-[11px] tracking-wide text-muted-foreground">
            PUBLIC SCHOOL
          </span>
        </span>
      ) : null}
    </div>
  );
}

function NavLinks({ items, onNavigate }: { items: NavItem[]; onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="space-y-1">
      {items.map(({ to, label, icon: Icon }) => {
        const active = pathname === to || (to !== "/" && pathname.startsWith(to + "/"));
        return (
          <Link
            key={to}
            to={to}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent/60",
            )}
          >
            <Icon className="size-4 shrink-0" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { role, fullName, user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const items = navFor(role);
  const isParent = role === "parent";

  return (
    <div className="min-h-screen bg-background">
      {!isParent ? (
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r bg-sidebar lg:flex">
          <div className="flex h-16 items-center border-b px-4">
            <Brand />
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            <NavLinks items={items} />
          </div>
          <div className="border-t p-3">
            <p className="truncate px-3 text-xs text-muted-foreground">{user?.email}</p>
            <Button variant="ghost" size="sm" className="mt-1 w-full justify-start" onClick={signOut}>
              <LogOut className="size-4" /> Sign out
            </Button>
          </div>
        </aside>
      ) : null}

      {open && !isParent ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Close menu"
            className="absolute inset-0 bg-foreground/40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col bg-sidebar shadow-xl">
            <div className="flex h-16 items-center justify-between border-b px-4">
              <Brand />
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Close">
                <X className="size-5" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              <NavLinks items={items} onNavigate={() => setOpen(false)} />
            </div>
            <div className="border-t p-3">
              <Button variant="ghost" size="sm" className="w-full justify-start" onClick={signOut}>
                <LogOut className="size-4" /> Sign out
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <div className={cn(!isParent && "lg:pl-64")}>
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-card/90 px-4 backdrop-blur">
          {!isParent ? (
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="size-5" />
            </Button>
          ) : null}
          {isParent ? <Brand /> : null}
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-right text-sm leading-tight sm:block">
              <span className="block font-semibold">{fullName || user?.email}</span>
              <span className="block text-xs capitalize text-muted-foreground">{role ?? ""}</span>
            </span>
            {isParent ? (
              <Button variant="ghost" size="icon" onClick={signOut} aria-label="Sign out">
                <LogOut className="size-5" />
              </Button>
            ) : null}
          </div>
        </header>

        <main className={cn("mx-auto w-full max-w-7xl p-4 sm:p-6", isParent && "pb-24")}>
          {children}
        </main>
      </div>

      {isParent ? (
        <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t bg-card">
          {PARENT_TABS.map(({ to, label, icon: Icon }) => (
            <ParentTab key={to} to={to} label={label} Icon={Icon} />
          ))}
        </nav>
      ) : null}
    </div>
  );
}

function ParentTab({ to, label, Icon }: { to: string; label: string; Icon: typeof Home }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const active = pathname === to;
  return (
    <Link
      to={to}
      className={cn(
        "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium",
        active ? "text-primary" : "text-muted-foreground",
      )}
    >
      <Icon className="size-5" />
      {label}
    </Link>
  );
}

export { SCHOOL_NAME };
