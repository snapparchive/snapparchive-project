'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Briefcase,
  Plus,
  MoreVertical,
  Edit,
  Archive,
  FileText,
  Lock,
  Search,
} from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
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
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { Toaster } from '@/components/ui/toaster';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import UniversalLoader from '@/components/ui/universal-loader';
import { logger, LogCategory } from '@/lib/logger';
import { useSubscriptionAccess } from '@/lib/hooks/useSubscriptionAccess';
import { SubscriptionWarningBanner } from '@/components/subscription/SubscriptionWarningBanner';

const DOSSIER_TYPES = ['Client', 'Project', 'Request'];
const DOSSIER_STATUSES = ['open', 'waiting', 'done', 'archived'] as const;
const ADMIN_STATES = ['ok', 'action_needed', 'unpaid'] as const;

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
  document_count?: number;
  linked_documents?: string[];
  linked_folders?: string[];
}

export default function DossiersPage() {

  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const subscriptionAccess = useSubscriptionAccess();
  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'active' | 'archived'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState('Client');
  const [newStatus, setNewStatus] = useState<DossierStatus>('open');
  const [newAdminState, setNewAdminState] = useState<AdminState>('ok');
  const [newPhase, setNewPhase] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (searchParams.get('create') === '1') {
      setIsCreateOpen(true);
      router.replace('/dashboard/dossiers', { scroll: false });
    }
  }, [searchParams, router]);


  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/login');
      return;
    }
    loadDossiers(session.user.id);
  };

  const loadDossiers = async (userId: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('dossiers')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const withCounts = await Promise.all(
        (data || []).map(async (d) => {
          // Get document count
          const { count } = await supabase
            .from('dossier_documents')
            .select('*', { count: 'exact', head: true })
            .eq('dossier_id', d.id);

          // Get linked document titles for search
          const { data: docLinks } = await supabase
            .from('dossier_documents')
            .select('documents(title, file_name)')
            .eq('dossier_id', d.id);

          const linkedDocuments = (docLinks || [])
            .map((link: any) => link.documents?.title || link.documents?.file_name)
            .filter(Boolean);

          // Get linked folder names for search
          const { data: folderLinks } = await supabase
            .from('dossier_folders')
            .select('folders(name)')
            .eq('dossier_id', d.id);

          const linkedFolders = (folderLinks || [])
            .map((link: any) => link.folders?.name)
            .filter(Boolean);

          return {
            ...d,
            document_count: count || 0,
            linked_documents: linkedDocuments,
            linked_folders: linkedFolders
          };
        })
      );
      setDossiers(withCounts);
    } catch (e: any) {
      logger.error(LogCategory.DATABASE, 'Failed to load dossiers', e, { userId });
      toast({ title: 'Error', description: 'Failed to load dossiers', variant: 'destructive' });
      setDossiers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredDossiers = dossiers.filter((d) => {
    // Status filter
    const matchesStatusFilter = statusFilter === 'archived'
      ? d.status === 'archived'
      : d.status !== 'archived';

    if (!matchesStatusFilter) return false;

    // Search filter
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();

    // Search in dossier fields
    const matchesTitle = d.title.toLowerCase().includes(query);
    const matchesType = d.type.toLowerCase().includes(query);
    const matchesStatus = d.status.toLowerCase().includes(query);
    const matchesAdminState = d.admin_state.toLowerCase().includes(query);
    const matchesPhase = d.phase?.toLowerCase().includes(query);

    // Search in linked documents
    const matchesDocuments = d.linked_documents?.some(doc =>
      doc.toLowerCase().includes(query)
    );

    // Search in linked folders
    const matchesFolders = d.linked_folders?.some(folder =>
      folder.toLowerCase().includes(query)
    );

    return (
      matchesTitle ||
      matchesType ||
      matchesStatus ||
      matchesAdminState ||
      matchesPhase ||
      matchesDocuments ||
      matchesFolders
    );
  });


  const totalPages = Math.ceil(filteredDossiers.length / ITEMS_PER_PAGE);

  const paginatedDossiers = filteredDossiers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  const handleCreateDossier = async () => {
    if (!subscriptionAccess.canEdit) {
      subscriptionAccess.showAccessDeniedToast('create dossiers');
      return;
    }
    const title = newTitle.trim();
    if (!title) {
      toast({ title: 'Error', description: 'Title is required', variant: 'destructive' });
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    try {
      const { data: dossier, error } = await supabase
        .from('dossiers')
        .insert({
          user_id: session.user.id,
          title,
          type: newType,
          status: newStatus,
          admin_state: newAdminState,
          phase: newPhase.trim() || null,
        })
        .select()
        .single();

      if (error) throw error;

      await supabase.from('dossier_events').insert({
        dossier_id: dossier.id,
        event_type: 'created',
        payload: { title, type: newType },
        created_by: session.user.id,
      });

      toast({ title: 'Success', description: 'Dossier created' });
      setNewTitle('');
      setNewType('Client');
      setNewStatus('open');
      setNewAdminState('ok');
      setNewPhase('');
      setIsCreateOpen(false);
      loadDossiers(session.user.id);
    } catch (e: any) {
      logger.error(LogCategory.DATABASE, 'Create dossier failed', e);
      toast({ title: 'Error', description: e.message || 'Failed to create dossier', variant: 'destructive' });
    }
  };

  const handleRowClick = (d: Dossier) => {
    router.push(`/dashboard/dossiers/${d.id}`);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar mobileOpen={sidebarOpen} onMobileClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader onMenuClick={() => setSidebarOpen(true)} />
        <div className="flex-1 overflow-auto">
          <div className="p-8 space-y-6">
            <SubscriptionWarningBanner />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Dossiers</h1>
                <p className="text-gray-600 mt-1">
                  Case-first view: organize documents by case or project
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Select value={statusFilter} onValueChange={(v: 'active' | 'archived') => setStatusFilter(v)}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
                <Dialog open={isCreateOpen} onOpenChange={(open) => {
                  if (!subscriptionAccess.canEdit && open) {
                    subscriptionAccess.showAccessDeniedToast('create dossiers');
                    setIsCreateOpen(false);
                    return;
                  }
                  setIsCreateOpen(open);
                }}>
                  <DialogTrigger asChild>
                    <Button
                      className={subscriptionAccess.canEdit ? 'bg-primary hover:bg-primary-hover text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}
                      disabled={!subscriptionAccess.canEdit}
                    >
                      {!subscriptionAccess.canEdit && <Lock className="h-5 w-5 mr-2" />}
                      {subscriptionAccess.canEdit && <Plus className="h-5 w-5 mr-2" />}
                      Create Dossier
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Dossier</DialogTitle>
                      <DialogDescription>
                        Add a case or project. You can link documents later.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <Label>Title *</Label>
                        <Input
                          value={newTitle}
                          onChange={(e) => setNewTitle(e.target.value)}
                          placeholder="e.g. Client A — Loan Application"
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label>Type</Label>
                        <Select value={newType} onValueChange={setNewType}>
                          <SelectTrigger className="mt-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {DOSSIER_TYPES.map((t) => (
                              <SelectItem key={t} value={t}>{t}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Status</Label>
                        <Select value={newStatus} onValueChange={(v) => setNewStatus(v as DossierStatus)}>
                          <SelectTrigger className="mt-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {DOSSIER_STATUSES.map((s) => (
                              <SelectItem key={s} value={s}>{s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Admin state</Label>
                        <Select value={newAdminState} onValueChange={(v) => setNewAdminState(v as AdminState)}>
                          <SelectTrigger className="mt-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ADMIN_STATES.map((a) => (
                              <SelectItem key={a} value={a}>{a.replace('_', ' ')}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Phase (optional)</Label>
                        <Input
                          value={newPhase}
                          onChange={(e) => setNewPhase(e.target.value)}
                          placeholder="e.g. Intake, Review"
                          className="mt-2"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                      <Button onClick={handleCreateDossier} className="bg-primary hover:bg-primary-hover text-white">Create</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Search Bar */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search dossiers, documents, folders, status, phase..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {isLoading ? (
              <div className="text-center py-12">
                <UniversalLoader fullScreen={false} message="" />
              </div>
            ) : filteredDossiers.length === 0 ? (
              <div className="text-center py-12">
                <Briefcase className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg mb-2">
                  {searchQuery
                    ? 'No dossiers found matching your search'
                    : statusFilter === 'archived' ? 'No archived dossiers' : 'No dossiers yet'
                  }
                </p>
                <p className="text-gray-400 mb-6">
                  {searchQuery
                    ? 'Try adjusting your search terms'
                    : statusFilter === 'archived' ? 'Switch to Active to see current dossiers.' : 'Create a dossier to group documents by case or project.'
                  }
                </p>
                {statusFilter === 'active' && !searchQuery && (
                  <Button
                    onClick={() => setIsCreateOpen(true)}
                    disabled={!subscriptionAccess.canEdit}
                    className={subscriptionAccess.canEdit ? 'bg-primary hover:bg-primary-hover text-white' : 'bg-gray-300 text-gray-500'}
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Create Dossier
                  </Button>
                )}
              </div>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-gray-50">
                          <th className="text-left p-4 font-semibold text-gray-700">Title</th>
                          <th className="text-left p-4 font-semibold text-gray-700">Type</th>
                          <th className="text-left p-4 font-semibold text-gray-700">Status</th>
                          <th className="text-left p-4 font-semibold text-gray-700">Admin</th>
                          <th className="text-left p-4 font-semibold text-gray-700">Phase</th>
                          <th className="text-left p-4 font-semibold text-gray-700">Docs</th>
                          <th className="w-10 p-2" />
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedDossiers.map((d) => (
                          <tr
                            key={d.id}
                            onClick={() => handleRowClick(d)}
                            className="border-b hover:bg-gray-50 cursor-pointer"
                          >
                            <td className="p-4 font-medium text-gray-900">{d.title}</td>
                            <td className="p-4 text-gray-600">{d.type}</td>
                            <td className="p-4">
                              <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${d.status === 'archived' ? 'bg-gray-200 text-gray-700' :
                                d.status === 'done' ? 'bg-green-100 text-green-800' :
                                  d.status === 'waiting' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                                }`}>
                                {d.status}
                              </span>
                            </td>
                            <td className="p-4">
                              <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${d.admin_state === 'action_needed' ? 'bg-orange-100 text-orange-800' :
                                d.admin_state === 'unpaid' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-700'
                                }`}>
                                {d.admin_state.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="p-4 text-gray-600">{d.phase || '—'}</td>
                            <td className="p-4 text-gray-600">{d.document_count ?? 0}</td>
                            <td className="p-2" onClick={(e) => e.stopPropagation()}>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm"><MoreVertical className="h-4 w-4" /></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleRowClick(d)}>
                                    <FileText className="h-4 w-4 mr-2" />
                                    Open
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
            {filteredDossiers.length > ITEMS_PER_PAGE && (
              <div className="flex justify-between items-center mt-4">
                <Button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  variant="outline"
                >
                  Previous
                </Button>
                <span className="text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  variant="outline"
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
      <Toaster />
    </div>
  );
}