import {
  Banknote,
  FileBarChart2,
  LayoutDashboard,
  Package,
  Receipt,
  Tags,
  UserCog,
  UserRound,
  Users,
  type LucideIcon,
} from 'lucide-react';

import type { Role } from '@/lib/auth/authorization';

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  description: string;
  /** If set, only these roles see the item in the sidebar. */
  roles?: Role[];
};

export const sidebarNavigation: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    description: 'Business overview',
  },
  {
    title: 'Customers',
    href: '/customers',
    icon: Users,
    description: 'Buyer directory',
  },
  {
    title: 'Orders',
    href: '/orders',
    icon: Package,
    description: 'Export pipeline',
  },
  {
    title: 'Payments',
    href: '/payments',
    icon: Banknote,
    description: 'Payment history',
  },
  {
    title: 'Expenses',
    href: '/expenses',
    icon: Receipt,
    description: 'Cost tracking',
  },
  {
    title: 'Categories',
    href: '/expense-categories',
    icon: Tags,
    description: 'Expense taxonomy',
  },
  {
    title: 'Reports',
    href: '/reports',
    icon: FileBarChart2,
    description: 'Export & insights',
  },
  {
    title: 'Users',
    href: '/users',
    icon: UserCog,
    description: 'Signup registry',
    roles: ['owner', 'admin'],
  },
  {
    title: 'Profile',
    href: '/profile',
    icon: UserRound,
    description: 'Account settings',
  },
];
