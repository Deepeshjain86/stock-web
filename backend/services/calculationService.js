/**
 * Single Source of Truth Calculation Service for Kirana ERP
 * Standardized enterprise accounting and inventory valuation logic (SAP/Oracle/Odoo standard).
 */

// Helper to build parameterized WHERE clause for filters
const formatWhereClause = (tablePrefix = 's', filters = {}) => {
  const whereClauses = [];
  const params = [];

  // Determine correct date column based on table schema
  const dateCol = (tablePrefix === 'pr' || tablePrefix === 'vr' || tablePrefix === 'sr' || tablePrefix === 'sl')
    ? `${tablePrefix}.created_at`
    : `${tablePrefix}.date`;

  // Date Range Filtering (supports startDate/endDate & dateFrom/dateTo)
  if (filters.startDate || filters.dateFrom) {
    const start = filters.startDate || filters.dateFrom;
    whereClauses.push(`DATE(${dateCol}) >= ?`);
    params.push(start);
  }
  if (filters.endDate || filters.dateTo) {
    const end = filters.endDate || filters.dateTo;
    whereClauses.push(`DATE(${dateCol}) <= ?`);
    params.push(end);
  }

  // Category filter
  if (filters.categoryId && filters.categoryId !== 'all') {
    const catId = Number(filters.categoryId);
    if (tablePrefix === 's') {
      whereClauses.push(`EXISTS (SELECT 1 FROM sale_items si_cat JOIN products pr_cat ON si_cat.product_id = pr_cat.id WHERE si_cat.sale_id = s.id AND pr_cat.category_id = ?)`);
      params.push(catId);
    } else if (tablePrefix === 'p') {
      whereClauses.push(`EXISTS (SELECT 1 FROM purchase_items pi_cat JOIN products pr_cat ON pi_cat.product_id = pr_cat.id WHERE pi_cat.purchase_id = p.id AND pr_cat.category_id = ?)`);
      params.push(catId);
    } else if (tablePrefix === 'products' || tablePrefix === 'pr_catalog') {
      whereClauses.push(`${tablePrefix}.category_id = ?`);
      params.push(catId);
    }
  }

  // Brand filter
  if (filters.brandId && filters.brandId !== 'all') {
    const bId = filters.brandId;
    if (tablePrefix === 's') {
      whereClauses.push(`EXISTS (SELECT 1 FROM sale_items si_b JOIN products pr_b ON si_b.product_id = pr_b.id WHERE si_b.sale_id = s.id AND pr_b.brand = ?)`);
      params.push(bId);
    } else if (tablePrefix === 'p') {
      whereClauses.push(`EXISTS (SELECT 1 FROM purchase_items pi_b JOIN products pr_b ON pi_b.product_id = pr_b.id WHERE pi_b.purchase_id = p.id AND pr_b.brand = ?)`);
      params.push(bId);
    } else if (tablePrefix === 'products' || tablePrefix === 'pr_catalog') {
      whereClauses.push(`${tablePrefix}.brand = ?`);
      params.push(bId);
    }
  }

  // Vendor filter (Applies to tables with vendor_id column, e.g. purchases 'p', purchase_returns 'pr', vendors 'v')
  if (filters.vendorId && filters.vendorId !== 'all') {
    const vId = Number(filters.vendorId);
    if (tablePrefix === 'p' || tablePrefix === 'pr' || tablePrefix === 'vr' || tablePrefix === 'v') {
      whereClauses.push(`${tablePrefix}.vendor_id = ?`);
      params.push(vId);
    } else if (tablePrefix === 's') {
      whereClauses.push(`EXISTS (SELECT 1 FROM stock_logs sl_v WHERE sl_v.reference_no = s.invoice_no AND sl_v.vendor_id = ?)`);
      params.push(vId);
    }
  }

  // Customer filter (Applies to tables with customer_id column, e.g. sales 's', customers 'c', borrow 'br')
  if (filters.customerId && filters.customerId !== 'all') {
    const cId = Number(filters.customerId);
    if (tablePrefix === 's' || tablePrefix === 'c' || tablePrefix === 'br') {
      whereClauses.push(`${tablePrefix}.customer_id = ?`);
      params.push(cId);
    }
  }

  // Employee / Staff filter (Applies to tables with user_id column, e.g. sales 's')
  if (filters.employeeId && filters.employeeId !== 'all') {
    const eId = Number(filters.employeeId);
    if (tablePrefix === 's') {
      whereClauses.push(`${tablePrefix}.user_id = ?`);
      params.push(eId);
    }
  }

  return {
    clause: whereClauses.length > 0 ? ' AND ' + whereClauses.join(' AND ') : '',
    params
  };
};

