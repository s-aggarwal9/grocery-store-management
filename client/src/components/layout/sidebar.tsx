import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Package,
  Users,
  FileText,
  Wallet,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Products", href: "/products", icon: Package },
  { name: "Customers", href: "/customers", icon: Users },
  { name: "Invoices", href: "/invoices", icon: FileText },
  { name: "Accounting", href: "/accounting", icon: Wallet },
];

function NavLinks({ className }: { className?: string }) {
  const [location] = useLocation();

  return (
    <nav className={className}>
      {navigation.map((item) => (
        <Link key={item.name} href={item.href}>
          <a
            className={cn(
              "group flex gap-x-3 rounded-md p-2 text-sm leading-6",
              location === item.href
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <item.icon className="h-6 w-6 shrink-0" />
            {item.name}
          </a>
        </Link>
      ))}
    </nav>
  );
}

export function Sidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild className="lg:hidden">
          <Button variant="outline" size="icon" className="ml-4 mt-4">
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72">
          <div className="flex h-16 items-center px-6">
            <h1 className="text-lg font-semibold">Grocery Store</h1>
          </div>
          <NavLinks className="flex flex-col gap-y-1 px-4" />
        </SheetContent>
      </Sheet>

      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 border-r bg-sidebar px-6">
          <div className="flex h-16 items-center">
            <h1 className="text-lg font-semibold text-sidebar-foreground">
              Grocery Store
            </h1>
          </div>
          <NavLinks className="flex flex-col gap-y-1" />
        </div>
      </div>
    </>
  );
}
