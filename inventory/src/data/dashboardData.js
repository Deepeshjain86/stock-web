export const dashboardStats = {
  totalProducts: 15,
  totalStock: 1285,
  inventoryValue: 285450,
  lowStockProducts: 3,
  outOfStockProducts: 2,
  todaysSales: 9800,
  totalSalesValue: 1245000,
  totalVendors: 10,
  totalCategories: 8,
};

export const stockMovementData = [
  { month: 'January', inbound: 8500, outbound: 7200 },
  { month: 'February', inbound: 9200, outbound: 8100 },
  { month: 'March', inbound: 10500, outbound: 9800 },
  { month: 'April', inbound: 9800, outbound: 9200 },
  { month: 'May', inbound: 11200, outbound: 10500 },
  { month: 'June', inbound: 12500, outbound: 11800 },
];

export const dailySalesData = [
  { date: 'Mon', sales: 2400, orders: 24 },
  { date: 'Tue', sales: 2210, orders: 22 },
  { date: 'Wed', sales: 2290, orders: 20 },
  { date: 'Thu', sales: 2000, orders: 18 },
  { date: 'Fri', sales: 2181, orders: 25 },
  { date: 'Sat', sales: 2500, orders: 28 },
  { date: 'Sun', sales: 2100, orders: 19 },
];

export const categoryDistribution = [
  { name: 'Dairy & Milk', value: 245, fill: '#3B82F6' },
  { name: 'Grains & Flour', value: 325, fill: '#8B5A2B' },
  { name: 'Spices', value: 185, fill: '#DC2626' },
  { name: 'Beverages', value: 85, fill: '#06B6D4' },
  { name: 'Packaged Foods', value: 280, fill: '#F59E0B' },
  { name: 'Oils & Ghee', value: 53, fill: '#EF4444' },
  { name: 'Frozen Foods', value: 45, fill: '#0EA5E9' },
  { name: 'Personal Care', value: 158, fill: '#EC4899' },
];

export const topSellingProducts = [
  { name: 'Maggi Instant Noodles', sales: 8500, quantity: 280 },
  { name: 'Amul Full Cream Milk', sales: 7200, quantity: 245 },
  { name: 'Tata Tea Gold', sales: 6800, quantity: 85 },
  { name: 'Basmati Rice Premium', sales: 5600, quantity: 120 },
  { name: 'Dettol Soap', sales: 4200, quantity: 156 },
  { name: 'Britannia Biscuits', sales: 3500, quantity: 0 },
];

export const lowStockAlerts = [
  { id: 1, name: 'Atta Whole Wheat Flour', current: 25, minimum: 15, status: 'low' },
  { id: 2, name: 'Turmeric Powder', current: 15, minimum: 20, status: 'critical' },
  { id: 3, name: 'Colgate Toothpaste', current: 2, minimum: 15, status: 'critical' },
];

export const recentActivities = [
  { id: 1, type: 'sale', message: 'Sale INV-008 completed - ₹563.50', timestamp: '2024-06-03 14:32' },
  { id: 2, type: 'purchase', message: 'Purchase PUR-001 received - 100 units', timestamp: '2024-06-03 10:15' },
  { id: 3, type: 'stock', message: 'Stock adjustment - Maggi Noodles +50 units', timestamp: '2024-06-03 09:45' },
  { id: 4, type: 'alert', message: 'Low stock alert: Colgate Toothpaste (2 units)', timestamp: '2024-06-02 16:20' },
  { id: 5, type: 'sale', message: 'Sale INV-007 completed - ₹5106.00', timestamp: '2024-06-02 13:10' },
  { id: 6, type: 'purchase', message: 'Purchase order PUR-002 created', timestamp: '2024-06-02 08:30' },
  { id: 7, type: 'stock', message: 'Stock out: Britannia Biscuits (25 units)', timestamp: '2024-06-01 15:45' },
  { id: 8, type: 'alert', message: 'Out of stock: Black Pepper Powder', timestamp: '2024-06-01 14:20' },
];

export const inventoryHealthMetrics = {
  overstock: 8,
  optimalStock: 5,
  lowStock: 2,
  outOfStock: 2,
  totalValue: 285450,
  totalCost: 165200,
  totalMargin: 120250,
  marginPercentage: 42.1,
};
