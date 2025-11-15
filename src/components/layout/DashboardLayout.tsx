import * as React from 'react';
import {
  Box,
  Container,
  GlobalStyles,
} from '@mui/material';
import { MainNav } from './MainNav';
import { SideNav } from './SideNav';
import { SidebarProvider, useSidebar } from '../../contexts/SidebarContext';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

function DashboardLayoutContent({ children }: DashboardLayoutProps): React.JSX.Element {
  const { isCollapsed } = useSidebar();

  return (
    <>
      <GlobalStyles
        styles={{
          body: {
            '--MainNav-height': '64px',
            '--SideNav-width': isCollapsed ? '0px' : '280px',
          },
        }}
      />
      <Box
        sx={{
          bgcolor: 'var(--mui-palette-background-default)',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          minHeight: '100vh',
        }}
      >
        <SideNav />
        <Box 
          sx={{ 
            display: 'flex', 
            flex: '1 1 auto', 
            flexDirection: 'column', 
            pl: { lg: 'var(--SideNav-width)' },
            minHeight: '100vh',
            transition: 'padding-left 0.3s ease',
          }}
        >
          <MainNav />
          <Box
            component="main"
            sx={{
              flex: '1 1 auto',
              py: 2,
              bgcolor: '#f8fafc',
            }}
          >
            <Container maxWidth="xl" sx={{ height: '100%' }}>
              {children}
            </Container>
          </Box>
        </Box>
      </Box>
    </>
  );
}

export default function DashboardLayout({ children }: DashboardLayoutProps): React.JSX.Element {
  return (
    <SidebarProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </SidebarProvider>
  );
}
