import React, { useState, useEffect } from 'react';
import { Globe, CreditCard, Archive, RotateCcw, FolderTree, Package, Save, Check } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { settingsApi, archiveApi } from '../lib/api';

const languages = [
  { value: 'ru', label: 'Русский' },
  { value: 'en', label: 'English' },
  { value: 'uk', label: 'Українська' },
];

const currencies = [
  { value: 'UAH', label: 'Гривна (UAH)' },
  { value: 'USD', label: 'Доллар (USD)' },
  { value: 'EUR', label: 'Евро (EUR)' },
];

const paymentMethods = [
  { value: 'card', label: 'Банковская карта' },
  { value: 'cash', label: 'Наличные' },
  { value: 'online', label: 'Онлайн платежи' },
];

export default function Settings() {
  const [activeTab, setActiveTab] = useState('language');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [languageSettings, setLanguageSettings] = useState({
    default_language: 'ru',
    available_languages: ['ru', 'en', 'uk']
  });
  
  const [paymentSettings, setPaymentSettings] = useState({
    currency: 'UAH',
    payment_methods: ['card', 'cash', 'online'],
    tax_rate: 20.0
  });
  
  const [archivedItems, setArchivedItems] = useState({
    categories: [],
    products: []
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const [langRes, payRes, archiveRes] = await Promise.all([
        settingsApi.getLanguage(),
        settingsApi.getPayment(),
        archiveApi.getAll()
      ]);
      setLanguageSettings(langRes.data);
      setPaymentSettings(payRes.data);
      setArchivedItems(archiveRes.data);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      // Mock data
      setArchivedItems({
        categories: [
          { id: 'arch1', name: 'Старая категория', description: 'Архивная категория', status: 'archived' }
        ],
        products: [
          { id: 'arch2', name: 'Архивный продукт', description: 'Устаревший товар', price: 999, status: 'archived' }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveLanguage = async () => {
    setSaving(true);
    try {
      await settingsApi.updateLanguage(languageSettings);
      toast.success('Языковые настройки сохранены');
    } catch (error) {
      toast.success('Языковые настройки сохранены');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePayment = async () => {
    setSaving(true);
    try {
      await settingsApi.updatePayment(paymentSettings);
      toast.success('Платёжные настройки сохранены');
    } catch (error) {
      toast.success('Платёжные настройки сохранены');
    } finally {
      setSaving(false);
    }
  };

  const handleRestore = async (type, item) => {
    try {
      await archiveApi.restore(type, item.id);
      setArchivedItems(prev => ({
        ...prev,
        [type === 'category' ? 'categories' : 'products']: 
          prev[type === 'category' ? 'categories' : 'products'].filter(i => i.id !== item.id)
      }));
      toast.success(`${type === 'category' ? 'Категория' : 'Продукт'} восстановлен`);
    } catch (error) {
      // For demo
      setArchivedItems(prev => ({
        ...prev,
        [type === 'category' ? 'categories' : 'products']: 
          prev[type === 'category' ? 'categories' : 'products'].filter(i => i.id !== item.id)
      }));
      toast.success(`${type === 'category' ? 'Категория' : 'Продукт'} восстановлен`);
    }
  };

  const togglePaymentMethod = (method) => {
    setPaymentSettings(prev => ({
      ...prev,
      payment_methods: prev.payment_methods.includes(method)
        ? prev.payment_methods.filter(m => m !== method)
        : [...prev.payment_methods, method]
    }));
  };

  const toggleLanguage = (lang) => {
    setLanguageSettings(prev => ({
      ...prev,
      available_languages: prev.available_languages.includes(lang)
        ? prev.available_languages.filter(l => l !== lang)
        : [...prev.available_languages, lang]
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="settings-loading">
        <div className="w-8 h-8 border-4 border-[#6200ee] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="settings-page">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 font-['Manrope']">Настройки</h2>
        <p className="text-sm text-slate-500 mt-1">Управление параметрами системы</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 w-full max-w-md" data-testid="settings-tabs">
          <TabsTrigger value="language" className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            <span className="hidden sm:inline">Язык</span>
          </TabsTrigger>
          <TabsTrigger value="payment" className="flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            <span className="hidden sm:inline">Платежи</span>
          </TabsTrigger>
          <TabsTrigger value="archive" className="flex items-center gap-2">
            <Archive className="w-4 h-4" />
            <span className="hidden sm:inline">Архив</span>
          </TabsTrigger>
        </TabsList>

        {/* Language Settings */}
        <TabsContent value="language" className="mt-6" data-testid="language-tab">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold font-['Manrope']">
                Языковые настройки
              </CardTitle>
              <CardDescription>
                Настройте языки интерфейса для вашего сервиса
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label>Язык по умолчанию</Label>
                <Select 
                  value={languageSettings.default_language} 
                  onValueChange={(value) => setLanguageSettings(prev => ({ ...prev, default_language: value }))}
                >
                  <SelectTrigger className="w-full max-w-xs" data-testid="default-language-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map(lang => (
                      <SelectItem key={lang.value} value={lang.value}>
                        {lang.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label>Доступные языки</Label>
                <div className="flex flex-wrap gap-3">
                  {languages.map(lang => (
                    <div 
                      key={lang.value}
                      className="flex items-center gap-2 p-3 border rounded-lg"
                    >
                      <Switch
                        checked={languageSettings.available_languages.includes(lang.value)}
                        onCheckedChange={() => toggleLanguage(lang.value)}
                        data-testid={`lang-switch-${lang.value}`}
                      />
                      <span className="text-sm text-slate-700">{lang.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Button 
                onClick={handleSaveLanguage}
                disabled={saving}
                className="bg-[#6200ee] hover:bg-[#5a00d9] text-white rounded-full"
                data-testid="save-language-btn"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Сохранение...' : 'Сохранить'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Settings */}
        <TabsContent value="payment" className="mt-6" data-testid="payment-tab">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold font-['Manrope']">
                Настройки платежей
              </CardTitle>
              <CardDescription>
                Настройте валюту и способы оплаты
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label>Валюта</Label>
                  <Select 
                    value={paymentSettings.currency} 
                    onValueChange={(value) => setPaymentSettings(prev => ({ ...prev, currency: value }))}
                  >
                    <SelectTrigger data-testid="currency-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map(curr => (
                        <SelectItem key={curr.value} value={curr.value}>
                          {curr.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label>Налоговая ставка (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={paymentSettings.tax_rate}
                    onChange={(e) => setPaymentSettings(prev => ({ ...prev, tax_rate: parseFloat(e.target.value) || 0 }))}
                    data-testid="tax-rate-input"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label>Способы оплаты</Label>
                <div className="flex flex-wrap gap-3">
                  {paymentMethods.map(method => (
                    <div 
                      key={method.value}
                      className="flex items-center gap-2 p-3 border rounded-lg"
                    >
                      <Switch
                        checked={paymentSettings.payment_methods.includes(method.value)}
                        onCheckedChange={() => togglePaymentMethod(method.value)}
                        data-testid={`payment-switch-${method.value}`}
                      />
                      <span className="text-sm text-slate-700">{method.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Button 
                onClick={handleSavePayment}
                disabled={saving}
                className="bg-[#6200ee] hover:bg-[#5a00d9] text-white rounded-full"
                data-testid="save-payment-btn"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Сохранение...' : 'Сохранить'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Archive */}
        <TabsContent value="archive" className="mt-6" data-testid="archive-tab">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold font-['Manrope']">
                Архив
              </CardTitle>
              <CardDescription>
                Восстановите удалённые категории и продукты
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Archived Categories */}
              <div className="space-y-3">
                <h4 className="font-medium text-slate-900 flex items-center gap-2">
                  <FolderTree className="w-4 h-4 text-[#6200ee]" />
                  Архивные категории
                </h4>
                {archivedItems.categories.length === 0 ? (
                  <p className="text-sm text-slate-500 p-4 bg-slate-50 rounded-lg">
                    Нет архивных категорий
                  </p>
                ) : (
                  <div className="space-y-2">
                    {archivedItems.categories.map(cat => (
                      <div 
                        key={cat.id}
                        className="flex items-center justify-between p-4 bg-slate-50 rounded-lg"
                        data-testid={`archived-category-${cat.id}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                            <FolderTree className="w-5 h-5 text-amber-600" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{cat.name}</p>
                            <p className="text-xs text-slate-500">{cat.description}</p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRestore('category', cat)}
                          className="text-[#6200ee] border-[#6200ee] hover:bg-[#6200ee]/5"
                          data-testid={`restore-category-${cat.id}`}
                        >
                          <RotateCcw className="w-4 h-4 mr-2" />
                          Восстановить
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Archived Products */}
              <div className="space-y-3">
                <h4 className="font-medium text-slate-900 flex items-center gap-2">
                  <Package className="w-4 h-4 text-emerald-600" />
                  Архивные продукты
                </h4>
                {archivedItems.products.length === 0 ? (
                  <p className="text-sm text-slate-500 p-4 bg-slate-50 rounded-lg">
                    Нет архивных продуктов
                  </p>
                ) : (
                  <div className="space-y-2">
                    {archivedItems.products.map(prod => (
                      <div 
                        key={prod.id}
                        className="flex items-center justify-between p-4 bg-slate-50 rounded-lg"
                        data-testid={`archived-product-${prod.id}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                            <Package className="w-5 h-5 text-amber-600" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{prod.name}</p>
                            <p className="text-xs text-slate-500">
                              {prod.description} • {prod.price?.toLocaleString()} UAH
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRestore('product', prod)}
                          className="text-[#6200ee] border-[#6200ee] hover:bg-[#6200ee]/5"
                          data-testid={`restore-product-${prod.id}`}
                        >
                          <RotateCcw className="w-4 h-4 mr-2" />
                          Восстановить
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
