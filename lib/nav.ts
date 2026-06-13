import {
  LayoutDashboard,
  Workflow,
  Database,
  Network,
  Target,
  ShieldAlert,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
}

export const NAVIGATION: NavItem[] = [
  { name: 'Workspace', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Agent Registry', href: '/agents', icon: Network },
  { name: 'Architect', href: '/workflow', icon: Workflow },
  { name: 'Memory', href: '/memory', icon: Database },
  { name: 'Hunt Center', href: '/hunt', icon: Target },
  { name: 'Enterprise', href: '/admin', icon: ShieldAlert },
];
