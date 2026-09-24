'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronDown, Clock3, Package, Plus, UserPlus, Users, Zap } from 'lucide-react';

import { EmptyState } from '@/components/shared/empty-state';
import { OrderStatusBadge } from '@/components/shared/orders/order-status-badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatCurrency, formatDateDisplay } from '@/lib/formatters';
import type { OrderStatus } from '@/types/domain';

export type RecentOrderItem = {
  id: string;
  orderNumber: string;
  productName: string;
  customerName: string;
  status: OrderStatus;
  orderValue: number;
  currency: string;
  orderDate: string;
};

export type RecentCustomerItem = {
  id: string;
  name: string;
  company: string;
  country: string;
  createdAt: string;
};

type Panel = 'orders' | 'customers';

const PANEL_COPY: Record<Panel, { title: string; description: string; href: string; cta: string }> =
  {
    orders: {
      title: 'Recent orders',
      description: 'The latest orders added to your export pipeline.',
      href: '/orders',
      cta: 'View all orders',
    },
    customers: {
      title: 'Recent customers',
      description: 'The latest buyers added to your directory.',
      href: '/customers',
      cta: 'View all customers',
    },
  };

function initialsOf(value: string) {
  return (
    value
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || '?'
  );
}

/** Dashboard "Quick actions" menu: create shortcuts plus recent orders/customers in a popup. */
export function DashboardQuickMenu({
  recentOrders,
  recentCustomers,
}: {
  recentOrders: RecentOrderItem[];
  recentCustomers: RecentCustomerItem[];
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  // Kept after closing so the dialog doesn't change content during its exit animation.
  const [panel, setPanel] = useState<Panel>('orders');
  const copy = PANEL_COPY[panel];

  function openPanel(next: Panel) {
    setPanel(next);
    setDialogOpen(true);
  }

  return (
    <>
      {/* Non-modal so the dialog opened from a menu item gets focus cleanly. */}
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button className="h-10 rounded-lg shadow-none">
            <Zap className="h-4 w-4" />
            Quick actions
            <ChevronDown className="h-4 w-4 opacity-80" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60">
          <DropdownMenuLabel>Create</DropdownMenuLabel>
          <DropdownMenuItem asChild>
            <Link href="/customers/new">
              <UserPlus className="h-4 w-4 text-muted-foreground" />
              Add customer
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/orders/new">
              <Plus className="h-4 w-4 text-muted-foreground" />
              Create order
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Recent</DropdownMenuLabel>
          <DropdownMenuItem onSelect={() => openPanel('orders')}>
            <Package className="h-4 w-4 text-muted-foreground" />
            <span className="flex-1">Recent orders</span>
            <span className="text-xs text-muted-foreground">{recentOrders.length}</span>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => openPanel('customers')}>
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="flex-1">Recent customers</span>
            <span className="text-xs text-muted-foreground">{recentCustomers.length}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="flex max-h-[calc(100vh-4rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-xl">
          <DialogHeader className="border-b border-border/70 px-6 py-5">
            <DialogTitle className="font-display flex items-center gap-2">
              <Clock3 className="h-4 w-4 text-primary" />
              {copy.title}
            </DialogTitle>
            <DialogDescription>{copy.description}</DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {panel === 'orders' ? (
              recentOrders.length ? (
                <div className="divide-y divide-border/70">
                  {recentOrders.map((order) => (
                    <Link
                      key={order.id}
                      href={`/orders/${order.id}`}
                      className="group flex items-center gap-3 px-6 py-3.5 transition-colors hover:bg-muted/40"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Package className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-semibold">{order.productName}</p>
                          <OrderStatusBadge status={order.status} />
                        </div>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          <span className="font-mono">{order.orderNumber}</span> ·{' '}
                          {order.customerName}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-semibold">
                          {formatCurrency(order.orderValue, order.currency)}
                        </p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          {formatDateDisplay(order.orderDate)}
                        </p>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="p-6">
                  <EmptyState
                    title="No orders yet"
                    description="Orders you create will show up here."
                  />
                </div>
              )
            ) : recentCustomers.length ? (
              <div className="divide-y divide-border/70">
                {recentCustomers.map((customer) => {
                  const displayName = customer.company || customer.name;
                  return (
                    <Link
                      key={customer.id}
                      href={`/customers/${customer.id}`}
                      className="group flex items-center gap-3 px-6 py-3.5 transition-colors hover:bg-muted/40"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-xs font-semibold text-violet-700">
                        {initialsOf(displayName)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{displayName}</p>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {[customer.company ? customer.name : null, customer.country]
                            .filter(Boolean)
                            .join(' · ')}
                        </p>
                      </div>
                      <p className="shrink-0 text-[11px] text-muted-foreground">
                        Added {formatDateDisplay(customer.createdAt)}
                      </p>
                      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="p-6">
                <EmptyState
                  title="No customers yet"
                  description="Customers you add will show up here."
                />
              </div>
            )}
          </div>

          <div className="flex shrink-0 justify-end border-t border-border/70 bg-muted/30 px-6 py-3">
            <Button asChild variant="ghost" size="sm" className="rounded-lg">
              <Link href={copy.href}>
                {copy.cta}
                <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
