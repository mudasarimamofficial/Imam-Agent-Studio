import {
  Target,
  Megaphone,
  Search,
  Inbox,
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
  { name: 'Hunt Center', href: '/hunt', icon: Target },
  { name: 'Copywriter AI', href: '/campaigns', icon: Megaphone },
  { name: 'Research Scout', href: '/leads', icon: Search },
  { name: 'Review Queue', href: '/review', icon: Inbox },
  { name: 'System Playground', href: '/agents', icon: Sliders },
  { name: 'Enterprise Settings', href: '/admin', icon: ShieldAlert },
];