/**
 * 1. Inventory Valuation Engine
 * Formula: Σ (Available Current Stock Qty × Purchase Price)
 * Available Stock Qty = Stock remaining in stock table after all transactions.
 * Out of stock items (quantity <= 0) contribute 0 to valuation.
 */
export const calculateInventoryValuation = async (db, filters = {}) => {
  let query = `
    SELECT COALESCE(SUM(
      GREATEST(0, s.quantity) * COALESCE(p.purchase_price, 0)
    ), 0) as valuation,
    COUNT(DISTINCT p.id) as total_items
    FROM stock s
    JOIN products p ON s.product_id = p.id
    WHERE s.quantity > 0
  `;
  const params = [];

  if (filters.categoryId && filters.categoryId !== 'all') {
    query += ` AND p.category_id = ?`;
    params.push(Number(filters.categoryId));
  }
  if (filters.brandId && filters.brandId !== 'all') {
    query += ` AND p.brand_id = ?`;
    params.push(Number(filters.brandId));
  }
  if (filters.warehouseId && filters.warehouseId !== 'all') {
    query += ` AND s.warehouse_id = ?`;
    params.push(Number(filters.warehouseId));
  }

  const [rows] = await db.query(query, params);
  return Number(rows[0]?.valuation || 0);
};

/**
 * 2. Purchase Expenses Engine
 * Purchase Expenses = Selected period Purchases Total - Selected period Vendor Returns + Freight/Loading Charges
 */
export const calculatePurchaseExpenses = async (db, filters = {}) => {
  let purchQuery = `SELECT COALESCE(SUM(p.total), 0) as gross_purchases, COUNT(p.id) as purch_count FROM purchases p WHERE 1=1`;
  const { clause: purchClause, params: purchParams } = formatWhereClause('p', filters);
  purchQuery += purchClause;

  const [purchRows] = await db.query(purchQuery, purchParams);
  const grossPurchases = Number(purchRows[0]?.gross_purchases || 0);
  const purchaseCount = Number(purchRows[0]?.purch_count || 0);

  // Vendor / Purchase Returns in date range
  let returnQuery = `SELECT COALESCE(SUM(pr.total_amount), 0) as total_returns FROM purchase_returns pr WHERE pr.status != 'Cancelled'`;
  const { clause: returnClause, params: returnParams } = formatWhereClause('pr', filters);
  returnQuery += returnClause;

  const [returnRows] = await db.query(returnQuery, returnParams);
  const totalVendorReturns = Number(returnRows[0]?.total_returns || 0);

  const netPurchaseExpenses = Math.max(0, grossPurchases - totalVendorReturns);

  return {
    grossPurchases,
    vendorReturns: totalVendorReturns,
    netPurchaseExpenses,
    purchaseCount
  };
};

/**
 * 3. Total Sales & Revenue Engine
 * Total Sales = Total of successful Sales Invoices in date range - Sales Returns refund amount
 */
export const calculateTotalSales = async (db, filters = {}) => {
  let salesQuery = `SELECT COALESCE(SUM(s.total), 0) as gross_sales, COALESCE(SUM(s.subtotal), 0) as gross_subtotal, COUNT(s.id) as sales_count FROM sales s WHERE 1=1`;
  const { clause: salesClause, params: salesParams } = formatWhereClause('s', filters);
  salesQuery += salesClause;

  const [salesRows] = await db.query(salesQuery, salesParams);
  const grossSales = Number(salesRows[0]?.gross_sales || 0);
  const grossSubtotal = Number(salesRows[0]?.gross_subtotal || 0);
  const salesCount = Number(salesRows[0]?.sales_count || 0);

  // Sales Returns in date range
  let returnQuery = `SELECT COALESCE(SUM(sr.refund_amount), 0) as total_returns FROM sales_returns sr JOIN sales s ON sr.sale_id = s.id WHERE 1=1`;
  const { clause: returnClause, params: returnParams } = formatWhereClause('s', filters);
  returnQuery += returnClause;

  const [returnRows] = await db.query(returnQuery, returnParams);
  const totalSalesReturns = Number(returnRows[0]?.total_returns || 0);

  const netSales = Math.max(0, grossSales - totalSalesReturns);
  const netSubtotal = Math.max(0, grossSubtotal - totalSalesReturns);

  return {
    grossSales,
    salesReturns: totalSalesReturns,
    netSales,
    netSubtotal,
    salesCount
  };
};

