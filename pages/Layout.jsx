

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { User } from '@/api/entities';
import { Blogger } from '@/api/entities';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';
import { Menu, User as UserIcon, LogOut, Globe } from 'lucide-react';
import ErrorBoundary from './components/ErrorBoundary';
import { LanguageProvider, useLanguage } from './components/contexts/LanguageContext';

function LayoutContent({ children, currentPageName }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [isBlogger, setIsBlogger] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { language, direction, switchLanguage, t } = useLanguage();

  useEffect(() => {
    const checkUser = async () => {
      try {
        const userData = await User.me();
        setUser(userData);

        if (userData && userData.role === 'blogger') {
          const bloggers = await Blogger.filter({ email: userData.email });
          setIsBlogger(bloggers && bloggers.length > 0);
        } else {
          setIsBlogger(false);
        }
      } catch (err) {
        console.log('Not logged in or error fetching user data, setting to default state.');
        setUser(null);
        setIsBlogger(false);
      }
    };

    checkUser();
  }, []);

  const handleLogout = async () => {
    await User.logout();
    window.location.reload();
  };

  const navigateToBloggerDashboard = () => {
    navigate(createPageUrl("BloggerDashboard"));
  };

  return (
    <div className="min-h-screen font-open-sans" dir={direction}>
      <style>{`
        /* Import fonts */
        @import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;500;600;700&family=Rubik:wght@400;500;600;700&display=swap');

        :root {
          --background: #ffffff;
          --foreground: #1a1a1a;
          --muted: #f3f4f6;
          --border: #e5e7eb;
          --primary: #3b82f6;
          --primary-foreground: #ffffff;
          --font-sans: 'Open Sans', sans-serif;
          --font-heading: 'Rubik', sans-serif;
        }

        html, body {
          direction: ${direction};
          text-align: ${direction === 'rtl' ? 'right' : 'left'};
          font-family: var(--font-sans);
        }

        h1, h2, h3, h4, h5, h6 {
          font-family: var(--font-heading);
        }

        .card-overlap {
          margin-top: -5rem;
          position: relative;
          z-index: 10;
        }

        .curved-shape {
          position: absolute;
          z-index: -1;
          border-radius: 50%;
        }

        .bg-gradient-primary {
          background: linear-gradient(135deg, #4fc3f7 0%, #0288d1 100%);
        }

        .search-pill {
          border-radius: 50px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
      `}</style>

      <header className="sticky top-0 z-50 w-full border-b shadow-sm bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container relative flex h-16 items-center justify-between">
          <Link to={createPageUrl("Home")} className="flex items-center gap-2">
            <span className="text-2xl font-bold font-heading">
              <span className="text-gray-800">Plan</span>
              <i className="text-blue-500 font-serif italic mx-1 not-italic">&</i>
              <span className="text-gray-800">Go</span>
            </span>
          </Link>

          {/* Centered Navigation for desktop */}
          <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <Link to={createPageUrl("Home")} legacyBehavior passHref>
                    <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                      {t('home')}
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <Link to={createPageUrl("Trips")} legacyBehavior passHref>
                    <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                      {t('myTrips')}
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <Link to={createPageUrl("Bloggers")} legacyBehavior passHref>
                    <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                      {t('travelBloggers')}
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
                {user && user.role === 'admin' && (
                  <>
                    <NavigationMenuItem>
                      <Button
                        variant="link"
                        onClick={() => navigate(createPageUrl("AdminPanel"))}
                      >
                        {t('systemSettings')}
                      </Button>
                    </NavigationMenuItem>
                    <NavigationMenuItem>
                      <Button
                        variant="link"
                        onClick={() => navigate(createPageUrl("AdminBloggerManager"))}
                      >
                        {t('bloggerManagement')}
                      </Button>
                    </NavigationMenuItem>
                  </>
                )}
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          {/* Language switcher and user menu */}
          <div className="hidden md:flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1">
                  <Globe className="h-4 w-4" />
                  <span className="text-sm">{language === 'he' ? 'עברית' : 'English'}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => switchLanguage('he')}>
                  <span className={language === 'he' ? 'font-bold' : ''}>עברית</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => switchLanguage('en')}>
                  <span className={language === 'en' ? 'font-bold' : ''}>English</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2">
                    <UserIcon className="h-5 w-5" />
                    {user.full_name}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => navigate(createPageUrl("UserProfile"))}>
                    {t('profile')}
                  </DropdownMenuItem>
                  {user?.role === 'blogger' && (
                    <DropdownMenuItem onClick={navigateToBloggerDashboard}>
                      {t('bloggerArea')}
                    </DropdownMenuItem>
                  )}
                  {user?.role === 'admin' && (
                    <DropdownMenuItem onClick={() => navigate(createPageUrl("AdminPanel"))}>
                      {t('systemSettings')}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem>{t('settings')}</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                    <LogOut className={`h-4 w-4 ${direction === 'rtl' ? 'ml-2' : 'mr-2'}`} />
                    {t('logout')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button onClick={() => User.login()}>{t('login')}</Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <Menu className="h-6 w-6" />
          </Button>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t p-4">
            <nav className="flex flex-col space-y-4">
              <Link
                to={createPageUrl("Home")}
                className="px-4 py-2 text-sm hover:bg-accent rounded-md"
                onClick={() => setMenuOpen(false)}
              >
                {t('home')}
              </Link>
              <Link
                to={createPageUrl("Trips")}
                className="px-4 py-2 text-sm hover:bg-accent rounded-md"
                onClick={() => setMenuOpen(false)}
              >
                {t('myTrips')}
              </Link>
              <Link
                to={createPageUrl("Bloggers")}
                className="px-4 py-2 text-sm hover:bg-accent rounded-md"
                onClick={() => setMenuOpen(false)}
              >
                {t('travelBloggers')}
              </Link>
              
              <div className="flex justify-between items-center px-4 py-2">
                <span className="text-sm">{t('language')}</span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => switchLanguage(language === 'he' ? 'en' : 'he')}
                >
                  {language === 'he' ? 'English' : 'עברית'}
                </Button>
              </div>
              
              {!user && (
                <Button onClick={() => User.login()} className="w-full">
                  {t('login')}
                </Button>
              )}
            </nav>
          </div>
        )}
      </header>

      <main className="min-h-[calc(100vh-4rem)] font-open-sans">
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </main>

      <footer className="border-t py-8 bg-muted/50">
        <div className="container grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-heading font-semibold mb-4">{t('about')}</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="#">{t('aboutUs')}</Link></li>
              <li><Link to="#">{t('ourTeam')}</Link></li>
              <li><Link to="#">{t('careers')}</Link></li>
              <li><Link to="#">{t('blog')}</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-heading font-semibold mb-4">{t('support')}</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="#">{t('contactUs')}</Link></li>
              <li><Link to="#">{t('faq')}</Link></li>
              <li><Link to="#">{t('helpCenter')}</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-heading font-semibold mb-4">{t('legal')}</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="#">{t('terms')}</Link></li>
              <li><Link to="#">{t('privacy')}</Link></li>
              <li><Link to="#">{t('refunds')}</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-heading font-semibold mb-4">{t('bloggers')}</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Button
                  variant="link"
                  className="h-auto p-0 text-muted-foreground hover:text-primary"
                  onClick={() => navigate(createPageUrl("BloggerLogin"))}
                >
                  {t('bloggerArea')}
                </Button>
              </li>
              <li>
                <Button
                  variant="link"
                  className="h-auto p-0 text-muted-foreground hover:text-primary"
                  onClick={() => navigate(createPageUrl("BloggerApplication"))}
                >
                  {t('applyToBeBlogger')}
                </Button>
              </li>
            </ul>
          </div>
        </div>
        <div className="container mt-8 pt-4 border-t text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Plan&Go. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

export default function Layout({ children, currentPageName }) {
  return (
    <LanguageProvider>
      <LayoutContent children={children} currentPageName={currentPageName} />
    </LanguageProvider>
  );
}

