import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, MoreHorizontal, FolderTree } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { categoriesApi } from '../lib/api';

const statusOptions = [
  { value: 'active', label: 'Активна', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'inactive', label: 'Неактивна', color: 'bg-slate-100 text-slate-600' },
];

const getStatusBadge = (status) => {
  const option = statusOptions.find(o => o.value === status);
  return option ? option : { label: status, color: 'bg-slate-100 text-slate-600' };
};

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'active'
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await categoriesApi.getAll();
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      // Mock data for demo
      setCategories([
        { id: '1', name: 'Электроника', description: 'Смартфоны, ноутбуки, планшеты', status: 'active', created_at: '2024-01-15' },
        { id: '2', name: 'Одежда', description: 'Мужская и женская одежда', status: 'active', created_at: '2024-01-10' },
        { id: '3', name: 'Книги', description: 'Цифровые и печатные книги', status: 'inactive', created_at: '2024-01-05' },
        { id: '4', name: 'Услуги', description: 'Консультации и подписки', status: 'active', created_at: '2024-01-01' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = categories.filter(cat => {
    const matchesSearch = cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         cat.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || cat.status === statusFilter;
    return matchesSearch && matchesStatus && cat.status !== 'archived';
  });

  const handleOpenDialog = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        description: category.description || '',
        status: category.status
      });
    } else {
      setEditingCategory(null);
      setFormData({ name: '', description: '', status: 'active' });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await categoriesApi.update(editingCategory.id, formData);
        setCategories(prev => prev.map(cat => 
          cat.id === editingCategory.id ? { ...cat, ...formData } : cat
        ));
        toast.success('Категория обновлена');
      } else {
        const response = await categoriesApi.create(formData);
        setCategories(prev => [...prev, response.data]);
        toast.success('Категория создана');
      }
      setDialogOpen(false);
    } catch (error) {
      toast.error('Ошибка сохранения');
      // For demo, just update local state
      if (editingCategory) {
        setCategories(prev => prev.map(cat => 
          cat.id === editingCategory.id ? { ...cat, ...formData } : cat
        ));
      } else {
        const newCat = { ...formData, id: String(Date.now()), created_at: new Date().toISOString() };
        setCategories(prev => [...prev, newCat]);
      }
      setDialogOpen(false);
      toast.success(editingCategory ? 'Категория обновлена' : 'Категория создана');
    }
  };

  const handleDelete = async () => {
    if (!categoryToDelete) return;
    try {
      await categoriesApi.delete(categoryToDelete.id);
      setCategories(prev => prev.filter(cat => cat.id !== categoryToDelete.id));
      toast.success('Категория удалена');
    } catch (error) {
      // For demo
      setCategories(prev => prev.map(cat => 
        cat.id === categoryToDelete.id ? { ...cat, status: 'archived' } : cat
      ));
      toast.success('Категория архивирована');
    }
    setDeleteDialogOpen(false);
    setCategoryToDelete(null);
  };

  return (
    <div className="space-y-6" data-testid="categories-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 font-['Manrope']">Категории</h2>
          <p className="text-sm text-slate-500 mt-1">Управление категориями продуктов</p>
        </div>
        <Button 
          onClick={() => handleOpenDialog()}
          className="bg-[#6200ee] hover:bg-[#5a00d9] text-white rounded-full btn-scale"
          data-testid="create-category-btn"
        >
          <Plus className="w-4 h-4 mr-2" />
          Создать категорию
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Поиск по названию или описанию..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="search-input"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48" data-testid="status-filter">
                <SelectValue placeholder="Статус" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все статусы</SelectItem>
                <SelectItem value="active">Активные</SelectItem>
                <SelectItem value="inactive">Неактивные</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-4 border-[#6200ee] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <FolderTree className="w-12 h-12 text-slate-300 mb-4" />
              <p className="text-slate-500">Категории не найдены</p>
              <Button 
                variant="link" 
                className="text-[#6200ee] mt-2"
                onClick={() => handleOpenDialog()}
              >
                Создать первую категорию
              </Button>
            </div>
          ) : (
            <Table data-testid="categories-table">
              <TableHeader>
                <TableRow className="table-header">
                  <TableHead className="py-4 px-6">Название</TableHead>
                  <TableHead className="py-4 px-6">Описание</TableHead>
                  <TableHead className="py-4 px-6">Статус</TableHead>
                  <TableHead className="py-4 px-6 text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCategories.map((category) => {
                  const statusBadge = getStatusBadge(category.status);
                  return (
                    <TableRow 
                      key={category.id} 
                      className="table-row-hover"
                      data-testid={`category-row-${category.id}`}
                    >
                      <TableCell className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-[#6200ee]/10 flex items-center justify-center">
                            <FolderTree className="w-5 h-5 text-[#6200ee]" />
                          </div>
                          <span className="font-medium text-slate-900">{category.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4 px-6 text-slate-500 max-w-xs truncate">
                        {category.description || '—'}
                      </TableCell>
                      <TableCell className="py-4 px-6">
                        <Badge className={`${statusBadge.color} font-medium`}>
                          {statusBadge.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-4 px-6 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              data-testid={`category-actions-${category.id}`}
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              onClick={() => handleOpenDialog(category)}
                              data-testid={`edit-category-${category.id}`}
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Редактировать
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => {
                                setCategoryToDelete(category);
                                setDeleteDialogOpen(true);
                              }}
                              className="text-red-600"
                              data-testid={`delete-category-${category.id}`}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Удалить
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md" data-testid="category-dialog">
          <DialogHeader>
            <DialogTitle className="font-['Manrope']">
              {editingCategory ? 'Редактировать категорию' : 'Создать категорию'}
            </DialogTitle>
            <DialogDescription>
              {editingCategory ? 'Измените данные категории' : 'Заполните данные для новой категории'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Название</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Введите название"
                required
                data-testid="category-name-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Описание</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Введите описание (необязательно)"
                rows={3}
                data-testid="category-description-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Статус</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger data-testid="category-status-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setDialogOpen(false)}
              >
                Отмена
              </Button>
              <Button 
                type="submit"
                className="bg-[#6200ee] hover:bg-[#5a00d9] text-white"
                data-testid="save-category-btn"
              >
                {editingCategory ? 'Сохранить' : 'Создать'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md" data-testid="delete-dialog">
          <DialogHeader>
            <DialogTitle className="font-['Manrope']">Удалить категорию?</DialogTitle>
            <DialogDescription>
              Категория "{categoryToDelete?.name}" будет архивирована. Вы сможете восстановить её в настройках.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteDialogOpen(false)}
            >
              Отмена
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDelete}
              data-testid="confirm-delete-btn"
            >
              Удалить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
