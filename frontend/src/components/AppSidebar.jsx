import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  CircleUserRoundIcon,
  HomeIcon,
  LogOutIcon,
  MessageCircleIcon,
  MoonIcon,
  ShieldCheckIcon,
  ShoppingCartIcon,
  SunIcon,
  StoreIcon,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from './ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

export default function AppSidebar() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => location.pathname === path;
  const darkMode = theme === 'dark';

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
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              render={<button type="button" />}
              onClick={() => setTheme(darkMode ? 'light' : 'dark')}
              tooltip={darkMode ? 'Light mode' : 'Dark mode'}
            >
              {darkMode ? <SunIcon /> : <MoonIcon />}
              <span>{darkMode ? 'Light mode' : 'Dark mode'}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          {user && (
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <SidebarMenuButton size="lg" aria-label={`Open profile menu for ${user.name}`}>
                      <CircleUserRoundIcon />
                      <span className="flex min-w-0 flex-col items-start">
                        <span className="max-w-full truncate font-medium">{user.name}</span>
                        <span className="max-w-full truncate text-xs text-sidebar-foreground/70">{user.email}</span>
                      </span>
                    </SidebarMenuButton>
                  }
                />
                <DropdownMenuContent side="top" align="end" className="w-48">
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => {
                      logout();
                      navigate('/login');
                    }}
                  >
                    <LogOutIcon />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
