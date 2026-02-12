'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Search,
  Grid3x3,
  List,
  FileText,
  MoreVertical,
  Eye,
  Edit,
  Share2,
  Trash2,
  Tag as TagIcon,
  Download,
  Copy,
  Check,
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
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { Toaster } from '@/components/ui/toaster';
import { logger, LogCategory } from '@/lib/logger';
import { useSubscriptionAccess } from '@/lib/hooks/useSubscriptionAccess';
import { SubscriptionWarningBanner } from '@/components/subscription/SubscriptionWarningBanner';

interface Document {
  id: string;
  title: string;
  file_name: string;
  file_type: string;
  file_url: string;
  ocr_status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  is_public: boolean;
  public_link: string | null;
}

interface Tag {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

export default function TagDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const subscriptionAccess = useSubscriptionAccess();
  const [tag, setTag] = useState<Tag | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [shareDocument, setShareDocument] = useState<Document | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    checkAuth();
  }, [params.id]);

  const checkAuth = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      router.push('/login');
      return;
    }
    loadTagAndDocuments(session.user.id);
  };

  const loadTagAndDocuments = async (userId: string) => {
    setIsLoading(true);

    // Load tag details
    const { data: tagData, error: tagError } = await supabase
      .from('tags')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', userId)
      .single();

    if (tagError || !tagData) {
      logger.error(
        LogCategory.DATABASE,
        'Tag not found',
        tagError,
        { tagId: params.id as string, userId }
      );
      toast({
        title: 'Error',
        description: 'Tag not found',
        variant: 'destructive',
      });
      router.push('/dashboard/tags');
      return;
    }

    setTag(tagData);

    // Load documents with this tag
    const { data: docTagsData, error: docTagsError } = await supabase
      .from('document_tags')
      .select('document_id')
      .eq('tag_id', params.id);

    if (docTagsError) {
      logger.databaseError('Load document tags failed', docTagsError);
      toast({
        title: 'Error',
        description: 'Failed to load documents',
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }

    const documentIds = (docTagsData || []).map((dt) => dt.document_id);

    if (documentIds.length > 0) {
      const { data: docsData, error: docsError } = await supabase
        .from('documents')
        .select('*')
        .in('id', documentIds)
        .eq('user_id', userId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (docsError) {
        logger.databaseError('Load documents failed', docsError);
        toast({
          title: 'Error',
          description: 'Failed to load documents',
          variant: 'destructive',
        });
      } else {
        setDocuments(docsData || []);
        logger.info(LogCategory.USER_ACTION, 'Tag documents loaded', {
          userId,
          tagId: params.id as string,
          documentCount: docsData?.length || 0,
        });
      }
    }

    setIsLoading(false);
  };

  const generatePublicLink = async (doc: Document) => {
    const { data: { session } } = await supabase.auth.getSession();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '');

    try {
      if (doc.public_link) {
        return `${appUrl}/public/${doc.public_link}`;
      }

      const publicId = `${doc.id.substring(0, 8)}-${Date.now().toString(36)}`;

      const { error } = await supabase
        .from('documents')
        .update({
          public_link: publicId,
          is_public: true
        })
        .eq('id', doc.id);

      if (error) {
        logger.error(
          LogCategory.USER_ACTION,
          'Failed to generate public link',
          error,
          { documentId: doc.id, userId: session?.user.id }
        );
        toast({
          title: 'Error',
          description: 'Failed to generate public link',
          variant: 'destructive',
        });
        return null;
      }

      logger.userAction('generate_public_link', session?.user.id || 'unknown', doc.id, {
        publicLink: publicId,
        title: doc.title,
      });

      if (session) await loadTagAndDocuments(session.user.id);

      return `${appUrl}/public/${publicId}`;
    } catch (error) {
      logger.systemError('Public link generation failed', error, {
        documentId: doc.id,
      });
      return null;
    }
  };

  const handleShare = async (doc: Document) => {
    const { data: { session } } = await supabase.auth.getSession();
    
    logger.userAction('share_document_attempt', session?.user.id || 'unknown', doc.id, {
      title: doc.title,
    });

    const publicUrl = await generatePublicLink(doc);
    if (publicUrl) {
      setShareDocument(doc);
      setIsShareOpen(true);
    }
  };

  const copyToClipboard = async (text: string) => {
    const { data: { session } } = await supabase.auth.getSession();

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      
      logger.userAction('copy_public_link', session?.user.id || 'unknown', shareDocument?.id, {
        link: text,
      });

      toast({ title: 'Success', description: 'Link copied to clipboard' });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      logger.error(
        LogCategory.USER_ACTION,
        'Failed to copy to clipboard',
        error,
        { documentId: shareDocument?.id }
      );
    }
  };

  const handleDownload = async (doc: Document) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      logger.userAction('download_document_start', session?.user.id || 'unknown', doc.id, {
        fileName: doc.file_name,
        fileType: doc.file_type,
      });

      const response = await fetch(doc.file_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = doc.file_name;
      window.document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      window.document.body.removeChild(a);

      logger.userAction('download_document_success', session?.user.id || 'unknown', doc.id);

      toast({
        title: 'Success',
        description: 'Document downloaded successfully',
      });
    } catch (error) {
      logger.error(LogCategory.USER_ACTION, 'Download failed', error, {
        documentId: doc.id,
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

    if (!confirm('Are you sure you want to delete this document?')) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const doc = documents.find(d => d.id === docId);

    logger.userAction('delete_document_start', session.user.id, docId, {
      title: doc?.title,
    });

    const { error } = await supabase.rpc('soft_delete_document', { document_id: docId });

    if (error) {
      logger.databaseError('Soft delete document RPC failed', error);
      toast({
        title: 'Error',
        description: 'Failed to delete document',
        variant: 'destructive',
      });
    } else {
      logger.userAction('delete_document_success', session.user.id, docId);
      toast({
        title: 'Success',
        description: 'Document deleted successfully',
      });
      loadTagAndDocuments(session.user.id);
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

  const filteredDocuments = documents.filter((doc) =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase())
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
        <Sidebar
          mobileOpen={sidebarOpen}
          onMobileClose={() => setSidebarOpen(false)}
        />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500">Loading tag...</p>
        </div>
      </div>
    );
  }

  if (!tag) return null;

  const publicUrl = shareDocument?.public_link
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/public/${shareDocument.public_link}`
    : '';

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        mobileOpen={sidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
      />
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
                onClick={() => router.push('/dashboard/tags')}
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Tags
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Badge
                    className="text-white text-lg px-4 py-2"
                    style={{ backgroundColor: tag.color }}
                  >
                    <TagIcon className="h-5 w-5 mr-2" />
                    {tag.name}
                  </Badge>
                </div>
                <p className="text-sm sm:text-base text-gray-600">
                  {filteredDocuments.length} documents
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3x3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search documents with this tag..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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
                  className="text-red-600"
                  onClick={() => {
                    if (confirm(`Delete ${selectedDocs.length} selected documents?`)) {
                      selectedDocs.forEach(docId => handleDeleteDocument(docId));
                      setSelectedDocs([]);
                    }
                  }}
                  disabled={!subscriptionAccess.canDelete}
                >
                  {!subscriptionAccess.canDelete && <Lock className="h-4 w-4 mr-2" />}
                  {subscriptionAccess.canDelete && <Trash2 className="h-4 w-4 mr-2" />}
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

            {filteredDocuments.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg mb-2">
                  {searchQuery
                    ? 'No documents found'
                    : 'No documents with this tag'}
                </p>
                <p className="text-gray-400">
                  {searchQuery
                    ? 'Try adjusting your search'
                    : 'Add this tag to documents to see them here'}
                </p>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {filteredDocuments.map((doc) => (
                  <Card
                    key={doc.id}
                    className="group hover:shadow-lg transition-shadow cursor-pointer"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <Checkbox
                          checked={selectedDocs.includes(doc.id)}
                          onCheckedChange={() => toggleDocSelection(doc.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => e.stopPropagation()}
                            >
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
                            {/* <DropdownMenuItem 
                              onClick={() => router.push(`/dashboard/documents/${doc.id}`)}
                              disabled={!subscriptionAccess.canEdit}
                            >
                              {!subscriptionAccess.canEdit && <Lock className="h-4 w-4 mr-2" />}
                              {subscriptionAccess.canEdit && <Edit className="h-4 w-4 mr-2" />}
                              Edit
                            </DropdownMenuItem> */}
                            <DropdownMenuItem onClick={() => handleShare(doc)}>
                              <Share2 className="h-4 w-4 mr-2" />
                              Share
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDownload(doc)}>
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteDocument(doc.id)}
                              disabled={!subscriptionAccess.canDelete}
                              className={subscriptionAccess.canDelete ? 'text-red-600' : ''}
                            >
                              {!subscriptionAccess.canDelete && <Lock className="h-4 w-4 mr-2" />}
                              {subscriptionAccess.canDelete && <Trash2 className="h-4 w-4 mr-2" />}
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div
                        onClick={() => router.push(`/dashboard/documents/${doc.id}`)}
                      >
                        <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center mb-3">
                          {renderListPreview(doc)}
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2 truncate">
                          {doc.title}
                        </h3>
                        <p className="text-sm text-gray-500 mb-3 truncate">
                          {doc.file_name}
                        </p>
                        <div className="flex items-center justify-between">
                          {getStatusBadge(doc.ocr_status)}
                          <span className="text-xs text-gray-400">
                            {new Date(doc.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
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
                          onClick={() => router.push(`/dashboard/documents/${doc.id}`)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </DropdownMenuItem>
                        {/* <DropdownMenuItem 
                          onClick={() => router.push(`/dashboard/documents/${doc.id}`)}
                          disabled={!subscriptionAccess.canEdit}
                        >
                          {!subscriptionAccess.canEdit && <Lock className="h-4 w-4 mr-2" />}
                          {subscriptionAccess.canEdit && <Edit className="h-4 w-4 mr-2" />}
                          Edit
                        </DropdownMenuItem> */}
                        <DropdownMenuItem onClick={() => handleShare(doc)}>
                          <Share2 className="h-4 w-4 mr-2" />
                          Share
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDownload(doc)}>
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteDocument(doc.id)}
                          disabled={!subscriptionAccess.canDelete}
                          className={subscriptionAccess.canDelete ? 'text-red-600' : ''}
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

      {/* Share Dialog */}
      <Dialog open={isShareOpen} onOpenChange={setIsShareOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Share Document</DialogTitle>
            <DialogDescription>
              Anyone with this link can view this document
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-2">
              <Input
                value={publicUrl}
                readOnly
                className="flex-1"
              />
              <Button
                size="sm"
                onClick={() => copyToClipboard(publicUrl)}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-sm text-gray-500">
              This document is publicly accessible via this link
            </p>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsShareOpen(false)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toaster />
    </div>
  );
}