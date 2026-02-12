'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  FolderOpen,
  Tags,
  Activity,
  Settings,
  LogOut,
  Plus,
  X,
  Menu,
  Briefcase,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/hooks/useTranslation';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { LogCategory, logger } from '@/lib/logger';
interface Folder {
  id: string;
  name: string;
}

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ mobileOpen, onMobileClose }: SidebarProps = {}) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useTranslation();
  const { toast } = useToast();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [showAllFolders, setShowAllFolders] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setUserId(data.session.user.id);
      }
    };
    fetchSession();
  }, []);

  useEffect(() => {
    loadFolders();
  }, []);

  const loadFolders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data, error } = await supabase
      .from('folders')
      .select('id, name')
      .eq('user_id', session.user.id)
      .is('parent_id', null)
      .order('name');

    if (!error && data) {
      setFolders(data); 
      logger.info(LogCategory.FOLDER, `Loaded ${data.length} folders for user`, {
        userId: session.user.id,
        metadata: { folderCount: data.length },
      });
    } else if (error) { 
      logger.error(LogCategory.FOLDER, 'Failed to load folders', error, {
        userId: session.user.id,
      });
    }
  };


  const handleLogout = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const { error } = await supabase.auth.signOut();

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
 
      logger.error(LogCategory.AUTH, 'Logout failed', error, {
        userId: session?.user.id || 'unknown',
      });
    } else { 
      logger.userLogout(session?.user.id || 'unknown');

      router.push('/');
    }
  };


  const navigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      name: 'All Documents',
      href: '/dashboard/documents',
      icon: FileText,
    },
    {
      name: 'Folders',
      href: '/dashboard/folders',
      icon: FolderOpen,
    },
    {
      name: 'Tags',
      href: '/dashboard/tags',
      icon: Tags,
    },
    {
      name: 'OCR Status',
      href: '/dashboard/ocr-status',
      icon: Activity,
    },
    {
      name: 'Settings',
      href: '/dashboard/settings',
      icon: Settings,
    },
  ];

  const handleNavClick = async (href: string) => {
    if (onMobileClose) {
      onMobileClose();
    }

    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;

      const userId = data.session?.user.id;
      if (userId) {
        logger.userAction('Navigation', userId, undefined, { destination: href });
      }
    } catch (err) {
      console.error('Failed to log navigation:', err);
    }

    router.push(href);
  };



  const SidebarContent = () => (
    <>
      <div className="p-6 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center space-x-2">
          <Image src='/Images/Websitelogo.png' alt='SnappArchieve' width={100} height={20}
            className='ml-10' />
        </Link>
        {onMobileClose && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onMobileClose}
            className="lg:hidden"
          >
            <X className="h-6 w-6" />
          </Button>
        )}
      </div>

      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <button
              key={item.href}
              onClick={() => handleNavClick(item.href)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive
                ? 'bg-primary-light text-primary'
                : 'text-gray-700 hover:bg-gray-50'
                }`}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </button>
          );
        })}

        {/* Dossiers section: All Dossiers + Create New Dossier */}
        <div className="pt-4 pb-2">
          <div className="px-3 mb-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Dossiers
            </span>
          </div>
          <div className="space-y-1">
            <button
              onClick={() => handleNavClick('/dashboard/dossiers')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${pathname === '/dashboard/dossiers'
                ? 'bg-primary-light text-primary'
                : 'text-gray-700 hover:bg-gray-50'
                }`}
            >
              <Briefcase className="h-5 w-5" />
              All Dossiers
            </button>
            <Button
              onClick={() => handleNavClick('/dashboard/dossiers?create=1')}
              variant="ghost"
              size="sm"
              className="w-full justify-start text-primary hover:text-primary-hover hover:bg-primary-light"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create New Dossier
            </Button>
          </div>
        </div>

        {folders.length > 0 && (
          <div className="pt-4 pb-2">
            <div className="px-3 mb-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Your Folders
              </span>
            </div>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {(showAllFolders ? folders : folders.slice(0, 3)).map((folder) => (
                <button
                  key={folder.id}
                  onClick={() =>
                    handleNavClick(`/dashboard/folders/${folder.id}`)
                  }
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                >
                  <FolderOpen className="h-4 w-4" />
                  <span className="truncate">{folder.name}</span>
                </button>
              ))}
            </div>

            {folders.length > 3 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAllFolders(!showAllFolders)}
                className="w-full justify-start mt-2 text-primary hover:text-primary-hover hover:bg-primary-light"
              >
                {showAllFolders ? 'Show Less' : 'Show More'}
              </Button>
            )}
            <Button
              onClick={() => {
                handleNavClick('/dashboard/folders');
                logger.userAction('New Folder Click', userId || 'unknown');
              }}
              variant="ghost"
              size="sm"
              className="w-full justify-start mt-2 text-primary hover:text-primary-hover hover:bg-primary-light"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Folder
            </Button>

          </div>
        )}
      </nav>

      <div className="p-3 border-t">
        <Button
          onClick={handleLogout}
          variant="ghost"
          className="w-full justify-start text-gray-700 hover:text-red-600 hover:bg-red-50"
        >
          <LogOut className="h-5 w-5 mr-3" />
          Logout
        </Button>
      </div>
    </>
  );

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={`fixed lg:sticky top-0 z-50 lg:z-0 w-64 bg-white border-r h-screen flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <SidebarContent />
      </aside>
    </>
  );
}
