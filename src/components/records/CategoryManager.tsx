import { useState } from 'react';
import { Lock, Plus, Pencil, Trash2, Tag } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { CategoriesResponse, CustomCategory } from '@/lib/api';
import { cn } from '@/lib/utils';

interface CategoryManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: CategoriesResponse | null;
  isPro: boolean;
  mutations: {
    createCategory: (data: { name: string; tipo: 'entrada' | 'saida' }) => void;
    updateCategory: (data: { id: string; data: { name: string; tipo: 'entrada' | 'saida' } }) => void;
    deleteCategory: (id: string) => void;
    isCreatingCategory: boolean;
    isUpdatingCategory: boolean;
    isDeletingCategory: boolean;
  };
}

export function CategoryManager({
  open,
  onOpenChange,
  categories,
  isPro,
  mutations,
}: CategoryManagerProps) {
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryTipo, setNewCategoryTipo] = useState<'entrada' | 'saida'>('saida');
  const [editingCategory, setEditingCategory] = useState<CustomCategory | null>(null);
  const [editName, setEditName] = useState('');
  const [editTipo, setEditTipo] = useState<'entrada' | 'saida'>('saida');

  const customCategories = categories?.customCategories || [];
  const categoriesCount = customCategories.length;

  const handleCreate = () => {
    if (!newCategoryName.trim()) return;
    mutations.createCategory({ name: newCategoryName.trim(), tipo: newCategoryTipo });
    setNewCategoryName('');
  };

  const handleStartEdit = (category: CustomCategory) => {
    setEditingCategory(category);
    setEditName(category.name);
    setEditTipo(category.tipo);
  };

  const handleSaveEdit = () => {
    if (!editingCategory || !editName.trim()) return;
    mutations.updateCategory({
      id: editingCategory.id,
      data: { name: editName.trim(), tipo: editTipo },
    });
    setEditingCategory(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta categoria?')) {
      mutations.deleteCategory(id);
    }
  };

  if (!isPro) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-amber-500" />
              Recurso PRO
            </DialogTitle>
          </DialogHeader>
          <div className="py-6 text-center">
            <Tag className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground mb-4">
              Categorias personalizadas são exclusivas do plano PRO.
              Faça upgrade para criar até 10 categorias customizadas.
            </p>
            <Button onClick={() => onOpenChange(false)}>Entendi</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-primary" />
            Categorias Personalizadas
          </DialogTitle>
          <DialogDescription>
            Gerencie suas categorias customizadas ({categoriesCount}/10)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Add new category form */}
          {categoriesCount < 10 && (
            <div className="flex gap-2">
              <Input
                placeholder="Nome da categoria"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="flex-1"
              />
              <Select value={newCategoryTipo} onValueChange={(v) => setNewCategoryTipo(v as 'entrada' | 'saida')}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entrada">Entrada</SelectItem>
                  <SelectItem value="saida">Saída</SelectItem>
                </SelectContent>
              </Select>
              <Button
                size="icon"
                onClick={handleCreate}
                disabled={!newCategoryName.trim() || mutations.isCreatingCategory}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          )}

          {categoriesCount >= 10 && (
            <p className="text-sm text-amber-500 text-center">
              Limite de 10 categorias atingido
            </p>
          )}

          {/* Categories list */}
          <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
            {customCategories.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhuma categoria personalizada criada
              </p>
            ) : (
              customCategories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center gap-2 p-3 rounded-lg bg-muted/50"
                >
                  {editingCategory?.id === category.id ? (
                    <>
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="flex-1 h-8"
                      />
                      <Select value={editTipo} onValueChange={(v) => setEditTipo(v as 'entrada' | 'saida')}>
                        <SelectTrigger className="w-[100px] h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="entrada">Entrada</SelectItem>
                          <SelectItem value="saida">Saída</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button size="sm" onClick={handleSaveEdit} disabled={mutations.isUpdatingCategory}>
                        Salvar
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingCategory(null)}>
                        Cancelar
                      </Button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 text-sm font-medium">{category.name}</span>
                      <span className={cn(
                        'text-xs px-2 py-1 rounded-full',
                        category.tipo === 'entrada'
                          ? 'bg-green-500/10 text-green-500'
                          : 'bg-orange-500/10 text-orange-500'
                      )}>
                        {category.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleStartEdit(category)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(category.id)}
                        disabled={mutations.isDeletingCategory}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
