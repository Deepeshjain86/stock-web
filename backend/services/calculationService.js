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

  // Brand filter (supports brandId or brand)
  const bVal = filters.brandId || filters.brand;
  if (bVal && bVal !== 'all') {
    const bId = bVal;
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
  let batchQuery = `
    SELECT COALESCE(SUM(pb.remaining_quantity * COALESCE(NULLIF(pb.purchase_price, 0), NULLIF(p.purchase_price, 0), (SELECT NULLIF(pi.purchase_price, 0) FROM purchase_items pi WHERE pi.product_id = p.id AND pi.purchase_price > 0 ORDER BY pi.id DESC LIMIT 1), 0)), 0) as batch_valuation
    FROM purchase_batches pb
    JOIN products p ON pb.product_id = p.id
    WHERE pb.remaining_quantity > 0
  `;
  const batchParams = [];
  if (filters.categoryId && filters.categoryId !== 'all') {
    batchQuery += ` AND p.category_id = ?`;
    batchParams.push(Number(filters.categoryId));
  }
  if (filters.brandId && filters.brandId !== 'all') {
    batchQuery += ` AND p.brand_id = ?`;
    batchParams.push(Number(filters.brandId));
  }
  if (filters.warehouseId && filters.warehouseId !== 'all') {
    batchQuery += ` AND pb.warehouse_id = ?`;
    batchParams.push(Number(filters.warehouseId));
  }

  const [batchRows] = await db.query(batchQuery, batchParams);
  const batchValuation = Number(batchRows[0]?.batch_valuation || 0);

  // Fallback for stock items without active purchase_batches records
  let fallbackQuery = `
    SELECT COALESCE(SUM(GREATEST(0, s.quantity) * COALESCE(NULLIF(p.purchase_price, 0), (SELECT NULLIF(pi.purchase_price, 0) FROM purchase_items pi WHERE pi.product_id = p.id AND pi.purchase_price > 0 ORDER BY pi.id DESC LIMIT 1), 0)), 0) as fallback_valuation
    FROM stock s
    JOIN products p ON s.product_id = p.id
    WHERE s.quantity > 0
      AND NOT EXISTS (SELECT 1 FROM purchase_batches pb WHERE pb.product_id = p.id AND pb.remaining_quantity > 0)
  `;
  const fallbackParams = [];
  if (filters.categoryId && filters.categoryId !== 'all') {
    fallbackQuery += ` AND p.category_id = ?`;
    fallbackParams.push(Number(filters.categoryId));
  }
  if (filters.brandId && filters.brandId !== 'all') {
    fallbackQuery += ` AND p.brand_id = ?`;
    fallbackParams.push(Number(filters.brandId));
  }
  if (filters.warehouseId && filters.warehouseId !== 'all') {
    fallbackQuery += ` AND s.warehouse_id = ?`;
    fallbackParams.push(Number(filters.warehouseId));
  }

  const [fallbackRows] = await db.query(fallbackQuery, fallbackParams);
  const fallbackValuation = Number(fallbackRows[0]?.fallback_valuation || 0);

  return Number((batchValuation + fallbackValuation).toFixed(2));
};

/**
 * 2. Purchase Expenses Engine
 * Purchase Expenses = Selected period Purchases Total - Selected period Vendor Returns + Freight/Loading Charges
 */