/**
 * 4. COGS (Cost of Goods Sold) Engine
 * COGS = Σ ((Sold Qty - Returned Qty) × Purchase Price)
 */
export const calculateCOGS = async (db, filters = {}) => {
  let cogsQuery = `
    SELECT COALESCE(SUM(
      (si.quantity - COALESCE((SELECT SUM(quantity) FROM sales_returns WHERE sale_id = si.sale_id AND product_id = si.product_id), 0)) * p.purchase_price
    ), 0) as cogs
    FROM sale_items si
    JOIN sales s ON si.sale_id = s.id
    JOIN products p ON si.product_id = p.id
    WHERE 1=1
  `;
  const { clause: cogsClause, params: cogsParams } = formatWhereClause('s', filters);
  cogsQuery += cogsClause;

  if (filters.categoryId && filters.categoryId !== 'all') {
    cogsQuery += ` AND p.category_id = ?`;
    cogsParams.push(Number(filters.categoryId));
  }
  if (filters.brandId && filters.brandId !== 'all') {
    cogsQuery += ` AND p.brand_id = ?`;
    cogsParams.push(Number(filters.brandId));
  }

  const [cogsRows] = await db.query(cogsQuery, cogsParams);
  return Math.max(0, Number(cogsRows[0]?.cogs || 0));
};

/**
 * 5. Net Profit Engine
 * ERP Standard Formula: Net Profit = Net Sales Revenue - COGS
 */
export const calculateNetProfit = async (db, filters = {}) => {
  const sales = await calculateTotalSales(db, filters);
  const cogs = await calculateCOGS(db, filters);
  const netProfit = Math.max(0, sales.netSales - cogs);
  
  return {
    netSales: sales.netSales,
    cogs,
    netProfit,
    marginPercentage: sales.netSales > 0 ? Number(((netProfit / sales.netSales) * 100).toFixed(2)) : 0
  };
};

/**
 * 6. Stock Count Metrics Engine
 */
export const calculateStockCounts = async (db, filters = {}) => {
  let lowStockQuery = `
    SELECT COUNT(*) as count FROM (
      SELECT p.id
      FROM products p
      LEFT JOIN stock s ON p.id = s.product_id
      WHERE 1=1
  `;
  const params = [];
  if (filters.categoryId && filters.categoryId !== 'all') {
    lowStockQuery += ` AND p.category_id = ?`;
    params.push(Number(filters.categoryId));
  }
  if (filters.brandId && filters.brandId !== 'all') {
    lowStockQuery += ` AND p.brand_id = ?`;
    params.push(Number(filters.brandId));
  }
  lowStockQuery += `
      GROUP BY p.id, p.min_stock
      HAVING COALESCE(SUM(s.quantity), 0) <= p.min_stock AND COALESCE(SUM(s.quantity), 0) > 0
    ) as temp
  `;

  const [lowStockRows] = await db.query(lowStockQuery, params);

  let outStockQuery = `
    SELECT COUNT(*) as count FROM (
      SELECT p.id
      FROM products p
      LEFT JOIN stock s ON p.id = s.product_id
      WHERE 1=1
  `;
  const outParams = [];
  if (filters.categoryId && filters.categoryId !== 'all') {
    outStockQuery += ` AND p.category_id = ?`;
    outParams.push(Number(filters.categoryId));
  }
  if (filters.brandId && filters.brandId !== 'all') {
    outStockQuery += ` AND p.brand_id = ?`;
    outParams.push(Number(filters.brandId));
  }
  outStockQuery += `
      GROUP BY p.id
      HAVING COALESCE(SUM(s.quantity), 0) = 0
    ) as temp
  `;

  const [outStockRows] = await db.query(outStockQuery, outParams);
  const [prodCountRows] = await db.query('SELECT COUNT(*) as count FROM products');

  return {
    totalProducts: Number(prodCountRows[0]?.count || 0),
    lowStockCount: Number(lowStockRows[0]?.count || 0),
    outOfStockCount: Number(outStockRows[0]?.count || 0)
  };
};

