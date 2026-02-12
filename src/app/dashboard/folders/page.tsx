'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  FolderOpen,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  FileText,
  Lock,
} from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { Toaster } from '@/components/ui/toaster';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import UniversalLoader from '@/components/ui/universal-loader';
import { logger, LogCategory, PerformanceLogger } from '@/lib/logger';
import { useSubscriptionAccess } from '@/lib/hooks/useSubscriptionAccess';
import { SubscriptionWarningBanner } from '@/components/subscription/SubscriptionWarningBanner';

interface Folder {
  id: string;
  name: string;
  created_at: string;
  document_count?: number;
}

export default function FoldersPage() {

  const ITEMS_PER_PAGE = 5;
  const router = useRouter();
  const { toast } = useToast();
  const subscriptionAccess = useSubscriptionAccess();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderDesc, setNewFolderDesc] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  useEffect(() => {
    logger.info(LogCategory.USER_ACTION, 'Folders page loaded');
    checkAuth();
  }, []);

  const checkAuth = async () => {
    logger.debug(LogCategory.AUTH, 'Checking authentication for folders page');

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      logger.warn(LogCategory.AUTH, 'No session found, redirecting to login');
      router.push('/login');
      return;
    }

    logger.info(LogCategory.AUTH, 'User authenticated on folders page', { userId: session.user.id });
    loadFolders(session.user.id);
  };

  const loadFolders = async (userId: string) => {
    const perf = new PerformanceLogger('Load folders', userId);
    setIsLoading(true);

    try {
      logger.info(LogCategory.FOLDER, 'Loading folders list', { userId });

      const { data, error } = await supabase
        .from('folders')
        .select('*, documents(count)')
        .eq('user_id', userId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error(LogCategory.DATABASE, 'Failed to load folders', error, { userId });

        toast({
          title: 'Error',
          description: 'Failed to load folders',
          variant: 'destructive',
        });

        setFolders([]);
      } else {
        logger.debug(LogCategory.FOLDER, 'Counting documents in folders', {
          folderCount: data?.length || 0,
          userId,
        });

        const foldersWithCounts = await Promise.all(
          (data || []).map(async (folder) => {
            const { count } = await supabase
              .from('documents')
              .select('*', { count: 'exact', head: true })
              .eq('folder_id', folder.id)
              .is('deleted_at', null);

            return { ...folder, document_count: count || 0 };
          })
        );

        setFolders(foldersWithCounts);
        setCurrentPage(1);

        logger.info(LogCategory.FOLDER, 'Folders loaded successfully', {
          count: foldersWithCounts.length,
          totalDocuments: foldersWithCounts.reduce((sum, f) => sum + (f.document_count || 0), 0),
          userId,
        });

        perf.end({ foldersCount: foldersWithCounts.length });
      }
    } catch (error) {
      logger.error(LogCategory.SYSTEM, 'Failed to load folders', error, { userId });
      perf.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const isDuplicateError = (error: any): boolean => {
    if (!error) return false;

    const errorMessage = error.message?.toLowerCase() || '';
    const errorCode = error.code || '';

    const isDuplicate = (
      errorCode === '23505' ||
      errorMessage.includes('duplicate') ||
      errorMessage.includes('unique') ||
      errorMessage.includes('idx_folders_unique_name_root') ||
      errorMessage.includes('idx_folders_unique_name_subfolder')
    );

    if (isDuplicate) {
      logger.warn(LogCategory.FOLDER, 'Duplicate folder name detected', {
        errorCode,
        errorMessage: error.message,
      });
    }

    return isDuplicate;
  };

  const handleCreateFolder = async () => {
    // Check subscription access before allowing creation
    if (!subscriptionAccess.canEdit) {
      subscriptionAccess.showAccessDeniedToast('create folders');
      return;
    }

    const trimmedName = newFolderName.trim();

    if (!trimmedName) {
      logger.warn(LogCategory.FOLDER, 'Create folder attempted without name');

      toast({
        title: 'Error',
        description: 'Folder name is required',
        variant: 'destructive',
      });
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const userId = session.user.id;

    logger.info(LogCategory.FOLDER, 'Creating new folder', {
      folderName: trimmedName,
      userId,
    });

    try {
      const { error } = await supabase.from('folders').insert({
        user_id: userId,
        name: trimmedName,
      });

      if (error) {
        if (isDuplicateError(error)) {
          logger.warn(LogCategory.FOLDER, 'Duplicate folder creation attempt', {
            folderName: trimmedName,
            userId,
          });

          toast({
            title: 'Duplicate Folder Name',
            description: `A folder named "${trimmedName}" already exists. Please choose a different name.`,
            variant: 'destructive',
          });
        } else {
          logger.error(LogCategory.DATABASE, 'Failed to create folder', error, {
            folderName: trimmedName,
            userId,
          });

          toast({
            title: 'Error',
            description: `Failed to create folder: ${error.message}`,
            variant: 'destructive',
          });
        }
      } else {
        logger.folderCreated('new-folder-id', userId, trimmedName);

        toast({
          title: 'Success',
          description: 'Folder created successfully',
        });

        setNewFolderName('');
        setNewFolderDesc('');
        setIsCreateOpen(false);
        loadFolders(userId);
      }
    } catch (error) {
      logger.error(LogCategory.SYSTEM, 'Folder creation failed', error, {
        folderName: trimmedName,
        userId,
      });
    }
  };

  const handleEditFolder = async () => {
    // Check subscription access before allowing edit
    if (!subscriptionAccess.canEdit) {
      subscriptionAccess.showAccessDeniedToast('edit folders');
      return;
    }

    if (!editingFolder) return;

    const trimmedName = newFolderName.trim();

    if (!trimmedName) {
      logger.warn(LogCategory.FOLDER, 'Edit folder attempted without name', {
        folderId: editingFolder.id,
      });

      toast({
        title: 'Error',
        description: 'Folder name is required',
        variant: 'destructive',
      });
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user.id;

    logger.info(LogCategory.FOLDER, 'Updating folder name', {
      folderId: editingFolder.id,
      oldName: editingFolder.name,
      newName: trimmedName,
      userId,
    });

    try {
      const { error } = await supabase
        .from('folders')
        .update({ name: trimmedName })
        .eq('id', editingFolder.id);

      if (error) {
        if (isDuplicateError(error)) {
          logger.warn(LogCategory.FOLDER, 'Duplicate folder rename attempt', {
            folderId: editingFolder.id,
            newName: trimmedName,
            userId,
          });

          toast({
            title: 'Duplicate Folder Name',
            description: `A folder named "${trimmedName}" already exists. Please choose a different name.`,
            variant: 'destructive',
          });
        } else {
          logger.error(LogCategory.DATABASE, 'Failed to update folder', error, {
            folderId: editingFolder.id,
            userId,
          });

          toast({
            title: 'Error',
            description: `Failed to update folder: ${error.message}`,
            variant: 'destructive',
          });
        }
      } else {
        logger.folderUpdated(editingFolder.id, userId || 'unknown', {
          oldName: editingFolder.name,
          newName: trimmedName,
        });

        toast({
          title: 'Success',
          description: 'Folder updated successfully',
        });

        setIsEditOpen(false);
        setEditingFolder(null);
        setNewFolderName('');

        if (session) loadFolders(session.user.id);
      }
    } catch (error) {
      logger.error(LogCategory.SYSTEM, 'Folder update failed', error, {
        folderId: editingFolder.id,
        userId,
      });
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    // Check subscription access before allowing delete
    if (!subscriptionAccess.canDelete) {
      subscriptionAccess.showAccessDeniedToast('delete folders');
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user.id;

    const folderToDelete = folders.find(f => f.id === folderId);

    logger.info(LogCategory.FOLDER, 'Delete folder requested', {
      folderId,
      folderName: folderToDelete?.name,
      documentCount: folderToDelete?.document_count,
      userId,
    });

    if (!confirm('Are you sure you want to delete this folder? Documents in this folder will not be deleted.')) {
      logger.info(LogCategory.FOLDER, 'Delete cancelled by user', { folderId, userId });
      return;
    }

    try {
      const { data, error } = await supabase.rpc('soft_delete_folder', {
        folder_id: folderId
      });

      if (error) {
        logger.error(LogCategory.DATABASE, 'Failed to delete folder', error, {
          folderId,
          userId,
        });

        toast({
          title: 'Error',
          description: `Failed to delete folder: ${error.message}`,
          variant: 'destructive',
        });
      } else if (data && !data.success) {
        logger.warn(LogCategory.FOLDER, 'Folder delete returned failure', {
          folderId,
          message: data.message,
          userId,
        });

        toast({
          title: 'Error',
          description: data.message,
          variant: 'destructive',
        });
      } else {
        logger.folderDeleted(folderId, userId || 'unknown', folderToDelete?.name || 'unknown');

        toast({
          title: 'Success',
          description: 'Folder deleted successfully',
        });

        if (session) loadFolders(session.user.id);
      }
    } catch (error) {
      logger.error(LogCategory.SYSTEM, 'Folder deletion failed', error, {
        folderId,
        userId,
      });
    }
  };

  const openEditDialog = (folder: Folder) => {
    if (!subscriptionAccess.canEdit) {
      subscriptionAccess.showAccessDeniedToast('edit folders');
      return;
    }

    logger.debug(LogCategory.USER_ACTION, 'Opening edit folder dialog', {
      folderId: folder.id,
      folderName: folder.name,
    });

    setEditingFolder(folder);
    setNewFolderName(folder.name);
    setIsEditOpen(true);
  };

  const handleFolderClick = async (folder: Folder) => {
    const { data: { session } } = await supabase.auth.getSession();

    logger.info(LogCategory.USER_ACTION, 'Navigating to folder detail', {
      folderId: folder.id,
      folderName: folder.name,
      userId: session?.user.id,
    });

    router.push(`/dashboard/folders/${folder.id}`);
  };
  const totalPages = Math.ceil(folders.length / ITEMS_PER_PAGE);

  const paginatedFolders = folders.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar mobileOpen={sidebarOpen} onMobileClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader onMenuClick={() => setSidebarOpen(true)} />
        <div className="flex-1 overflow-auto">
          <div className="p-8 space-y-6">
            {/* Subscription Warning Banner */}
            <SubscriptionWarningBanner />

            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Folders</h1>
                <p className="text-gray-600 mt-1">
                  Organize your documents into folders
                </p>
              </div>
              <Dialog open={isCreateOpen} onOpenChange={(open) => {
                if (!subscriptionAccess.canEdit && open) {
                  subscriptionAccess.showAccessDeniedToast('create folders');
                  setIsCreateOpen(false);
                  return;
                }
                setIsCreateOpen(open);
                if (open) {
                  logger.debug(LogCategory.USER_ACTION, 'Create folder dialog opened');
                } else {
                  logger.debug(LogCategory.USER_ACTION, 'Create folder dialog closed');
                }
              }}>
                <DialogTrigger asChild>
                  <Button
                    className={`${subscriptionAccess.canEdit
                      ? 'bg-primary hover:bg-primary-hover text-white'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    disabled={!subscriptionAccess.canEdit}
                  >
                    {!subscriptionAccess.canEdit && <Lock className="h-5 w-5 mr-2" />}
                    {subscriptionAccess.canEdit && <Plus className="h-5 w-5 mr-2" />}
                    Create Folder
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Folder</DialogTitle>
                    <DialogDescription>
                      Create a folder to organize your documents
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <Label htmlFor="name">Folder Name *</Label>
                      <Input
                        id="name"
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        placeholder="My Documents"
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Description (Optional)</Label>
                      <Input
                        id="description"
                        value={newFolderDesc}
                        onChange={(e) => setNewFolderDesc(e.target.value)}
                        placeholder="Folder description"
                        className="mt-2"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => {
                        logger.debug(LogCategory.USER_ACTION, 'Create folder cancelled');
                        setIsCreateOpen(false);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateFolder}
                      disabled={!subscriptionAccess.canEdit}
                      className={`${subscriptionAccess.canEdit
                        ? 'bg-primary hover:bg-primary-hover text-white'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                    >
                      {!subscriptionAccess.canEdit && <Lock className="h-4 w-4 mr-2" />}
                      Create Folder
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {isLoading ? (
              <div className="text-center py-12">
                <UniversalLoader
                  fullScreen={false}
                  message=""
                />
              </div>
            ) : folders.length === 0 ? (
              <div className="text-center py-12">
                <FolderOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg mb-2">No folders yet</p>
                <p className="text-gray-400 mb-6">
                  Create your first folder to organize documents
                </p>
                <Button
                  onClick={() => {
                    if (!subscriptionAccess.canEdit) {
                      subscriptionAccess.showAccessDeniedToast('create folders');
                      return;
                    }
                    logger.info(LogCategory.USER_ACTION, 'Create first folder button clicked');
                    setIsCreateOpen(true);
                  }}
                  disabled={!subscriptionAccess.canEdit}
                  className={`${subscriptionAccess.canEdit
                    ? 'bg-primary hover:bg-primary-hover text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                >
                  {!subscriptionAccess.canEdit && <Lock className="h-5 w-5 mr-2" />}
                  {subscriptionAccess.canEdit && <Plus className="h-5 w-5 mr-2" />}
                  Create Folder
                </Button>
              </div>
            ) : (
              <div className="flex flex-col divide-y">
                {paginatedFolders.map((folder) => (
                  <Card
                    key={folder.id}
                    className="group hover:shadow-lg transition-shadow cursor-pointer w-full m-1"
                  >
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex items-center space-x-4" onClick={() => handleFolderClick(folder)}>
                        <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                          <FolderOpen className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{folder.name}</h3>
                          <p className="text-sm text-gray-500">
                            {folder.document_count || 0} documents
                          </p>
                          <p className="text-xs text-gray-400">
                            Created {new Date(folder.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleFolderClick(folder)}>
                            <FileText className="h-4 w-4 mr-2" />
                            View Documents
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              if (!subscriptionAccess.canEdit) {
                                subscriptionAccess.showAccessDeniedToast('edit folders');
                                return;
                              }
                              openEditDialog(folder);
                            }}
                            disabled={!subscriptionAccess.canEdit}
                            className={!subscriptionAccess.canEdit ? 'opacity-50 cursor-not-allowed' : ''}
                          >
                            {!subscriptionAccess.canEdit && <Lock className="h-4 w-4 mr-2" />}
                            {subscriptionAccess.canEdit && <Edit className="h-4 w-4 mr-2" />}
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteFolder(folder.id)}
                            disabled={!subscriptionAccess.canDelete}
                            className={`text-red-600 ${!subscriptionAccess.canDelete ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            {!subscriptionAccess.canDelete && <Lock className="h-4 w-4 mr-2" />}
                            {subscriptionAccess.canDelete && <Trash2 className="h-4 w-4 mr-2" />}
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </CardContent>
                  </Card>
                ))}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-4 mt-6">
                    <Button
                      variant="outline"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    >
                      Previous
                    </Button>

                    <span className="text-sm text-gray-600">
                      Page {currentPage} of {totalPages}
                    </span>

                    <Button
                      variant="outline"
                      disabled={currentPage === totalPages}
                      onClick={() =>
                        setCurrentPage((p) => Math.min(p + 1, totalPages))
                      }
                    >
                      Next
                    </Button>
                  </div>
                )}

              </div>

            )}
          </div>
        </div>

        <Dialog open={isEditOpen} onOpenChange={(open) => {
          setIsEditOpen(open);
          if (!open) {
            logger.debug(LogCategory.USER_ACTION, 'Edit folder dialog closed');
          }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rename Folder</DialogTitle>
              <DialogDescription>
                Enter a new name for this folder
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="edit-name">Folder Name *</Label>
              <Input
                id="edit-name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="My Documents"
                className="mt-2"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                logger.debug(LogCategory.USER_ACTION, 'Edit folder cancelled');
                setIsEditOpen(false);
              }}>
                Cancel
              </Button>
              <Button
                onClick={handleEditFolder}
                disabled={!subscriptionAccess.canEdit}
                className={`${subscriptionAccess.canEdit
                  ? 'bg-primary hover:bg-primary-hover text-white'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
              >
                {!subscriptionAccess.canEdit && <Lock className="h-4 w-4 mr-2" />}
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <Toaster />
    </div>
  );
}