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
  { name: 'Hunt Center', href: '/hunt', icon: Target },
  { name: 'Prompt Playground', href: '/agents', icon: Sliders },
  { name: 'Video Script Assistant', href: '/workflow', icon: Video },
  { name: 'Copywriter AI', href: '/campaigns', icon: Megaphone },
  { name: 'Enterprise Settings', href: '/admin', icon: ShieldAlert },
];

