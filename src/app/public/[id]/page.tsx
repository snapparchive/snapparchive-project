'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Download, FileText, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';

interface Document {
  id: string;
  title: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  ocr_text: string | null;
  ocr_status: string;
  created_at: string;
}

export default function PublicDocumentPage() {
  const params = useParams();
  const [document, setDocument] = useState<Document | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { 
    loadDocument();
  }, [params.id]);

  const loadDocument = async () => { 
    
    try {
      setIsLoading(true);
      setError(null);
 
      const { data, error: fetchError } = await supabase
        .from('documents')
        .select('id, title, file_name, file_url, file_type, file_size, ocr_text, ocr_status, created_at, public_link, is_public')
        .eq('public_link', params.id)
        .eq('is_public', true)
        .is('deleted_at', null)
        .maybeSingle(); 

      if (fetchError) {
        console.error('Supabase error:', fetchError);
        setError(`Database error: ${fetchError.message}`);
        setIsLoading(false);
        return;
      }

      if (!data) { 
        setError('Document not found or is not publicly accessible');
        setIsLoading(false);
        return;
      }

  
      
      setDocument(data);
    } catch (err: any) { 
      console.error(err); 
      setError(`Unexpected error: ${err.message}`);
    } finally {
      setIsLoading(false); 
    }
  };

  const handleDownload = async () => {
    if (!document) return; 

    try {
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
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download document');
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-500">Loading document...</p>
          <p className="text-xs text-gray-400 mt-2">Public Link: {params.id}</p>
          <p className="text-xs text-gray-300 mt-1">Check browser console for logs</p>
        </div>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Document Not Found
              </h2>
              <p className="text-gray-600 mb-4">
                {error || 'This document may have been removed or is not publicly accessible.'}
              </p>
              <div className="bg-gray-100 rounded p-3 mb-4">
                <p className="text-xs text-gray-500 font-mono break-all">
                  Public Link ID: {params.id}
                </p>
              </div>
              <p className="text-sm text-gray-500 mb-4">
                Please check the link and try again, or contact the document owner.
              </p>
              <Button 
                onClick={() => window.location.reload()} 
                variant="outline"
                className="mr-2"
              >
                Retry
              </Button>
              <Button 
                onClick={() => console.log('Manual reload triggered')}
                variant="outline"
              >
                Check Console
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Public Document</h1>
                <p className="text-sm text-gray-500">Shared via secure link</p>
              </div>
            </div>
            <Button onClick={handleDownload} className="bg-primary hover:bg-primary-hover">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex-1">
                <CardTitle className="text-2xl mb-2">{document.title}</CardTitle>
                <p className="text-sm text-gray-600 break-all">{document.file_name}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">OCR Status</p>
                <div className="mt-1">{getStatusBadge(document.ocr_status)}</div>
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
          </CardContent>
        </Card>

        {document.ocr_status === 'completed' && document.ocr_text && (
          <Card>
            <CardHeader>
              <CardTitle>Extracted Text (OCR)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-gray-50 rounded-lg max-h-96 overflow-y-auto">
                <p className="text-gray-700 whitespace-pre-wrap text-sm">
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
                  ? 'Document queued for OCR processing...'
                  : 'OCR processing in progress...'}
              </p>
              <p className="text-sm text-gray-500">
                Check back soon for extracted text
              </p>
            </CardContent>
          </Card>
        )}
        {document.ocr_status === 'failed' && (
          <Card>
            <CardContent className="py-12 text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600 mb-2 text-lg font-medium">
                OCR processing failed
              </p>
              <p className="text-sm text-gray-500">
                Please contact the document owner for assistance
              </p>
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
  );
}