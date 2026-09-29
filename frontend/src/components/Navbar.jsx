import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  HomeIcon,
  LogInIcon,
  LogOutIcon,
  MessageCircleIcon,
  MoreHorizontalIcon,
  MoonIcon,
  ShieldCheckIcon,
  ShoppingCartIcon,
  SunIcon,
  StoreIcon,
  UserPlusIcon,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import api from '../api/axios';
import { Button } from './ui/button';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from './ui/command';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [chatCount, setChatCount] = useState(0);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');

  useEffect(() => {
    document.documentElement.classList.toggle('dark-theme', darkMode);
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  useEffect(() => {
    if (!user) {
      setChatCount(0);
      return undefined;
    }

    let active = true;
    api.get('/chat/conversations')
      .then(({ data }) => {
        if (active) setChatCount(data.length);
      })
      .catch(() => {
        if (active) setChatCount(0);
      });

    return () => {
      active = false;
    };
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const runMenuAction = (action) => {
    setMenuOpen(false);
    action();
  };

  return (
    <nav className="navbar">
      <div className="brand-area">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="menu-toggle"
          aria-label="Open navigation command menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <MoreHorizontalIcon />
        </Button>
        <Link to="/" className="brand">ShopMERN</Link>
        <CommandDialog open={menuOpen} onOpenChange={setMenuOpen} title="ShopMERN menu">
          <Command>
            <CommandInput placeholder="Search the menu..." />
            <CommandList>
              <CommandEmpty>No matching menu item.</CommandEmpty>
              <CommandGroup heading="Navigate">
                <CommandItem onSelect={() => runMenuAction(() => navigate('/'))}>
                  <HomeIcon />
                  <span>Home</span>
                </CommandItem>
                {user?.role === 'user' && (
                  <CommandItem onSelect={() => runMenuAction(() => navigate('/cart'))}>
                    <ShoppingCartIcon />
                    <span>Cart ({cartCount})</span>
                  </CommandItem>
                )}
                <CommandItem onSelect={() => runMenuAction(() => navigate(user ? '/inbox' : '/login'))}>
                  <MessageCircleIcon />
                  <span>Chat{user ? ` (${chatCount})` : ''}</span>
                </CommandItem>
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup heading="Account">
                {!user && (
                  <>
                    <CommandItem onSelect={() => runMenuAction(() => navigate('/login'))}>
                      <LogInIcon />
                      <span>Login</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runMenuAction(() => navigate('/register'))}>
                      <UserPlusIcon />
                      <span>Register</span>
                    </CommandItem>
                  </>
                )}
                {user && (user.role === 'seller' || user.role === 'admin') && (
                  <CommandItem onSelect={() => runMenuAction(() => navigate('/seller'))}>
                    <StoreIcon />
                    <span>Seller Dashboard</span>
                  </CommandItem>
                )}
                {user?.role === 'admin' && (
                  <CommandItem onSelect={() => runMenuAction(() => navigate('/admin'))}>
                    <ShieldCheckIcon />
                    <span>Admin</span>
                  </CommandItem>
                )}
                <CommandItem onSelect={() => runMenuAction(() => setDarkMode((current) => !current))}>
                  {darkMode ? <SunIcon /> : <MoonIcon />}
                  <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
                </CommandItem>
                {user && (
                  <CommandItem onSelect={() => runMenuAction(handleLogout)}>
                    <LogOutIcon />
                    <span>Logout</span>
                  </CommandItem>
                )}
              </CommandGroup>
            </CommandList>
          </Command>
        </CommandDialog>
      </div>
      <div className="nav-links">
        {user && (user.role === 'seller' || user.role === 'admin') && (
          <Link to="/seller">Seller Dashboard</Link>
        )}
        {user && user.role === 'admin' && <Link to="/admin">Admin</Link>}

        {!user && <Link to="/login">Login</Link>}
        {!user && <Link to="/register">Register</Link>}
        {user && (
          <span className="nav-user">
            {user.name} ({user.role})
            <button onClick={handleLogout}>Logout</button>
          </span>
        )}
      </div>
    </nav>
  );
}
