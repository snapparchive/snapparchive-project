'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Upload,
  FolderPlus,
  FileText,
  MoreVertical,
  Eye,
  Trash2,
  FolderInput,
  Download,
  Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useTranslation } from '@/lib/hooks/useTranslation';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { Sidebar } from '../layout/Sidebar';
import { useSubscriptionAccess } from '@/lib/hooks/useSubscriptionAccess';
import { SubscriptionWarningBanner } from '@/components/subscription/SubscriptionWarningBanner';
import { UsageStatsCard } from '../subscription/UsageStatsCard';

interface TagType {
  id: string;
  name: string;
  color: string;
}

interface Document {
  id: string;
  title: string;
  file_name: string;
  file_type: string;
  file_url: string;
  ocr_status: 'pending' | 'processing' | 'completed' | 'failed';
  ocr_text: string | null;
  created_at: string;
  thumbnail_url: string | null;
  folder_id: string | null;
  folders?: { name: string } | null;
  tags?: TagType[];
}

interface Folder {
  id: string;
  name: string;
}

interface Stats {
  totalDocs: number;
  ocrProcessing: number;
  ocrFailed: number;
  recentUploads: number;
}

export function Dashboard() {
  const ITEMS_PER_PAGE = 5;
  const router = useRouter();
  const { t } = useTranslation();
  const { toast } = useToast();
  const subscriptionAccess = useSubscriptionAccess();

  const [documents, setDocuments] = useState<Document[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalDocs: 0,
    ocrProcessing: 0,
    ocrFailed: 0,
    recentUploads: 0,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [targetFolderId, setTargetFolderId] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    const interval = setInterval(refreshOCRStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const refreshOCRStatus = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data } = await supabase
      .from('documents')
      .select('id, ocr_status')
      .eq('user_id', session.user.id);

    if (!data) return;

    setDocuments(prev =>
      prev.map(doc => {
        const updated = data.find(d => d.id === doc.id);
        return updated ? { ...doc, ocr_status: updated.ocr_status } : doc;
      })
    );
  };

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/login');
      return;
    }
    loadData(session.user.id);
  };

  const loadData = async (userId: string) => {
    setIsLoading(true);

    const { data: allDocs, error: docsError } = await supabase
      .from('documents')
      .select('*, folders(name)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (docsError) {
      toast({
        title: 'Error',
        description: 'Failed to load documents',
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }

    const { data: foldersData } = await supabase
      .from('folders')
      .select('id, name')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('name');

    setFolders(foldersData || []);

    if (allDocs) {
      const docsWithTags = await Promise.all(
        allDocs.map(async (doc) => {
          const { data: tagData } = await supabase
            .from('document_tags')
            .select('tags(id, name, color)')
            .eq('document_id', doc.id);

          const tags = tagData
            ?.map(item => item.tags)
            .filter(tag => tag !== null) as unknown as TagType[] || [];

          return { ...doc, tags };
        })
      );

      setDocuments(docsWithTags);

      const now = new Date();
      const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const statsData: Stats = {
        totalDocs: docsWithTags.length,
        ocrProcessing: docsWithTags.filter((d) => d.ocr_status === 'processing').length,
        ocrFailed: docsWithTags.filter((d) => d.ocr_status === 'failed').length,
        recentUploads: docsWithTags.filter(
          (d) => new Date(d.created_at) > last24Hours
        ).length,
      };

      setStats(statsData);
    }

    setIsLoading(false);
  };

  const handleRestrictedAction = (action: string) => {
    subscriptionAccess.showAccessDeniedToast(action);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
            Done
          </Badge>
        );
      case 'processing':
        return (
          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
            Processing
          </Badge>
        );
      case 'failed':
        return (
          <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
            Failed
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">
            Pending
          </Badge>
        );
    }
  };

  const filteredDocuments = documents.filter((doc) => {
    const query = searchQuery.toLowerCase();
    return (
      doc.title.toLowerCase().includes(query) ||
      doc.file_name.toLowerCase().includes(query) ||
      (doc.ocr_text && doc.ocr_text.toLowerCase().includes(query)) ||
      (doc.folders?.name && doc.folders.name.toLowerCase().includes(query)) ||
      (doc.tags && doc.tags.some(tag => tag.name.toLowerCase().includes(query)))
    );
  });
  const totalPages = Math.ceil(filteredDocuments.length / ITEMS_PER_PAGE);

  const paginatedDocuments = filteredDocuments.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  const toggleDocSelection = (docId: string) => {
    if (!subscriptionAccess.canMove) {
      handleRestrictedAction('select documents');
      return;
    }
    setSelectedDocs((prev) =>
      prev.includes(docId)
        ? prev.filter((id) => id !== docId)
        : [...prev, docId]
    );
  };

  const selectAll = () => {
    if (!subscriptionAccess.canMove) {
      handleRestrictedAction('select documents');
      return;
    }
    if (selectedDocs.length === paginatedDocuments.length) {
      setSelectedDocs([]);
    } else {
      setSelectedDocs(paginatedDocuments.map((doc) => doc.id));
    }

  };

  const handleMoveToFolder = async () => {
    if (!subscriptionAccess.canMove) {
      handleRestrictedAction('move documents');
      return;
    }

    if (!targetFolderId || selectedDocs.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select a folder',
        variant: 'destructive',
      });
      return;
    }

    try {
      const updates = selectedDocs.map(docId =>
        supabase
          .from('documents')
          .update({ folder_id: targetFolderId === 'none' ? null : targetFolderId })
          .eq('id', docId)
      );

      const results = await Promise.all(updates);
      const hasError = results.some(result => result.error);

      if (hasError) {
        toast({
          title: 'Error',
          description: 'Failed to move some documents',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Success',
          description: `${selectedDocs.length} document(s) moved successfully`,
        });

        setShowMoveDialog(false);
        setTargetFolderId('');
        setSelectedDocs([]);

        const { data: { session } } = await supabase.auth.getSession();
        if (session) loadData(session.user.id);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to move documents',
        variant: 'destructive',
      });
    }
  };

  const handleDownload = async (doc: Document) => {
    try {
      const response = await fetch(doc.file_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.file_name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Success',
        description: 'Document downloaded successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to download document',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!subscriptionAccess.canDelete) {
      handleRestrictedAction('delete documents');
      return;
    }

    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      const { error } = await supabase.rpc('soft_delete_document', {
        document_id: docId
      });

      if (error) {
        toast({
          title: 'Error',
          description: `Failed to delete document: ${error.message}`,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Success',
          description: 'Document deleted successfully',
        });

        const { data: { session } } = await supabase.auth.getSession();
        if (session) loadData(session.user.id);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete document',
        variant: 'destructive',
      });
    }
  };

  const renderListPreview = (doc: Document) => {
    if (doc.file_type.startsWith('image/')) {
      return (
        <div className="w-10 h-10 bg-gray-100 rounded overflow-hidden">
          <img
            src={doc.file_url}
            alt={doc.title}
            className="w-full h-full object-cover"
          />
        </div>
      );
    }

    if (doc.file_type === 'application/pdf') {
      return (
        <div className="w-10 h-10 bg-red-100 rounded flex items-center justify-center flex-shrink-0">
          <FileText className="h-5 w-5 text-red-600" />
        </div>
      );
    }

    return (
      <div className="w-10 h-10 bg-primary rounded flex items-center justify-center flex-shrink-0">
        <FileText className="h-5 w-5 text-white" />
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar mobileOpen={sidebarOpen} onMobileClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader onMenuClick={() => setSidebarOpen(true)} />
        <div className="flex-1 overflow-auto">
          <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
            {/* Subscription Warning Banner */}
            <SubscriptionWarningBanner />

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {t('dashboard.title')}
                </h1>
              </div>
              <div className="flex-1 max-w-2xl">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search documents, tags, folders, or content..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-11 sm:h-12"
                  />
                </div>
              </div>
            </div>
            <UsageStatsCard />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
              <Card>
                <CardHeader className="pb-2 sm:pb-3">
                  <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">
                    {t('dashboard.stats.totalDocs')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl sm:text-3xl font-bold text-primary">
                    {stats.totalDocs}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2 sm:pb-3">
                  <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">
                    {t('dashboard.stats.ocrProcessing')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl sm:text-3xl font-bold text-blue-600">
                    {stats.ocrProcessing}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2 sm:pb-3">
                  <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">
                    {t('dashboard.stats.ocrFailed')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl sm:text-3xl font-bold text-red-600">
                    {stats.ocrFailed}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2 sm:pb-3">
                  <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">
                    {t('dashboard.stats.recentUploads')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl sm:text-3xl font-bold text-purple-600">
                    {stats.recentUploads}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Button
                onClick={() => {
                  if (!subscriptionAccess.canUpload) {
                    handleRestrictedAction('upload documents');
                    return;
                  }
                  router.push('/dashboard/upload');
                }}
                disabled={!subscriptionAccess.canUpload}
                className={`${subscriptionAccess.canUpload
                  ? 'bg-primary hover:bg-primary-hover text-white'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
              >
                {!subscriptionAccess.canUpload && <Lock className="h-5 w-5 mr-2" />}
                {subscriptionAccess.canUpload && <Upload className="h-5 w-5 mr-2" />}
                <span className="text-sm sm:text-base">{t('dashboard.actions.uploadDocument')}</span>
              </Button>
              <Button
                onClick={() => {
                  if (!subscriptionAccess.canEdit) {
                    handleRestrictedAction('create folders');
                    return;
                  }
                  router.push('/dashboard/folders');
                }}
                disabled={!subscriptionAccess.canEdit}
                variant="outline"
                className={!subscriptionAccess.canEdit ? 'opacity-50 cursor-not-allowed' : ''}
              >
                {!subscriptionAccess.canEdit && <Lock className="h-5 w-5 mr-2" />}
                {subscriptionAccess.canEdit && <FolderPlus className="h-5 w-5 mr-2" />}
                <span className="text-sm sm:text-base">{t('dashboard.actions.createFolder')}</span>
              </Button>
            </div>

            {selectedDocs.length > 0 && (
              <div className="flex items-center gap-4 p-4 bg-blue-50 border border-cyan-200 rounded-lg">
                <span className="text-sm font-medium text-gray-700">
                  {selectedDocs.length} selected
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (!subscriptionAccess.canMove) {
                      handleRestrictedAction('move documents');
                      return;
                    }
                    setShowMoveDialog(true);
                  }}
                  disabled={!subscriptionAccess.canMove}
                >
                  <FolderInput className="h-4 w-4 mr-2" />
                  Move to Folder
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600"
                  onClick={() => {
                    if (!subscriptionAccess.canDelete) {
                      handleRestrictedAction('delete documents');
                      return;
                    }
                    if (confirm(`Delete ${selectedDocs.length} selected documents?`)) {
                      selectedDocs.forEach(docId => handleDeleteDocument(docId));
                      setSelectedDocs([]);
                    }
                  }}
                  disabled={!subscriptionAccess.canDelete}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Selected
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedDocs([])}
                >
                  Clear
                </Button>
              </div>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">{t('dashboard.documentsList')}</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8 text-gray-500">
                    Loading documents...
                  </div>
                ) : filteredDocuments.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {searchQuery
                      ? 'No documents found matching your search'
                      : 'No documents found. Upload your first document to get started!'}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-4 p-3 bg-gray-100 rounded-lg font-medium text-sm">
                      <Checkbox
                        checked={
                          selectedDocs.length === paginatedDocuments.length &&
                          paginatedDocuments.length > 0
                        }
                        onCheckedChange={selectAll}
                        disabled={!subscriptionAccess.canMove}
                      />
                      <span className="w-12">Preview</span>
                      <span className="flex-1">Title</span>
                      <span className="w-32 hidden sm:block">Folder</span>
                      <span className="w-24">Status</span>
                      <span className="w-32 hidden sm:block">Date</span>
                      <span className="w-10"></span>
                    </div>
                    {paginatedDocuments.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center gap-4 p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <Checkbox
                          checked={selectedDocs.includes(doc.id)}
                          onCheckedChange={() => toggleDocSelection(doc.id)}
                          disabled={!subscriptionAccess.canMove}
                        />
                        <div
                          className="flex items-center gap-3 flex-1 cursor-pointer"
                          onClick={() => router.push(`/dashboard/documents/${doc.id}`)}
                        >
                          {renderListPreview(doc)}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">
                              {doc.title}
                            </p>
                            <p className="text-sm text-gray-500 truncate">
                              {doc.file_name}
                            </p>
                            {doc.tags && doc.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {doc.tags.slice(0, 2).map(tag => (
                                  <Badge
                                    key={tag.id}
                                    className="text-xs"
                                    style={{ backgroundColor: tag.color, color: 'white' }}
                                  >
                                    {tag.name}
                                  </Badge>
                                ))}
                                {doc.tags.length > 2 && (
                                  <Badge className="text-xs bg-gray-200 text-gray-700">
                                    +{doc.tags.length - 2}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <span className="w-32 text-sm text-gray-600 truncate hidden sm:block">
                          {doc.folders?.name || 'No folder'}
                        </span>
                        <div className="w-24">{getStatusBadge(doc.ocr_status)}</div>
                        <span className="w-32 text-sm text-gray-600 hidden sm:block">
                          {new Date(doc.created_at).toLocaleDateString()}
                        </span>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="w-10">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() =>
                                router.push(`/dashboard/documents/${doc.id}`)
                              }
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDownload(doc)}>
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteDocument(doc.id)}
                              disabled={!subscriptionAccess.canDelete}
                              className={`text-red-600 ${!subscriptionAccess.canDelete ? 'opacity-50' : ''}`}
                            >
                              {!subscriptionAccess.canDelete && <Lock className="h-4 w-4 mr-2" />}
                              {subscriptionAccess.canDelete && <Trash2 className="h-4 w-4 mr-2" />}
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    ))}
                  </div>

                )}
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

              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={showMoveDialog} onOpenChange={setShowMoveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move Documents to Folder</DialogTitle>
            <DialogDescription>
              Select a folder to move {selectedDocs.length} document(s) to.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={targetFolderId} onValueChange={setTargetFolderId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a folder" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Folder</SelectItem>
                {folders.map((folder) => (
                  <SelectItem key={folder.id} value={folder.id}>
                    {folder.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowMoveDialog(false);
                setTargetFolderId('');
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleMoveToFolder}>
              Move Documents
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}