export const inventoryReport = {
  totalProducts: 15,
  totalValue: 285450,
  totalCost: 165200,
  totalMargin: 120250,
  marginPercentage: 42.1,
  categories: 8,
  vendors: 10,
  turnoverRatio: 8.5,
  averageStockValue: 19030,
};

export const salesReport = {
  totalSales: 28000,
  totalOrders: 350,
  averageOrderValue: 80,
  topProduct: 'Maggi Instant Noodles',
  topCustomer: 'Mehta Stores',
  salesGrowth: '12.5%',
  periodData: [
    { period: 'Week 1', sales: 6500, orders: 75 },
    { period: 'Week 2', sales: 7200, orders: 82 },
    { period: 'Week 3', sales: 8100, orders: 95 },
    { period: 'Week 4', sales: 6200, orders: 98 },
  ],
};

export const purchaseReport = {
  totalPurchases: 32000,
  totalOrders: 10,
  averageOrderValue: 3200,
  topVendor: 'Tata Consumer',
  topProduct: 'Maggi Instant Noodles',
  purchaseGrowth: '8.2%',
  periodData: [
    { period: 'Week 1', purchases: 7200 },
    { period: 'Week 2', purchases: 8100 },
    { period: 'Week 3', purchases: 8500 },
    { period: 'Week 4', purchases: 8200 },
  ],
};

export const lowStockReport = [
  { id: 1, product: 'Turmeric Powder', current: 15, minimum: 20, days: 3, status: 'critical' },
  { id: 2, product: 'Colgate Toothpaste', current: 2, minimum: 15, days: 1, status: 'critical' },
  { id: 3, product: 'Atta Whole Wheat Flour', current: 25, minimum: 15, days: 8, status: 'low' },
  { id: 4, product: 'Black Pepper Powder', current: 0, minimum: 10, days: 0, status: 'out' },
  { id: 5, product: 'Britannia Good Day Biscuits', current: 0, minimum: 40, days: 0, status: 'out' },
];

export const profitReport = {
  period: 'June 2024',
  totalRevenue: 28000,
  totalCost: 16800,
  totalProfit: 11200,
  profitMargin: 40,
  trend: '↑ 12%',
  categoryBreakdown: [
    { category: 'Dairy & Milk', profit: 2800, margin: 45 },
    { category: 'Packaged Foods', profit: 2200, margin: 38 },
    { category: 'Spices', profit: 1950, margin: 52 },
    { category: 'Beverages', profit: 1620, margin: 42 },
    { category: 'Personal Care', profit: 1480, margin: 38 },
    { category: 'Oils & Ghee', profit: 920, margin: 35 },
    { category: 'Frozen Foods', profit: 150, margin: 22 },
  ],
};

export const vendorPerformance = [
  {
    vendor: 'Tata Consumer',
    totalPurchases: 56000,
    averageDeliveryTime: '2 days',
    qualityRating: 4.9,
    priceCompetitiveness: 4.8,
  },
  {
    vendor: 'Amul Dairy',
    totalPurchases: 45000,
    averageDeliveryTime: '1 day',
    qualityRating: 4.8,
    priceCompetitiveness: 4.7,
  },
  {
    vendor: 'Rice Traders Ltd',
    totalPurchases: 32000,
    averageDeliveryTime: '3 days',
    qualityRating: 4.6,
    priceCompetitiveness: 4.5,
  },
  {
    vendor: 'Spice Masters',
    totalPurchases: 28500,
    averageDeliveryTime: '4 days',
    qualityRating: 4.7,
    priceCompetitiveness: 4.6,
  },
  {
    vendor: 'Nestle India',
    totalPurchases: 48000,
    averageDeliveryTime: '2 days',
    qualityRating: 4.8,
    priceCompetitiveness: 4.7,
  },
];

export const categoryPerformance = [
  { category: 'Dairy & Milk', sales: 5200, profit: 2340, margin: 45, trend: '↑' },
  { category: 'Grains & Flour', sales: 4800, profit: 1920, margin: 40, trend: '↑' },
  { category: 'Packaged Foods', sales: 5800, profit: 2204, margin: 38, trend: '↑' },
  { category: 'Spices', sales: 3750, profit: 1950, margin: 52, trend: '↑' },
  { category: 'Beverages', sales: 3850, profit: 1617, margin: 42, trend: '→' },
  { category: 'Personal Care', sales: 3900, profit: 1482, margin: 38, trend: '↑' },
  { category: 'Oils & Ghee', sales: 2400, profit: 840, margin: 35, trend: '↓' },
  { category: 'Frozen Foods', sales: 680, profit: 150, margin: 22, trend: '↓' },
];
