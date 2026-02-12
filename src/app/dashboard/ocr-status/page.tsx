'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR, { mutate } from 'swr';
import {
  Activity,
  FileText,
  MoreVertical,
  Eye,
  RotateCcw,
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2,
} from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { logger, LogCategory } from '@/lib/logger';

interface Document {
  id: string;
  title: string;
  file_name: string;
  ocr_status: 'queued' | 'processing' | 'completed' | 'failed' | 'paused';
  ocr_text: string | null;
  ocr_error: string | null;
  ocr_retry_count: number;
  created_at: string;
  user_id: string;
}

// Fetcher function for SWR
const fetcher = async (key: string) => {
  const userId = key.split('/')[1];
  
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Document[];
};

export default function OCRStatusPage() {
  const ITEMS_PER_PAGE = 5;
  const router = useRouter();
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState('all');
  const [viewingDocument, setViewingDocument] = useState<Document | null>(null);
  const [isOCRViewOpen, setIsOCRViewOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [userId, setUserId] = useState<string | null>(null);

  // Get user session
  const { data: session } = useSWR('session', async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/login');
      return null;
    }
    setUserId(session.user.id);
    logger.info(LogCategory.USER_ACTION, 'User accessed OCR status page', {
      userId: session.user.id,
    });
    return session;
  });

  // Fetch documents with SWR
  const { data: documents, error, isLoading } = useSWR(
    userId ? `documents/${userId}` : null,
    fetcher,
    {
      refreshInterval: 5000, // Still poll every 5 seconds, but SWR handles it efficiently
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 2000,
      onSuccess: (data) => {
        if (userId) {
          logger.info(LogCategory.OCR, 'Documents loaded successfully', {
            userId,
            documentCount: data?.length || 0,
          });
        }
      },
      onError: (err) => {
        if (userId) {
          logger.error(LogCategory.OCR, 'Failed to load documents', err, {
            userId,
          });
        }
      },
    }
  );

  // Handle tab change
  const handleTabChange = (value: string) => {
    setSelectedTab(value);
    setCurrentPage(1);
    
    if (userId) {
      logger.info(LogCategory.USER_ACTION, 'OCR status tab changed', {
        userId,
        tab: value,
      });
    }
  };

  // Filter documents based on selected tab
  const filteredDocuments = (documents || []).filter((doc) => {
    if (selectedTab === 'all') return true;
    if (selectedTab === 'pending') return doc.ocr_status === 'queued';
    return doc.ocr_status === selectedTab;
  });

  const totalPages = Math.ceil(filteredDocuments.length / ITEMS_PER_PAGE);

  const paginatedDocuments = filteredDocuments.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'processing':
        return <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />;
      case 'failed':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case 'queued':
        return <Clock className="h-5 w-5 text-amber-600" />;
      case 'paused':
        return <Clock className="h-5 w-5 text-gray-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
            Completed
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
      case 'queued':
        return (
          <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
            Queued
          </Badge>
        );
      case 'paused':
        return (
          <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">
            Paused
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">
            Unknown
          </Badge>
        );
    }
  };

  const handleRetryOCR = async (docId: string) => {
    if (!userId) return;

    try {
      logger.info(LogCategory.OCR, 'User initiated OCR retry', {
        userId,
        documentId: docId,
      });

      const { error } = await supabase
        .from('documents')
        .update({
          ocr_status: 'queued',
          ocr_error: null,
          ocr_started_at: null,
          ocr_completed_at: null,
        })
        .eq('id', docId);

      if (error) {
        logger.error(LogCategory.OCR, 'OCR retry failed', error, {
          userId,
          documentId: docId,
        });
        toast({
          title: 'Error',
          description: 'Failed to retry OCR',
          variant: 'destructive',
        });
      } else {
        logger.ocrQueued(docId, userId);

        // Optimistically update the UI
        mutate(
          `documents/${userId}`,
          (currentData: Document[] | undefined) => {
            if (!currentData) return currentData;
            return currentData.map((doc) =>
              doc.id === docId
                ? {
                    ...doc,
                    ocr_status: 'queued' as const,
                    ocr_error: null,
                    ocr_started_at: null,
                    ocr_completed_at: null,
                  }
                : doc
            );
          },
          { revalidate: true }
        );

        toast({
          title: 'Success',
          description: 'Document queued for OCR processing',
        });
      }
    } catch (err) {
      logger.error(LogCategory.OCR, 'Unexpected error during OCR retry', err, {
        userId,
        documentId: docId,
      });
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    }
  };

  const handleViewOCR = (doc: Document) => {
    setViewingDocument(doc);
    setIsOCRViewOpen(true);
    
    if (userId) {
      logger.info(LogCategory.USER_ACTION, 'User viewed OCR text', {
        userId,
        documentId: doc.id,
        ocrStatus: doc.ocr_status,
        fileName: doc.file_name,
        title: doc.title,
      });
    }
  };

  const handleRefresh = () => {
    if (userId) {
      logger.info(LogCategory.USER_ACTION, 'User manually refreshed OCR status', {
        userId,
      });
      mutate(`documents/${userId}`);
    }
  };

  const getStatusCount = (status: string) => {
    if (!documents) return 0;
    if (status === 'all') return documents.length;
    if (status === 'pending') return documents.filter((doc) => doc.ocr_status === 'queued').length;
    return documents.filter((doc) => doc.ocr_status === status).length;
  };

  // Show error state
  if (error) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar mobileOpen={sidebarOpen} onMobileClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <DashboardHeader onMenuClick={() => setSidebarOpen(true)} />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Documents</h2>
              <p className="text-gray-600 mb-4">Failed to load OCR status information</p>
              <Button onClick={handleRefresh}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
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
        <div className="flex-1 overflow-auto">
          <div className="p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">OCR Status</h1>
                <p className="text-gray-600 mt-1">
                  Monitor and manage OCR processing status
                </p>
              </div>
              <Button variant="outline" onClick={handleRefresh}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>

            <Tabs value={selectedTab} onValueChange={handleTabChange}>
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="all">
                  All ({getStatusCount('all')})
                </TabsTrigger>
                <TabsTrigger value="pending">
                  Queued ({getStatusCount('pending')})
                </TabsTrigger>
                <TabsTrigger value="processing">
                  Processing ({getStatusCount('processing')})
                </TabsTrigger>
                <TabsTrigger value="completed">
                  Completed ({getStatusCount('completed')})
                </TabsTrigger>
                <TabsTrigger value="failed">
                  Failed ({getStatusCount('failed')})
                </TabsTrigger>
              </TabsList>

              <TabsContent value={selectedTab} className="mt-6">
                {isLoading ? (
                  <div className="text-center py-12">
                    <UniversalLoader fullScreen={false} message="" />
                  </div>
                ) : filteredDocuments.length === 0 ? (
                  <div className="text-center py-12">
                    <Activity className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg mb-2">
                      No documents {selectedTab === 'pending' ? 'queued' : `with ${selectedTab} status`}
                    </p>
                    <p className="text-sm text-gray-400">
                      {selectedTab === 'pending' && 'Upload a document to see it here'}
                      {selectedTab === 'processing' && 'No documents are currently being processed'}
                      {selectedTab === 'completed' && 'No documents have been processed yet'}
                      {selectedTab === 'failed' && 'No failed OCR jobs'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {paginatedDocuments.map((doc) => (
                      <Card key={doc.id}>
                        <CardContent className="p-6">
                          <div className="flex items-center gap-4">
                            <div className="flex-shrink-0">
                              {getStatusIcon(doc.ocr_status)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="font-semibold text-gray-900 truncate">
                                  {doc.title}
                                </h3>
                                {getStatusBadge(doc.ocr_status)}
                              </div>
                              <p className="text-sm text-gray-500 truncate">
                                {doc.file_name}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                Uploaded {new Date(doc.created_at).toLocaleString()}
                              </p>
                              {doc.ocr_status === 'failed' && (
                                <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                                  <p className="text-sm text-red-600 font-medium mb-1">
                                    OCR Processing Failed
                                  </p>
                                  {doc.ocr_error && (
                                    <p className="text-xs text-red-500">
                                      Error: {doc.ocr_error}
                                    </p>
                                  )}
                                  {doc.ocr_retry_count > 0 && (
                                    <p className="text-xs text-red-500 mt-1">
                                      Retry attempts: {doc.ocr_retry_count}
                                    </p>
                                  )}
                                </div>
                              )}
                              {doc.ocr_status === 'queued' && (
                                <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded">
                                  <p className="text-xs text-amber-700">
                                    Waiting in queue for processing...
                                  </p>
                                </div>
                              )}
                              {doc.ocr_status === 'processing' && (
                                <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
                                  <p className="text-xs text-blue-700">
                                    Currently processing document...
                                  </p>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {doc.ocr_status === 'completed' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleViewOCR(doc)}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  View OCR Text
                                </Button>
                              )}
                              {doc.ocr_status === 'failed' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleRetryOCR(doc.id)}
                                  className="text-primary"
                                >
                                  <RotateCcw className="h-4 w-4 mr-2" />
                                  Retry OCR
                                </Button>
                              )}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
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
                                    View Document
                                  </DropdownMenuItem>
                                  {doc.ocr_status === 'completed' && (
                                    <DropdownMenuItem onClick={() => handleViewOCR(doc)}>
                                      <FileText className="h-4 w-4 mr-2" />
                                      View OCR Text
                                    </DropdownMenuItem>
                                  )}
                                  {(doc.ocr_status === 'failed' || doc.ocr_status === 'queued') && (
                                    <DropdownMenuItem onClick={() => handleRetryOCR(doc.id)}>
                                      <RotateCcw className="h-4 w-4 mr-2" />
                                      {doc.ocr_status === 'failed' ? 'Retry OCR' : 'Re-queue OCR'}
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
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
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <Dialog open={isOCRViewOpen} onOpenChange={setIsOCRViewOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>OCR Extracted Text</DialogTitle>
            </DialogHeader>
            {viewingDocument && (
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="font-medium text-gray-900">{viewingDocument.title}</p>
                  <p className="text-sm text-gray-500">{viewingDocument.file_name}</p>
                </div>
                <div className="relative">
                  <div className="max-h-96 overflow-y-auto p-4 bg-white border border-gray-200 rounded-lg">
                    <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
                      {viewingDocument.ocr_text ||
                        'No OCR text available for this document.'}
                    </pre>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => {
                      if (viewingDocument.ocr_text) {
                        navigator.clipboard.writeText(viewingDocument.ocr_text);
                        toast({
                          title: 'Success',
                          description: 'Text copied to clipboard',
                        });
                        
                        if (userId) {
                          logger.info(LogCategory.USER_ACTION, 'User copied OCR text to clipboard', {
                            userId,
                            documentId: viewingDocument.id,
                          });
                        }
                      }
                    }}
                  >
                    Copy Text
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
      <Toaster />
    </div>
  );
}