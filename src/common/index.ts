import { HomeIcon, BoltIcon, BoltSlashIcon } from '@heroicons/react/24/outline';
import { NavItem } from '@/types';

export const navigation: Array<NavItem> = [
  { name: 'Interior Design', href: '/', icon: HomeIcon },
  { name: 'Enhance Background', href: '/enhancebg', icon: BoltIcon },
  { name: 'Remove Background', href: '/removebg', icon: BoltSlashIcon },
];