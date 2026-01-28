import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, FileText, Plus, ArrowLeft, Settings2 } from 'lucide-react';
import { Header } from '@/components/dashboard/Header';
import { RecordTable } from '@/components/records/RecordTable';
import { RecordFilters } from '@/components/records/RecordFilters';
import { CreateRecordDialog } from '@/components/records/CreateRecordDialog';
import { EditRecordDialog } from '@/components/records/EditRecordDialog';
import { DeleteRecordDialog } from '@/components/records/DeleteRecordDialog';
import { CategoryManager } from '@/components/records/CategoryManager';
import { useRecordsData } from '@/hooks/useRecordsData';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { FinanceRecord } from '@/lib/api';

const Records = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();

  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [tipoFilter, setTipoFilter] = useState<'entrada' | 'saida' | undefined>();
  const [categoriaFilter, setCategoriaFilter] = useState<string | undefined>();
  const [editingRecord, setEditingRecord] = useState<FinanceRecord | null>(null);
  const [deletingRecord, setDeletingRecord] = useState<FinanceRecord | null>(null);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const {
    records,
    pagination,
    categories,
    allCategories,
    isLoading,
    isFetching,
    error,
    mutations,
  } = useRecordsData({
    startDate,
    endDate,
    tipo: tipoFilter,
    categoria: categoriaFilter,
    page: currentPage,
    limit: pageSize,
  });

  // Auth redirect
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const handleSignOut = () => {
    signOut();
    navigate('/auth');
  };

  const handleCreateRecord = (data: Parameters<typeof mutations.createRecord>[0]) => {
    mutations.createRecord(data);
    setCurrentPage(1); // Reset para primeira página após criar
  };

  const handleEditRecord = (record: FinanceRecord) => {
    setEditingRecord(record);
  };

  const handleUpdateRecord = (data: Parameters<typeof mutations.updateRecord>[0]) => {
    mutations.updateRecord(data);
    setEditingRecord(null);
  };

  const handleDeleteRecord = (record: FinanceRecord) => {
    setDeletingRecord(record);
  };

  const handleConfirmDelete = (id: string, scope?: 'single' | 'future') => {
    mutations.deleteRecord({ id, scope });
    // Se deletar último registro da página E não for página 1, voltar para página anterior
    if (records.length === 1 && currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Handlers para filtros que resetam a página
  const handleStartDateChange = (date: Date | undefined) => {
    setStartDate(date);
    setCurrentPage(1);
  };

  const handleEndDateChange = (date: Date | undefined) => {
    setEndDate(date);
    setCurrentPage(1);
  };

  const handleTipoChange = (tipo: 'entrada' | 'saida' | undefined) => {
    setTipoFilter(tipo);
    setCurrentPage(1);

    // Reset categoria se não existe no novo tipo
    if (tipo && categoriaFilter) {
      const validCategories = tipo === 'entrada'
        ? allCategories.entrada
        : allCategories.saida;
      if (!validCategories.includes(categoriaFilter)) {
        setCategoriaFilter(undefined);
      }
    }
  };

  const handleCategoriaChange = (categoria: string | undefined) => {
    setCategoriaFilter(categoria);
    setCurrentPage(1);
  };

  const handlePageSizeChange = (newSize: number) => {
    // Calcular posição aproximada para manter contexto
    const firstItemIndex = (currentPage - 1) * pageSize;
    const newPage = Math.floor(firstItemIndex / newSize) + 1;
    setPageSize(newSize);
    setCurrentPage(newPage);
  };

  const isPro = user?.subscription === 'pro';

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return null;
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-background bg-grid-pattern">
        <Header onSignOut={handleSignOut} />
        <main className="container px-4 sm:px-6 lg:px-8 pt-24 pb-12 flex items-center justify-center">
          <Card className="p-6 max-w-md">
            <AlertTriangle className="w-10 h-10 text-destructive mx-auto mb-4" />
            <p className="text-center text-muted-foreground mb-4">
              Erro ao carregar registros. Tente novamente.
            </p>
            <Button onClick={() => window.location.reload()} className="w-full">
              Tentar novamente
            </Button>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background bg-grid-pattern">
      <Header onSignOut={handleSignOut} />

      <main className="container px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="gap-2 mb-4 mt-1"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao Dashboard
        </Button>

        {/* Title Section */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
                <FileText className="w-6 h-6 text-primary" />
                Registros Financeiros
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Gerencie seus registros de entrada e saída
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setShowCategoryManager(true)}
                className="gap-2"
              >
                <Settings2 className="w-4 h-4" />
                <span className="hidden sm:inline">Categorias</span>
              </Button>
              <CreateRecordDialog
                onSubmit={handleCreateRecord}
                isLoading={mutations.isCreating}
                categories={allCategories}
              />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-4 sm:mb-6 opacity-0 animate-fade-up" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
          <RecordFilters
            startDate={startDate}
            endDate={endDate}
            tipoFilter={tipoFilter}
            categoriaFilter={categoriaFilter}
            onStartDateChange={handleStartDateChange}
            onEndDateChange={handleEndDateChange}
            onTipoChange={handleTipoChange}
            onCategoriaChange={handleCategoriaChange}
            categories={allCategories}
          />
        </div>

        {/* Records Table */}
        <div className="opacity-0 animate-fade-up" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
          <RecordTable
            records={records}
            pagination={pagination}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            onPageSizeChange={handlePageSizeChange}
            onEdit={handleEditRecord}
            onDelete={handleDeleteRecord}
            isLoading={isLoading}
            isFetching={isFetching}
          />
        </div>
      </main>

      {/* FAB for mobile */}
      <div className="fixed bottom-6 right-6 md:hidden">
        <CreateRecordDialog
          onSubmit={handleCreateRecord}
          isLoading={mutations.isCreating}
          categories={allCategories}
          trigger={
            <Button size="lg" className="rounded-full w-14 h-14 shadow-lg">
              <Plus className="w-6 h-6" />
            </Button>
          }
        />
      </div>

      {/* Edit Record Dialog */}
      <EditRecordDialog
        record={editingRecord}
        open={!!editingRecord}
        onOpenChange={(open) => !open && setEditingRecord(null)}
        onSubmit={handleUpdateRecord}
        isLoading={mutations.isUpdating}
        categories={allCategories}
      />

      {/* Delete Record Dialog */}
      <DeleteRecordDialog
        record={deletingRecord}
        open={!!deletingRecord}
        onOpenChange={(open) => !open && setDeletingRecord(null)}
        onConfirm={handleConfirmDelete}
      />

      {/* Category Manager Dialog */}
      <CategoryManager
        open={showCategoryManager}
        onOpenChange={setShowCategoryManager}
        categories={categories}
        isPro={isPro}
        mutations={mutations}
      />
    </div>
  );
};

export default Records;
