'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  FileText,
  MoreVertical,
  Eye,
  Trash2,
  FolderOpen,
  Download,
  FolderInput,
} from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { Toaster } from '@/components/ui/toaster';
import { UniversalLoader } from '@/components/ui/universal-loader';
import { logger, LogCategory } from '@/lib/logger';

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface Document {
  id: string;
  title: string;
  file_name: string;
  file_url: string;
  file_type: string;
  ocr_text: string | null;
  ocr_status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  folder_id: string | null;
  folders?: { name: string } | null;
  tags?: Tag[];
}

interface Folder {
  id: string;
  name: string;
}

export default function AllDocumentsPage() {
  const ITEMS_PER_PAGE = 10;
  const router = useRouter();
  const { toast } = useToast();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [targetFolderId, setTargetFolderId] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedFolder, selectedStatus]);


  const checkAuth = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      router.push('/login');
      return;
    }
    setUserId(session.user.id);
    logger.info(LogCategory.USER_ACTION, 'User accessed all documents page', {
      userId: session.user.id,
    });
    loadData(session.user.id);
  };

  const loadData = async (userId: string) => {
    setIsLoading(true);

    try {
      const { data: docsData, error: docsError } = await supabase
        .from('documents')
        .select('*, folders(name)')
        .eq('user_id', userId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (docsError) {
        logger.error(LogCategory.DATABASE, 'Failed to load documents', docsError, {
          userId,
        });
        toast({
          title: 'Error',
          description: 'Failed to load documents',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      if (docsData) {
        const docsWithTags = await Promise.all(
          docsData.map(async (doc) => {
            const { data: tagData } = await supabase
              .from('document_tags')
              .select('tags(id, name, color)')
              .eq('document_id', doc.id);

            const tags = tagData
              ?.map(item => item.tags)
              .filter(tag => tag !== null) as unknown as Tag[] || [];

            return { ...doc, tags };
          })
        );

        setDocuments(docsWithTags);

        logger.info(LogCategory.USER_ACTION, 'Documents loaded successfully', {
          userId,
          documentCount: docsWithTags.length,
        });
      }

      const { data: foldersData, error: foldersError } = await supabase
        .from('folders')
        .select('id, name')
        .eq('user_id', userId)
        .is('deleted_at', null)
        .order('name');

      if (foldersError) {
        logger.error(LogCategory.DATABASE, 'Failed to load folders', foldersError, {
          userId,
        });
      } else {
        setFolders(foldersData || []);
      }
    } catch (error) {
      logger.error(LogCategory.SYSTEM, 'Unexpected error loading data', error, {
        userId,
      });
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
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

    const matchesSearch =
      doc.title.toLowerCase().includes(query) ||
      doc.file_name.toLowerCase().includes(query) ||
      (doc.ocr_text && doc.ocr_text.toLowerCase().includes(query)) ||
      (doc.folders?.name && doc.folders.name.toLowerCase().includes(query)) ||
      (doc.tags && doc.tags.some(tag => tag.name.toLowerCase().includes(query)));

    const matchesFolder =
      selectedFolder === 'all' ||
      (selectedFolder === 'none' && !doc.folder_id) ||
      doc.folder_id === selectedFolder;

    const matchesStatus =
      selectedStatus === 'all' || doc.ocr_status === selectedStatus;

    return matchesSearch && matchesFolder && matchesStatus;
  });

  const totalPages = Math.ceil(filteredDocuments.length / ITEMS_PER_PAGE);

  const paginatedDocuments = filteredDocuments.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const toggleDocSelection = (docId: string) => {
    setSelectedDocs((prev) =>
      prev.includes(docId)
        ? prev.filter((id) => id !== docId)
        : [...prev, docId]
    );
  };

  const selectAll = () => {
    if (selectedDocs.length === filteredDocuments.length) {
      setSelectedDocs([]);
    } else {
      setSelectedDocs(filteredDocuments.map((doc) => doc.id));
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
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      logger.info(LogCategory.USER_ACTION, 'User initiated document deletion', {
        userId,
        documentId: docId,
      });

      const { error } = await supabase
        .rpc('soft_delete_document', { document_id: docId });

      if (error) {
        logger.error(LogCategory.DATABASE, 'Failed to delete document', error, {
          userId,
          documentId: docId,
        });
        toast({
          title: 'Error',
          description: `Failed to delete document: ${error.message}`,
          variant: 'destructive',
        });
      } else {
        logger.info(LogCategory.USER_ACTION, 'Document deleted successfully', {
          userId,
          documentId: docId,
        });
        toast({
          title: 'Success',
          description: 'Document deleted successfully',
        });

        if (userId) loadData(userId);
      }
    } catch (error: any) {
      logger.error(LogCategory.SYSTEM, 'Unexpected error deleting document', error, {
        userId,
        documentId: docId,
      });
      toast({
        title: 'Error',
        description: `Failed to delete document: ${error.message}`,
        variant: 'destructive',
      });
    }
  };

  const handleMoveToFolder = async () => {
    if (!targetFolderId || selectedDocs.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select a folder',
        variant: 'destructive',
      });
      return;
    }

    try {
      logger.info(LogCategory.USER_ACTION, 'Moving documents to folder', {
        userId,
        documentCount: selectedDocs.length,
        targetFolderId,
      });

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

        if (userId) loadData(userId);
      }
    } catch (error: any) {
      logger.error(LogCategory.SYSTEM, 'Unexpected error moving documents', error, {
        userId,
      });
      toast({
        title: 'Error',
        description: 'Failed to move documents',
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
          <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">All Documents</h1>
                <p className="text-sm sm:text-base text-gray-600 mt-1">
                  {filteredDocuments.length} documents found
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search documents, tags, folders, or content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedFolder} onValueChange={setSelectedFolder}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by folder" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Folders</SelectItem>
                  <SelectItem value="none">No Folder</SelectItem>
                  {folders.map((folder) => (
                    <SelectItem key={folder.id} value={folder.id}>
                      {folder.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedDocs.length > 0 && (
              <div className="flex items-center gap-4 p-4 bg-blue-50 border border-cyan-200 rounded-lg">
                <span className="text-sm font-medium text-gray-700">
                  {selectedDocs.length} selected
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowMoveDialog(true)}
                >
                  <FolderInput className="h-4 w-4 mr-2" />
                  Move to Folder
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600"
                  onClick={() => {
                    if (confirm(`Delete ${selectedDocs.length} selected documents?`)) {
                      selectedDocs.forEach(docId => handleDeleteDocument(docId));
                      setSelectedDocs([]);
                    }
                  }}
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

            {isLoading ? (
              <div className="text-center py-12">
                <UniversalLoader fullScreen={false} message="" />
              </div>
            ) : filteredDocuments.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg mb-2">No documents found</p>
                <p className="text-gray-400">
                  Try adjusting your filters or upload a new document
                </p>
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
                          onClick={() => router.push(`/dashboard/documents/${doc.id}`)}
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
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>
            )}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4">
                <span className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  >
                    Previous
                  </Button>

                  {Array.from({ length: totalPages }).map((_, i) => (
                    <Button
                      key={i}
                      size="sm"
                      variant={currentPage === i + 1 ? 'default' : 'outline'}
                      onClick={() => setCurrentPage(i + 1)}
                    >
                      {i + 1}
                    </Button>
                  ))}

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}

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
            <Button onClick={handleMoveToFolder}>Move Documents</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toaster />
    </div>
  );
}