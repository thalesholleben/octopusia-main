import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financeAPI, type FinanceRecord, type CategoriesResponse, type CustomCategory } from '@/lib/api';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface RecordFilters {
  startDate?: Date;
  endDate?: Date;
  tipo?: 'entrada' | 'saida';
  categoria?: string;
  page?: number;
  limit?: number;
}

export const useRecordsData = (filters: RecordFilters = {}) => {
  const queryClient = useQueryClient();
  const { page = 1, limit = 50 } = filters;

  // Fetch records
  const {
    data: recordsData,
    isLoading: recordsLoading,
    error: recordsError,
    isFetching,
  } = useQuery({
    queryKey: ['records', filters],
    queryFn: () => financeAPI.getRecords({
      startDate: filters.startDate ? format(filters.startDate, 'yyyy-MM-dd') : undefined,
      endDate: filters.endDate ? format(filters.endDate, 'yyyy-MM-dd') : undefined,
      tipo: filters.tipo,
      categoria: filters.categoria,
      page,
      limit,
    }),
    staleTime: 1000 * 30,
    refetchOnWindowFocus: true,
    keepPreviousData: true,
  });

  // Fetch categories
  const {
    data: categoriesData,
    isLoading: categoriesLoading,
    error: categoriesError,
  } = useQuery({
    queryKey: ['categories'],
    queryFn: () => financeAPI.getCategories(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Create record mutation
  const createMutation = useMutation({
    mutationFn: financeAPI.createRecord,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['records'] });
      queryClient.invalidateQueries({ queryKey: ['financeRecords'] });
      toast.success('Registro criado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erro ao criar registro');
    },
  });

  // Update record mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof financeAPI.updateRecord>[1] }) =>
      financeAPI.updateRecord(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['records'] });
      queryClient.invalidateQueries({ queryKey: ['financeRecords'] });
      toast.success('Registro atualizado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erro ao atualizar registro');
    },
  });

  // Delete record mutation
  const deleteMutation = useMutation({
    mutationFn: financeAPI.deleteRecord,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['records'] });
      queryClient.invalidateQueries({ queryKey: ['financeRecords'] });
      toast.success('Registro excluído com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erro ao excluir registro');
    },
  });

  // Category mutations
  const createCategoryMutation = useMutation({
    mutationFn: financeAPI.createCustomCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Categoria criada com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erro ao criar categoria');
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name: string; tipo: 'entrada' | 'saida' } }) =>
      financeAPI.updateCustomCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Categoria atualizada com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erro ao atualizar categoria');
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: financeAPI.deleteCustomCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Categoria excluída com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erro ao excluir categoria');
    },
  });

  const records = recordsData?.data.records || [];
  const pagination = recordsData?.data.pagination;
  const categories = categoriesData?.data || null;

  // Merged categories for selects
  const allCategories = useMemo(() => {
    if (!categories) return { entrada: [] as string[], saida: [] as string[] };

    const customEntrada = categories.customCategories
      .filter(c => c.tipo === 'entrada')
      .map(c => c.name);
    const customSaida = categories.customCategories
      .filter(c => c.tipo === 'saida')
      .map(c => c.name);

    return {
      entrada: [...categories.defaultCategories.entrada, ...customEntrada],
      saida: [...categories.defaultCategories.saida, ...customSaida],
    };
  }, [categories]);

  return {
    records,
    pagination,
    categories,
    allCategories,
    isLoading: recordsLoading || categoriesLoading,
    isFetching,
    error: recordsError || categoriesError,
    mutations: {
      createRecord: createMutation.mutate,
      updateRecord: updateMutation.mutate,
      deleteRecord: deleteMutation.mutate,
      createCategory: createCategoryMutation.mutate,
      updateCategory: updateCategoryMutation.mutate,
      deleteCategory: deleteCategoryMutation.mutate,
      isCreating: createMutation.isPending,
      isUpdating: updateMutation.isPending,
      isDeleting: deleteMutation.isPending,
      isCreatingCategory: createCategoryMutation.isPending,
      isUpdatingCategory: updateCategoryMutation.isPending,
      isDeletingCategory: deleteCategoryMutation.isPending,
    },
  };
};