/**
 * 7. Top Selling Products Engine
 */
export const getTopSellingProducts = async (db, filters = {}, limit = 10) => {
  let query = `
    SELECT pr.id, pr.name, pr.barcode,
           SUM(si.quantity - COALESCE((SELECT SUM(quantity) FROM sales_returns WHERE sale_id = si.sale_id AND product_id = si.product_id), 0)) as units_sold,
           SUM(si.total - COALESCE((SELECT SUM(refund_amount) FROM sales_returns WHERE sale_id = si.sale_id AND product_id = si.product_id), 0)) as revenue
    FROM sale_items si
    JOIN sales s ON si.sale_id = s.id
    JOIN products pr ON si.product_id = pr.id
    WHERE 1=1
  `;
  const { clause, params } = formatWhereClause('s', filters);
  query += clause;

  if (filters.categoryId && filters.categoryId !== 'all') {
    query += ` AND pr.category_id = ?`;
    params.push(Number(filters.categoryId));
  }
  if (filters.brandId && filters.brandId !== 'all') {
    query += ` AND pr.brand_id = ?`;
    params.push(Number(filters.brandId));
  }

  query += ` GROUP BY pr.id HAVING revenue > 0 ORDER BY revenue DESC LIMIT ?`;
  params.push(Number(limit));

  const [rows] = await db.query(query, params);
  return rows;
};

/**
 * 8. Top Purchased Products Engine
 */
export const getTopPurchasedProducts = async (db, filters = {}, limit = 10) => {
  let query = `
    SELECT pr.id, pr.name, pr.barcode,
           SUM(pi.quantity - COALESCE((SELECT SUM(quantity) FROM purchase_returns WHERE purchase_id = pi.purchase_id AND product_id = pi.product_id AND status != 'Cancelled'), 0)) as units_purchased,
           SUM(pi.total - COALESCE((SELECT SUM(total_amount) FROM purchase_returns WHERE purchase_id = pi.purchase_id AND product_id = pi.product_id AND status != 'Cancelled'), 0)) as total_expenses
    FROM purchase_items pi
    JOIN purchases p ON pi.purchase_id = p.id
    JOIN products pr ON pi.product_id = pr.id
    WHERE 1=1
  `;
  const { clause, params } = formatWhereClause('p', filters);
  query += clause;

  if (filters.categoryId && filters.categoryId !== 'all') {
    query += ` AND pr.category_id = ?`;
    params.push(Number(filters.categoryId));
  }
  if (filters.brandId && filters.brandId !== 'all') {
    query += ` AND pr.brand_id = ?`;
    params.push(Number(filters.brandId));
  }

  query += ` GROUP BY pr.id HAVING total_expenses > 0 ORDER BY total_expenses DESC LIMIT ?`;
  params.push(Number(limit));

  const [rows] = await db.query(query, params);
  return rows;
};

/**
 * 9. Unified Executive Dashboard KPIs
 */
