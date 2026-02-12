'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Briefcase,
  FileText,
  Plus,
  MoreVertical,
  Eye,
  Trash2,
  MessageSquare,
  Lock,
  Upload,
  FolderOpen,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Search,
} from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { Toaster } from '@/components/ui/toaster';
import { logger, LogCategory } from '@/lib/logger';
import { useSubscriptionAccess } from '@/lib/hooks/useSubscriptionAccess';
import { SubscriptionWarningBanner } from '@/components/subscription/SubscriptionWarningBanner';
import UniversalLoader from '@/components/ui/universal-loader';

const DOSSIER_TYPES = ['Client', 'Project', 'Request'];
const DOSSIER_STATUSES = ['open', 'waiting', 'done', 'archived'] as const;
const ADMIN_STATES = ['ok', 'action_needed', 'unpaid'] as const;
const ITEMS_PER_PAGE = 5;

type DossierStatus = typeof DOSSIER_STATUSES[number];
type AdminState = typeof ADMIN_STATES[number];

interface Dossier {
  id: string;
  user_id: string;
  title: string;
  type: string;
  status: DossierStatus;
  admin_state: AdminState;
  phase: string | null;
  created_at: string;
  updated_at: string;
}

interface DocLink {
  id: string;
  document_id: string;
  documents: { id: string; title: string; file_name: string; file_type: string; created_at: string } | null;
}

interface FolderLink {
  id: string;
  folder_id: string;
  folders: { id: string; name: string; created_at: string } | null;
}

interface DossierEvent {
  id: string;
  dossier_id: string;
  event_type: string;
  payload: Record<string, unknown> | null;
  created_by: string | null;
  created_at: string;
}

