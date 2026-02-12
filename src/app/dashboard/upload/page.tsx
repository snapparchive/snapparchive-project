'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, FileText, X, Tag as TagIcon, FolderOpen, Loader2, AlertCircle, Lock, CheckSquare, Square } from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { Toaster } from '@/components/ui/toaster';
import { logger, LogCategory, PerformanceLogger } from '@/lib/logger';
import { useSubscriptionAccess } from '@/lib/hooks/useSubscriptionAccess';
import { SubscriptionWarningBanner } from '@/components/subscription/SubscriptionWarningBanner';
import { trackEvent } from '@/lib/analytics';

interface Folder {
  id: string;
  name: string;
}

interface Tag {
  id: string;
  name: string;
  color: string;
}

const MAX_FILE_SIZE = 15 * 1024 * 1024;
const ALLOWED_FILE_TYPES = {
  'application/pdf': ['.pdf'],
  'image/png': ['.png'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/jpg': ['.jpg'],
};

const ALLOWED_EXTENSIONS = ['.pdf', '.png', '.jpg', '.jpeg'];

const FILE_TYPE_NAMES: Record<string, string> = {
  'application/pdf': 'PDF',
  'image/png': 'PNG Image',
  'image/jpeg': 'JPEG Image',
  'image/jpg': 'JPEG Image',
};

export default function UploadPage() {
  const router = useRouter();
  const { toast } = useToast();
  const subscriptionAccess = useSubscriptionAccess();

  const [isUploading, setIsUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<string>('');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [validationError, setValidationError] = useState<string | null>(null);

  // ✅ NEW: OCR opt-in state (default FALSE per client requirement)
  const [ocrEnabled, setOcrEnabled] = useState(false);

  useEffect(() => {
    logger.info(LogCategory.USER_ACTION, 'Upload page loaded');
    checkAuth();
  }, []);

  useEffect(() => {
    if (!subscriptionAccess.isLoading && !subscriptionAccess.canUpload) {
      toast({
        title: 'Access Restricted',
        description: subscriptionAccess.warningMessage || 'You need an active subscription to upload documents.',
        variant: 'destructive',
      });

      setTimeout(() => {
        router.push('/dashboard/settings');
      }, 2000);
    }
  }, [subscriptionAccess.isLoading, subscriptionAccess.canUpload]);

  const checkAuth = async () => {
    logger.debug(LogCategory.AUTH, 'Checking authentication for upload page');

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      logger.warn(LogCategory.AUTH, 'No session found, redirecting to login');
      router.push('/login');
      return;
    }

    logger.info(LogCategory.AUTH, 'User authenticated on upload page', { userId: session.user.id });
    loadFoldersAndTags(session.user.id);
  };

  const loadFoldersAndTags = async (uid: string) => {
    const perf = new PerformanceLogger('Load folders and tags', uid);

    try {
      logger.info(LogCategory.USER_ACTION, 'Loading folders and tags for upload', { userId: uid });

      const { data: foldersData, error: foldersError } = await supabase
        .from('folders')
        .select('id, name')
        .eq('user_id', uid)
        .is('deleted_at', null)
        .order('name');

      if (foldersError) {
        logger.error(LogCategory.DATABASE, 'Failed to load folders', foldersError, { userId: uid });
      } else {
        setFolders(foldersData || []);
        logger.info(LogCategory.USER_ACTION, 'Folders loaded successfully', {
          userId: uid,
          count: foldersData?.length || 0
        });
      }

      const { data: tagsData, error: tagsError } = await supabase
        .from('tags')
        .select('id, name, color')
        .eq('user_id', uid)
        .order('name');

      if (tagsError) {
        logger.error(LogCategory.DATABASE, 'Failed to load tags', tagsError, { userId: uid });
      } else {
        setTags(tagsData || []);
        logger.info(LogCategory.USER_ACTION, 'Tags loaded successfully', {
          userId: uid,
          count: tagsData?.length || 0
        });
      }

      perf.end({ foldersCount: foldersData?.length || 0, tagsCount: tagsData?.length || 0 });
    } catch (error) {
      logger.error(LogCategory.SYSTEM, 'Failed to load folders and tags', error, { userId: uid });
      perf.error(error);
    }
  };

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    logger.debug(LogCategory.UPLOAD, 'Validating file', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    });

    if (file.size > MAX_FILE_SIZE) {
      const error = `File size exceeds the maximum limit of ${(MAX_FILE_SIZE / 1024 / 1024).toFixed(0)}MB. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB.`;
      logger.warn(LogCategory.UPLOAD, 'File validation failed: size exceeded', {
        fileName: file.name,
        fileSize: file.size,
        maxSize: MAX_FILE_SIZE,
      });
      return { valid: false, error };
    }

    if (!Object.keys(ALLOWED_FILE_TYPES).includes(file.type)) {
      const error = `File type "${file.type || 'unknown'}" is not supported. Only PDF, PNG, and JPEG files are allowed.`;
      logger.warn(LogCategory.UPLOAD, 'File validation failed: invalid type', {
        fileName: file.name,
        fileType: file.type,
      });
      return { valid: false, error };
    }

    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      const error = `File extension "${extension}" is not allowed. Supported: ${ALLOWED_EXTENSIONS.join(', ')}`;
      logger.warn(LogCategory.UPLOAD, 'File validation failed: invalid extension', {
        fileName: file.name,
        extension,
      });
      return { valid: false, error };
    }

    if (file.size === 0) {
      const error = 'File appears to be corrupted or empty. Please select a valid file.';
      logger.warn(LogCategory.UPLOAD, 'File validation failed: empty file', { fileName: file.name });
      return { valid: false, error };
    }

    logger.info(LogCategory.UPLOAD, 'File validation passed', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    });

    return { valid: true };
  };

  const calculateChecksum = async (file: File): Promise<string> => {
    const perf = new PerformanceLogger('Calculate checksum', undefined, undefined);

    try {
      logger.debug(LogCategory.UPLOAD, 'Calculating file checksum', { fileName: file.name });

      const buffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      logger.info(LogCategory.UPLOAD, 'Checksum calculated successfully', {
        fileName: file.name,
        checksum: hashHex.substring(0, 16) + '...',
      });

      perf.end({ fileName: file.name, checksumLength: hashHex.length });
      return hashHex;
    } catch (error) {
      logger.error(LogCategory.UPLOAD, 'Checksum calculation failed', error, { fileName: file.name });
      perf.error(error, { fileName: file.name });
      throw new Error('Failed to calculate file checksum. File may be corrupted.');
    }
  };

  const checkDuplicateFile = async (checksum: string, userId: string): Promise<boolean> => {
    try {
      logger.debug(LogCategory.UPLOAD, 'Checking for duplicate file', {
        checksum: checksum.substring(0, 16) + '...',
        userId,
      });

      const { data, error } = await supabase
        .from('documents')
        .select('id, title, file_name')
        .eq('user_id', userId)
        .eq('file_checksum', checksum)
        .is('deleted_at', null)
        .maybeSingle();

      if (error) {
        logger.error(LogCategory.DATABASE, 'Duplicate check query failed', error, { userId });
      }

      if (data) {
        logger.warn(LogCategory.UPLOAD, 'Duplicate file detected', {
          existingDocId: data.id,
          existingTitle: data.title,
          existingFileName: data.file_name,
          checksum: checksum.substring(0, 16) + '...',
          userId,
        });

        const userChoice = confirm(
          `A file with identical content already exists:\n\n` +
          `Title: ${data.title}\n` +
          `Filename: ${data.file_name}\n\n` +
          `Do you want to upload anyway?`
        );

        if (!userChoice) {
          logger.info(LogCategory.UPLOAD, 'User cancelled duplicate upload', { userId });
          return true;
        } else {
          logger.info(LogCategory.UPLOAD, 'User chose to upload duplicate', { userId });
          return false;
        }
      }

      logger.info(LogCategory.UPLOAD, 'No duplicate found', { userId });
      return false;
    } catch (error) {
      logger.error(LogCategory.SYSTEM, 'Duplicate check failed', error, { checksum, userId });
      return false;
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!subscriptionAccess.canUpload) {
      subscriptionAccess.showAccessDeniedToast('select files for upload');
      e.target.value = '';
      return;
    }

    setValidationError(null);
    const selectedFile = e.target.files?.[0];

    if (!selectedFile) return;

    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user.id || 'unknown';

    logger.info(LogCategory.UPLOAD, 'File selected for upload', {
      fileName: selectedFile.name,
      fileSize: selectedFile.size,
      fileType: selectedFile.type,
      userId,
    });

    const validation = validateFile(selectedFile);

    if (!validation.valid) {
      setValidationError(validation.error!);

      logger.warn(LogCategory.UPLOAD, 'File validation failed', {
        fileName: selectedFile.name,
        error: validation.error,
        userId,
      });

      toast({
        title: 'Invalid File',
        description: validation.error,
        variant: 'destructive',
      });
      e.target.value = '';
      return;
    }

    setFile(selectedFile);
    if (!title) {
      setTitle(selectedFile.name.replace(/\.[^/.]+$/, ''));
      logger.debug(LogCategory.USER_ACTION, 'Auto-filled title from filename', {
        fileName: selectedFile.name,
        userId,
      });
    }

    toast({
      title: 'File Selected',
      description: `${selectedFile.name} (${(selectedFile.size / 1024 / 1024).toFixed(2)} MB)`,
    });

    logger.info(LogCategory.UPLOAD, 'File selected successfully', {
      fileName: selectedFile.name,
      userId,
    });
  };

  const toggleTag = async (tagId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user.id;

    setSelectedTagIds(prev => {
      const newSelection = prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId];

      logger.debug(LogCategory.USER_ACTION, 'Tag selection toggled', {
        tagId,
        selected: !prev.includes(tagId),
        totalSelected: newSelection.length,
        userId,
      });

      return newSelection;
    });
  };

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
      } else {
        logger.warn(LogCategory.OCR, 'Failed to trigger OCR processing', {
          userId: session.user.id,
          status: response.status,
          statusText: response.statusText,
        });
      }
    } catch (error) {
      logger.error(LogCategory.OCR, 'Failed to trigger OCR', error);
    }
  };

  const sendUploadNotification = async (
    accessToken: string,
    documentId: string,
    title: string,
    fileName: string
  ) => {
    try {
      await fetch('/api/notifications/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'upload',
          documentId,
          documentTitle: title,
          fileName,
        }),
      });
    } catch (error) {
      console.error('Failed to send upload notification:', error);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!subscriptionAccess.canUpload) {
      subscriptionAccess.showAccessDeniedToast('upload documents');
      return;
    }

    if (!subscriptionAccess.canUploadMore) {
      toast({
        title: 'Upload Limit Reached',
        description: subscriptionAccess.warningMessage || 'You have reached your plan limits',
        variant: 'destructive',
      });
      return;
    }

    if (!file) {
      logger.warn(LogCategory.UPLOAD, 'Upload attempted without file');
      toast({
        title: 'Error',
        description: 'Please select a file to upload',
        variant: 'destructive',
      });
      return;
    }

    if (!title.trim()) {
      logger.warn(LogCategory.UPLOAD, 'Upload attempted without title');
      toast({
        title: 'Error',
        description: 'Please enter a document title',
        variant: 'destructive',
      });
      return;
    }

    const validation = validateFile(file);
    if (!validation.valid) {
      toast({
        title: 'Validation Error',
        description: validation.error,
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    let documentId: string | undefined;
    let userId: string | undefined;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        logger.warn(LogCategory.AUTH, 'Session expired during upload');
        router.push('/login');
        return;
      }

      userId = session.user.id;
      const perf = new PerformanceLogger('Document upload', userId);

      logger.uploadStarted(file.name, userId, file.size, file.type);
      logger.info(LogCategory.UPLOAD, 'OCR opt-in status', {
        ocrEnabled,
        fileName: file.name,
        userId,
      });

      setUploadProgress(10);
      const checksum = await calculateChecksum(file);

      setUploadProgress(20);
      const isDuplicate = await checkDuplicateFile(checksum, userId);
      if (isDuplicate) {
        logger.info(LogCategory.UPLOAD, 'Upload cancelled due to duplicate', { userId });
        setIsUploading(false);
        setUploadProgress(0);
        return;
      }

      setUploadProgress(30);
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;

      logger.debug(LogCategory.STORAGE, 'Starting file upload to storage', {
        fileName,
        fileSize: file.size,
        userId,
      });

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        logger.error(LogCategory.STORAGE, 'Storage upload failed', uploadError, {
          fileName: file.name,
          userId,
        });
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      logger.info(LogCategory.STORAGE, 'File uploaded to storage successfully', {
        fileName,
        path: uploadData.path,
        userId,
      });

      setUploadProgress(70);

      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(fileName);

      const publicLinkId = `${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 9)}`;

      setUploadProgress(80);
      const folderId = selectedFolderId && selectedFolderId !== 'none' ? selectedFolderId : null;

      logger.debug(LogCategory.DATABASE, 'Inserting document record', {
        title: title.trim(),
        fileName: file.name,
        fileSize: file.size,
        folderId,
        ocrEnabled,
        userId,
      });

      const { data: document, error: docError } = await supabase
        .from('documents')
        .insert({
          user_id: userId,
          title: title.trim(),
          file_name: file.name,
          file_url: publicUrl,
          file_size: file.size,
          file_type: file.type,
          file_checksum: checksum,
          folder_id: folderId,
          ocr_enabled: ocrEnabled,
          ocr_status: ocrEnabled ? 'queued' : null,
          ocr_started_at: ocrEnabled ? new Date().toISOString() : null,
          public_link: publicLinkId,
          is_public: true,
        })
        .select()
        .single();

      if (docError) {
        logger.error(LogCategory.DATABASE, 'Failed to insert document record', docError, { userId });
        throw docError;
      }

      documentId = document.id;

      logger.documentCreated(documentId!, userId, title.trim(), {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        folderId,
        ocrEnabled,
      });

      setUploadProgress(90);

      if (selectedTagIds.length > 0 && document) {
        logger.debug(LogCategory.TAG, 'Applying tags to document', {
          documentId,
          tagIds: selectedTagIds,
          tagCount: selectedTagIds.length,
          userId,
        });

        const tagInserts = selectedTagIds.map(tagId => ({
          document_id: document.id,
          tag_id: tagId,
        }));

        const { error: tagError } = await supabase.from('document_tags').insert(tagInserts);

        if (tagError) {
          logger.error(LogCategory.DATABASE, 'Failed to apply tags', tagError, {
            documentId,
            userId,
          });
        } else {
          logger.tagsApplied(documentId!, userId, selectedTagIds, selectedTagIds.length);
        }
      }

      setUploadProgress(100);

      logger.uploadCompleted(documentId!, file.name, userId, file.size);

      if (ocrEnabled) {
        logger.ocrQueued(documentId!, userId, {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
        });
      } else {
        logger.info(LogCategory.OCR, 'OCR not enabled for this document', {
          documentId,
          userId,
        });
      }

      perf.end({
        documentId,
        fileName: file.name,
        fileSize: file.size,
        tagsCount: selectedTagIds.length,
        ocrEnabled,
      });

      const successMessage = ocrEnabled
        ? 'Your document has been uploaded and queued for OCR processing.'
        : 'Your document has been uploaded successfully.';

      toast({
        title: 'Document Uploaded',
        description: successMessage,
      });

      await sendUploadNotification(
        session.access_token,
        documentId!,
        title.trim(),
        file.name
      );

      setTimeout(() => {
        router.push(ocrEnabled ? '/dashboard/ocr-status' : '/dashboard/documents');
      }, 1200);

      if (ocrEnabled) {
        await triggerOCRProcessing();
      }

    } catch (error: any) {
      const { data: { session } } = await supabase.auth.getSession();
      userId = session?.user.id || userId;

      logger.uploadFailed(file?.name || 'unknown', userId || 'unknown', error);

      if (documentId && userId) {
        logger.documentCreated(documentId, userId, title.trim(), {
          fileName: file?.name,
          status: 'failed',
          error: error.message,
        });
      }

      let errorMessage = 'Upload failed. Please try again.';

      if (error.message.includes('timeout')) {
        errorMessage = 'Upload timed out. Please check your internet connection and try again.';
      } else if (error.message.includes('network')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (error.message.includes('corrupted')) {
        errorMessage = 'File appears to be corrupted. Please try a different file.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: 'Upload Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const manageSubscription = () => {
    trackEvent('click_manage_Subscription_banner', {
      button_name: 'Manage Subscription',
      button_location: 'manage_Subscription_banner',
    });
    router.push('/dashboard/settings');
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  };

  if (subscriptionAccess.isLoading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar mobileOpen={sidebarOpen} onMobileClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!subscriptionAccess.canUpload) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar mobileOpen={sidebarOpen} onMobileClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <DashboardHeader onMenuClick={() => setSidebarOpen(true)} />
          <div className="flex-1 flex items-center justify-center p-8">
            <Card className="max-w-md w-full">
              <CardContent className="pt-6 text-center">
                <Lock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Upload Access Restricted
                </h2>
                <p className="text-gray-600 mb-6">
                  {subscriptionAccess.warningMessage || 'You need an active subscription with auto-renewal enabled to upload documents.'}
                </p>
                <Button
                  onClick={manageSubscription}
                  className="bg-primary hover:bg-primary-hover text-white"
                >
                  Manage Subscription
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar mobileOpen={sidebarOpen} onMobileClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader onMenuClick={() => setSidebarOpen(true)} />
        <div className="flex-1 overflow-auto p-4 sm:p-8">
          <div className="max-w-2xl mx-auto space-y-6">
            <SubscriptionWarningBanner />

            <div className="mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Upload Document
              </h1>
              <p className="text-sm sm:text-base text-gray-600 mt-2">
                Upload a document and optionally enable OCR to make it searchable
              </p>
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>File Requirements:</strong> Maximum {(MAX_FILE_SIZE / 1024 / 1024).toFixed(0)}MB •
                  Supported formats: PDF, PNG, JPEG
                </p>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Document Details</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpload} className="space-y-6">
                  {validationError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{validationError}</AlertDescription>
                    </Alert>
                  )}

                  <div>
                    <Label htmlFor="title">Document Title *</Label>
                    <Input
                      id="title"
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Enter document title"
                      required
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Enter document description"
                      className="mt-2"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="folder">Folder (Optional)</Label>
                    <Select value={selectedFolderId} onValueChange={setSelectedFolderId}>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Select a folder" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Folder</SelectItem>
                        {folders.map((folder) => (
                          <SelectItem key={folder.id} value={folder.id}>
                            <div className="flex items-center gap-2">
                              <FolderOpen className="h-4 w-4" />
                              {folder.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Tags (Optional)</Label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {tags.length === 0 ? (
                        <p className="text-sm text-gray-500">
                          No tags available. Create tags first.
                        </p>
                      ) : (
                        tags.map((tag) => (
                          <Badge
                            key={tag.id}
                            className="cursor-pointer transition-all"
                            style={{
                              backgroundColor: selectedTagIds.includes(tag.id)
                                ? tag.color
                                : '#e5e7eb',
                              color: selectedTagIds.includes(tag.id)
                                ? 'white'
                                : '#374151',
                            }}
                            onClick={() => toggleTag(tag.id)}
                          >
                            <TagIcon className="h-3 w-3 mr-1" />
                            {tag.name}
                          </Badge>
                        ))
                      )}
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <button
                        type="button"
                        onClick={() => setOcrEnabled(!ocrEnabled)}
                        className="mt-0.5 flex-shrink-0"
                      >
                        {ocrEnabled ? (
                          <CheckSquare className="h-5 w-5 text-primary" />
                        ) : (
                          <Square className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                      <div className="flex-1">
                        <Label
                          htmlFor="ocr-toggle"
                          className="font-semibold cursor-pointer"
                          onClick={() => setOcrEnabled(!ocrEnabled)}
                        >
                          Enable OCR Processing
                        </Label>
                        <p className="text-sm text-gray-600 mt-1">
                          {ocrEnabled ? (
                            <span className="text-green-700">
                              ✓ This document will be processed for text extraction and made searchable.
                              Processing may take a few minutes.
                            </span>
                          ) : (
                            <span>
                              OCR is disabled. The document will be stored without text extraction.
                              You can enable OCR later if needed.
                            </span>
                          )}
                        </p>
                        {ocrEnabled && (
                          <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
                            <strong>Note:</strong> OCR cost applies per document. Disable this if you don't need text extraction.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="file">Select File *</Label>
                    <div className="mt-2">
                      {!file ? (
                        <label
                          htmlFor="file"
                          className="flex flex-col items-center justify-center w-full h-48 sm:h-64 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mb-4" />
                            <p className="mb-2 text-sm text-gray-500">
                              <span className="font-semibold">Click to upload</span> or drag and drop
                            </p>
                            <p className="text-xs text-gray-500">
                              PDF, PNG, JPEG (MAX. {(MAX_FILE_SIZE / 1024 / 1024).toFixed(0)}MB)
                            </p>
                          </div>
                          <input
                            id="file"
                            type="file"
                            className="hidden"
                            onChange={handleFileChange}
                            accept={ALLOWED_EXTENSIONS.join(',')}
                          />
                        </label>
                      ) : (
                        <div className="flex items-center justify-between p-4 bg-blue-50 border-2 border-[#04a3c3] rounded-lg">
                          <div className="flex items-center gap-3">
                            <FileText className="h-8 w-8 text-primary" />
                            <div>
                              <p className="font-medium text-gray-900 text-sm sm:text-base">
                                {file.name}
                              </p>
                              <p className="text-xs sm:text-sm text-gray-500">
                                {formatFileSize(file.size)} • {FILE_TYPE_NAMES[file.type] || file.type}
                              </p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setFile(null);
                              setValidationError(null);
                              logger.info(LogCategory.USER_ACTION, 'File selection cleared');
                            }}
                          >
                            <X className="h-5 w-5" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {isUploading && uploadProgress > 0 && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Uploading...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                    <Button
                      type="submit"
                      disabled={isUploading || !file}
                      className="bg-primary hover:bg-primary-hover text-white flex-1 flex items-center justify-center gap-2"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Uploading... {uploadProgress}%
                        </>
                      ) : (
                        'Upload Document'
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        logger.info(LogCategory.USER_ACTION, 'Upload cancelled by user');
                        router.push('/dashboard');
                      }}
                      disabled={isUploading}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Toaster />
    </div>
  );
}