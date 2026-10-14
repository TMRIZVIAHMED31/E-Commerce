import { Link, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  MessageCircleIcon,
  ShieldCheckIcon,
  ShoppingCartIcon,
  StoreIcon,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from './ui/sidebar';

export default function AppSidebar() {
  const { user } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton render={<Link to="/" />} size="lg" isActive={isActive('/')}>
              <span className="font-semibold">ShopMERN</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigate</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton render={<Link to="/" />} isActive={isActive('/')}>
                  <HomeIcon />
                  <span>Home</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {user?.role === 'user' && (
                <SidebarMenuItem>
                  <SidebarMenuButton render={<Link to="/cart" />} isActive={isActive('/cart')}>
                    <ShoppingCartIcon />
                    <span>Cart</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              <SidebarMenuItem>
                <SidebarMenuButton render={<Link to={user ? '/inbox' : '/login'} />} isActive={isActive('/inbox')}>
                  <MessageCircleIcon />
                  <span>Chat</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {(user?.role === 'seller' || user?.role === 'admin') && (
          <SidebarGroup>
            <SidebarGroupLabel>Workspace</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton render={<Link to="/seller" />} isActive={isActive('/seller')}>
                    <StoreIcon />
                    <span>Seller Dashboard</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {user.role === 'admin' && (
                  <SidebarMenuItem>
                    <SidebarMenuButton render={<Link to="/admin" />} isActive={isActive('/admin')}>
                      <ShieldCheckIcon />
                      <span>Admin</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