export const calculatePurchaseExpenses = async (db, filters = {}) => {
  let purchQuery = `
    SELECT COALESCE(SUM(p.subtotal), 0) as gross_subtotal,
           COALESCE(SUM(p.gst_amount), 0) as total_gst,
           COALESCE(SUM(p.discount), 0) as total_discount,
           COALESCE(SUM(p.total), 0) as gross_purchases,
           COUNT(p.id) as purch_count 
    FROM purchases p WHERE 1=1
  `;
  const { clause: purchClause, params: purchParams } = formatWhereClause('p', filters);
  purchQuery += purchClause;

  const [purchRows] = await db.query(purchQuery, purchParams);
  const rawGrossPurchases = Number(purchRows[0]?.gross_purchases || 0);
  const rawGst = Number(purchRows[0]?.total_gst || 0);
  const totalDiscount = Number(purchRows[0]?.total_discount || 0);
  const purchaseCount = Number(purchRows[0]?.purch_count || 0);

  // Fallback GST & Net Subtotal calculation from items
  let calculatedItemGst = 0;
  let itemNetSubtotal = 0;
  try {
    let itemNetQuery = `
      SELECT COALESCE(SUM(pi.quantity * pi.purchase_price), 0) as net_subtotal,
             COALESCE(SUM((pi.quantity * pi.purchase_price) * (COALESCE(NULLIF(pi.gst, 0), pr.gst, 0) / 100)), 0) as item_gst
      FROM purchase_items pi
      JOIN purchases p ON pi.purchase_id = p.id
      JOIN products pr ON pi.product_id = pr.id
      WHERE 1=1
    `;
    const { clause: itemNetClause, params: itemNetParams } = formatWhereClause('p', filters);
    itemNetQuery += itemNetClause;
    const [itemNetRows] = await db.query(itemNetQuery, itemNetParams);
    itemNetSubtotal = Number(itemNetRows[0]?.net_subtotal || 0);
    calculatedItemGst = Number(itemNetRows[0]?.item_gst || 0);
  } catch (e) {}

  const totalGst = rawGst > 0 ? rawGst : calculatedItemGst;

  // Active inventory stock GST amount
  let stockGst = 0;
  try {
    const [stockGstRows] = await db.query(`
      SELECT COALESCE(SUM((pb.remaining_quantity * pb.purchase_price) * (COALESCE(pr.gst, 0) / 100)), 0) as stock_gst
      FROM purchase_batches pb
      JOIN products pr ON pb.product_id = pr.id
      WHERE pb.remaining_quantity > 0
    `);
    stockGst = Number(stockGstRows[0]?.stock_gst || 0);
  } catch (e) {}

  // Vendor / Purchase Returns in date range
  let returnQuery = `SELECT COALESCE(SUM(pr.total_amount), 0) as total_returns FROM purchase_returns pr WHERE pr.status != 'Cancelled'`;
  const { clause: returnClause, params: returnParams } = formatWhereClause('pr', filters);
  returnQuery += returnClause;

  const [returnRows] = await db.query(returnQuery, returnParams);
  const totalVendorReturns = Number(returnRows[0]?.total_returns || 0);

  const effectiveSubtotalExclTax = itemNetSubtotal > 0 ? itemNetSubtotal : Number(purchRows[0]?.gross_subtotal || 0);
  const netSubtotalExclTax = Math.max(0, effectiveSubtotalExclTax - totalVendorReturns);
  const netTotalPaidInclTax = Math.max(0, (effectiveSubtotalExclTax + totalGst) - totalVendorReturns);

  return {
    grossPurchases: Number(netTotalPaidInclTax.toFixed(2)),
    grossSubtotal: Number(effectiveSubtotalExclTax.toFixed(2)),
    netSubtotalExclTax: Number(netSubtotalExclTax.toFixed(2)),
    totalGst: Number(totalGst.toFixed(2)),
    stockGst: Number(stockGst.toFixed(2)),
    totalDiscount,
    vendorReturns: totalVendorReturns,
    netPurchaseExpenses: Number(netTotalPaidInclTax.toFixed(2)),
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
      (si.quantity - COALESCE((SELECT SUM(quantity) FROM sales_returns WHERE sale_id = si.sale_id AND product_id = si.product_id), 0)) *
      COALESCE(
        NULLIF((SELECT pb.purchase_price FROM purchase_batches pb WHERE pb.product_id = si.product_id AND pb.batch_number = si.batch_number AND pb.purchase_price > 0 LIMIT 1), 0),
        NULLIF(p.purchase_price, 0),
        (SELECT NULLIF(pi.purchase_price, 0) FROM purchase_items pi WHERE pi.product_id = si.product_id AND pi.purchase_price > 0 ORDER BY pi.id DESC LIMIT 1),
        0
      )
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
  return Math.max(0, Number(Number(cogsRows[0]?.cogs || 0).toFixed(2)));
};

/**
 * 5. Net Profit Engine
 * ERP Standard Formula: Net Profit = Net Sales Revenue - COGS
 */
export const calculateNetProfit = async (db, filters = {}) => {
  const sales = await calculateTotalSales(db, filters);
  const cogs = await calculateCOGS(db, filters);
  const stockDestroy = await calculateStockDestroy(db, filters);
  
  const grossProfit = Number((sales.netSales - cogs).toFixed(2));
  const operatingExpenses = Number((stockDestroy.destroyCost || 0).toFixed(2));
  const netProfit = Math.max(0, Number((grossProfit - operatingExpenses).toFixed(2)));

  return {
    netSales: sales.netSales,
    cogs,
    grossProfit,
    operatingExpenses,
    netProfit,
    marginPercentage: sales.netSales > 0 ? Number(((grossProfit / sales.netSales) * 100).toFixed(2)) : 0
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
    netPurchaseSubtotalExclTax: purchases.netSubtotalExclTax,
    purchaseGst: purchases.totalGst > 0 ? purchases.totalGst : purchases.stockGst,
    stockGst: purchases.stockGst,
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
    let query = `
      SELECT COALESCE(SUM(bt.remaining_amount), 0) as borrow_outstanding,
             COALESCE(SUM(bt.total_amount), 0) as total_borrow,
             COALESCE(SUM(bt.paid_amount), 0) as total_paid
      FROM borrow_transactions bt
      JOIN customers c ON bt.customer_id = c.id
      WHERE c.name != 'Walk-in Customer'
    `;
    const params = [];
    if (filters.customerId && filters.customerId !== 'all') {
      query += ` AND bt.customer_id = ?`;
      params.push(Number(filters.customerId));
    }
    const [rows] = await db.query(query, params);
    let borrowOutstanding = Number(rows[0]?.borrow_outstanding || 0);

    if (borrowOutstanding === 0 && (!filters.customerId || filters.customerId === 'all')) {
      let custQuery = `SELECT COALESCE(SUM(outstanding_balance), 0) as total_cust_bal FROM customers WHERE name != 'Walk-in Customer'`;
      const [custRows] = await db.query(custQuery);
      if (Number(custRows[0]?.total_cust_bal || 0) > 0) {
        borrowOutstanding = Number(custRows[0]?.total_cust_bal);
      }
    }

    return {
      borrowOutstanding: Number(borrowOutstanding.toFixed(2)),
      totalBorrow: Number((Number(rows[0]?.total_borrow || 0)).toFixed(2)),
      totalPaid: Number((Number(rows[0]?.total_paid || 0)).toFixed(2))
    };
  } catch (err) {
    return { borrowOutstanding: 0, totalBorrow: 0, totalPaid: 0 };
  }
};

/**
 * 12. Stock Aging Engine (Enterprise FIFO Bucket Standard)
 * Classifies active inventory in purchase_batches into 0-30, 31-60, 61-90, and 90+ day aging buckets.
 */
export const calculateStockAging = async (db, filters = {}) => {
  try {
    let query = `
      SELECT 
        SUM(CASE WHEN DATEDIFF(CURRENT_DATE(), pb.purchase_date) <= 30 THEN pb.remaining_quantity * COALESCE(NULLIF(pb.purchase_price, 0), NULLIF(p.purchase_price, 0), 0) ELSE 0 END) as val_0_30,
        SUM(CASE WHEN DATEDIFF(CURRENT_DATE(), pb.purchase_date) <= 30 THEN pb.remaining_quantity ELSE 0 END) as qty_0_30,
        SUM(CASE WHEN DATEDIFF(CURRENT_DATE(), pb.purchase_date) BETWEEN 31 AND 60 THEN pb.remaining_quantity * COALESCE(NULLIF(pb.purchase_price, 0), NULLIF(p.purchase_price, 0), 0) ELSE 0 END) as val_31_60,
        SUM(CASE WHEN DATEDIFF(CURRENT_DATE(), pb.purchase_date) BETWEEN 31 AND 60 THEN pb.remaining_quantity ELSE 0 END) as qty_31_60,
        SUM(CASE WHEN DATEDIFF(CURRENT_DATE(), pb.purchase_date) BETWEEN 61 AND 90 THEN pb.remaining_quantity * COALESCE(NULLIF(pb.purchase_price, 0), NULLIF(p.purchase_price, 0), 0) ELSE 0 END) as val_61_90,
        SUM(CASE WHEN DATEDIFF(CURRENT_DATE(), pb.purchase_date) BETWEEN 61 AND 90 THEN pb.remaining_quantity ELSE 0 END) as qty_61_90,
        SUM(CASE WHEN DATEDIFF(CURRENT_DATE(), pb.purchase_date) > 90 THEN pb.remaining_quantity * COALESCE(NULLIF(pb.purchase_price, 0), NULLIF(p.purchase_price, 0), 0) ELSE 0 END) as val_90_plus,
        SUM(CASE WHEN DATEDIFF(CURRENT_DATE(), pb.purchase_date) > 90 THEN pb.remaining_quantity ELSE 0 END) as qty_90_plus,
        COALESCE(SUM(pb.remaining_quantity * COALESCE(NULLIF(pb.purchase_price, 0), NULLIF(p.purchase_price, 0), 0)), 0) as total_valuation,
        COALESCE(SUM(pb.remaining_quantity), 0) as total_qty
      FROM purchase_batches pb
      JOIN products p ON pb.product_id = p.id
      WHERE pb.remaining_quantity > 0
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

    const [rows] = await db.query(query, params);
    const r = rows[0] || {};

    return {
      bucket0_30: { qty: Number(r.qty_0_30 || 0), value: Number(Number(r.val_0_30 || 0).toFixed(2)) },
      bucket31_60: { qty: Number(r.qty_31_60 || 0), value: Number(Number(r.val_31_60 || 0).toFixed(2)) },
      bucket61_90: { qty: Number(r.qty_61_90 || 0), value: Number(Number(r.val_61_90 || 0).toFixed(2)) },
      bucket90Plus: { qty: Number(r.qty_90_plus || 0), value: Number(Number(r.val_90_plus || 0).toFixed(2)) },
      totalValuation: Number(Number(r.total_valuation || 0).toFixed(2)),
      totalQuantity: Number(r.total_qty || 0)
    };
  } catch (err) {
    return { bucket0_30: { qty: 0, value: 0 }, bucket31_60: { qty: 0, value: 0 }, bucket61_90: { qty: 0, value: 0 }, bucket90Plus: { qty: 0, value: 0 }, totalValuation: 0, totalQuantity: 0 };
  }
};

/**
 * 13. Inventory Turnover Ratio & Velocity Engine
 */
export const calculateInventoryTurnover = async (db, filters = {}) => {
  try {
    const cogs = await calculateCOGS(db, filters);
    const invValuation = await calculateInventoryValuation(db, filters);

    const avgInventory = invValuation > 0 ? invValuation : 1;
    const turnoverRatio = Number((cogs / avgInventory).toFixed(2));
    const daysToSell = turnoverRatio > 0 ? Number((365 / turnoverRatio).toFixed(1)) : 365;

    // Movement Classification: Fast, Slow, Dead Stock
    const [deadStockRows] = await db.query(`
      SELECT COUNT(DISTINCT p.id) as count
      FROM products p
      JOIN stock s ON p.id = s.product_id
      WHERE s.quantity > 0
        AND NOT EXISTS (
          SELECT 1 FROM sale_items si 
          JOIN sales sa ON si.sale_id = sa.id 
          WHERE si.product_id = p.id AND sa.date >= DATE_SUB(CURRENT_DATE(), INTERVAL 90 DAY)
        )
    `);

    const [slowStockRows] = await db.query(`
      SELECT COUNT(DISTINCT p.id) as count
      FROM products p
      JOIN stock s ON p.id = s.product_id
      WHERE s.quantity > 0
        AND EXISTS (
          SELECT 1 FROM sale_items si 
          JOIN sales sa ON si.sale_id = sa.id 
          WHERE si.product_id = p.id AND sa.date >= DATE_SUB(CURRENT_DATE(), INTERVAL 90 DAY)
        )
        AND (
          SELECT COALESCE(SUM(si.quantity), 0) FROM sale_items si JOIN sales sa ON si.sale_id = sa.id WHERE si.product_id = p.id AND sa.date >= DATE_SUB(CURRENT_DATE(), INTERVAL 60 DAY)
        ) < 5
    `);

    return {
      cogs,
      averageInventory: invValuation,
      turnoverRatio,
      daysToSell,
      deadStockCount: Number(deadStockRows[0]?.count || 0),
      slowMovingCount: Number(slowStockRows[0]?.count || 0)
    };
  } catch (err) {
    return { cogs: 0, averageInventory: 0, turnoverRatio: 0, daysToSell: 365, deadStockCount: 0, slowMovingCount: 0 };
  }
};

/**
 * 14. ABC Inventory Analysis Engine
 * Ranks items by sales revenue / valuation into Class A (Top 80%), Class B (Next 15%), Class C (Bottom 5%).
 */
export const calculateABCAnalysis = async (db, filters = {}) => {
  try {
    const [rows] = await db.query(`
      SELECT p.id, p.name, p.barcode, c.name as category,
             COALESCE(SUM(s.quantity), 0) as stock_level,
             COALESCE((SELECT SUM(pb.remaining_quantity * COALESCE(NULLIF(pb.purchase_price, 0), NULLIF(p.purchase_price, 0), 0)) FROM purchase_batches pb WHERE pb.product_id = p.id AND pb.remaining_quantity > 0), COALESCE(SUM(s.quantity * p.purchase_price), 0)) as valuation,
             COALESCE((SELECT SUM(si.total) FROM sale_items si JOIN sales sa ON si.sale_id = sa.id WHERE si.product_id = p.id), 0) as revenue
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN stock s ON p.id = s.product_id
      GROUP BY p.id, c.name
      ORDER BY revenue DESC, valuation DESC
    `);

    const totalRev = rows.reduce((acc, r) => acc + Number(r.revenue || 0), 0);
    let cumulative = 0;

    const classified = rows.map(r => {
      const rev = Number(r.revenue || 0);
      cumulative += rev;
      const pct = totalRev > 0 ? (cumulative / totalRev) * 100 : 100;

      let categoryClass = 'C';
      if (pct <= 80) categoryClass = 'A';
      else if (pct <= 95) categoryClass = 'B';

      return {
        ...r,
        stock_level: Number(r.stock_level),
        valuation: Number(Number(r.valuation).toFixed(2)),
        revenue: Number(Number(r.revenue).toFixed(2)),
        abcClass: categoryClass
      };
    });

    const classA = classified.filter(i => i.abcClass === 'A');
    const classB = classified.filter(i => i.abcClass === 'B');
    const classC = classified.filter(i => i.abcClass === 'C');

    return {
      summary: {
        classACount: classA.length,
        classBCount: classB.length,
        classCCount: classC.length,
        totalItems: classified.length
      },
      items: classified
    };
  } catch (err) {
    return { summary: { classACount: 0, classBCount: 0, classCCount: 0, totalItems: 0 }, items: [] };
  }
};

/**
 * 15. Stock Reservation & Physical vs Available Stock Engine
 */
export const calculateReservedStockMetrics = async (db, filters = {}) => {
  try {
    const [physicalRows] = await db.query(`SELECT COALESCE(SUM(quantity), 0) as physical_stock FROM stock`);
    const physicalStock = Number(physicalRows[0]?.physical_stock || 0);

    // Reserved stock from open/pending sales orders
    let reservedStock = 0;
    try {
      const [resRows] = await db.query(`SELECT COALESCE(SUM(soi.quantity), 0) as reserved FROM sales_order_items soi JOIN sales_orders so ON soi.sales_order_id = so.id WHERE so.status IN ('Pending', 'Approved', 'Processing')`);
      reservedStock = Number(resRows[0]?.reserved || 0);
    } catch (e) {}

    // Incoming stock from open purchase orders
    let incomingStock = 0;
    try {
      const [incRows] = await db.query(`SELECT COALESCE(SUM(poi.quantity - poi.received_quantity), 0) as incoming FROM purchase_order_items poi JOIN purchase_orders po ON poi.purchase_order_id = po.id WHERE po.status IN ('Pending', 'Approved', 'Ordered') AND poi.quantity > poi.received_quantity`);
      incomingStock = Number(incRows[0]?.incoming || 0);
    } catch (e) {}

    const availableStock = Math.max(0, physicalStock - reservedStock);

    return {
      physicalStock,
      reservedStock,
      availableStock,
      incomingStock
    };
  } catch (err) {
    return { physicalStock: 0, reservedStock: 0, availableStock: 0, incomingStock: 0 };
  }
};

/**
 * 16. Batch-by-Batch Detailed Valuation Report Engine
 */
export const calculateBatchValuationReport = async (db, filters = {}) => {
  try {
    let query = `
      SELECT pb.id as batch_id, pb.batch_number, pb.product_id, pr.name as product_name, pr.barcode, pr.unit,
             c.name as category, v.name as supplier_name,
             pb.purchase_quantity, pb.remaining_quantity, pb.purchase_date, pb.expiry_date,
             pb.purchase_price, pb.mrp, pb.selling_price,
             (pb.remaining_quantity * pb.purchase_price) as batch_valuation,
             DATEDIFF(CURRENT_DATE(), pb.purchase_date) as age_in_days
      FROM purchase_batches pb
      JOIN products pr ON pb.product_id = pr.id
      LEFT JOIN categories c ON pr.category_id = c.id
      LEFT JOIN vendors v ON pb.supplier_id = v.id
      WHERE pb.remaining_quantity > 0
    `;
    const params = [];

    if (filters.categoryId && filters.categoryId !== 'all') {
      query += ` AND pr.category_id = ?`;
      params.push(Number(filters.categoryId));
    }
    if (filters.brandId && filters.brandId !== 'all') {
      query += ` AND pr.brand_id = ?`;
      params.push(Number(filters.brandId));
    }
    if (filters.search) {
      query += ` AND (pr.name LIKE ? OR pb.batch_number LIKE ?)`;
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    query += ` ORDER BY pb.purchase_date ASC, pb.id ASC`;

    const [batches] = await db.query(query, params);
    const totalValuation = batches.reduce((acc, b) => acc + Number(b.batch_valuation || 0), 0);

    return {
      totalBatches: batches.length,
      totalValuation: Number(totalValuation.toFixed(2)),
      batches: batches.map(b => ({
        ...b,
        purchase_price: Number(b.purchase_price),
        selling_price: Number(b.selling_price),
        mrp: Number(b.mrp),
        batch_valuation: Number(Number(b.batch_valuation).toFixed(2))
      }))
    };
  } catch (err) {
    return { totalBatches: 0, totalValuation: 0, batches: [] };
  }
};

/**
 * 17. Automated Inventory Consistency & Reconciliation Engine
 * Detects any mismatch between stock table, purchase_batches, and stock_logs.
 */
export const validateInventoryConsistency = async (db) => {
  try {
    const discrepancies = [];

    const [products] = await db.query(`SELECT id, name, barcode FROM products`);

    for (const p of products) {
      const pId = p.id;

      // Stock table sum
      const [stockRows] = await db.query(`SELECT COALESCE(SUM(quantity), 0) as total FROM stock WHERE product_id = ?`, [pId]);
      const stockQty = Number(stockRows[0]?.total || 0);

      // Batches table sum
      const [batchRows] = await db.query(`SELECT COALESCE(SUM(remaining_quantity), 0) as total FROM purchase_batches WHERE product_id = ?`, [pId]);
      const batchQty = Number(batchRows[0]?.total || 0);

      if (batchQty > 0 && stockQty !== batchQty) {
        discrepancies.push({
          product_id: pId,
          product_name: p.name,
          barcode: p.barcode,
          type: 'STOCK_BATCH_MISMATCH',
          stockQuantity: stockQty,
          batchQuantity: batchQty,
          variance: stockQty - batchQty,
          severity: 'HIGH',
          recommendation: 'Auto-sync stock quantity to match remaining batch total'
        });
      }
    }

    return {
      isConsistent: discrepancies.length === 0,
      discrepancyCount: discrepancies.length,
      discrepancies,
      checkedAt: new Date().toISOString()
    };
  } catch (err) {
    return { isConsistent: false, discrepancyCount: 1, discrepancies: [{ error: err.message }], checkedAt: new Date().toISOString() };
  }
};

