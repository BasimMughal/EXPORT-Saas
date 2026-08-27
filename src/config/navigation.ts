import {
  Banknote,
  FileBarChart2,
  LayoutDashboard,
  Package,
  UserCog,
  UserRound,
  Users,
  type LucideIcon,
} from 'lucide-react';

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  description: string;
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
  },
  {
    title: 'Profile',
    href: '/profile',
    icon: UserRound,
    description: 'Account settings',
  },
];
