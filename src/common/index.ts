import { 
  HomeIcon,
  BoltIcon, 
  BoltSlashIcon, 
  SunIcon, 
  CubeTransparentIcon,
  CakeIcon,
  PaintBrushIcon,
  VideoCameraIcon,
  FaceSmileIcon,
  CpuChipIcon,
  MicrophoneIcon,
  SpeakerWaveIcon,
  PaperAirplaneIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';
import { NavItem } from '@/types';

export const navigation: Array<NavItem> = [
  { name: 'Interior Design', href: '/', icon: HomeIcon },
  { name: 'IlluminAI', href: '/illuminai', icon: SunIcon },
  { name: 'Upscaler', href: '/app/upscaler', icon:  CubeTransparentIcon},
  { name: 'Enhance Background', href: '/enhancebg', icon: BoltIcon },
  { name: 'Remove Background', href: '/removebg', icon: BoltSlashIcon },
  { name: 'Become Simpson', href: '/simpson', icon: CakeIcon },
  { name: 'FreshInk', href: '/app/freshink', icon: PaintBrushIcon },
  { name: 'Create Video', href: '/app/createVideo', icon: VideoCameraIcon },
  { name: 'Hair Style', href: '/app/hairStyle', icon: FaceSmileIcon },
  { name: 'Live Portrait', href: '/app/livePortrait', icon: MicrophoneIcon },
  { name: 'tts', href: '/on-device/tts', icon: SpeakerWaveIcon },
  { name: 'Trip Planner', href: '/chat/trip', icon: PaperAirplaneIcon },
  { name: 'TryOn', href: '/app/tryon', icon: UserCircleIcon },
  { name: 'Sam2', href: '/app/sam2', icon: UserCircleIcon },
  { name: 'Logo', href: '/app/logo', icon: UserCircleIcon },
  { name: 'EVF-SAM', href: '/app/EVF-SAM', icon: UserCircleIcon },
];