export default function DossierDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const subscriptionAccess = useSubscriptionAccess();
  
  const [dossier, setDossier] = useState<Dossier | null>(null);
  const [documents, setDocuments] = useState<DocLink[]>([]);
  const [folders, setFolders] = useState<FolderLink[]>([]);
  const [events, setEvents] = useState<DossierEvent[]>([]);
  const [allUserDocs, setAllUserDocs] = useState<{ id: string; title: string; file_name: string }[]>([]);
  const [allUserFolders, setAllUserFolders] = useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [addDocOpen, setAddDocOpen] = useState(false);
  const [addFolderOpen, setAddFolderOpen] = useState(false);
  const [addNoteOpen, setAddNoteOpen] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [selectedDocId, setSelectedDocId] = useState<string>('');
  const [selectedFolderId, setSelectedFolderId] = useState<string>('');
  const [editPhase, setEditPhase] = useState('');
  const [editStatus, setEditStatus] = useState<DossierStatus>('open');
  const [editAdminState, setEditAdminState] = useState<AdminState>('ok');
  const [editType, setEditType] = useState('Client');
  const [activeTab, setActiveTab] = useState('documents');
  
  // Search states
  const [documentSearchQuery, setDocumentSearchQuery] = useState('');
  const [folderSearchQuery, setFolderSearchQuery] = useState('');
  
  // Pagination states
  const [documentPage, setDocumentPage] = useState(1);
  const [folderPage, setFolderPage] = useState(1);
  const [eventPage, setEventPage] = useState(1);
  
  const dossierId = params.id as string;
  const isArchived = dossier?.status === 'archived';
  const canEdit = !isArchived && subscriptionAccess.canEdit;

  // Filtered documents based on search
  const filteredDocuments = documents.filter((link) => {
    if (!documentSearchQuery.trim()) return true;
    
    const query = documentSearchQuery.toLowerCase();
    const doc = link.documents;
    
    if (!doc) return false;
    
    return (
      doc.title.toLowerCase().includes(query) ||
      doc.file_name.toLowerCase().includes(query) ||
      doc.file_type.toLowerCase().includes(query)
    );
  });

  // Filtered folders based on search
  const filteredFolders = folders.filter((link) => {
    if (!folderSearchQuery.trim()) return true;
    
    const query = folderSearchQuery.toLowerCase();
    const folder = link.folders;
    
    if (!folder) return false;
    
    return folder.name.toLowerCase().includes(query);
  });

  // Pagination calculations for documents
  const paginatedDocuments = filteredDocuments.slice(
    (documentPage - 1) * ITEMS_PER_PAGE,
    documentPage * ITEMS_PER_PAGE
  );
  const totalDocPages = Math.ceil(filteredDocuments.length / ITEMS_PER_PAGE);

  // Pagination calculations for folders
  const paginatedFolders = filteredFolders.slice(
    (folderPage - 1) * ITEMS_PER_PAGE,
    folderPage * ITEMS_PER_PAGE
  );
  const totalFolderPages = Math.ceil(filteredFolders.length / ITEMS_PER_PAGE);

  // Pagination calculations for events
  const paginatedEvents = events.slice(
    (eventPage - 1) * ITEMS_PER_PAGE,
    eventPage * ITEMS_PER_PAGE
  );
  const totalEventPages = Math.ceil(events.length / ITEMS_PER_PAGE);

  // Reset page when search query changes
  useEffect(() => {
    setDocumentPage(1);
  }, [documentSearchQuery]);

  useEffect(() => {
    setFolderPage(1);
  }, [folderSearchQuery]);

  useEffect(() => {
    checkAuth();
  }, [dossierId]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/login');
      return;
    }
    loadDossier(session.user.id);
  };

  const loadDossier = async (userId: string) => {
    setIsLoading(true);
    try {
      const { data: d, error: de } = await supabase
        .from('dossiers')
        .select('*')
        .eq('id', dossierId)
        .eq('user_id', userId)
        .single();

      if (de || !d) {
        toast({ title: 'Error', description: 'Dossier not found', variant: 'destructive' });
        router.push('/dashboard/dossiers');
        return;
      }

      setDossier(d);
      setEditPhase(d.phase || '');
      setEditStatus(d.status);
      setEditAdminState(d.admin_state);
      setEditType(d.type);

      // Load linked documents
      const { data: links } = await supabase
        .from('dossier_documents')
        .select('id, document_id, documents(id, title, file_name, file_type, created_at)')
        .eq('dossier_id', dossierId);
      setDocuments((links as unknown as DocLink[]) || []);

      // Load linked folders
      const { data: folderLinks } = await supabase
        .from('dossier_folders')
        .select('id, folder_id, folders(id, name, created_at)')
        .eq('dossier_id', dossierId);
      setFolders((folderLinks as unknown as FolderLink[]) || []);

      // Load events
      const { data: ev } = await supabase
        .from('dossier_events')
        .select('*')
        .eq('dossier_id', dossierId)
        .order('created_at', { ascending: false });
      setEvents((ev as DossierEvent[]) || []);

      // Load available documents (not yet linked to ANY dossier)
      const { data: userDocs } = await supabase
        .from('documents')
        .select('id, title, file_name')
        .eq('user_id', userId)
        .is('deleted_at', null);

      // Get all documents that are already linked to any dossier
      const { data: allLinkedDocs } = await supabase
        .from('dossier_documents')
        .select('document_id');

      const linkedDocIds = new Set((allLinkedDocs || []).map((l: { document_id: string }) => l.document_id));
      const availableDocs = (userDocs || []).filter((doc: { id: string }) => !linkedDocIds.has(doc.id));
      setAllUserDocs(availableDocs);

      // Load available folders (not yet linked to this dossier)
      const { data: userFolders } = await supabase
        .from('folders')
        .select('id, name')
        .eq('user_id', userId)
        .is('deleted_at', null);

      const linkedFolderIds = (folderLinks || []).map((l: { folder_id: string }) => l.folder_id);
      const availableFolders = (userFolders || []).filter((folder: { id: string }) => !linkedFolderIds.includes(folder.id));
      setAllUserFolders(availableFolders);

    } catch (e: any) {
      logger.error(LogCategory.DATABASE, 'Load dossier failed', e);
      toast({ title: 'Error', description: 'Failed to load dossier', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const logEvent = async (eventType: string, payload: Record<string, unknown>) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    await supabase.from('dossier_events').insert({
      dossier_id: dossierId,
      event_type: eventType,
      payload,
      created_by: session.user.id,
    });
    // Reload events
    const { data: ev } = await supabase
      .from('dossier_events')
      .select('*')
      .eq('dossier_id', dossierId)
      .order('created_at', { ascending: false });
    setEvents((ev as DossierEvent[]) || []);
  };

  const handleUpdateStatus = async (status: DossierStatus) => {
    if (!canEdit || !dossier) return;
    const prev = dossier.status;
    const { error } = await supabase.from('dossiers').update({ status, updated_at: new Date().toISOString() }).eq('id', dossierId);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }
    setDossier({ ...dossier, status });
    setEditStatus(status);
    await logEvent('status_changed', { from: prev, to: status });
    toast({ title: 'Success', description: 'Status updated' });
  };

  const handleUpdatePhase = async () => {
    if (!canEdit || !dossier) return;
    const prev = dossier.phase;
    const phase = editPhase.trim() || null;
    const { error } = await supabase.from('dossiers').update({ phase, updated_at: new Date().toISOString() }).eq('id', dossierId);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }
    setDossier({ ...dossier, phase });
    await logEvent('phase_changed', { from: prev, to: phase });
    toast({ title: 'Success', description: 'Phase updated' });
  };

  const handleUpdateAdminState = async (admin_state: AdminState) => {
    if (!canEdit || !dossier) return;
    const prev = dossier.admin_state;
    const { error } = await supabase.from('dossiers').update({ admin_state, updated_at: new Date().toISOString() }).eq('id', dossierId);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }
    setDossier({ ...dossier, admin_state });
    setEditAdminState(admin_state);
    await logEvent('admin_state_changed', { from: prev, to: admin_state });
    toast({ title: 'Success', description: 'Admin state updated' });
  };

  const handleAddDocument = async () => {
    if (!canEdit || !selectedDocId) return;

    try {
      // Check if document is already linked to another dossier
      const { data: existingLink } = await supabase
        .from('dossier_documents')
        .select('dossier_id, dossiers(title)')
        .eq('document_id', selectedDocId)
        .single();

      if (existingLink) {
        const dossierTitle = (existingLink as any).dossiers?.title || 'another dossier';
        toast({
          title: 'Document Already Linked',
          description: `This document is already linked to "${dossierTitle}". Each document can only be linked to one dossier.`,
          variant: 'destructive',
        });
        return;
      }

      const { error } = await supabase.from('dossier_documents').insert({
        dossier_id: dossierId,
        document_id: selectedDocId
      });

      if (error) {
        if (error.code === '23505') {
          toast({
            title: 'Document Already Added',
            description: 'This document is already linked to this dossier.',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Error',
            description: 'Failed to link document. Please try again.',
            variant: 'destructive',
          });
        }
        return;
      }

      const doc = allUserDocs.find((d) => d.id === selectedDocId);
      await logEvent('document_added', { document_id: selectedDocId, title: doc?.title });

      toast({ title: 'Success', description: 'Document linked successfully!' });

      setAddDocOpen(false);
      setSelectedDocId('');

      const { data: { session } } = await supabase.auth.getSession();
      if (session) await loadDossier(session.user.id);

      setDocumentPage(1);

    } catch (e: any) {
      logger.error(LogCategory.DATABASE, 'Add document to dossier failed', e);
      toast({ title: 'Error', description: 'Failed to link document', variant: 'destructive' });
    }
  };

  const handleRemoveDocument = async (linkId: string, docTitle: string) => {
    if (!canEdit) return;

    if (!confirm('Remove this document from the dossier?')) return;

    try {
      const { error } = await supabase.from('dossier_documents').delete().eq('id', linkId);

      if (error) {
        toast({ title: 'Error', description: 'Failed to remove document. Please try again.', variant: 'destructive' });
        return;
      }

      await logEvent('document_removed', { title: docTitle });
      toast({ title: 'Success', description: 'Document removed successfully!' });

      const { data: { session } } = await supabase.auth.getSession();
      if (session) await loadDossier(session.user.id);

      const newTotalPages = Math.ceil((filteredDocuments.length - 1) / ITEMS_PER_PAGE);
      if (documentPage > newTotalPages && newTotalPages > 0) {
        setDocumentPage(newTotalPages);
      }

    } catch (e: any) {
      logger.error(LogCategory.DATABASE, 'Remove document from dossier failed', e);
      toast({ title: 'Error', description: 'Failed to remove document', variant: 'destructive' });
    }
  };

  const handleAddFolder = async () => {
    if (!canEdit || !selectedFolderId) return;

    try {
      const { error } = await supabase.from('dossier_folders').insert({
        dossier_id: dossierId,
        folder_id: selectedFolderId
      });

      if (error) {
        if (error.code === '23505') {
          toast({
            title: 'Folder Already Added',
            description: 'This folder is already linked to this dossier.',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Error',
            description: 'Failed to link folder. Please try again.',
            variant: 'destructive',
          });
        }
        return;
      }

      const folder = allUserFolders.find((f) => f.id === selectedFolderId);
      await logEvent('folder_added', { folder_id: selectedFolderId, name: folder?.name });

      toast({ title: 'Success', description: 'Folder linked successfully!' });

      setAddFolderOpen(false);
      setSelectedFolderId('');

      const { data: { session } } = await supabase.auth.getSession();
      if (session) await loadDossier(session.user.id);

      setFolderPage(1);

    } catch (e: any) {
      logger.error(LogCategory.DATABASE, 'Add folder to dossier failed', e);
      toast({ title: 'Error', description: 'Failed to link folder', variant: 'destructive' });
    }
  };

  const handleRemoveFolder = async (linkId: string, folderName: string) => {
    if (!canEdit) return;

    if (!confirm('Remove this folder from the dossier?')) return;

    try {
      const { error } = await supabase.from('dossier_folders').delete().eq('id', linkId);

      if (error) {
        toast({ title: 'Error', description: 'Failed to remove folder. Please try again.', variant: 'destructive' });
        return;
      }

      await logEvent('folder_removed', { name: folderName });
      toast({ title: 'Success', description: 'Folder removed successfully!' });

      const { data: { session } } = await supabase.auth.getSession();
      if (session) await loadDossier(session.user.id);

      const newTotalPages = Math.ceil((filteredFolders.length - 1) / ITEMS_PER_PAGE);
      if (folderPage > newTotalPages && newTotalPages > 0) {
        setFolderPage(newTotalPages);
      }

    } catch (e: any) {
      logger.error(LogCategory.DATABASE, 'Remove folder from dossier failed', e);
      toast({ title: 'Error', description: 'Failed to remove folder', variant: 'destructive' });
    }
  };

  const handleAddNote = async () => {
    if (!canEdit || !noteText.trim()) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      await supabase.from('dossier_events').insert({
        dossier_id: dossierId,
        event_type: 'note',
        payload: { body: noteText.trim() },
        created_by: session.user.id,
      });

      setNoteText('');
      setAddNoteOpen(false);

      const { data: ev } = await supabase
        .from('dossier_events')
        .select('*')
        .eq('dossier_id', dossierId)
        .order('created_at', { ascending: false });
      setEvents((ev as DossierEvent[]) || []);

      setEventPage(1);

      toast({ title: 'Success', description: 'Note added successfully!' });
    } catch (e: any) {
      logger.error(LogCategory.DATABASE, 'Add note failed', e);
      toast({ title: 'Error', description: 'Failed to add note', variant: 'destructive' });
    }
  };

  const formatEvent = (e: DossierEvent) => {
    const date = new Date(e.created_at).toLocaleString();
    switch (e.event_type) {
      case 'created':
        return { label: 'Dossier created', sub: (e.payload as any)?.title ? `"${(e.payload as any).title}"` : date };
      case 'document_added':
        return { label: 'Document added', sub: (e.payload as any)?.title || '' };
      case 'document_removed':
        return { label: 'Document removed', sub: (e.payload as any)?.title || '' };
      case 'folder_added':
        return { label: 'Folder added', sub: (e.payload as any)?.name || '' };
      case 'folder_removed':
        return { label: 'Folder removed', sub: (e.payload as any)?.name || '' };
      case 'status_changed':
        return { label: 'Status changed', sub: `${(e.payload as any)?.from} → ${(e.payload as any)?.to}` };
      case 'phase_changed':
        return { label: 'Phase changed', sub: `${(e.payload as any)?.from ?? '—'} → ${(e.payload as any)?.to ?? '—'}` };
      case 'admin_state_changed':
        return { label: 'Admin state changed', sub: `${(e.payload as any)?.from} → ${(e.payload as any)?.to}` };
      case 'note':
        return { label: 'Note', sub: (e.payload as any)?.body || '' };
      default:
        return { label: e.event_type, sub: '' };
    }
  };

  const PaginationControls = ({ 
    currentPage, 
    totalPages, 
    onPageChange 
  }: { 
    currentPage: number; 
    totalPages: number; 
    onPageChange: (page: number) => void;
  }) => {
    if (totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-between mt-4 pt-4 border-t">
        <p className="text-sm text-gray-600">
          Page {currentPage} of {totalPages}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar mobileOpen={sidebarOpen} onMobileClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex items-center justify-center">
          <UniversalLoader fullScreen={false} message="" />
        </div>
      </div>
    );
  }

  if (!dossier) return null;

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar mobileOpen={sidebarOpen} onMobileClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader onMenuClick={() => setSidebarOpen(true)} />
        <div className="flex-1 overflow-auto">
          <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            <SubscriptionWarningBanner />

            <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/dossiers')}>
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Dossiers
            </Button>

            <div className="flex flex-col gap-4">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{dossier.title}</h1>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm text-gray-600">Type: {dossier.type}</span>
                {canEdit ? (
                  <>
                    <Select value={editStatus} onValueChange={(v) => handleUpdateStatus(v as DossierStatus)}>
                      <SelectTrigger className="w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DOSSIER_STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={editAdminState} onValueChange={(v) => handleUpdateAdminState(v as AdminState)}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ADMIN_STATES.map((a) => (
                          <SelectItem key={a} value={a}>{a.replace('_', ' ')}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex items-center gap-2">
                      <Input
                        value={editPhase}
                        onChange={(e) => setEditPhase(e.target.value)}
                        placeholder="Phase"
                        className="w-[160px]"
                      />
                      <Button size="sm" onClick={handleUpdatePhase}>Save phase</Button>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="inline-flex px-2 py-1 rounded text-sm font-medium bg-gray-100">{dossier.status}</span>
                    <span className="inline-flex px-2 py-1 rounded text-sm font-medium bg-gray-100">{dossier.admin_state.replace('_', ' ')}</span>
                    <span className="text-sm text-gray-600">Phase: {dossier.phase || '—'}</span>
                  </>
                )}
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList>
                <TabsTrigger value="documents">
                  Documents ({filteredDocuments.length})
                </TabsTrigger>
                <TabsTrigger value="folders">
                  Folders ({filteredFolders.length})
                </TabsTrigger>
                <TabsTrigger value="timeline">
                  Timeline ({events.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="documents" className="mt-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="font-semibold text-gray-900">Linked documents</h2>
                      {canEdit && (
                        <Button
                          size="sm"
                          onClick={() => setAddDocOpen(true)}
                          disabled={allUserDocs.length === 0}
                          className={allUserDocs.length === 0 
                            ? "bg-gray-300 text-gray-500 cursor-not-allowed" 
                            : "bg-primary hover:bg-primary-hover text-white"
                          }
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Document
                        </Button>
                      )}
                    </div>

                    {/* Document Search */}
                    {documents.length > 0 && (
                      <div className="mb-4 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          type="text"
                          placeholder="Search documents by title or filename..."
                          value={documentSearchQuery}
                          onChange={(e) => setDocumentSearchQuery(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    )}

                    {allUserDocs.length === 0 && canEdit && documents.length === 0 && (
                      <Alert className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          No documents available to add. All your documents are either already linked to this dossier or to other dossiers. 
                          Each document can only be linked to one dossier at a time.
                        </AlertDescription>
                      </Alert>
                    )}

                    {filteredDocuments.length === 0 ? (
                      <p className="text-gray-500 py-6 text-center">
                        {documentSearchQuery 
                          ? 'No documents found matching your search'
                          : documents.length === 0
                            ? `No documents linked. ${canEdit && allUserDocs.length > 0 ? 'Click "Add Document" to link a document from your library.' : ''}`
                            : 'No documents found'
                        }
                      </p>
                    ) : (
                      <>
                        <ul className="space-y-2">
                          {paginatedDocuments.map((link) => (
                            <li key={link.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div
                                className="flex items-center gap-3 cursor-pointer flex-1"
                                onClick={() => router.push(`/dashboard/documents/${link.document_id}`)}
                              >
                                <FileText className="h-5 w-5 text-gray-500" />
                                <div className="flex-1">
                                  <span className="font-medium block">{link.documents?.title || link.document_id}</span>
                                  <span className="text-sm text-gray-500">{link.documents?.file_name}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button variant="ghost" size="sm" onClick={() => router.push(`/dashboard/documents/${link.document_id}`)}>
                                  <Eye className="h-4 w-4" />
                                </Button>
                                {canEdit && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => handleRemoveDocument(link.id, link.documents?.title || '')}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </li>
                          ))}
                        </ul>
                        <PaginationControls 
                          currentPage={documentPage}
                          totalPages={totalDocPages}
                          onPageChange={setDocumentPage}
                        />
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="folders" className="mt-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="font-semibold text-gray-900">Linked folders</h2>
                      {canEdit && (
                        <Button
                          size="sm"
                          onClick={() => setAddFolderOpen(true)}
                          disabled={allUserFolders.length === 0}
                          className={allUserFolders.length === 0 
                            ? "bg-gray-300 text-gray-500 cursor-not-allowed" 
                            : "bg-primary hover:bg-primary-hover text-white"
                          }
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Folder
                        </Button>
                      )}
                    </div>

                    {/* Folder Search */}
                    {folders.length > 0 && (
                      <div className="mb-4 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          type="text"
                          placeholder="Search folders by name..."
                          value={folderSearchQuery}
                          onChange={(e) => setFolderSearchQuery(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    )}

                    {allUserFolders.length === 0 && canEdit && folders.length === 0 && (
                      <Alert className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          No folders available to add. All your folders are already linked to this dossier.
                        </AlertDescription>
                      </Alert>
                    )}

                    {filteredFolders.length === 0 ? (
                      <p className="text-gray-500 py-6 text-center">
                        {folderSearchQuery 
                          ? 'No folders found matching your search'
                          : folders.length === 0
                            ? `No folders linked. ${canEdit && allUserFolders.length > 0 ? 'Click "Add Folder" to link a folder from your library.' : ''}`
                            : 'No folders found'
                        }
                      </p>
                    ) : (
                      <>
                        <ul className="space-y-2">
                          {paginatedFolders.map((link) => (
                            <li key={link.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div
                                className="flex items-center gap-3 cursor-pointer flex-1"
                                onClick={() => router.push(`/dashboard/folders/${link.folder_id}`)}
                              >
                                <FolderOpen className="h-5 w-5 text-primary" />
                                <span className="font-medium">{link.folders?.name || link.folder_id}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button variant="ghost" size="sm" onClick={() => router.push(`/dashboard/folders/${link.folder_id}`)}>
                                  <Eye className="h-4 w-4" />
                                </Button>
                                {canEdit && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => handleRemoveFolder(link.id, link.folders?.name || '')}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </li>
                          ))}
                        </ul>
                        <PaginationControls 
                          currentPage={folderPage}
                          totalPages={totalFolderPages}
                          onPageChange={setFolderPage}
                        />
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="timeline" className="mt-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="font-semibold text-gray-900">Timeline</h2>
                      {canEdit && (
                        <Button size="sm" onClick={() => setAddNoteOpen(true)} className="bg-primary hover:bg-primary-hover text-white">
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Add note
                        </Button>
                      )}
                    </div>
                    {events.length === 0 ? (
                      <p className="text-gray-500 py-6 text-center">No events yet.</p>
                    ) : (
                      <>
                        <ul className="space-y-3">
                          {paginatedEvents.map((e) => {
                            const { label, sub } = formatEvent(e);
                            return (
                              <li key={e.id} className="flex flex-col gap-1 p-3 bg-gray-50 rounded-lg">
                                <span className="font-medium text-gray-900">{label}</span>
                                {sub && <span className="text-sm text-gray-600">{sub}</span>}
                                <span className="text-xs text-gray-400">{new Date(e.created_at).toLocaleString()}</span>
                              </li>
                            );
                          })}
                        </ul>
                        <PaginationControls 
                          currentPage={eventPage}
                          totalPages={totalEventPages}
                          onPageChange={setEventPage}
                        />
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Add Document Dialog */}
      <Dialog open={addDocOpen} onOpenChange={setAddDocOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add document to dossier</DialogTitle>
            <DialogDescription>
              Select a document from your library. Each document can only be linked to one dossier.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {allUserDocs.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No documents available to add. All your documents are either already linked to this dossier or to other dossiers.
                </AlertDescription>
              </Alert>
            ) : (
              <Select value={selectedDocId} onValueChange={setSelectedDocId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose document" />
                </SelectTrigger>
                <SelectContent>
                  {allUserDocs.map((doc) => (
                    <SelectItem key={doc.id} value={doc.id}>
                      {doc.title} ({doc.file_name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setAddDocOpen(false); setSelectedDocId(''); }}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddDocument} 
              disabled={!selectedDocId || allUserDocs.length === 0} 
              className="bg-primary hover:bg-primary-hover text-white"
            >
              Add Document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Folder Dialog */}
      <Dialog open={addFolderOpen} onOpenChange={setAddFolderOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add folder to dossier</DialogTitle>
            <DialogDescription>
              Select a folder from your library. It will be linked to this dossier.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {allUserFolders.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No folders available to add. All your folders are already linked to this dossier.
                </AlertDescription>
              </Alert>
            ) : (
              <Select value={selectedFolderId} onValueChange={setSelectedFolderId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose folder" />
                </SelectTrigger>
                <SelectContent>
                  {allUserFolders.map((folder) => (
                    <SelectItem key={folder.id} value={folder.id}>
                      {folder.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setAddFolderOpen(false); setSelectedFolderId(''); }}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddFolder} 
              disabled={!selectedFolderId || allUserFolders.length === 0} 
              className="bg-primary hover:bg-primary-hover text-white"
            >
              Add Folder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Note Dialog */}
      <Dialog open={addNoteOpen} onOpenChange={setAddNoteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add note</DialogTitle>
            <DialogDescription>This will appear in the timeline.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label>Note</Label>
            <Textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="e.g. Waiting for client response"
              className="mt-2 min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setAddNoteOpen(false); setNoteText(''); }}>
              Cancel
            </Button>
            <Button onClick={handleAddNote} disabled={!noteText.trim()} className="bg-primary hover:bg-primary-hover text-white">
              Add note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toaster />
    </div>
  );
}