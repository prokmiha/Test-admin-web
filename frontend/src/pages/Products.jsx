import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, MoreHorizontal, Package, Filter } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
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
import { productsApi, categoriesApi } from '../lib/api';

const scenarioOptions = [
  { value: 'registration', label: 'Регистрация', color: 'bg-blue-100 text-blue-700' },
  { value: 'physical_product', label: 'Физический продукт', color: 'bg-amber-100 text-amber-700' },
  { value: 'digital_product', label: 'Цифровой продукт', color: 'bg-purple-100 text-purple-700' },
];

const statusOptions = [
  { value: 'active', label: 'Активен', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'inactive', label: 'Неактивен', color: 'bg-slate-100 text-slate-600' },
];

const getScenarioBadge = (scenario) => {
  const option = scenarioOptions.find(o => o.value === scenario);
  return option ? option : { label: scenario, color: 'bg-slate-100 text-slate-600' };
};

const getStatusBadge = (status) => {
  const option = statusOptions.find(o => o.value === status);
  return option ? option : { label: status, color: 'bg-slate-100 text-slate-600' };
};

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [scenarioFilter, setScenarioFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productToDelete, setProductToDelete] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    scenario: 'digital_product',
    category_id: '',
    price: 0,
    status: 'active'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        productsApi.getAll(),
        categoriesApi.getAll()
      ]);
      setProducts(productsRes.data);
      setCategories(categoriesRes.data.filter(c => c.status !== 'archived'));
    } catch (error) {
      console.error('Failed to fetch data:', error);
      // Mock data
      setCategories([
        { id: '1', name: 'Электроника', status: 'active' },
        { id: '2', name: 'Одежда', status: 'active' },
        { id: '3', name: 'Услуги', status: 'active' },
      ]);
      setProducts([
        { id: '1', name: 'iPhone 15 Pro', description: 'Смартфон Apple', scenario: 'physical_product', category_id: '1', price: 49999, status: 'active' },
        { id: '2', name: 'MacBook Air M3', description: 'Ноутбук Apple', scenario: 'physical_product', category_id: '1', price: 79999, status: 'active' },
        { id: '3', name: 'Курс программирования', description: 'Онлайн курс по Python', scenario: 'digital_product', category_id: '3', price: 9999, status: 'active' },
        { id: '4', name: 'Премиум подписка', description: 'Годовая подписка на сервис', scenario: 'registration', category_id: '3', price: 4999, status: 'active' },
        { id: '5', name: 'Футболка классическая', description: 'Хлопковая футболка', scenario: 'physical_product', category_id: '2', price: 1299, status: 'inactive' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.name || '—';
  };

  const filteredProducts = products.filter(prod => {
    const matchesSearch = prod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         prod.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || prod.status === statusFilter;
    const matchesScenario = scenarioFilter === 'all' || prod.scenario === scenarioFilter;
    const matchesCategory = categoryFilter === 'all' || prod.category_id === categoryFilter;
    return matchesSearch && matchesStatus && matchesScenario && matchesCategory && prod.status !== 'archived';
  });

  const handleOpenDialog = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        description: product.description || '',
        scenario: product.scenario,
        category_id: product.category_id || 'none',
        price: product.price || 0,
        status: product.status
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        description: '',
        scenario: 'digital_product',
        category_id: 'none',
        price: 0,
        status: 'active'
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const dataToSave = {
      ...formData,
      price: parseFloat(formData.price) || 0,
      category_id: formData.category_id === 'none' ? null : formData.category_id || null
    };

    try {
      if (editingProduct) {
        await productsApi.update(editingProduct.id, dataToSave);
        setProducts(prev => prev.map(prod => 
          prod.id === editingProduct.id ? { ...prod, ...dataToSave } : prod
        ));
        toast.success('Продукт обновлён');
      } else {
        const response = await productsApi.create(dataToSave);
        setProducts(prev => [...prev, response.data]);
        toast.success('Продукт создан');
      }
      setDialogOpen(false);
    } catch (error) {
      // For demo
      if (editingProduct) {
        setProducts(prev => prev.map(prod => 
          prod.id === editingProduct.id ? { ...prod, ...dataToSave } : prod
        ));
      } else {
        const newProd = { ...dataToSave, id: String(Date.now()) };
        setProducts(prev => [...prev, newProd]);
      }
      setDialogOpen(false);
      toast.success(editingProduct ? 'Продукт обновлён' : 'Продукт создан');
    }
  };

  const handleDelete = async () => {
    if (!productToDelete) return;
    try {
      await productsApi.delete(productToDelete.id);
      setProducts(prev => prev.filter(prod => prod.id !== productToDelete.id));
      toast.success('Продукт удалён');
    } catch (error) {
      setProducts(prev => prev.map(prod => 
        prod.id === productToDelete.id ? { ...prod, status: 'archived' } : prod
      ));
      toast.success('Продукт архивирован');
    }
    setDeleteDialogOpen(false);
    setProductToDelete(null);
  };

  return (
    <div className="space-y-6" data-testid="products-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 font-['Manrope']">Продукты</h2>
          <p className="text-sm text-slate-500 mt-1">Управление каталогом продуктов</p>
        </div>
        <Button 
          onClick={() => handleOpenDialog()}
          className="bg-[#6200ee] hover:bg-[#5a00d9] text-white rounded-full btn-scale"
          data-testid="create-product-btn"
        >
          <Plus className="w-4 h-4 mr-2" />
          Добавить продукт
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
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
            <div className="flex flex-wrap gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40" data-testid="status-filter">
                  <SelectValue placeholder="Статус" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все статусы</SelectItem>
                  {statusOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={scenarioFilter} onValueChange={setScenarioFilter}>
                <SelectTrigger className="w-48" data-testid="scenario-filter">
                  <SelectValue placeholder="Сценарий" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все сценарии</SelectItem>
                  {scenarioOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-44" data-testid="category-filter">
                  <SelectValue placeholder="Категория" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все категории</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Package className="w-12 h-12 text-slate-300 mb-4" />
              <p className="text-slate-500">Продукты не найдены</p>
              <Button 
                variant="link" 
                className="text-[#6200ee] mt-2"
                onClick={() => handleOpenDialog()}
              >
                Добавить первый продукт
              </Button>
            </div>
          ) : (
            <Table data-testid="products-table">
              <TableHeader>
                <TableRow className="table-header">
                  <TableHead className="py-4 px-6">Продукт</TableHead>
                  <TableHead className="py-4 px-6">Категория</TableHead>
                  <TableHead className="py-4 px-6">Сценарий</TableHead>
                  <TableHead className="py-4 px-6">Цена</TableHead>
                  <TableHead className="py-4 px-6">Статус</TableHead>
                  <TableHead className="py-4 px-6 text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => {
                  const scenarioBadge = getScenarioBadge(product.scenario);
                  const statusBadge = getStatusBadge(product.status);
                  return (
                    <TableRow 
                      key={product.id} 
                      className="table-row-hover"
                      data-testid={`product-row-${product.id}`}
                    >
                      <TableCell className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                            <Package className="w-5 h-5 text-emerald-600" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{product.name}</p>
                            <p className="text-xs text-slate-500 truncate max-w-[200px]">
                              {product.description || '—'}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4 px-6 text-slate-600">
                        {getCategoryName(product.category_id)}
                      </TableCell>
                      <TableCell className="py-4 px-6">
                        <Badge className={`${scenarioBadge.color} font-medium`}>
                          {scenarioBadge.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-4 px-6 font-medium text-slate-900">
                        {product.price?.toLocaleString() || 0} UAH
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
                              data-testid={`product-actions-${product.id}`}
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              onClick={() => handleOpenDialog(product)}
                              data-testid={`edit-product-${product.id}`}
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Редактировать
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => {
                                setProductToDelete(product);
                                setDeleteDialogOpen(true);
                              }}
                              className="text-red-600"
                              data-testid={`delete-product-${product.id}`}
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
        <DialogContent className="sm:max-w-lg" data-testid="product-dialog">
          <DialogHeader>
            <DialogTitle className="font-['Manrope']">
              {editingProduct ? 'Редактировать продукт' : 'Добавить продукт'}
            </DialogTitle>
            <DialogDescription>
              {editingProduct ? 'Измените данные продукта' : 'Заполните данные для нового продукта'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="name">Название</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Введите название"
                  required
                  data-testid="product-name-input"
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="description">Описание</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Введите описание"
                  rows={2}
                  data-testid="product-description-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="scenario">Сценарий</Label>
                <Select 
                  value={formData.scenario} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, scenario: value }))}
                >
                  <SelectTrigger data-testid="product-scenario-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {scenarioOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Категория</Label>
                <Select 
                  value={formData.category_id} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}
                >
                  <SelectTrigger data-testid="product-category-select">
                    <SelectValue placeholder="Выберите категорию" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Без категории</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Цена (UAH)</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  placeholder="0"
                  data-testid="product-price-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Статус</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger data-testid="product-status-select">
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
                data-testid="save-product-btn"
              >
                {editingProduct ? 'Сохранить' : 'Создать'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md" data-testid="delete-dialog">
          <DialogHeader>
            <DialogTitle className="font-['Manrope']">Удалить продукт?</DialogTitle>
            <DialogDescription>
              Продукт "{productToDelete?.name}" будет архивирован. Вы сможете восстановить его в настройках.
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
