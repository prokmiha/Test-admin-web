import React, { useState, useEffect } from 'react';
import { 
  FolderTree, 
  Package, 
  DollarSign, 
  TrendingUp,
  FileText,
  ShoppingBag,
  Download,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { analyticsApi } from '../lib/api';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

const COLORS = ['#6200ee', '#03dac6', '#ff5722', '#ffc107'];

const scenarioLabels = {
  registration: 'Регистрация',
  physical_product: 'Физический',
  digital_product: 'Цифровой'
};

export default function Analytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await analyticsApi.get();
      setAnalytics(response.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      // Set mock data for demo
      setAnalytics({
        total_categories: 8,
        active_categories: 6,
        total_products: 24,
        active_products: 20,
        products_by_scenario: {
          registration: 5,
          physical_product: 10,
          digital_product: 5
        },
        price_stats: {
          min: 99,
          max: 9999,
          avg: 2450,
          total: 49000
        },
        recent_activity: [
          { type: 'category', action: 'created', name: 'Электроника', time: '2 часа назад' },
          { type: 'product', action: 'updated', name: 'Смартфон', time: '4 часа назад' },
          { type: 'product', action: 'created', name: 'Ноутбук', time: '1 день назад' }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="analytics-loading">
        <div className="w-8 h-8 border-4 border-[#6200ee] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const pieData = analytics ? Object.entries(analytics.products_by_scenario).map(([key, value]) => ({
    name: scenarioLabels[key] || key,
    value
  })) : [];

  const barData = analytics ? [
    { name: 'Категории', active: analytics.active_categories, total: analytics.total_categories },
    { name: 'Продукты', active: analytics.active_products, total: analytics.total_products }
  ] : [];

  return (
    <div className="space-y-6" data-testid="analytics-page">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="card-hover" data-testid="stat-categories">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Категории</p>
                <p className="text-3xl font-bold text-slate-900 mt-1 font-['Manrope']">
                  {analytics?.active_categories || 0}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  из {analytics?.total_categories || 0} всего
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-[#6200ee]/10 flex items-center justify-center">
                <FolderTree className="w-6 h-6 text-[#6200ee]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover" data-testid="stat-products">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Продукты</p>
                <p className="text-3xl font-bold text-slate-900 mt-1 font-['Manrope']">
                  {analytics?.active_products || 0}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  из {analytics?.total_products || 0} всего
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                <Package className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover" data-testid="stat-revenue">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Общая стоимость</p>
                <p className="text-3xl font-bold text-slate-900 mt-1 font-['Manrope']">
                  {analytics?.price_stats?.total?.toLocaleString() || 0}
                </p>
                <p className="text-xs text-slate-400 mt-1">UAH</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover" data-testid="stat-average">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Средняя цена</p>
                <p className="text-3xl font-bold text-slate-900 mt-1 font-['Manrope']">
                  {Math.round(analytics?.price_stats?.avg || 0).toLocaleString()}
                </p>
                <p className="text-xs text-slate-400 mt-1">UAH</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scenario Distribution */}
        <Card data-testid="chart-scenarios">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900 font-['Manrope']">
              Распределение по сценариям
            </CardTitle>
            <CardDescription>Типы продуктов в системе</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-4">
              {pieData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-sm text-slate-600">{entry.name}: {entry.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Active vs Total */}
        <Card data-testid="chart-totals">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900 font-['Manrope']">
              Активные vs Всего
            </CardTitle>
            <CardDescription>Сравнение активных элементов</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="active" fill="#6200ee" radius={[4, 4, 0, 0]} name="Активные" />
                  <Bar dataKey="total" fill="#e2e8f0" radius={[4, 4, 0, 0]} name="Всего" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Price Range & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Price Range */}
        <Card data-testid="price-range">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900 font-['Manrope']">
              Ценовой диапазон
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
              <span className="text-sm text-slate-500">Минимум</span>
              <span className="font-semibold text-slate-900">
                {analytics?.price_stats?.min?.toLocaleString() || 0} UAH
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
              <span className="text-sm text-slate-500">Максимум</span>
              <span className="font-semibold text-slate-900">
                {analytics?.price_stats?.max?.toLocaleString() || 0} UAH
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-[#6200ee]/5 rounded-lg border border-[#6200ee]/20">
              <span className="text-sm text-[#6200ee]">Среднее</span>
              <span className="font-semibold text-[#6200ee]">
                {Math.round(analytics?.price_stats?.avg || 0).toLocaleString()} UAH
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-2" data-testid="recent-activity">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900 font-['Manrope']">
              Последняя активность
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics?.recent_activity?.map((activity, index) => (
                <div 
                  key={index} 
                  className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    activity.type === 'category' ? 'bg-[#6200ee]/10' : 'bg-emerald-100'
                  }`}>
                    {activity.type === 'category' ? (
                      <FolderTree className={`w-5 h-5 ${
                        activity.type === 'category' ? 'text-[#6200ee]' : 'text-emerald-600'
                      }`} />
                    ) : (
                      <Package className="w-5 h-5 text-emerald-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">
                      {activity.action === 'created' ? 'Создано' : 'Обновлено'}: {activity.name}
                    </p>
                    <p className="text-xs text-slate-500">{activity.time}</p>
                  </div>
                  <Activity className="w-4 h-4 text-slate-400" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
