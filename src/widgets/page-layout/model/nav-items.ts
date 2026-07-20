import {
  Building2,
  ListChecks,
  MessageSquare,
  Layers,
  MonitorSmartphone,
  PlusSquare,
  Settings,
  UploadCloud,
  UserPen,
  Users,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: '발행',
    items: [
      { href: '/manual-post', label: '수동 발행', icon: UploadCloud },
      { href: '/publish', label: '분리 발행', icon: Layers },
      { href: '/comment-jobs', label: '댓글 작업', icon: MessageSquare },
    ],
  },
  {
    label: '운영',
    items: [{ href: '/queue', label: '큐', icon: ListChecks }],
  },
  {
    label: '관리',
    items: [
      { href: '/nickname-change', label: '닉네임', icon: UserPen },
      { href: '/accounts', label: '계정', icon: Users },
      { href: '/cafe-join', label: '카페 가입', icon: Building2 },
      { href: '/cafe-create', label: '카페개설', icon: PlusSquare },
      { href: '/agent', label: '에이전트', icon: MonitorSmartphone },
      { href: '/settings', label: '설정', icon: Settings },
    ],
  },
];