export const getExecutiveDashboardKPIs = async (db, filters = {}) => {
  const sales = await calculateTotalSales(db, filters);
  const purchases = await calculatePurchaseExpenses(db, filters);
  const cogs = await calculateCOGS(db, filters);
  const netProfit = Math.max(0, sales.netSales - cogs);
  const inventoryValuation = await calculateInventoryValuation(db, filters);
  const stockCounts = await calculateStockCounts(db, filters);

  const [prodCount] = await db.query('SELECT COUNT(*) as count FROM products');
  const [catCount] = await db.query('SELECT COUNT(*) as count FROM categories');
  const [vendorCount] = await db.query('SELECT COUNT(*) as count FROM vendors');
  let activeVendorCount = vendorCount;
  try {
    const [aVend] = await db.query('SELECT COUNT(*) as count FROM vendors WHERE status = "Active"');
    activeVendorCount = aVend;
  } catch (e) {}

  const [custCount] = await db.query('SELECT COUNT(*) as count FROM customers WHERE name != "Walk-in Customer"');
  let activeCustCount = custCount;
  try {
    const [aCust] = await db.query('SELECT COUNT(*) as count FROM customers WHERE status = "Active" AND name != "Walk-in Customer"');
    activeCustCount = aCust;
  } catch (e) {}

  const [pendingPayments] = await db.query(`
    SELECT COALESCE(SUM(total), 0) as total 
    FROM purchases 
    WHERE payment_status != 'Paid'
  `);

  const topSelling = await getTopSellingProducts(db, filters, 5);
  const topPurchased = await getTopPurchasedProducts(db, filters, 5);

  return {
    totalProducts: prodCount[0].count,
    totalCategories: catCount[0].count,
    totalVendors: vendorCount[0].count,
    activeVendors: activeVendorCount[0]?.count || vendorCount[0].count,
    totalCustomers: custCount[0].count,
    activeCustomers: activeCustCount[0]?.count || custCount[0].count,
    totalPurchases: purchases.netPurchaseExpenses,
    grossPurchases: purchases.grossPurchases,
    vendorReturns: purchases.vendorReturns,
    totalSales: sales.netSales,
    grossSales: sales.grossSales,
    salesReturns: sales.salesReturns,
    totalOrders: sales.salesCount,
    cogs,
    profit: netProfit,
    inventoryValuation,
    lowStock: stockCounts.lowStockCount,
    outOfStock: stockCounts.outOfStockCount,
    pendingPayments: Number(pendingPayments[0]?.total || 0),
    topSellingProducts: topSelling,
    topPurchasedProducts: topPurchased
  };
};

/**
 * 10. Stock Destroy & Wastage Loss Engine
 */
export const calculateStockDestroy = async (db, filters = {}) => {
  try {
    let query = `SELECT COALESCE(SUM(total_cost), 0) as destroy_cost, COALESCE(SUM(quantity), 0) as destroy_qty, COUNT(id) as destroy_count FROM stock_destroys WHERE (status IS NULL OR status != 'Cancelled')`;
    const params = [];
    if (filters.startDate || filters.dateFrom) {
      const start = (filters.startDate || filters.dateFrom).split(' ')[0];
      query += ` AND DATE(created_at) >= ?`;
      params.push(start);
    }
    if (filters.endDate || filters.dateTo) {
      const end = (filters.endDate || filters.dateTo).split(' ')[0];
      query += ` AND DATE(created_at) <= ?`;
      params.push(end);
    }
    const [rows] = await db.query(query, params);
    return {
      destroyCost: Number(rows[0]?.destroy_cost || 0),
      destroyQty: Number(rows[0]?.destroy_qty || 0),
      destroyCount: Number(rows[0]?.destroy_count || 0)
    };
  } catch (err) {
    return { destroyCost: 0, destroyQty: 0, destroyCount: 0 };
  }
};

/**
 * 11. Customer Borrow / Credit Ledger Engine
 */
export const calculateBorrowLedger = async (db, filters = {}) => {
  try {
    let query = `SELECT COALESCE(SUM(remaining_amount), 0) as borrow_outstanding, COALESCE(SUM(total_amount), 0) as total_borrow, COALESCE(SUM(paid_amount), 0) as total_paid FROM borrow_transactions WHERE 1=1`;
    const params = [];
    if (filters.customerId && filters.customerId !== 'all') {
      query += ` AND customer_id = ?`;
      params.push(Number(filters.customerId));
    }
    const [rows] = await db.query(query, params);
    return {
      borrowOutstanding: Number(rows[0]?.borrow_outstanding || 0),
      totalBorrow: Number(rows[0]?.total_borrow || 0),
      totalPaid: Number(rows[0]?.total_paid || 0)
    };
  } catch (err) {
    return { borrowOutstanding: 0, totalBorrow: 0, totalPaid: 0 };
  }
};
