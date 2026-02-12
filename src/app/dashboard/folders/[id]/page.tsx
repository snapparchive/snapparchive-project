'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Search,
  FileText,
  MoreVertical,
  Eye,
  Trash2,
  Upload,
  Download,
  FolderInput,
  Lock,
} from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
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
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { Toaster } from '@/components/ui/toaster';
import { logger, LogCategory, PerformanceLogger } from '@/lib/logger';
import { useSubscriptionAccess } from '@/lib/hooks/useSubscriptionAccess';
import { SubscriptionWarningBanner } from '@/components/subscription/SubscriptionWarningBanner';

interface Document {
  id: string;
  title: string;
  file_name: string;
  file_type: string;
  file_url: string;
  ocr_status: 'pending' | 'processing' | 'completed' | 'failed';
  ocr_text: string | null;
  created_at: string;
}

interface Folder {
  id: string;
  name: string;
  created_at: string;
}

export default function FolderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const subscriptionAccess = useSubscriptionAccess();
  const [folder, setFolder] = useState<Folder | null>(null);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [targetFolderId, setTargetFolderId] = useState<string>('');

  useEffect(() => {
    logger.info(LogCategory.USER_ACTION, 'Folder detail page loaded', { folderId: params.id as string });
    checkAuth();
  }, [params.id]);

  const checkAuth = async () => {
    logger.debug(LogCategory.AUTH, 'Checking authentication for folder detail');

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      logger.warn(LogCategory.AUTH, 'No session found, redirecting to login');
      router.push('/login');
      return;
    }

    logger.info(LogCategory.AUTH, 'User authenticated on folder detail page', {
      userId: session.user.id,
      folderId: params.id as string,
    });

    loadFolderAndDocuments(session.user.id);
  };

  const loadFolderAndDocuments = async (userId: string) => {
    const folderId = params.id as string;
    const perf = new PerformanceLogger('Load folder and documents', userId);

    setIsLoading(true);

    try {
      logger.info(LogCategory.FOLDER, 'Loading folder details', { folderId, userId });

      // Load folder details
      const { data: folderData, error: folderError } = await supabase
        .from('folders')
        .select('*')
        .eq('id', folderId)
        .eq('user_id', userId)
        .is('deleted_at', null)
        .single();

      if (folderError || !folderData) {
        logger.error(LogCategory.DATABASE, 'Folder not found or error loading', folderError, {
          folderId,
          userId,
        });

        toast({
          title: 'Error',
          description: 'Folder not found',
          variant: 'destructive',
        });
        router.push('/dashboard/folders');
        return;
      }

      setFolder(folderData);

      // Load all folders for move dialog
      const { data: allFolders } = await supabase
        .from('folders')
        .select('id, name, created_at')
        .eq('user_id', userId)
        .is('deleted_at', null)
        .neq('id', folderId)
        .order('name');

      setFolders(allFolders || [])

      logger.info(LogCategory.FOLDER, 'Folder loaded successfully', {
        folderId,
        folderName: folderData.name,
        userId,
      });

      // Load documents in this folder
      logger.debug(LogCategory.DOCUMENT, 'Loading documents in folder', { folderId, userId });

      const { data: docsData, error: docsError } = await supabase
        .from('documents')
        .select('*')
        .eq('folder_id', folderId)
        .eq('user_id', userId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (docsError) {
        logger.error(LogCategory.DATABASE, 'Failed to load documents in folder', docsError, {
          folderId,
          userId,
        });

        toast({
          title: 'Error',
          description: 'Failed to load documents',
          variant: 'destructive',
        });
      } else {
        setDocuments(docsData || []);
        logger.info(LogCategory.DOCUMENT, 'Documents loaded successfully', {
          folderId,
          count: docsData?.length || 0,
          userId,
        });
      }

      perf.end({ folderId, folderName: folderData.name, documentsCount: docsData?.length || 0 });
    } catch (error) {
      logger.error(LogCategory.SYSTEM, 'Failed to load folder and documents', error, {
        folderId,
        userId,
      });
      perf.error(error, { folderId });
    } finally {
      setIsLoading(false);
    }
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

  // FIXED: Consistent search with OCR text
  const filteredDocuments = documents.filter((doc) => {
    const query = searchQuery.toLowerCase();
    return (
      doc.title.toLowerCase().includes(query) ||
      doc.file_name.toLowerCase().includes(query) ||
      (doc.ocr_text && doc.ocr_text.toLowerCase().includes(query))
    );
  });

  const toggleDocSelection = (docId: string) => {
    if (!subscriptionAccess.canMove) {
      subscriptionAccess.showAccessDeniedToast('select documents');
      return;
    }

    setSelectedDocs((prev) => {
      const newSelection = prev.includes(docId)
        ? prev.filter((id) => id !== docId)
        : [...prev, docId];

      logger.debug(LogCategory.USER_ACTION, 'Document selection toggled', {
        documentId: docId,
        selected: !prev.includes(docId),
        totalSelected: newSelection.length,
      });

      return newSelection;
    });
  };

  const selectAll = async () => {
    if (!subscriptionAccess.canMove) {
      subscriptionAccess.showAccessDeniedToast('select documents');
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user.id;

    if (selectedDocs.length === filteredDocuments.length) {
      setSelectedDocs([]);
      logger.info(LogCategory.USER_ACTION, 'All documents deselected', {
        folderId: params.id as string,
        userId,
      });
    } else {
      setSelectedDocs(filteredDocuments.map((doc) => doc.id));
      logger.info(LogCategory.USER_ACTION, 'All documents selected', {
        folderId: params.id as string,
        count: filteredDocuments.length,
        userId,
      });
    }
  };

  const handleMoveToFolder = async () => {
    if (!subscriptionAccess.canMove) {
      subscriptionAccess.showAccessDeniedToast('move documents');
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
        if (session) loadFolderAndDocuments(session.user.id);
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
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user.id;

    logger.info(LogCategory.DOCUMENT, 'Document download initiated', {
      documentId: doc.id,
      fileName: doc.file_name,
      userId,
    });

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

      logger.documentDownloaded(doc.id, userId || 'unknown', doc.file_name);

      toast({
        title: 'Success',
        description: 'Document downloaded successfully',
      });
    } catch (error) {
      logger.error(LogCategory.DOCUMENT, 'Document download failed', error, {
        documentId: doc.id,
        fileName: doc.file_name,
        userId,
      });

      toast({
        title: 'Error',
        description: 'Failed to download document',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!subscriptionAccess.canDelete) {
      subscriptionAccess.showAccessDeniedToast('delete documents');
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user.id;

    logger.info(LogCategory.DOCUMENT, 'Delete document requested', {
      documentId: docId,
      folderId: params.id as string,
      userId,
    });

    if (!confirm('Are you sure you want to delete this document?')) {
      logger.info(LogCategory.DOCUMENT, 'Delete cancelled by user', { documentId: docId, userId });
      return;
    }

    try {
      const { error } = await supabase.rpc('soft_delete_document', {
        document_id: docId
      });

      if (error) {
        logger.error(LogCategory.DATABASE, 'Failed to delete document', error, {
          documentId: docId,
          userId,
        });

        toast({
          title: 'Error',
          description: `Failed to delete document: ${error.message}`,
          variant: 'destructive',
        });
      } else {
        logger.documentDeleted(docId, userId || 'unknown');

        toast({
          title: 'Success',
          description: 'Document deleted successfully',
        });

        if (session) loadFolderAndDocuments(session.user.id);
      }
    } catch (error) {
      logger.error(LogCategory.SYSTEM, 'Delete document failed', error, {
        documentId: docId,
        userId,
      });
    }
  };

  const handleDeleteSelected = async () => {
    if (!subscriptionAccess.canDelete) {
      subscriptionAccess.showAccessDeniedToast('delete documents');
      return;
    }

    if (selectedDocs.length === 0) return;

    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user.id;

    logger.info(LogCategory.DOCUMENT, 'Bulk delete requested', {
      documentCount: selectedDocs.length,
      documentIds: selectedDocs,
      folderId: params.id as string,
      userId,
    });

    if (!confirm(`Are you sure you want to delete ${selectedDocs.length} document(s)?`)) {
      logger.info(LogCategory.DOCUMENT, 'Bulk delete cancelled by user', { userId });
      return;
    }

    try {
      const results = await Promise.all(
        selectedDocs.map(docId => supabase.rpc('soft_delete_document', { document_id: docId }))
      );

      const hasErrors = results.some(result => result.error);

      if (hasErrors) {
        logger.error(LogCategory.DOCUMENT, 'Some documents failed to delete', null, {
          documentIds: selectedDocs,
          userId,
        });

        toast({
          title: 'Error',
          description: 'Some documents could not be deleted',
          variant: 'destructive',
        });
      } else {
        logger.bulkActionPerformed(
          userId || 'unknown',
          'delete',
          selectedDocs.length,
          selectedDocs
        );

        toast({
          title: 'Success',
          description: `${selectedDocs.length} document(s) deleted successfully`,
        });
      }

      setSelectedDocs([]);
      if (session) loadFolderAndDocuments(session.user.id);
    } catch (error) {
      logger.error(LogCategory.SYSTEM, 'Bulk delete failed', error, {
        documentIds: selectedDocs,
        userId,
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

  if (isLoading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar mobileOpen={sidebarOpen} onMobileClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500">Loading folder...</p>
        </div>
      </div>
    );
  }

  if (!folder) return null;

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar mobileOpen={sidebarOpen} onMobileClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader onMenuClick={() => setSidebarOpen(true)} />
        <div className="flex-1 overflow-auto">
          <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
            {/* Subscription Warning Banner */}
            <SubscriptionWarningBanner />

            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  logger.info(LogCategory.USER_ACTION, 'Navigating back to folders list');
                  router.push('/dashboard/folders');
                }}
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Folders
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {folder.name}
                </h1>
                <p className="text-sm sm:text-base text-gray-600 mt-1">
                  {filteredDocuments.length} documents
                </p>
              </div>
              <Button
                onClick={() => {
                  if (!subscriptionAccess.canUpload) {
                    subscriptionAccess.showAccessDeniedToast('upload documents');
                    return;
                  }
                  logger.info(LogCategory.USER_ACTION, 'Navigating to upload from folder', {
                    folderId: folder.id,
                  });
                  router.push('/dashboard/upload');
                }}
                disabled={!subscriptionAccess.canUpload}
                className={`${
                  subscriptionAccess.canUpload
                    ? 'bg-primary hover:bg-primary-hover text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
                size="sm"
              >
                {!subscriptionAccess.canUpload && <Lock className="h-4 w-4 mr-2" />}
                {subscriptionAccess.canUpload && <Upload className="h-4 w-4 mr-2" />}
                Upload
              </Button>
            </div>

            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search documents, file names, or content..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (e.target.value) {
                    logger.searchPerformed('unknown', e.target.value, filteredDocuments.length);
                  }
                }}
                className="pl-10"
              />
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
                      subscriptionAccess.showAccessDeniedToast('move documents');
                      return;
                    }
                    setShowMoveDialog(true);
                  }}
                  disabled={!subscriptionAccess.canMove}
                >
                  {!subscriptionAccess.canMove && <Lock className="h-4 w-4 mr-2" />}
                  {subscriptionAccess.canMove && <FolderInput className="h-4 w-4 mr-2" />}
                  Move to Folder
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className={`text-red-600 ${!subscriptionAccess.canDelete ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={handleDeleteSelected}
                  disabled={!subscriptionAccess.canDelete}
                >
                  {!subscriptionAccess.canDelete && <Lock className="h-4 w-4 mr-2" />}
                  {subscriptionAccess.canDelete && <Trash2 className="h-4 w-4 mr-2" />}
                  Delete Selected
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedDocs([]);
                    logger.info(LogCategory.USER_ACTION, 'Selection cleared');
                  }}
                >
                  Clear
                </Button>
              </div>
            )}

            {filteredDocuments.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg mb-2">
                  {searchQuery
                    ? 'No documents found'
                    : 'No documents in this folder'}
                </p>
                <p className="text-gray-400 mb-6">
                  {searchQuery
                    ? 'Try adjusting your search'
                    : 'Upload documents to this folder to get started'}
                </p>
                {!searchQuery && (
                  <Button
                    onClick={() => router.push('/dashboard/upload')}
                    className="bg-primary hover:bg-primary-hover text-white"
                  >
                    <Upload className="h-5 w-5 mr-2" />
                    Upload Document
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-4 p-3 bg-gray-100 rounded-lg font-medium text-sm">
                  <Checkbox
                    checked={
                      selectedDocs.length === filteredDocuments.length &&
                      filteredDocuments.length > 0
                    }
                    onCheckedChange={selectAll}
                    disabled={!subscriptionAccess.canMove}
                  />
                  <span className="w-12">Preview</span>
                  <span className="flex-1">Title</span>
                  <span className="w-24">Status</span>
                  <span className="w-32 hidden sm:block">Date</span>
                  <span className="w-10"></span>
                </div>
                {filteredDocuments.map((doc) => (
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
                      onClick={() => {
                        // FIXED: Pass folder context for navigation
                        router.push(`/dashboard/documents/${doc.id}?from=folder&folderId=${folder.id}`);
                      }}
                    >
                      {renderListPreview(doc)}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {doc.title}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {doc.file_name}
                        </p>
                      </div>
                    </div>
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
                          onClick={() => router.push(`/dashboard/documents/${doc.id}?from=folder&folderId=${folder.id}`)}
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
                          className={`text-red-600 ${!subscriptionAccess.canDelete ? 'opacity-50 cursor-not-allowed' : ''}`}
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
          </div>
        </div>
      </div>

      {/* Move to Folder Dialog */}
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
                {folders.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.name}
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
            <Button 
              onClick={handleMoveToFolder}
              disabled={!subscriptionAccess.canMove}
              className={`${
                subscriptionAccess.canMove
                  ? 'bg-primary hover:bg-primary-hover text-white'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {!subscriptionAccess.canMove && <Lock className="h-4 w-4 mr-2" />}
              Move Documents
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toaster />
    </div>
  );
}