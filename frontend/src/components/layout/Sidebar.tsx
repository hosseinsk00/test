import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Box,
  Typography,
  Divider,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  LocalShipping as TruckIcon,
  Person as DriverIcon,
  Build as BreakdownIcon,
  Settings as ServiceIcon,
  Assignment as InspectionIcon,
  LocalGasStation as FuelIcon,
  Notifications as NotificationIcon,
  Chat as ChatIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

const DRAWER_WIDTH = 260;

interface MenuItem {
  title: string;
  path: string;
  icon: React.ReactElement;
}

const menuItems: MenuItem[] = [
  { title: 'داشبورد', path: '/dashboard', icon: <DashboardIcon /> },
  { title: 'کامیون‌ها', path: '/trucks', icon: <TruckIcon /> },
  { title: 'رانندگان', path: '/drivers', icon: <DriverIcon /> },
  { title: 'خرابی‌ها', path: '/breakdowns', icon: <BreakdownIcon /> },
  { title: 'سرویس‌ها', path: '/services', icon: <ServiceIcon /> },
  { title: 'بازدیدها', path: '/inspections', icon: <InspectionIcon /> },
  { title: 'مدیریت سوخت', path: '/fuel', icon: <FuelIcon /> },
  { title: 'اعلان‌ها', path: '/notifications', icon: <NotificationIcon /> },
  { title: 'چت‌بات هوشمند', path: '/chatbot', icon: <ChatIcon /> },
];

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          borderRight: '1px solid #e0e0e0',
        },
      }}
    >
      <Toolbar>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TruckIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Box>
            <Typography variant="h6" fontWeight="bold" color="primary">
              مدیریت ناوگان
            </Typography>
            <Typography variant="caption" color="text.secondary">
              سیستم جامع
            </Typography>
          </Box>
        </Box>
      </Toolbar>

      <Divider />

      <List sx={{ px: 1, py: 2 }}>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                selected={isActive}
                onClick={() => navigate(item.path)}
                sx={{
                  borderRadius: 2,
                  '&.Mui-selected': {
                    bgcolor: 'primary.main',
                    color: 'white',
                    '&:hover': {
                      bgcolor: 'primary.dark',
                    },
                    '& .MuiListItemIcon-root': {
                      color: 'white',
                    },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 40,
                    color: isActive ? 'white' : 'action.active',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.title}
                  primaryTypographyProps={{
                    fontSize: '0.95rem',
                    fontWeight: isActive ? 600 : 400,
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Drawer>
  );
};

export default Sidebar;
export { DRAWER_WIDTH };
