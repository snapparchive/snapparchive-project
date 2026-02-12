'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Download, Share2, Edit, Trash2, FileText, FolderOpen, Tag as TagIcon, RotateCcw, Loader2, Copy, Check, Lock, Briefcase, Plus } from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { Toaster } from '@/components/ui/toaster';
import { logger, LogCategory } from '@/lib/logger';
import { useSubscriptionAccess } from '@/lib/hooks/useSubscriptionAccess';
import { SubscriptionWarningBanner } from '@/components/subscription/SubscriptionWarningBanner';

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface Folder {
  id: string;
  name: string;
}

interface Document {
  id: string;
  title: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  ocr_status: string;
  ocr_enabled: boolean; // ✅ ADDED
  ocr_text: string | null;
  ocr_error: string | null;
  ocr_retry_count: number;
  created_at: string;
  updated_at: string;
  folder_id: string | null;
  is_public: boolean;
  public_link: string | null;
  folders?: Folder | null;
}

interface DossierLink {
  id: string;
  title: string;
  status: string;
}

export default function DocumentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const subscriptionAccess = useSubscriptionAccess();
  const [document, setDocument] = useState<Document | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [addToDossierOpen, setAddToDossierOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Dossier: current link (at most one per document in Phase 1)
  const [currentDossierLink, setCurrentDossierLink] = useState<DossierLink | null>(null);
  const [availableDossiers, setAvailableDossiers] = useState<{ id: string; title: string; status: string }[]>([]);
  const [createNewDossier, setCreateNewDossier] = useState(false);
  const [newDossierTitle, setNewDossierTitle] = useState('');
  const [newDossierType, setNewDossierType] = useState('Client');
  const [selectedDossierId, setSelectedDossierId] = useState<string>('');
  const [dossierActionLoading, setDossierActionLoading] = useState(false);

  // Edit form states
  const [editTitle, setEditTitle] = useState('');
  const [editFolderId, setEditFolderId] = useState<string>('');
  const [editTagIds, setEditTagIds] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadDocument();
    loadFolders();
    loadAllTags();

    const interval = setInterval(() => {
      if (document && (document.ocr_status === 'queued' || document.ocr_status === 'processing')) {
        loadDocument();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [params.id, document?.ocr_status]);

  useEffect(() => {
    if (addToDossierOpen) loadAvailableDossiers();
  }, [addToDossierOpen]);

  const loadDocument = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/login');
      return;
    }

    try {
      const { data: docData, error: docError } = await supabase
        .from('documents')
        .select('*, folders(id, name)')
        .eq('id', params.id)
        .eq('user_id', session.user.id)
        .is('deleted_at', null)
        .maybeSingle();

      if (docError || !docData) {
        logger.error(
          LogCategory.USER_ACTION,
          'Document not found or access denied',
          docError,
          {
            documentId: params.id as string,
            userId: session.user.id,
          }
        );

        toast({
          title: 'Error',
          description: 'Document not found',
          variant: 'destructive',
        });
        router.push('/dashboard');
        return;
      }

      logger.userAction('view_document', session.user.id, params.id as string, {
        title: docData.title,
        ocrStatus: docData.ocr_status,
        ocrEnabled: docData.ocr_enabled,
        fileType: docData.file_type,
      });

      setDocument(docData);

      const { data: tagData } = await supabase
        .from('document_tags')
        .select('tags(id, name, color)')
        .eq('document_id', params.id);

      if (tagData) {
        const documentTags = tagData
          .map(item => item.tags)
          .filter(tag => tag !== null) as unknown as Tag[];
        setTags(documentTags);
      }

      // Current dossier link (Phase 1: at most one dossier per document)
      const { data: linkData } = await supabase
        .from('dossier_documents')
        .select('dossiers(id, title, status)')
        .eq('document_id', params.id)
        .maybeSingle();
      if (linkData?.dossiers) {
        const d = linkData.dossiers as unknown as { id: string; title: string; status: string };
        setCurrentDossierLink({ id: d.id, title: d.title, status: d.status });
      } else {
        setCurrentDossierLink(null);
      }

      setIsLoading(false);
    } catch (error) {
      logger.systemError('Failed to load document', error, {
        documentId: params.id as string,
        userId: session?.user.id,
      });

      toast({
        title: 'Error',
        description: 'Failed to load document',
        variant: 'destructive',
      });
    }
  };

  const loadFolders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    try {
      const { data, error } = await supabase
        .from('folders')
        .select('id, name')
        .eq('user_id', session.user.id)
        .is('deleted_at', null)
        .order('name');

      if (error) {
        logger.databaseError('Load folders query', error);
      } else {
        setFolders(data || []);
      }
    } catch (error) {
      logger.systemError('Failed to load folders', error);
    }
  };

  const loadAllTags = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    try {
      const { data, error } = await supabase
        .from('tags')
        .select('id, name, color')
        .eq('user_id', session.user.id)
        .order('name');

      if (error) {
        logger.databaseError('Load tags query', error);
      } else {
        setAllTags(data || []);
      }
    } catch (error) {
      logger.systemError('Failed to load tags', error);
    }
  };

  const loadAvailableDossiers = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    try {
      const { data, error } = await supabase
        .from('dossiers')
        .select('id, title, status')
        .eq('user_id', session.user.id)
        .neq('status', 'archived')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      const list = data || [];
      setAvailableDossiers(list);
      if (list.length > 0) setSelectedDossierId(list[0].id);
    } catch (e) {
      logger.error(LogCategory.DATABASE, 'Failed to load dossiers', e, {});
      setAvailableDossiers([]);
    }
  };

  const logDossierEvent = async (dossierId: string, eventType: string, payload: Record<string, unknown>) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    await supabase.from('dossier_events').insert({
      dossier_id: dossierId,
      event_type: eventType,
      payload,
      created_by: session.user.id,
    });
  };

  // ✅ NEW: Trigger OCR Processing
  const triggerOCRProcessing = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      logger.info(LogCategory.OCR, 'Triggering OCR processing', { userId: session.user.id });

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/process-ocr`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        }
      );

      if (response.ok) {
        logger.info(LogCategory.OCR, 'OCR processing triggered successfully', {
          userId: session.user.id,
          status: response.status,
        });
      }
    } catch (error) {
      logger.error(LogCategory.OCR, 'Failed to trigger OCR', error);
    }
  };

  const handleAddToDossierConfirm = async () => {
    if (!document) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    setDossierActionLoading(true);
    try {
      let dossierId = selectedDossierId;
      if (createNewDossier) {
        if (!newDossierTitle.trim()) {
          toast({ title: 'Error', description: 'Dossier title is required', variant: 'destructive' });
          setDossierActionLoading(false);
          return;
        }
        const { data: newDossier, error: createErr } = await supabase
          .from('dossiers')
          .insert({
            user_id: session.user.id,
            title: newDossierTitle.trim(),
            type: newDossierType,
            status: 'open',
            admin_state: 'ok',
            phase: null,
          })
          .select('id')
          .single();
        if (createErr || !newDossier) throw createErr || new Error('Failed to create dossier');
        dossierId = newDossier.id;
        await logDossierEvent(dossierId, 'created', { title: newDossierTitle.trim(), type: newDossierType });
      }
      const { error: linkErr } = await supabase
        .from('dossier_documents')
        .insert({ dossier_id: dossierId, document_id: document.id });
      if (linkErr) throw linkErr;
      await logDossierEvent(dossierId, 'document_added', { document_id: document.id, document_title: document.title });
      toast({ title: 'Success', description: 'Document added to dossier' });
      setAddToDossierOpen(false);
      setCreateNewDossier(false);
      setNewDossierTitle('');
      setNewDossierType('Client');
      setSelectedDossierId('');
      await loadDocument();
    } catch (e: any) {
      logger.error(LogCategory.DATABASE, 'Add to dossier failed', e, { documentId: document.id });
      toast({ title: 'Error', description: e.message || 'Failed to add to dossier', variant: 'destructive' });
    } finally {
      setDossierActionLoading(false);
    }
  };

  const handleRemoveFromDossier = async () => {
    if (!document || !currentDossierLink) return;
    if (!confirm('Remove this document from the dossier? The document will remain in your library.')) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    try {
      const { error } = await supabase
        .from('dossier_documents')
        .delete()
        .eq('document_id', document.id)
        .eq('dossier_id', currentDossierLink.id);
      if (error) throw error;
      await logDossierEvent(currentDossierLink.id, 'document_removed', { document_id: document.id, document_title: document.title });
      toast({ title: 'Success', description: 'Document removed from dossier' });
      setCurrentDossierLink(null);
      await loadDocument();
    } catch (e: any) {
      logger.error(LogCategory.DATABASE, 'Remove from dossier failed', e, { documentId: document.id });
      toast({ title: 'Error', description: e.message || 'Failed to remove from dossier', variant: 'destructive' });
    }
  };

  const generatePublicLink = async () => {
    if (!document) return null;

    const { data: { session } } = await supabase.auth.getSession();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '');

    try {
      if (document.public_link) {
        logger.userAction('access_public_link', session?.user.id || 'unknown', document.id, {
          publicLink: document.public_link,
        });
        return `${appUrl}/public/${document.public_link}`;
      }

      const publicId = `${document.id.substring(0, 8)}-${Date.now().toString(36)}`;

      const { error } = await supabase
        .from('documents')
        .update({
          public_link: publicId,
          is_public: true
        })
        .eq('id', document.id);

      if (error) {
        logger.error(LogCategory.USER_ACTION, 'Failed to generate public link', error, {
          documentId: document.id,
          userId: session?.user.id,
        });
        toast({
          title: 'Error',
          description: 'Failed to generate public link',
          variant: 'destructive',
        });
        return null;
      }

      logger.userAction('generate_public_link', session?.user.id || 'unknown', document.id, {
        publicLink: publicId,
        title: document.title,
      });

      await loadDocument();
      return `${appUrl}/public/${publicId}`;
    } catch (error) {
      logger.systemError('Public link generation failed', error, {
        documentId: document.id,
      });
      return null;
    }
  };

  const handleDownload = async () => {
    if (!document) {
      toast({ title: 'Error', description: 'Document not found', variant: 'destructive' });
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();

      logger.userAction('download_document_start', session?.user.id || 'unknown', document.id, {
        fileName: document.file_name,
        fileSize: document.file_size,
        fileType: document.file_type,
      });

      const response = await fetch(document.file_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = document.file_name;
      window.document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      window.document.body.removeChild(a);

      logger.userAction('download_document_success', session?.user.id || 'unknown', document.id, {
        fileName: document.file_name,
      });

      toast({ title: 'Success', description: 'Document downloaded successfully' });
    } catch (error) {
      const { data: { session } } = await supabase.auth.getSession();

      logger.error(LogCategory.USER_ACTION, 'Download failed', error, {
        documentId: document.id,
        userId: session?.user.id,
        fileName: document.file_name,
      });

      toast({ title: 'Error', description: 'Failed to download document', variant: 'destructive' });
    }
  };

  const handleShare = async () => {
    const { data: { session } } = await supabase.auth.getSession();

    logger.userAction('share_document_attempt', session?.user.id || 'unknown', document?.id, {
      title: document?.title,
    });

    const publicUrl = await generatePublicLink();
    if (publicUrl) {
      setIsShareOpen(true);
    }
  };

  const copyToClipboard = async (text: string) => {
    const { data: { session } } = await supabase.auth.getSession();

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);

      logger.userAction('copy_public_link', session?.user.id || 'unknown', document?.id, {
        link: text,
      });

      toast({ title: 'Success', description: 'Link copied to clipboard' });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      logger.error(LogCategory.USER_ACTION, 'Failed to copy to clipboard', error, { documentId: document?.id });
    }
  };

  const openEditDialog = async () => {
    if (!subscriptionAccess.canEdit) {
      subscriptionAccess.showAccessDeniedToast('edit documents');
      return;
    }

    if (!document) return;

    const { data: { session } } = await supabase.auth.getSession();
    logger.userAction('open_edit_dialog', session?.user.id || 'unknown', document.id, {
      title: document.title,
    });

    setEditTitle(document.title);
    setEditFolderId(document.folder_id || 'none');
    setEditTagIds(tags.map(t => t.id));
    setIsEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!document || !editTitle.trim()) {
      toast({
        title: 'Error',
        description: 'Title is required',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const folderId = editFolderId === 'none' ? null : editFolderId;

      logger.userAction('edit_document_start', session.user.id, document.id, {
        oldTitle: document.title,
        newTitle: editTitle.trim(),
        oldFolderId: document.folder_id,
        newFolderId: folderId,
      });

      const { error: docError } = await supabase
        .from('documents')
        .update({
          title: editTitle.trim(),
          folder_id: folderId
        })
        .eq('id', document.id);

      if (docError) {
        logger.databaseError('Update document failed', docError);
        throw docError;
      }

      await supabase
        .from('document_tags')
        .delete()
        .eq('document_id', document.id);

      if (editTagIds.length > 0) {
        const tagInserts = editTagIds.map(tagId => ({
          document_id: document.id,
          tag_id: tagId,
        }));
        const { error: tagError } = await supabase.from('document_tags').insert(tagInserts);
        if (tagError) {
          logger.databaseError('Insert document tags failed', tagError);
        }
      }

      logger.userAction('edit_document_success', session.user.id, document.id, {
        title: editTitle.trim(),
        folderId: folderId,
        tagCount: editTagIds.length,
      });

      toast({
        title: 'Success',
        description: 'Document updated successfully',
      });

      setIsEditOpen(false);
      await loadDocument();
    } catch (error: any) {
      const { data: { session } } = await supabase.auth.getSession();

      logger.error(LogCategory.USER_ACTION, 'Edit document failed', error, {
        documentId: document.id,
        userId: session?.user.id,
      });

      toast({
        title: 'Error',
        description: error.message || 'Failed to update document',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleEditTag = (tagId: string) => {
    setEditTagIds(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const handleRetryOCR = async () => {
    if (!subscriptionAccess.canEdit) {
      subscriptionAccess.showAccessDeniedToast('retry OCR processing');
      return;
    }

    if (!document) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      logger.userAction('retry_ocr', session.user.id, document.id, {
        previousStatus: document.ocr_status,
        retryCount: document.ocr_retry_count,
      });

      const { error } = await supabase
        .from('documents')
        .update({
          ocr_status: 'queued',
          ocr_error: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', document.id);

      if (error) {
        logger.databaseError('Retry OCR update failed', error);
        throw error;
      }

      logger.ocrQueued(document.id, session.user.id, {
        retryAttempt: true,
        previousRetryCount: document.ocr_retry_count,
      });

      toast({
        title: 'Success',
        description: 'Document re-queued for OCR processing',
      });

      loadDocument();
    } catch (error: any) {
      const { data: { session } } = await supabase.auth.getSession();

      logger.error(LogCategory.OCR, 'Failed to retry OCR', error, {
        documentId: document.id,
        userId: session?.user.id,
      });

      toast({
        title: 'Error',
        description: 'Failed to retry OCR',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!subscriptionAccess.canDelete) {
      subscriptionAccess.showAccessDeniedToast('delete documents');
      return;
    }

    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !document) return;

      logger.userAction('delete_document_start', session.user.id, params.id as string, {
        title: document.title,
        fileName: document.file_name,
      });

      const { error } = await supabase
        .rpc('soft_delete_document', { document_id: params.id });

      if (error) {
        logger.databaseError('Soft delete document RPC failed', error);
        throw error;
      }

      logger.userAction('delete_document_success', session.user.id, params.id as string, {
        title: document.title,
      });

      toast({
        title: 'Success',
        description: 'Document deleted successfully',
      });

      router.push('/dashboard');
    } catch (error: any) {
      const { data: { session } } = await supabase.auth.getSession();

      logger.error(LogCategory.USER_ACTION, 'Failed to delete document', error, {
        documentId: params.id as string,
        userId: session?.user.id,
      });

      toast({
        title: 'Error',
        description: `Failed to delete document: ${error.message}`,
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-700">Completed</Badge>;
      case 'processing':
        return (
          <Badge className="bg-blue-100 text-blue-700 flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            Processing
          </Badge>
        );
      case 'queued':
        return <Badge className="bg-yellow-100 text-yellow-700">Queued</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-700">Failed</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-700">Unknown</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar mobileOpen={sidebarOpen} onMobileClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-gray-500">Loading document...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!document) return null;

  const publicUrl = document.public_link
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/public/${document.public_link}`
    : '';

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar mobileOpen={sidebarOpen} onMobileClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader onMenuClick={() => setSidebarOpen(true)} />
        <div className="flex-1 overflow-auto p-4 sm:p-8">
          <div className="max-w-4xl mx-auto space-y-6">
            <SubscriptionWarningBanner />

            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/dashboard/documents')}
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 break-words">
                  {document.title}
                </h1>
                <p className="text-sm sm:text-base text-gray-600 mt-2 break-all">
                  {document.file_name}
                </p>

                {document.folders && (
                  <div className="flex items-center gap-2 mt-3">
                    <FolderOpen className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-700">
                      {document.folders.name}
                    </span>
                  </div>
                )}

                {currentDossierLink && (
                  <div className="flex items-center gap-2 mt-3">
                    <Briefcase className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-700">
                      In dossier:{' '}
                      <button
                        type="button"
                        onClick={() => router.push(`/dashboard/dossiers/${currentDossierLink.id}`)}
                        className="text-primary hover:underline font-medium"
                      >
                        {currentDossierLink.title}
                      </button>
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-500 hover:text-red-600 h-7 px-2"
                      onClick={handleRemoveFromDossier}
                      disabled={!subscriptionAccess.canEdit}
                    >
                      Remove from dossier
                    </Button>
                  </div>
                )}

                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {tags.map(tag => (
                      <Badge
                        key={tag.id}
                        style={{ backgroundColor: tag.color, color: 'white' }}
                      >
                        <TagIcon className="h-3 w-3 mr-1" />
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload()}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShare}
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>

                {!currentDossierLink && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAddToDossierOpen(true)}
                    disabled={!subscriptionAccess.canEdit}
                    className={!subscriptionAccess.canEdit ? 'opacity-50' : ''}
                  >
                    {subscriptionAccess.canEdit && <Briefcase className="h-4 w-4 mr-2" />}
                    {!subscriptionAccess.canEdit && <Lock className="h-4 w-4 mr-2" />}
                    Add to Dossier
                  </Button>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={openEditDialog}
                  disabled={!subscriptionAccess.canEdit}
                  className={!subscriptionAccess.canEdit ? 'opacity-50' : ''}
                >
                  {!subscriptionAccess.canEdit && <Lock className="h-4 w-4 mr-2" />}
                  {subscriptionAccess.canEdit && <Edit className="h-4 w-4 mr-2" />}
                  Edit
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDelete}
                  disabled={!subscriptionAccess.canDelete}
                  className={`${!subscriptionAccess.canDelete ? 'opacity-50' : 'text-red-600 hover:text-red-700'}`}
                >
                  {!subscriptionAccess.canDelete && <Lock className="h-4 w-4 mr-2" />}
                  {subscriptionAccess.canDelete && <Trash2 className="h-4 w-4 mr-2" />}
                  Delete
                </Button>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Document Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">OCR Status</p>
                    <div className="mt-1 flex items-center gap-2">
                      {getStatusBadge(document.ocr_status)}
                      {document.ocr_retry_count > 0 && (
                        <span className="text-xs text-gray-500">
                          (Retry {document.ocr_retry_count})
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">File Size</p>
                    <p className="mt-1 text-gray-900">
                      {(document.file_size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">File Type</p>
                    <p className="mt-1 text-gray-900">
                      {document.file_type || 'Unknown'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Upload Date</p>
                    <p className="mt-1 text-gray-900">
                      {new Date(document.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {document.ocr_error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm font-medium text-red-800 mb-1">OCR Error</p>
                    <p className="text-sm text-red-700">{document.ocr_error}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ✅ OCR Control Section */}
            <Card>
              <CardHeader>
                <CardTitle>OCR Processing Control</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">
                      Optical Character Recognition (OCR)
                    </h3>
                    <p className="text-sm text-gray-600">
                      {document.ocr_enabled
                        ? 'OCR is enabled for this document. Text extraction will be performed automatically.'
                        : 'OCR is currently disabled. Enable it to extract and search text from this document.'}
                    </p>

                    {document.ocr_enabled && document.ocr_status === 'completed' && (
                      <p className="text-xs text-green-700 mt-2">
                        ✓ Text extraction completed successfully
                      </p>
                    )}

                    {document.ocr_enabled && (document.ocr_status === 'queued' || document.ocr_status === 'processing') && (
                      <p className="text-xs text-blue-700 mt-2">
                        ⚡ Processing in progress...
                      </p>
                    )}

                    {document.ocr_enabled && document.ocr_status === 'failed' && (
                      <p className="text-xs text-red-700 mt-2">
                        ✗ Processing failed. You can retry below.
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {!document.ocr_enabled ? (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={async () => {
                          if (!subscriptionAccess.canEdit) {
                            subscriptionAccess.showAccessDeniedToast('enable OCR');
                            return;
                          }

                          if (!confirm('Enable OCR processing for this document? This will extract text and make the document searchable.')) return;

                          try {
                            const { data: { session } } = await supabase.auth.getSession();
                            if (!session) return;

                            const { error } = await supabase
                              .from('documents')
                              .update({
                                ocr_enabled: true,
                                ocr_status: 'queued',
                                ocr_error: null,
                                ocr_started_at: new Date().toISOString(),
                                updated_at: new Date().toISOString()
                              })
                              .eq('id', document.id);

                            if (error) throw error;

                            logger.info(LogCategory.OCR, 'OCR enabled for document', {
                              documentId: document.id,
                              userId: session.user.id,
                            });

                            toast({
                              title: 'OCR Enabled',
                              description: 'Document queued for text extraction',
                            });

                            await loadDocument();
                            await triggerOCRProcessing();
                          } catch (error: any) {
                            logger.error(LogCategory.OCR, 'Failed to enable OCR', error);
                            toast({
                              title: 'Error',
                              description: 'Failed to enable OCR',
                              variant: 'destructive',
                            });
                          }
                        }}
                        disabled={!subscriptionAccess.canEdit}
                        className={!subscriptionAccess.canEdit ? 'opacity-50' : 'bg-primary hover:bg-primary-hover'}
                      >
                        {!subscriptionAccess.canEdit && <Lock className="h-4 w-4 mr-2" />}
                        Enable OCR
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          if (!subscriptionAccess.canEdit) {
                            subscriptionAccess.showAccessDeniedToast('disable OCR');
                            return;
                          }

                          if (!confirm('Disable OCR for this document? Existing extracted text will be preserved but no future processing will occur.')) return;

                          try {
                            const { data: { session } } = await supabase.auth.getSession();
                            if (!session) return;

                            const { error } = await supabase
                              .from('documents')
                              .update({
                                ocr_enabled: false,
                                ocr_status: document.ocr_status === 'completed' ? 'completed' : 'pending',
                                updated_at: new Date().toISOString()
                              })
                              .eq('id', document.id);

                            if (error) throw error;

                            logger.info(LogCategory.OCR, 'OCR disabled for document', {
                              documentId: document.id,
                              userId: session.user.id,
                            });

                            toast({
                              title: 'OCR Disabled',
                              description: 'Text extraction disabled for this document',
                            });

                            await loadDocument();
                          } catch (error: any) {
                            logger.error(LogCategory.OCR, 'Failed to disable OCR', error);
                            toast({
                              title: 'Error',
                              description: 'Failed to disable OCR',
                              variant: 'destructive',
                            });
                          }
                        }}
                        disabled={!subscriptionAccess.canEdit}
                      >
                        {!subscriptionAccess.canEdit && <Lock className="h-4 w-4 mr-2" />}
                        Disable OCR
                      </Button>
                    )}
                  </div>
                </div>

                {document.ocr_enabled && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs text-blue-800">
                      <strong>Status:</strong> {document.ocr_status}
                      {document.ocr_retry_count > 0 && ` (Retry ${document.ocr_retry_count})`}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {document.ocr_status === 'completed' && document.ocr_text && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Extracted Text (OCR)</CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        navigator.clipboard.writeText(document.ocr_text!);
                        const { data: { session } } = await supabase.auth.getSession();
                        logger.userAction('copy_ocr_text', session?.user.id || 'unknown', document.id);
                        toast({ title: 'Success', description: 'Text copied to clipboard' });
                      }}
                    >
                      Copy
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="p-4 bg-gray-50 rounded-lg max-h-96 overflow-y-auto">
                    <p className="text-gray-700 whitespace-pre-wrap text-sm sm:text-base">
                      {document.ocr_text}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {(document.ocr_status === 'queued' || document.ocr_status === 'processing') && (
              <Card>
                <CardContent className="py-12 text-center">
                  <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                  <p className="text-gray-600 mb-2 text-lg font-medium">
                    {document.ocr_status === 'queued'
                      ? '⚡ Document queued for ultra-fast OCR processing...'
                      : '🚀 OCR processing in progress...'}
                  </p>
                  <p className="text-sm text-gray-500 mb-1">
                    This page will update automatically when processing completes
                  </p>
                </CardContent>
              </Card>
            )}

            {document.ocr_status === 'failed' && (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-red-600 mb-4">
                    OCR processing failed. {document.ocr_error}
                  </p>
                  <Button
                    variant="outline"
                    onClick={handleRetryOCR}
                    disabled={!subscriptionAccess.canEdit}
                    className={`text-primary ${!subscriptionAccess.canEdit ? 'opacity-50' : ''}`}
                  >
                    {!subscriptionAccess.canEdit && <Lock className="h-4 w-4 mr-2" />}
                    {subscriptionAccess.canEdit && <RotateCcw className="h-4 w-4 mr-2" />}
                    Retry OCR
                  </Button>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Preview</CardTitle>
              </CardHeader>

              <CardContent>
                <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg overflow-hidden">
                  {document.file_type.startsWith('image/') && (
                    <img
                      src={document.file_url}
                      alt={document.title}
                      className="max-h-full max-w-full object-contain rounded"
                    />
                  )}

                  {document.file_type === 'application/pdf' && (
                    <iframe
                      src={`${document.file_url}#toolbar=0`}
                      className="w-full h-full rounded"
                    />
                  )}

                  {!document.file_type.startsWith('image/') &&
                    document.file_type !== 'application/pdf' && (
                      <div className="text-center">
                        <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">
                          Preview not available for this file type
                        </p>
                      </div>
                    )}
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>

      {/* Dialogs remain the same... */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Edit Document</DialogTitle>
            <DialogDescription>
              Update document title, folder, and tags
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Document title"
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="edit-folder">Folder</Label>
              <Select value={editFolderId} onValueChange={setEditFolderId}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select folder" />
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
            <div>
              <Label>Tags</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {allTags.map((tag) => (
                  <Badge
                    key={tag.id}
                    className="cursor-pointer transition-all"
                    style={{
                      backgroundColor: editTagIds.includes(tag.id)
                        ? tag.color
                        : '#e5e7eb',
                      color: editTagIds.includes(tag.id)
                        ? 'white'
                        : '#374151',
                    }}
                    onClick={() => toggleEditTag(tag.id)}
                  >
                    <TagIcon className="h-3 w-3 mr-1" />
                    {tag.name}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

      <Dialog open={addToDossierOpen} onOpenChange={(open) => { setAddToDossierOpen(open); if (!open) { setCreateNewDossier(false); setNewDossierTitle(''); setSelectedDossierId(''); } }}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Add to Dossier</DialogTitle>
            <DialogDescription>
              Link this document to an existing dossier or create a new one. A document can belong to one dossier.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex gap-2">
              <Button
                variant={!createNewDossier ? 'default' : 'outline'}
                size="sm"
                onClick={() => { setCreateNewDossier(false); setSelectedDossierId(availableDossiers[0]?.id || ''); }}
              >
                Select existing
              </Button>
              <Button
                variant={createNewDossier ? 'default' : 'outline'}
                size="sm"
                onClick={() => { setCreateNewDossier(true); setSelectedDossierId(''); }}
              >
                <Plus className="h-4 w-4 mr-1" />
                Create new dossier
              </Button>
            </div>
            {!createNewDossier ? (
              <div>
                <Label>Dossier</Label>
                <Select value={selectedDossierId} onValueChange={setSelectedDossierId}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Choose a dossier" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableDossiers.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.title} {d.status ? `(${d.status})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {availableDossiers.length === 0 && (
                  <p className="text-sm text-gray-500 mt-2">No active dossiers. Create a new one above.</p>
                )}
              </div>
            ) : (
              <>
                <div>
                  <Label htmlFor="new-dossier-title">Dossier title</Label>
                  <Input
                    id="new-dossier-title"
                    value={newDossierTitle}
                    onChange={(e) => setNewDossierTitle(e.target.value)}
                    placeholder="e.g. Client A — Loan Application"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>Type</Label>
                  <Select value={newDossierType} onValueChange={setNewDossierType}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Client">Client</SelectItem>
                      <SelectItem value="Project">Project</SelectItem>
                      <SelectItem value="Request">Request</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddToDossierOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddToDossierConfirm}
              disabled={dossierActionLoading || (!createNewDossier && !selectedDossierId) || (createNewDossier && !newDossierTitle.trim())}
            >
              {dossierActionLoading ? 'Adding...' : createNewDossier ? 'Create dossier & link' : 'Add to dossier'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toaster />
    </div>
  );
}