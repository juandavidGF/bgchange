import { HomeIcon, 
  BoltIcon, 
  BoltSlashIcon, 
  SunIcon, 
  CubeTransparentIcon,
  FaceSmileIcon,
  PaintBrushIcon,
  VideoCameraIcon,
  HandRaisedIcon,
} from '@heroicons/react/24/outline';
import { NavItem } from '@/types';

export const navigation: Array<NavItem> = [
  { name: 'Interior Design', href: '/', icon: HomeIcon },
  { name: 'IlluminAI', href: '/illuminai', icon: SunIcon },
  { name: 'Upscaler', href: '/upscaler', icon:  CubeTransparentIcon},
  { name: 'Enhance Background', href: '/enhancebg', icon: BoltIcon },
  { name: 'Remove Background', href: '/removebg', icon: BoltSlashIcon },
  { name: 'Become Simpson', href: '/simpson', icon: FaceSmileIcon },
  { name: 'FreshInk', href: '/app/freshink', icon: PaintBrushIcon },
  { name: 'Create Video', href: '/app/createVideo', icon: VideoCameraIcon },
  { name: 'Hair Style', href: '/app/hairStyle', icon: HandRaisedIcon },
];
