import {
  Target,
  Megaphone,
  Video,
  Sliders,
  ShieldAlert,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
}

export const NAVIGATION: NavItem[] = [
  { name: 'Agent Library', href: '/library', icon: Target },
  { name: 'Hunt Center', href: '/hunt', icon: Target },
  { name: 'Campaigns', href: '/campaigns', icon: Megaphone },
  { name: 'Enterprise Settings', href: '/admin', icon: ShieldAlert },
];

