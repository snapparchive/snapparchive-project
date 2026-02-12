'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Tags as TagsIcon, Plus, MoreVertical, Edit, Trash2, FileText, Lock } from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
import { logger } from '@/lib/logger';
import { useSubscriptionAccess } from '@/lib/hooks/useSubscriptionAccess';
import { SubscriptionWarningBanner } from '@/components/subscription/SubscriptionWarningBanner';

interface Tag {
  id: string;
  name: string;
  color: string;
  created_at: string;
  document_count?: number;
}

const TAG_COLORS = [
  '#04a3c3',
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
];

export default function TagsPage() {
  const ITEMS_PER_PAGE = 16;
  const router = useRouter();
  const { toast } = useToast();
  const subscriptionAccess = useSubscriptionAccess();
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [newTagName, setNewTagName] = useState('');
  const [selectedColor, setSelectedColor] = useState(TAG_COLORS[0]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      router.push('/login');
      return;
    }
    loadTags(session.user.id);
  };

  const loadTags = async (userId: string) => {
    setIsLoading(true);

    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to load tags',
        variant: 'destructive',
      });
    } else {
      const tagsWithCounts = await Promise.all(
        (data || []).map(async (tag) => {
          const { count } = await supabase
            .from('document_tags')
            .select('*', { count: 'exact', head: true })
            .eq('tag_id', tag.id);
          return { ...tag, document_count: count || 0 };
        })
      );
      setTags(tagsWithCounts);
    }

    setIsLoading(false);
  };

  const handleCreateTag = async () => {
    // Check subscription access before allowing creation
    if (!subscriptionAccess.canEdit) {
      subscriptionAccess.showAccessDeniedToast('create tags');
      return;
    }

    if (!newTagName.trim()) {
      toast({
        title: 'Error',
        description: 'Tag name is required',
        variant: 'destructive',
      });
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data: insertedData, error } = await supabase.from('tags').insert({
      user_id: session.user.id,
      name: newTagName.trim(),
      color: selectedColor,
    }).select().single();

    if (error) {
      toast({
        title: 'Error',
        description: error.message.includes('unique')
          ? 'Tag name already exists'
          : 'Failed to create tag',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Tag created successfully',
      });

      // Logger
      logger.tagCreated(
        insertedData.id,
        session.user.id,
        insertedData.name,
        insertedData.color
      );

      setNewTagName('');
      setSelectedColor(TAG_COLORS[0]);
      setIsCreateOpen(false);
      loadTags(session.user.id);
    }
  };

  const handleEditTag = async () => {
    // Check subscription access before allowing edit
    if (!subscriptionAccess.canEdit) {
      subscriptionAccess.showAccessDeniedToast('edit tags');
      return;
    }

    if (!editingTag || !newTagName.trim()) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { error } = await supabase
      .from('tags')
      .update({ name: newTagName.trim(), color: selectedColor })
      .eq('id', editingTag.id);

    if (error) {
      // Check for unique constraint violation
      if (error.code === '23505' || error.message.includes('unique')) {
        toast({
          title: 'Error',
          description: 'A tag with this name already exists',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to update tag',
          variant: 'destructive',
        });
      }
    } else {
      toast({
        title: 'Success',
        description: 'Tag updated successfully',
      });

      logger.tagUpdated(editingTag.id, session.user.id, {
        name: newTagName.trim(),
        color: selectedColor,
      });

      setIsEditOpen(false);
      setEditingTag(null);
      setNewTagName('');
      loadTags(session.user.id);
    }
  };


  const handleDeleteTag = async (tagId: string) => {
    // Check subscription access before allowing delete
    if (!subscriptionAccess.canDelete) {
      subscriptionAccess.showAccessDeniedToast('delete tags');
      return;
    }

    if (!confirm('Are you sure you want to delete this tag? It will be removed from all documents.'))
      return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data: tagData, error: fetchError } = await supabase
      .from('tags')
      .select('name')
      .eq('id', tagId)
      .single();

    if (fetchError || !tagData) {
      toast({
        title: 'Error',
        description: 'Failed to fetch tag details for logging',
        variant: 'destructive',
      });
      return;
    }

    const { error } = await supabase.from('tags').delete().eq('id', tagId);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete tag',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Tag deleted successfully',
      });

      logger.tagDeleted(tagId, session.user.id, tagData.name);

      loadTags(session.user.id);
    }
  };



  const openEditDialog = (tag: Tag) => {
    if (!subscriptionAccess.canEdit) {
      subscriptionAccess.showAccessDeniedToast('edit tags');
      return;
    }

    setEditingTag(tag);
    setNewTagName(tag.name);
    setSelectedColor(tag.color);
    setIsEditOpen(true);
  };
  const filteredTags = tags.filter((tag) =>
    tag.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const totalPages = Math.ceil(filteredTags.length / ITEMS_PER_PAGE);

  const paginatedTags = filteredTags.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );


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
                <h1 className="text-3xl font-bold text-gray-900">Tags</h1>
                <p className="text-gray-600 mt-1">
                  Organize and categorize your documents with tags
                </p>
              </div>

              <Dialog open={isCreateOpen} onOpenChange={(open) => {
                if (!subscriptionAccess.canEdit && open) {
                  subscriptionAccess.showAccessDeniedToast('create tags');
                  setIsCreateOpen(false);
                  return;
                }
                setIsCreateOpen(open);
              }}>
                <DialogTrigger asChild>
                  <Button 
                    className={`${
                      subscriptionAccess.canEdit
                        ? 'bg-primary hover:bg-primary-hover text-white'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                    disabled={!subscriptionAccess.canEdit}
                  >
                    {!subscriptionAccess.canEdit && <Lock className="h-5 w-5 mr-2" />}
                    {subscriptionAccess.canEdit && <Plus className="h-5 w-5 mr-2" />}
                    Create Tag
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Tag</DialogTitle>
                    <DialogDescription>
                      Create a tag to categorize your documents
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <Label htmlFor="name">Tag Name *</Label>
                      <Input
                        id="name"
                        value={newTagName}
                        onChange={(e) => setNewTagName(e.target.value)}
                        placeholder="Important"
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label>Tag Color</Label>
                      <div className="flex gap-2 mt-2">
                        {TAG_COLORS.map((color) => (
                          <button
                            key={color}
                            onClick={() => setSelectedColor(color)}
                            className={`w-10 h-10 rounded-full border-2 transition-all ${selectedColor === color
                              ? 'border-gray-900 scale-110'
                              : 'border-transparent'
                              }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateTag}
                      disabled={!subscriptionAccess.canEdit}
                      className={`${
                        subscriptionAccess.canEdit
                          ? 'bg-primary hover:bg-primary-hover text-white'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {!subscriptionAccess.canEdit && <Lock className="h-4 w-4 mr-2" />}
                      Create Tag
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            <div className="mb-4 flex items-center gap-2">
              <Input
                placeholder="Search tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
            </div>
            {isLoading ? (
              <div className="text-center py-12">
                <UniversalLoader
                  fullScreen={false}
                  message=""  // Empty string to hide text
                />

              </div>
            ) : tags.length === 0 ? (
              <div className="text-center py-12">
                <TagsIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg mb-2">No tags created yet</p>
                <p className="text-gray-400 mb-6">
                  Tags help you organize and find documents quickly
                </p>
                <Button
                  onClick={() => {
                    if (!subscriptionAccess.canEdit) {
                      subscriptionAccess.showAccessDeniedToast('create tags');
                      return;
                    }
                    setIsCreateOpen(true);
                  }}
                  disabled={!subscriptionAccess.canEdit}
                  className={`${
                    subscriptionAccess.canEdit
                      ? 'bg-primary hover:bg-primary-hover text-white'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {!subscriptionAccess.canEdit && <Lock className="h-5 w-5 mr-2" />}
                  {subscriptionAccess.canEdit && <Plus className="h-5 w-5 mr-2" />}
                  Create Tag
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {paginatedTags.map((tag) => (
                  <div
                    key={tag.id}
                    className="p-6 bg-white rounded-lg border-2 border-gray-100 hover:border-[#04a3c3] hover:shadow-lg transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between">
                      <div
                        className="flex-1"
                        onClick={() => router.push(`/dashboard/tags/${tag.id}`)}
                      >
                        <Badge
                          className="text-white mb-3"
                          style={{ backgroundColor: tag.color }}
                        >
                          {tag.name}
                        </Badge>
                        <p className="text-sm text-gray-600 flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          {tag.document_count || 0} documents
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                          Created {new Date(tag.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={async () => { 
                              const { data: { session } } = await supabase.auth.getSession();
                              if (session) { 
                                logger.userAction(
                                  'Viewed Tag Documents',
                                  session.user.id,
                                  tag.id,
                                  { tagName: tag.name }
                                );
                              } 
                              router.push(`/dashboard/tags/${tag.id}`);
                            }}
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            View Tags
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => {
                              if (!subscriptionAccess.canEdit) {
                                subscriptionAccess.showAccessDeniedToast('edit tags');
                                return;
                              }
                              openEditDialog(tag);
                            }}
                            disabled={!subscriptionAccess.canEdit}
                            className={!subscriptionAccess.canEdit ? 'opacity-50 cursor-not-allowed' : ''}
                          >
                            {!subscriptionAccess.canEdit && <Lock className="h-4 w-4 mr-2" />}
                            {subscriptionAccess.canEdit && <Edit className="h-4 w-4 mr-2" />}
                            Edit Tag
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteTag(tag.id)}
                            disabled={!subscriptionAccess.canDelete}
                            className={`text-red-600 ${!subscriptionAccess.canDelete ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            {!subscriptionAccess.canDelete && <Lock className="h-4 w-4 mr-2" />}
                            {subscriptionAccess.canDelete && <Trash2 className="h-4 w-4 mr-2" />}
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-8">
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
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                >
                  Next
                </Button>
              </div>
            )}

          </div>
        </div>

        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Tag</DialogTitle>
              <DialogDescription>Update tag name and color</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="edit-name">Tag Name *</Label>
                <Input
                  id="edit-name"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="Important"
                  className="mt-2"
                />
              </div>
              <div>
                <Label>Tag Color</Label>
                <div className="flex gap-2 mt-2">
                  {TAG_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`w-10 h-10 rounded-full border-2 transition-all ${selectedColor === color
                        ? 'border-gray-900 scale-110'
                        : 'border-transparent'
                        }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleEditTag}
                disabled={!subscriptionAccess.canEdit}
                className={`${
                  subscriptionAccess.canEdit
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
