import {
  Banknote,
  FileBarChart2,
  LayoutDashboard,
  Package,
  Users,
  type LucideIcon,
} from 'lucide-react';

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  description: string;
};

/** Pages reached from the header rather than the sidebar; used for the header title. */
export const headerOnlyPages: Array<Pick<NavItem, 'title' | 'href' | 'description'>> = [
  {
    title: 'Profile',
    href: '/profile',
    description: 'Account settings',
  },
];

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
];
