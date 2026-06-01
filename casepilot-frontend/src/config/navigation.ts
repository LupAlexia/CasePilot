import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import PeopleOutlinedIcon from '@mui/icons-material/PeopleOutlined';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import type { SvgIconComponent } from '@mui/icons-material';

export interface NavItem {
  label: string;
  path: string;
  icon: SvgIconComponent;
  adminOnly?: boolean;
}

export const workspaceNavigation: NavItem[] = [
  { label: 'Dashboard', path: '/app/dashboard', icon: DashboardOutlinedIcon },
  { label: 'Dosare', path: '/app/dosare', icon: FolderOutlinedIcon },
  { label: 'Calendar', path: '/app/calendar', icon: CalendarMonthOutlinedIcon },
  { label: 'Asistent AI', path: '/app/asistent-ai', icon: AutoAwesomeOutlinedIcon },
  { label: 'Profil', path: '/app/profil', icon: PersonOutlineOutlinedIcon },
];

export const adminNavigation: NavItem[] = [
  { label: 'Utilizatori', path: '/app/admin/utilizatori', icon: PeopleOutlinedIcon, adminOnly: true },
  { label: 'Jurnal Audit', path: '/app/admin/audit', icon: HistoryOutlinedIcon, adminOnly: true },
  { label: 'Supraveghere', path: '/app/admin/supraveghere', icon: ShieldOutlinedIcon, adminOnly: true },
];
