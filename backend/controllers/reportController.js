import {
  getExecutiveDashboardKPIs,
  calculateInventoryValuation,
  calculatePurchaseExpenses,
  calculateTotalSales,
  calculateCOGS,
  calculateNetProfit,
  calculateStockCounts,
  calculateStockDestroy,
  calculateStockAdjustments,
  calculateBorrowLedger,
  calculateStockAging,
  calculateInventoryTurnover,
  calculateABCAnalysis,
  calculateReservedStockMetrics,
  calculateBatchValuationReport,
  validateInventoryConsistency,
  getValuationDrillDown
} from '../services/calculationService.js';

// @desc    Get dashboard metrics / KPIs for tenant
// @route   GET /api/reports/dashboard-kpis
// @access  Private
export const getDashboardKPIs = async (req, res, next) => {
  try {
    const kpis = await getExecutiveDashboardKPIs(req.db, req.query);

    // Near Expiry products (active FIFO batch within 30 days)
    const [nearExpiry] = await req.db.query(`
      SELECT COUNT(*) as count FROM (
        SELECT p.id, 
               COALESCE(
                 (SELECT pb.expiry_date FROM purchase_batches pb WHERE pb.product_id = p.id AND pb.remaining_quantity > 0 AND pb.expiry_date IS NOT NULL AND pb.expiry_date != '' AND pb.expiry_date != 'N/A' AND pb.expiry_date != '0000-00-00' ORDER BY pb.purchase_date ASC, pb.id ASC LIMIT 1),
                 p.expiry_date
               ) as active_expiry
        FROM products p
      ) t
      WHERE t.active_expiry IS NOT NULL 
        AND t.active_expiry > CURRENT_DATE() 
        AND t.active_expiry <= DATE_ADD(CURRENT_DATE(), INTERVAL 30 DAY)
    `);

    // Expired products (active FIFO batch expired)
    const [expired] = await req.db.query(`
      SELECT COUNT(*) as count FROM (
        SELECT p.id, 
               COALESCE(
                 (SELECT pb.expiry_date FROM purchase_batches pb WHERE pb.product_id = p.id AND pb.remaining_quantity > 0 AND pb.expiry_date IS NOT NULL AND pb.expiry_date != '' AND pb.expiry_date != 'N/A' AND pb.expiry_date != '0000-00-00' ORDER BY pb.purchase_date ASC, pb.id ASC LIMIT 1),
                 p.expiry_date
               ) as active_expiry
        FROM products p
      ) t
      WHERE t.active_expiry IS NOT NULL 
        AND t.active_expiry <= CURRENT_DATE()
    `);

    // Category Distribution (Valuation & products count per category using FIFO batch cost)
    const [categoryDist] = await req.db.query(`
      SELECT c.name as name, COUNT(p.id) as value,
             COALESCE(
               (SELECT SUM(pb.remaining_quantity * COALESCE(NULLIF(pb.purchase_price, 0), NULLIF(pr2.purchase_price, 0), 0)) 
                FROM purchase_batches pb 
                JOIN products pr2 ON pb.product_id = pr2.id 
                WHERE pr2.category_id = c.id AND pb.remaining_quantity > 0),
               GREATEST(0, COALESCE(SUM(s.quantity), 0) * COALESCE(p.purchase_price, 0))
             ) as valuation
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id
      LEFT JOIN stock s ON p.id = s.product_id
      GROUP BY c.id
    `);

    return res.status(200).json({
      success: true,
      kpis: {
        ...kpis,
        nearExpiry: nearExpiry[0].count,
        expired: expired[0].count
      },
      categoryDist
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get chart statistics for tenant
// @route   GET /api/reports/dashboard-charts
// @access  Private
export const getDashboardCharts = async (req, res, next) => {
  try {
    // 1. Sales vs Purchases Trends (Monthly breakdown of last 6 months after sales and purchase returns)
    const [salesTrend] = await req.db.query(`
      SELECT DATE_FORMAT(s.date, '%b %Y') as month, 
             GREATEST(0, COALESCE(SUM(s.total), 0) - COALESCE((SELECT SUM(sr.refund_amount) FROM sales_returns sr JOIN sales s2 ON sr.sale_id = s2.id WHERE DATE_FORMAT(s2.date, '%Y-%m') = DATE_FORMAT(s.date, '%Y-%m')), 0)) as sales
      FROM sales s
      WHERE s.date >= DATE_SUB(CURRENT_DATE(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(s.date, '%Y-%m')
      ORDER BY s.date ASC
    `);

    const [purchaseTrend] = await req.db.query(`
      SELECT DATE_FORMAT(p.date, '%b %Y') as month, 
             GREATEST(0, COALESCE(SUM(p.total), 0) - COALESCE((SELECT SUM(pr.total_amount) FROM purchase_returns pr WHERE pr.purchase_id = p.id AND pr.status != 'Cancelled'), 0)) as purchases
      FROM purchases p
      WHERE p.date >= DATE_SUB(CURRENT_DATE(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(p.date, '%Y-%m')
      ORDER BY p.date ASC
    `);

    // Calculate monthly COGS for real profit computation
    const [monthlyCogs] = await req.db.query(`
      SELECT DATE_FORMAT(s.date, '%b %Y') as month,
             COALESCE(SUM(
               (si.quantity - COALESCE((SELECT SUM(quantity) FROM sales_returns WHERE sale_id = si.sale_id AND product_id = si.product_id), 0)) *
               COALESCE(
                 NULLIF((SELECT pb.purchase_price FROM purchase_batches pb WHERE pb.product_id = si.product_id AND pb.batch_number = si.batch_number AND pb.purchase_price > 0 LIMIT 1), 0),
                 NULLIF(pr.purchase_price, 0),
                 (SELECT NULLIF(pi.purchase_price, 0) FROM purchase_items pi WHERE pi.product_id = si.product_id AND pi.purchase_price > 0 ORDER BY pi.id DESC LIMIT 1),
                 0
               )
             ), 0) as cogs
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      JOIN products pr ON si.product_id = pr.id
      WHERE s.date >= DATE_SUB(CURRENT_DATE(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(s.date, '%Y-%m')
    `);

    // Merge monthly sales and purchases and calculate Net Profit = Net Sales - COGS
    const monthlyTrends = [];
    const months = [...new Set([...salesTrend.map(s => s.month), ...purchaseTrend.map(p => p.month)])];
    for (const m of months) {
      const sVal = Math.max(0, Number(salesTrend.find(s => s.month === m)?.sales || 0));
      const pVal = Math.max(0, Number(purchaseTrend.find(p => p.month === m)?.purchases || 0));
      const cVal = Math.max(0, Number(monthlyCogs.find(c => c.month === m)?.cogs || 0));
      const profitVal = Math.max(0, sVal - cVal);

      monthlyTrends.push({
        name: m,
        Sales: sVal,
        Purchases: pVal,
        Profit: profitVal
      });
    }

    // 2. Category Distribution (Valuation & products count per category using FIFO batch cost)
    const [categoryDist] = await req.db.query(`
      SELECT c.name as name, COUNT(p.id) as value,
             COALESCE(
               (SELECT SUM(pb.remaining_quantity * COALESCE(NULLIF(pb.purchase_price, 0), NULLIF(pr2.purchase_price, 0), 0)) 
                FROM purchase_batches pb 
                JOIN products pr2 ON pb.product_id = pr2.id 
                WHERE pr2.category_id = c.id AND pb.remaining_quantity > 0),
               GREATEST(0, COALESCE(SUM(s.quantity), 0) * COALESCE(p.purchase_price, 0))
             ) as valuation
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id
      LEFT JOIN stock s ON p.id = s.product_id
      GROUP BY c.id
    `);

    // 3. Warehouse Distribution (Stock quantity per warehouse)
    const [warehouseDist] = await req.db.query(`
      SELECT w.name as name, COALESCE(SUM(s.quantity), 0) as value
      FROM warehouses w
      LEFT JOIN stock s ON w.id = s.warehouse_id
      GROUP BY w.id
    `);

    // 4. Daily Sales (Last 15 days, net of returns)
    const [dailySales] = await req.db.query(`
      SELECT DATE_FORMAT(s.date, '%d %b') as dateLabel, 
             GREATEST(0, SUM(s.total) - COALESCE((SELECT SUM(sr.refund_amount) FROM sales_returns sr JOIN sales s2 ON sr.sale_id = s2.id WHERE s2.date = s.date), 0)) as amount
      FROM sales s
      WHERE s.date >= DATE_SUB(CURRENT_DATE(), INTERVAL 15 DAY)
      GROUP BY s.date
      ORDER BY s.date ASC
    `);

    // 5. Stock Movement (Logs aggregated by date last 7 days)
    const [stockMovement] = await req.db.query(`
      SELECT DATE_FORMAT(created_at, '%d %b') as dateLabel,
             SUM(CASE WHEN type = 'Stock In' OR (type = 'Adjustment' AND quantity > 0) THEN quantity ELSE 0 END) as stockIn,
             SUM(CASE WHEN type = 'Stock Out' THEN ABS(quantity) WHEN type = 'Adjustment' AND quantity < 0 THEN ABS(quantity) ELSE 0 END) as stockOut
      FROM stock_logs
      WHERE created_at >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)
      GROUP BY DATE(created_at)
      ORDER BY created_at ASC
    `);

    return res.status(200).json({
      success: true,
      charts: {
        monthlyTrends,
        categoryDist,
        warehouseDist,
        dailySales,
        stockMovement
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Detailed Stock / Inventory Valuations Report for tenant
// @route   GET /api/reports/inventory
// @access  Private
// @desc    Get Inventory Valuation Report for tenant
// @route   GET /api/reports/inventory
// @access  Private
export const getInventoryReport = async (req, res, next) => {
  try {
    const { categoryId, brandId, search } = req.query;
    let query = `
      SELECT p.id, p.name, p.barcode, COALESCE(b.name, '') as brand, COALESCE(sc.name, '') as sub_category, c.name as category, p.unit, p.purchase_price, p.selling_price,
             COALESCE(
               (SELECT SUM(pb.remaining_quantity) FROM purchase_batches pb WHERE pb.product_id = p.id AND pb.remaining_quantity > 0),
               COALESCE(SUM(s.quantity), 0)
             ) as stock_level,
             COALESCE(
               (SELECT SUM(pb.remaining_quantity * COALESCE(NULLIF(pb.purchase_price, 0), NULLIF(p.purchase_price, 0), 0)) FROM purchase_batches pb WHERE pb.product_id = p.id AND pb.remaining_quantity > 0),
               GREATEST(0, COALESCE(SUM(s.quantity), 0) * COALESCE(p.purchase_price, 0))
             ) as valuation
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN sub_categories sc ON p.sub_category_id = sc.id
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN stock s ON p.id = s.product_id
      WHERE 1=1
    `;
    const params = [];

    if (categoryId && categoryId !== 'all') {
      query += ` AND p.category_id = ?`;
      params.push(Number(categoryId));
    }
    if (brandId && brandId !== 'all') {
      query += ` AND p.brand_id = ?`;
      params.push(Number(brandId));
    }
    if (search) {
      query += ` AND (p.name LIKE ? OR p.barcode LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ` GROUP BY p.id, b.name, sc.name, c.name ORDER BY p.name ASC`;

    const [report] = await req.db.query(query, params);
    return res.status(200).json({ success: true, report });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Sales & Taxes Report for tenant (net of returns)
// @route   GET /api/reports/sales
// @access  Private
export const getSalesReport = async (req, res, next) => {
  try {
    const { startDate, endDate, customerId, employeeId, paymentMethod } = req.query;
    let query = `
      SELECT s.id, s.invoice_no, s.date, c.name as customer, s.subtotal, s.discount, s.gst_amount, s.total, s.payment_method,
             COALESCE((SELECT SUM(refund_amount) FROM sales_returns WHERE sale_id = s.id), 0) as returned_amount,
             GREATEST(0, s.total - COALESCE((SELECT SUM(refund_amount) FROM sales_returns WHERE sale_id = s.id), 0)) as net_total
      FROM sales s
      JOIN customers c ON s.customer_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (startDate) {
      query += ` AND DATE(s.date) >= ?`;
      params.push(startDate);
    }
    if (endDate) {
      query += ` AND DATE(s.date) <= ?`;
      params.push(endDate);
    }
    if (customerId && customerId !== 'all') {
      query += ` AND s.customer_id = ?`;
      params.push(Number(customerId));
    }
    if (employeeId && employeeId !== 'all') {
      query += ` AND s.user_id = ?`;
      params.push(Number(employeeId));
    }
    if (paymentMethod && paymentMethod !== 'all') {
      query += ` AND s.payment_method = ?`;
      params.push(paymentMethod);
    }

    query += ` ORDER BY s.date DESC, s.id DESC`;

    const [report] = await req.db.query(query, params);
    return res.status(200).json({ success: true, report });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Purchase Report for tenant
// @route   GET /api/reports/purchases
// @access  Private
export const getPurchaseReport = async (req, res, next) => {
  try {
    const { startDate, endDate, vendorId, paymentStatus } = req.query;
    let query = `
      SELECT p.id, p.purchase_no, p.date, v.name as vendor, p.subtotal, p.discount, p.gst_amount, p.total, p.payment_status,
             COALESCE((SELECT SUM(total_amount) FROM purchase_returns WHERE purchase_id = p.id AND status != 'Cancelled'), 0) as vendor_returns,
             GREATEST(0, p.total - COALESCE((SELECT SUM(total_amount) FROM purchase_returns WHERE purchase_id = p.id AND status != 'Cancelled'), 0)) as net_total
      FROM purchases p
      JOIN vendors v ON p.vendor_id = v.id
      WHERE 1=1
    `;
    const params = [];

    if (startDate) {
      query += ` AND DATE(p.date) >= ?`;
      params.push(startDate);
    }
    if (endDate) {
      query += ` AND DATE(p.date) <= ?`;
      params.push(endDate);
    }
    if (vendorId && vendorId !== 'all') {
      query += ` AND p.vendor_id = ?`;
      params.push(Number(vendorId));
    }
    if (paymentStatus && paymentStatus !== 'all') {
      query += ` AND p.payment_status = ?`;
      params.push(paymentStatus);
    }

    query += ` ORDER BY p.date DESC, p.id DESC`;

    const [report] = await req.db.query(query, params);
    return res.status(200).json({ success: true, report });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Sales Dashboard KPIs and Analytics
// @route   GET /api/reports/sales-dashboard
// @access  Private (Admin & Sales Manager only)
export const getSalesDashboardData = async (req, res, next) => {
  try {
    const { startDate, endDate, employeeId, customerId, productId, paymentStatus } = req.query;

    // 1. Calculate Today's KPIs (Deducting Sales Returns)
    const [todaySalesResult] = await req.db.query(
      'SELECT COALESCE(SUM(total), 0) as gross_revenue, COUNT(id) as orders FROM sales WHERE date = CURRENT_DATE()'
    );
    const [todayReturnsResult] = await req.db.query(
      'SELECT COALESCE(SUM(refund_amount), 0) as returns_amount, COUNT(id) as count FROM sales_returns WHERE DATE(created_at) = CURRENT_DATE()'
    );
    const [todayCogsResult] = await req.db.query(
      `SELECT COALESCE(SUM(
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
       WHERE s.date = CURRENT_DATE()`
    );

    const todayReturns = Number(todayReturnsResult[0].returns_amount);
    const todayRevenue = Math.max(0, Number(todaySalesResult[0].gross_revenue) - todayReturns);
    const todayOrders = Number(todaySalesResult[0].orders);
    const todayCogs = Math.max(0, Number(todayCogsResult[0].cogs));
    const todayProfit = Math.max(0, todayRevenue - todayCogs);

    // 2. Calculate Monthly KPIs (Current Month vs Last Month for growth)
    const [currentMonthSalesResult] = await req.db.query(
      `SELECT COALESCE(SUM(total), 0) as gross_revenue, COUNT(id) as orders 
       FROM sales 
       WHERE DATE_FORMAT(date, '%Y-%m') = DATE_FORMAT(CURRENT_DATE(), '%Y-%m')`
    );
    const [currentMonthReturnsResult] = await req.db.query(
      `SELECT COALESCE(SUM(refund_amount), 0) as returns_amount 
       FROM sales_returns 
       WHERE DATE_FORMAT(created_at, '%Y-%m') = DATE_FORMAT(CURRENT_DATE(), '%Y-%m')`
    );
    const [currentMonthCogsResult] = await req.db.query(
      `SELECT COALESCE(SUM(
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
       WHERE DATE_FORMAT(s.date, '%Y-%m') = DATE_FORMAT(CURRENT_DATE(), '%Y-%m')`
    );
    const [lastMonthRevenueResult] = await req.db.query(
      `SELECT COALESCE(SUM(total), 0) - COALESCE((SELECT SUM(refund_amount) FROM sales_returns sr JOIN sales s2 ON sr.sale_id = s2.id WHERE DATE_FORMAT(s2.date, '%Y-%m') = DATE_FORMAT(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH), '%Y-%m')), 0) as revenue 
       FROM sales 
       WHERE DATE_FORMAT(date, '%Y-%m') = DATE_FORMAT(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH), '%Y-%m')`
    );

    const monthlyReturns = Number(currentMonthReturnsResult[0].returns_amount);
    const monthlyRevenue = Math.max(0, Number(currentMonthSalesResult[0].gross_revenue) - monthlyReturns);
    const monthlyOrders = Number(currentMonthSalesResult[0].orders);
    const monthlyCogs = Math.max(0, Number(currentMonthCogsResult[0].cogs));
    const monthlyProfit = Math.max(0, monthlyRevenue - monthlyCogs);
    
    const lastMonthRevenue = Number(lastMonthRevenueResult[0].revenue);
    const monthlyGrowth = lastMonthRevenue > 0 
      ? ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
      : 100;

    // 3. Build filtered queries for charts and tables
    let filterQuery = ' WHERE 1=1';
    const filterParams = [];

    if (startDate) {
      filterQuery += ' AND s.date >= ?';
      filterParams.push(startDate);
    }
    if (endDate) {
      filterQuery += ' AND s.date <= ?';
      filterParams.push(endDate);
    }
    if (employeeId) {
      filterQuery += ' AND s.user_id = ?';
      filterParams.push(Number(employeeId));
    }
    if (customerId) {
      filterQuery += ' AND s.customer_id = ?';
      filterParams.push(Number(customerId));
    }
    if (productId) {
      filterQuery += ' AND s.id IN (SELECT sale_id FROM sale_items WHERE product_id = ?)';
      filterParams.push(Number(productId));
    }
    if (paymentStatus && paymentStatus !== 'all') {
      filterQuery += ' AND s.payment_status = ?';
      filterParams.push(paymentStatus);
    }

    // Daily Sales chart data (filtered)
    const [dailyPerformance] = await req.db.query(
      `SELECT DATE_FORMAT(s.date, '%Y-%m-%d') as label, SUM(s.total) as revenue, COUNT(s.id) as orders
       FROM sales s
       ${filterQuery}
       GROUP BY s.date
       ORDER BY s.date ASC`,
      filterParams
    );

    // Weekly Sales chart data (filtered)
    const [weeklyPerformance] = await req.db.query(
      `SELECT DATE_FORMAT(s.date, '%Y-w%v') as label, SUM(s.total) as revenue, COUNT(s.id) as orders
       FROM sales s
       ${filterQuery}
       GROUP BY WEEK(s.date)
       ORDER BY s.date ASC`,
      filterParams
    );

    // Monthly Sales chart data (filtered)
    const [monthlyPerformance] = await req.db.query(
      `SELECT DATE_FORMAT(s.date, '%b %Y') as label, SUM(s.total) as revenue, COUNT(s.id) as orders
       FROM sales s
       ${filterQuery}
       GROUP BY DATE_FORMAT(s.date, '%Y-%m')
       ORDER BY s.date ASC`,
      filterParams
    );

    // Top Selling Products
    const [topProducts] = await req.db.query(
      `SELECT p.id, p.name, p.barcode, 
              SUM(si.quantity - COALESCE((SELECT SUM(quantity) FROM sales_returns WHERE sale_id = si.sale_id AND product_id = si.product_id), 0)) as quantity_sold, 
              SUM(si.total - COALESCE((SELECT SUM(refund_amount) FROM sales_returns WHERE sale_id = si.sale_id AND product_id = si.product_id), 0)) as total_sales
       FROM sale_items si
       JOIN sales s ON si.sale_id = s.id
       JOIN products p ON si.product_id = p.id
       ${filterQuery}
       GROUP BY p.id
       ORDER BY total_sales DESC
       LIMIT 10`,
      filterParams
    );

    // Top Customers
    const [topCustomers] = await req.db.query(
      `SELECT c.id, c.name, COUNT(s.id) as orders_count, SUM(s.total) as total_spent
       FROM sales s
       JOIN customers c ON s.customer_id = c.id
       ${filterQuery}
       GROUP BY c.id
       ORDER BY total_spent DESC
       LIMIT 10`,
      filterParams
    );

    // Payment method distribution from itemized sale_payments or sales fallback
    let paymentDistribution = [];
    try {
      const [spDist] = await req.db.query(
        `SELECT sp.payment_method as name, COUNT(DISTINCT sp.sale_id) as value, SUM(sp.amount) as amount
         FROM sale_payments sp
         JOIN sales s ON sp.sale_id = s.id
         ${filterQuery}
         GROUP BY sp.payment_method`,
        filterParams
      );
      if (spDist && spDist.length > 0) {
        paymentDistribution = spDist;
      }
    } catch (e) {}

    if (paymentDistribution.length === 0) {
      const [legacyDist] = await req.db.query(
        `SELECT s.payment_method as name, COUNT(s.id) as value, SUM(s.total) as amount
         FROM sales s
         ${filterQuery}
         GROUP BY s.payment_method`,
        filterParams
      );
      paymentDistribution = legacyDist;
    }

    // Returned orders list
    const [returnedOrders] = await req.db.query(
      `SELECT sr.id, sr.invoice_no, sr.refund_amount, sr.reason, sr.created_at, p.name as product_name, sr.quantity
       FROM sales_returns sr
       JOIN products p ON sr.product_id = p.id
       JOIN sales s ON sr.sale_id = s.id
       ${filterQuery}
       ORDER BY sr.created_at DESC`,
      filterParams
    );

    return res.status(200).json({
      success: true,
      kpis: {
        todaySales: todayOrders,
        todayRevenue,
        todayOrders,
        todayProfit,
        todayReturns,
        monthlySales: monthlyOrders,
        monthlyRevenue,
        monthlyProfit,
        monthlyGrowth,
        monthlyOrders
      },
      charts: {
        daily: dailyPerformance,
        weekly: weeklyPerformance,
        monthly: monthlyPerformance,
        topProducts,
        topCustomers,
        paymentDistribution,
        returnedOrders
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Vendor-wise Purchases Summary
// @route   GET /api/reports/vendor-purchases
// @access  Private
export const getVendorPurchasesReport = async (req, res, next) => {
  try {
    const [report] = await req.db.query(`
      SELECT v.id as vendor_id, v.name as vendor_name, v.company_name,
             COUNT(p.id) as purchases_count, 
             COALESCE(SUM(p.total), 0) as total_purchased
      FROM vendors v
      LEFT JOIN purchases p ON v.id = p.vendor_id
      GROUP BY v.id
      ORDER BY total_purchased DESC
    `);
    return res.status(200).json({ success: true, report });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Vendor-wise Inventory Valuation
// @route   GET /api/reports/vendor-inventory
// @access  Private
export const getVendorInventoryReport = async (req, res, next) => {
  try {
    const [report] = await req.db.query(`
      SELECT v.id as vendor_id, v.name as vendor_name, 
             pr.id as product_id, pr.name as product_name, pr.barcode, pr.unit,
             COALESCE(SUM(s.quantity), 0) as stock_level, 
             COALESCE(
               (SELECT SUM(pb.remaining_quantity * COALESCE(NULLIF(pb.purchase_price, 0), NULLIF(pr.purchase_price, 0), 0)) FROM purchase_batches pb WHERE pb.product_id = pr.id AND pb.supplier_id = v.id AND pb.remaining_quantity > 0),
               COALESCE(SUM(s.quantity * pr.purchase_price), 0)
             ) as valuation
      FROM vendors v
      JOIN stock s ON v.id = s.vendor_id
      JOIN products pr ON s.product_id = pr.id
      GROUP BY v.id, pr.id
      ORDER BY v.name ASC, stock_level DESC
    `);
    return res.status(200).json({ success: true, report });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Stock Returns Analytics and logs
// @route   GET /api/reports/vendor-returns
// @access  Private
export const getVendorReturnsReport = async (req, res, next) => {
  try {
    const [returnsList] = await req.db.query(`
      SELECT pr.*, v.name as vendor_name, p.name as product_name, p.barcode
      FROM purchase_returns pr
      JOIN vendors v ON pr.vendor_id = v.id
      JOIN products p ON pr.product_id = p.id
      ORDER BY pr.created_at DESC
    `);

    const [reasonStats] = await req.db.query(`
      SELECT reason, COUNT(id) as count, COALESCE(SUM(total_amount), 0) as total_amount
      FROM purchase_returns
      GROUP BY reason
    `);

    const [vendorStats] = await req.db.query(`
      SELECT v.name as vendor_name, COUNT(pr.id) as count, COALESCE(SUM(pr.total_amount), 0) as total_amount
      FROM purchase_returns pr
      JOIN vendors v ON pr.vendor_id = v.id
      GROUP BY v.id
    `);

    return res.status(200).json({
      success: true,
      report: {
        returnsList,
        reasonStats,
        vendorStats
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Advanced reports & analytical metrics
// @route   GET /api/reports/advanced-analytics
// @access  Private
export const getAdvancedAnalyticsData = async (req, res, next) => {
  try {
    const {
      scope = 'overall',
      productId,
      categoryId,
      brand,
      vendorId,
      customerId,
      employeeId,
      timeScale = 'daily',
      startDate,
      endDate,
      compareStartDate,
      compareEndDate
    } = req.query;

    const db = req.db;

    // Date formatting helper based on scale
    let salesLabelExpr = "DATE_FORMAT(s.date, '%Y-%m-%d')";
    let purchLabelExpr = "DATE_FORMAT(p.date, '%Y-%m-%d')";
    if (timeScale === 'monthly') {
      salesLabelExpr = "DATE_FORMAT(s.date, '%b %Y')";
      purchLabelExpr = "DATE_FORMAT(p.date, '%b %Y')";
    } else if (timeScale === 'yearly') {
      salesLabelExpr = "DATE_FORMAT(s.date, '%Y')";
      purchLabelExpr = "DATE_FORMAT(p.date, '%Y')";
    }

    // Dynamic WHERE clauses
    let salesWhere = ' WHERE 1=1';
    const salesParams = [];

    let purchWhere = ' WHERE 1=1';
    const purchParams = [];

    let logsWhere = ' WHERE 1=1';
    const logsParams = [];

    if (startDate && endDate) {
      salesWhere += ' AND s.date BETWEEN ? AND ?';
      salesParams.push(startDate + ' 00:00:00', endDate + ' 23:59:59');

      purchWhere += ' AND p.date BETWEEN ? AND ?';
      purchParams.push(startDate + ' 00:00:00', endDate + ' 23:59:59');

      logsWhere += ' AND sl.created_at BETWEEN ? AND ?';
      logsParams.push(startDate + ' 00:00:00', endDate + ' 23:59:59');
    }

    if (productId) {
      salesWhere += ' AND EXISTS (SELECT 1 FROM sale_items si_sub WHERE si_sub.sale_id = s.id AND si_sub.product_id = ?)';
      salesParams.push(Number(productId));

      purchWhere += ' AND EXISTS (SELECT 1 FROM purchase_items pi_sub WHERE pi_sub.purchase_id = p.id AND pi_sub.product_id = ?)';
      purchParams.push(Number(productId));

      logsWhere += ' AND sl.product_id = ?';
      logsParams.push(Number(productId));
    }

    if (categoryId) {
      salesWhere += ' AND EXISTS (SELECT 1 FROM sale_items si_sub JOIN products pr_sub ON si_sub.product_id = pr_sub.id WHERE si_sub.sale_id = s.id AND pr_sub.category_id = ?)';
      salesParams.push(Number(categoryId));

      purchWhere += ' AND EXISTS (SELECT 1 FROM purchase_items pi_sub JOIN products pr_sub ON pi_sub.product_id = pr_sub.id WHERE pi_sub.purchase_id = p.id AND pr_sub.category_id = ?)';
      purchParams.push(Number(categoryId));

      logsWhere += ' AND EXISTS (SELECT 1 FROM products pr_sub WHERE pr_sub.id = sl.product_id AND pr_sub.category_id = ?)';
      logsParams.push(Number(categoryId));
    }

    if (brand) {
      salesWhere += ' AND EXISTS (SELECT 1 FROM sale_items si_sub JOIN products pr_sub ON si_sub.product_id = pr_sub.id WHERE si_sub.sale_id = s.id AND (pr_sub.brand = ? OR pr_sub.brand_id = ?))';
      salesParams.push(brand, brand);

      purchWhere += ' AND EXISTS (SELECT 1 FROM purchase_items pi_sub JOIN products pr_sub ON pi_sub.product_id = pr_sub.id WHERE pi_sub.purchase_id = p.id AND (pr_sub.brand = ? OR pr_sub.brand_id = ?))';
      purchParams.push(brand, brand);

      logsWhere += ' AND EXISTS (SELECT 1 FROM products pr_sub WHERE pr_sub.id = sl.product_id AND (pr_sub.brand = ? OR pr_sub.brand_id = ?))';
      logsParams.push(brand, brand);
    }

    if (vendorId) {
      purchWhere += ' AND p.vendor_id = ?';
      purchParams.push(Number(vendorId));

      salesWhere += ' AND EXISTS (SELECT 1 FROM stock_logs sl_sub WHERE sl_sub.reference_no = s.invoice_no AND sl_sub.vendor_id = ?)';
      salesParams.push(Number(vendorId));

      logsWhere += ' AND sl.vendor_id = ?';
      logsParams.push(Number(vendorId));
    }

    if (customerId) {
      salesWhere += ' AND s.customer_id = ?';
      salesParams.push(Number(customerId));
    }

    if (employeeId) {
      salesWhere += ' AND s.user_id = ?';
      salesParams.push(Number(employeeId));
    }

    // ── 1. KPI COUNTERS ────────────────────────────────────────────────────────
    let kpis = {};

    if (scope === 'product' && productId) {
      const pIdNum = Number(productId);

      // Product Specific Metrics
      const [soldRes] = await db.query(
        `SELECT COALESCE(SUM(si.quantity), 0) as sold_qty, COALESCE(SUM(si.total), 0) as revenue
         FROM sale_items si JOIN sales s ON si.sale_id = s.id ${salesWhere} AND si.product_id = ?`,
        [...salesParams, pIdNum]
      );
      const [purchRes] = await db.query(
        `SELECT COALESCE(SUM(pi.quantity), 0) as purch_qty
         FROM purchase_items pi JOIN purchases p ON pi.purchase_id = p.id ${purchWhere} AND pi.product_id = ?`,
        [...purchParams, pIdNum]
      );
      const [stockRes] = await db.query(
        'SELECT COALESCE(SUM(quantity), 0) as current_stock FROM stock WHERE product_id = ?',
        [pIdNum]
      );
      const [returnsRes] = await db.query(
        'SELECT COALESCE(SUM(quantity), 0) as ret_qty, COALESCE(SUM(refund_amount), 0) as ret_amt FROM sales_returns WHERE product_id = ?',
        [pIdNum]
      );

      const netSoldQty = Math.max(0, Number(soldRes[0].sold_qty) - Number(returnsRes[0].ret_qty));
      const netRevenue = Math.max(0, Number(soldRes[0].revenue) - Number(returnsRes[0].ret_amt));

      kpis = {
        unitsSold: netSoldQty,
        revenue: netRevenue,
        unitsPurchased: Number(purchRes[0].purch_qty),
        currentStock: Number(stockRes[0].current_stock),
        returnsQty: Number(returnsRes[0].ret_qty),
        returnsAmount: Number(returnsRes[0].ret_amt)
      };
    } else {
      const salesCalc = (await calculateTotalSales(db, req.query)) || {};
      const purchCalc = (await calculatePurchaseExpenses(db, req.query)) || {};
      const cogsCalc = Number((await calculateCOGS(db, req.query)) || 0);
      const invValuation = Number((await calculateInventoryValuation(db, req.query)) || 0);
      const stockCounts = (await calculateStockCounts(db, req.query)) || {};
      const destroyCalc = (await calculateStockDestroy(db, req.query)) || {};
      const borrowCalc = (await calculateBorrowLedger(db, req.query)) || {};
      const stockAdjustments = (await calculateStockAdjustments(db, req.query)) || {};

      const adjGain = Number(stockAdjustments.adjustmentGain || 0);
      const adjLoss = Number(stockAdjustments.adjustmentLoss || 0);
      const destCost = Number(destroyCalc.destroyCost || 0);
      const netSalesVal = Number(salesCalc.netSales || 0);

      const grossProfitCalc = Number((netSalesVal - cogsCalc).toFixed(2));
      const grossMarginPct = netSalesVal > 0 ? Number(((grossProfitCalc / netSalesVal) * 100).toFixed(2)) : 0;
      const netProfit = Math.max(0, netSalesVal - cogsCalc + adjGain - adjLoss - destCost);
      const marginPct = netSalesVal > 0 ? Number(((netProfit / netSalesVal) * 100).toFixed(2)) : 0;

      const [unitsSoldTotalRes] = await db.query(`
        SELECT COALESCE(SUM(si.quantity), 0) as total_units_sold
        FROM sale_items si JOIN sales s ON si.sale_id = s.id
        ${salesWhere}
      `, salesParams);
      const totalUnitsSold = Number(unitsSoldTotalRes[0]?.total_units_sold || 0);

      // Build transfer WHERE that respects date filter
      let transferWhere = "WHERE status IN ('Completed', 'In Transit')";
      const transferParams = [];
      if (startDate) { transferWhere += ' AND DATE(created_at) >= ?'; transferParams.push(startDate); }
      if (endDate)   { transferWhere += ' AND DATE(created_at) <= ?'; transferParams.push(endDate); }

      const [transferValRes] = await db.query(`
        SELECT COALESCE(SUM(total_value), 0) as total_transfer_value, COALESCE(SUM(quantity), 0) as total_transfer_qty
        FROM stock_transfers
        ${transferWhere}
      `, transferParams);
      const totalStockTransferredValue = Number(transferValRes[0]?.total_transfer_value || 0);
      const totalStockTransferredQty = Number(transferValRes[0]?.total_transfer_qty || 0);

      kpis = {
        totalSales: salesCalc.netSales,
        unitsSold: totalUnitsSold,
        grossSales: salesCalc.grossSales,
        salesCount: salesCalc.salesCount,
        salesReturns: salesCalc.salesReturns,
        totalPurchases: purchCalc.netPurchaseExpenses,
        grossPurchases: purchCalc.grossPurchases,
        netPurchaseSubtotalExclTax: purchCalc.netSubtotalExclTax,
        purchaseGst: purchCalc.totalGst > 0 ? purchCalc.totalGst : purchCalc.stockGst,
        stockGst: purchCalc.stockGst,
        vendorReturns: purchCalc.vendorReturns,
        totalStockTransferredValue,
        totalStockTransferredQty,
        stockDestroyCost: destroyCalc.destroyCost,
        stockDestroyQty: destroyCalc.destroyQty,
        borrowOutstanding: borrowCalc.borrowOutstanding,
        totalBorrow: borrowCalc.totalBorrow,
        totalPaid: borrowCalc.totalPaid,
        inventoryValue: invValuation,
        inventoryAdjustmentGain: stockAdjustments.adjustmentGain,
        inventoryAdjustmentLoss: stockAdjustments.adjustmentLoss,
        netInventoryAdjustment: stockAdjustments.netInventoryAdjustment,
        wastageLoss: stockAdjustments.wastageLoss,
        increasedQty: stockAdjustments.increasedQty || 0,
        decreasedQty: stockAdjustments.decreasedQty || 0,
        netQty: stockAdjustments.netQty || 0,
        wastageQty: stockAdjustments.wastageQty || 0,
        adjustmentCount: stockAdjustments.adjustmentCount || 0,
        lowStockCount: stockCounts.lowStockCount,
        outOfStockCount: stockCounts.outOfStockCount,
        cogs: cogsCalc,
        grossProfit: grossProfitCalc,
        grossMargin: grossMarginPct,
        profit: netProfit,
        profitMargin: marginPct,
        growth: 0
      };

      // Calculate comparison growth % if comparison dates provided
      if (compareStartDate && compareEndDate) {
        const [compSalesRes] = await db.query(`
          SELECT COALESCE(SUM(s.total), 0) as comp_sales
          FROM sales s WHERE s.date BETWEEN ? AND ?
        `, [compareStartDate, compareEndDate]);

        const compSales = Number(compSalesRes[0].comp_sales);
        if (compSales > 0) {
          kpis.growth = Number((((salesCalc.netSales - compSales) / compSales) * 100).toFixed(1));
        } else {
          kpis.growth = 100;
        }
      }
    }

    // ── 2. PERIOD TRENDS CHART DATA (trends) ──────────────────────────────────
    const [salesTrend] = await db.query(`
      SELECT ${salesLabelExpr} as label, 
             GREATEST(0, SUM(s.total) - COALESCE((SELECT SUM(sr.refund_amount) FROM sales_returns sr JOIN sales s2 ON sr.sale_id = s2.id WHERE DATE(s2.date) = DATE(s.date)), 0)) as revenue,
             COALESCE((SELECT SUM(si.quantity) FROM sale_items si JOIN sales s2 ON si.sale_id = s2.id WHERE DATE(s2.date) = DATE(s.date)), 0) as units_sold
      FROM sales s
      ${salesWhere}
      GROUP BY label
      ORDER BY s.date ASC
    `, salesParams);

    const [purchTrend] = await db.query(`
      SELECT ${purchLabelExpr} as label, 
             GREATEST(0, SUM(p.total) - COALESCE((SELECT SUM(pr.total_amount) FROM purchase_returns pr WHERE pr.purchase_id = p.id AND (pr.status IS NULL OR pr.status != 'Cancelled')), 0)) as expenses
      FROM purchases p
      ${purchWhere}
      GROUP BY label
      ORDER BY p.date ASC
    `, purchParams);

    let returnLabelExpr = "DATE_FORMAT(pr.created_at, '%Y-%m-%d')";
    if (timeScale === 'monthly') {
      returnLabelExpr = "DATE_FORMAT(pr.created_at, '%b %Y')";
    } else if (timeScale === 'yearly') {
      returnLabelExpr = "DATE_FORMAT(pr.created_at, '%Y')";
    }

    // Build a purchase_returns WHERE clause that respects date + vendor filters
    let returnsWhere = 'WHERE pr.status != \'Cancelled\'';
    const returnsParams = [];
    if (startDate) { returnsWhere += ' AND DATE(pr.created_at) >= ?'; returnsParams.push(startDate); }
    if (endDate)   { returnsWhere += ' AND DATE(pr.created_at) <= ?'; returnsParams.push(endDate); }
    if (vendorId)  { returnsWhere += ' AND pr.vendor_id = ?';         returnsParams.push(Number(vendorId)); }

    const [returnsTrend] = await db.query(`
      SELECT ${returnLabelExpr} as label,
             COALESCE(SUM(pr.total_amount), 0) as returns_val
      FROM purchase_returns pr
      ${returnsWhere}
      GROUP BY label
    `, returnsParams);

    const trendMap = {};
    salesTrend.forEach(row => {
      trendMap[row.label] = { 
        label: row.label, 
        revenue: Number(row.revenue), 
        units_sold: Number(row.units_sold || 0), 
        expenses: 0, 
        returns: 0, 
        profit: Number(row.revenue) 
      };
    });

    purchTrend.forEach(row => {
      if (trendMap[row.label]) {
        trendMap[row.label].expenses = Number(row.expenses);
        trendMap[row.label].profit = Math.max(0, trendMap[row.label].revenue - Number(row.expenses));
      } else {
        trendMap[row.label] = { label: row.label, revenue: 0, units_sold: 0, expenses: Number(row.expenses), returns: 0, profit: 0 };
      }
    });

    returnsTrend.forEach(row => {
      if (trendMap[row.label]) {
        trendMap[row.label].returns = Number(row.returns_val);
      } else {
        trendMap[row.label] = { label: row.label, revenue: 0, expenses: 0, returns: Number(row.returns_val), profit: 0 };
      }
    });

    const trends = Object.values(trendMap);

    // ── 3. TOP SELLING PRODUCTS ────────────────────────────────────────────────
    const [topProducts] = await db.query(`
      SELECT pr.id, pr.name, pr.barcode,
             SUM(si.quantity - COALESCE((SELECT SUM(quantity) FROM sales_returns WHERE sale_id = si.sale_id AND product_id = si.product_id), 0)) as units_sold,
             SUM(si.total - COALESCE((SELECT SUM(refund_amount) FROM sales_returns WHERE sale_id = si.sale_id AND product_id = si.product_id), 0)) as revenue
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      JOIN products pr ON si.product_id = pr.id
      ${salesWhere}
      GROUP BY pr.id
      ORDER BY revenue DESC
      LIMIT 10
    `, salesParams);

    // ── 4. CATEGORY SALES BREAKDOWN ───────────────────────────────────────────
    const [categoryDist] = await db.query(`
      SELECT c.name as name, 
             COALESCE(SUM(si.total - COALESCE((SELECT SUM(refund_amount) FROM sales_returns WHERE sale_id = si.sale_id AND product_id = si.product_id), 0)), 0) as value
      FROM categories c
      JOIN products pr ON c.id = pr.category_id
      JOIN sale_items si ON pr.id = si.product_id
      JOIN sales s ON si.sale_id = s.id
      ${salesWhere}
      GROUP BY c.id
      HAVING value > 0
      ORDER BY value DESC
    `, salesParams);

    // ── 5. STOCK MOVEMENT LOGS COUNT ──────────────────────────────────────────
    const [movementCounts] = await db.query(`
      SELECT sl.type, COUNT(sl.id) as count, COALESCE(SUM(sl.quantity), 0) as units
      FROM stock_logs sl
      ${logsWhere}
      GROUP BY sl.type
    `, logsParams);

    // ── 6. RECENT STOCK MOVEMENT LOGS DETAILS ─────────────────────────────────
    const [movementLogs] = await db.query(`
      SELECT sl.id, sl.type, sl.quantity, sl.reference_no, sl.notes, sl.created_at,
             p.name as product_name, p.barcode, w.name as warehouse_name
      FROM stock_logs sl
      LEFT JOIN products p ON sl.product_id = p.id
      LEFT JOIN warehouses w ON sl.warehouse_id = w.id
      ${logsWhere}
      ORDER BY sl.created_at DESC
      LIMIT 15
    `, logsParams);

    // ── 7. TOP PURCHASED PRODUCTS ─────────────────────────────────────────────
    const [topPurchased] = await db.query(`
      SELECT pr.id, pr.name, pr.barcode,
             SUM(pi.quantity - COALESCE((SELECT SUM(quantity) FROM purchase_returns WHERE purchase_id = pi.purchase_id AND product_id = pi.product_id AND (status IS NULL OR status != 'Cancelled')), 0)) as units_purchased,
             SUM(pi.total - COALESCE((SELECT SUM(total_amount) FROM purchase_returns WHERE purchase_id = pi.purchase_id AND product_id = pi.product_id AND (status IS NULL OR status != 'Cancelled')), 0)) as total_expenses
      FROM purchase_items pi
      JOIN purchases p ON pi.purchase_id = p.id
      JOIN products pr ON pi.product_id = pr.id
      ${purchWhere}
      GROUP BY pr.id
      ORDER BY total_expenses DESC
      LIMIT 10
    `, purchParams);

    // ── 8. TOP CUSTOMERS ──────────────────────────────────────────────────────
    const [topCustomers] = await db.query(`
      SELECT c.id, c.name, c.phone, COALESCE(SUM(s.total), 0) as total_spent, COUNT(s.id) as sales_count
      FROM customers c
      JOIN sales s ON c.id = s.customer_id
      ${salesWhere}
      GROUP BY c.id
      ORDER BY total_spent DESC
      LIMIT 5
    `, salesParams);

    // ── 9. TOP SUPPLIERS ──────────────────────────────────────────────────────
    const [topSuppliers] = await db.query(`
      SELECT v.id, COALESCE(v.company_name, v.name) as name, v.phone, COALESCE(SUM(p.total), 0) as total_procured, COUNT(p.id) as purchase_count
      FROM vendors v
      JOIN purchases p ON v.id = p.vendor_id
      ${purchWhere}
      GROUP BY v.id
      ORDER BY total_procured DESC
      LIMIT 5
    `, purchParams);

    return res.status(200).json({
      success: true,
      kpis,
      charts: {
        trends,
        topProducts,
        topPurchasedProducts: topPurchased,
        categoryDist,
        topCustomers,
        topSuppliers,
        movementCounts,
        movementLogs
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get dynamic inventory summary statistics
// @route   GET /api/reports/inventory-summary
// @access  Private
export const getInventorySummary = async (req, res, next) => {
  try {
    const isSuperAdmin = req.user.role === 'Super Admin';

    const hasViewProducts = isSuperAdmin || req.user.role === 'Admin' || req.user.permissions?.includes('view_products');
    const hasViewStock = isSuperAdmin || req.user.role === 'Admin' || req.user.permissions?.includes('view_stock');
    const hasViewCategories = isSuperAdmin || req.user.role === 'Admin' || req.user.permissions?.includes('view_categories');
    const hasManageVendors = isSuperAdmin || req.user.role === 'Admin' || req.user.permissions?.includes('manage_vendors');

    let totalProducts = 0;
    let totalCategories = 0;
    let totalSuppliers = 0;
    let totalStockQty = 0;
    let lowStockProducts = 0;
    let outOfStockProducts = 0;
    let nearExpiryProducts = 0;
    let totalInventoryValue = 0;

    // 1. Total Products
    if (hasViewProducts) {
      const [pCount] = await req.db.query('SELECT COUNT(*) as count FROM products');
      totalProducts = pCount[0]?.count || 0;
    }

    // 2. Total Categories
    if (hasViewCategories) {
      const [cCount] = await req.db.query('SELECT COUNT(*) as count FROM categories');
      totalCategories = cCount[0]?.count || 0;
    }

    // 3. Total Suppliers
    if (hasManageVendors) {
      const [vCount] = await req.db.query('SELECT COUNT(*) as count FROM vendors');
      totalSuppliers = vCount[0]?.count || 0;
    }

    // 4. Stock & Inventory Value
    if (hasViewStock) {
      // Total stock quantity sum (Single Source of Truth aligned with Products Page)
      const [sQty] = await req.db.query(`
        SELECT COALESCE(SUM(total_stock), 0) as total FROM (
          SELECT COALESCE(
            SUM(s.quantity),
            (SELECT SUM(remaining_quantity) FROM purchase_batches WHERE product_id = p.id),
            0
          ) as total_stock
          FROM products p
          LEFT JOIN stock s ON p.id = s.product_id
          GROUP BY p.id
        ) as temp
      `);
      totalStockQty = Number(sQty[0]?.total || 0);

      // Low Stock count
      const [lowStock] = await req.db.query(`
        SELECT COUNT(*) as count FROM (
          SELECT p.id,
                 COALESCE(
                   SUM(s.quantity),
                   (SELECT SUM(remaining_quantity) FROM purchase_batches WHERE product_id = p.id),
                   0
                 ) as total_stock
          FROM products p
          LEFT JOIN stock s ON p.id = s.product_id
          GROUP BY p.id, p.min_stock
          HAVING total_stock <= p.min_stock AND total_stock > 0
        ) as temp
      `);
      lowStockProducts = lowStock[0]?.count || 0;

      // Out of Stock count
      const [outOfStock] = await req.db.query(`
        SELECT COUNT(*) as count FROM (
          SELECT p.id,
                 COALESCE(
                   SUM(s.quantity),
                   (SELECT SUM(remaining_quantity) FROM purchase_batches WHERE product_id = p.id),
                   0
                 ) as total_stock
          FROM products p
          LEFT JOIN stock s ON p.id = s.product_id
          GROUP BY p.id
          HAVING total_stock = 0
        ) as temp
      `);
      outOfStockProducts = outOfStock[0]?.count || 0;

      // Near Expiry count (active FIFO batch in purchase_batches)
      const [nearExp] = await req.db.query(`
        SELECT COUNT(*) as count FROM (
          SELECT p.id, 
                 COALESCE(
                   (SELECT pb.expiry_date FROM purchase_batches pb WHERE pb.product_id = p.id AND pb.remaining_quantity > 0 AND pb.expiry_date IS NOT NULL AND pb.expiry_date != '' AND pb.expiry_date != 'N/A' AND pb.expiry_date != '0000-00-00' ORDER BY pb.purchase_date ASC, pb.id ASC LIMIT 1),
                   p.expiry_date
                 ) as active_expiry
          FROM products p
        ) t
        WHERE t.active_expiry IS NOT NULL 
          AND t.active_expiry > CURRENT_DATE() 
          AND t.active_expiry <= DATE_ADD(CURRENT_DATE(), INTERVAL 30 DAY)
      `);
      nearExpiryProducts = nearExp[0]?.count || 0;

      // Inventory valuation (Single Source of Truth)
      totalInventoryValue = await calculateInventoryValuation(req.db, req.query);
    }

    return res.status(200).json({
      success: true,
      summary: {
        totalProducts,
        totalCategories,
        totalSuppliers,
        totalStockQty,
        lowStockProducts,
        outOfStockProducts,
        nearExpiryProducts,
        totalInventoryValue
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Stock Aging Report
// @route   GET /api/reports/stock-aging
export const getStockAgingReport = async (req, res, next) => {
  try {
    const report = await calculateStockAging(req.db, req.query);
    return res.status(200).json({ success: true, report });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Inventory Turnover & Velocity Report
// @route   GET /api/reports/inventory-turnover
export const getInventoryTurnoverReport = async (req, res, next) => {
  try {
    const report = await calculateInventoryTurnover(req.db, req.query);
    return res.status(200).json({ success: true, report });
  } catch (error) {
    next(error);
  }
};

// @desc    Get ABC Inventory Analysis Report
// @route   GET /api/reports/abc-analysis
export const getABCAnalysisReport = async (req, res, next) => {
  try {
    const report = await calculateABCAnalysis(req.db, req.query);
    return res.status(200).json({ success: true, report });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Batch-by-Batch Valuation Report
// @route   GET /api/reports/batch-valuation
export const getBatchValuationReport = async (req, res, next) => {
  try {
    const report = await calculateBatchValuationReport(req.db, req.query);
    return res.status(200).json({ success: true, report });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Reserved Stock & Available Stock Metrics
// @route   GET /api/reports/reserved-stock
export const getReservedStockReport = async (req, res, next) => {
  try {
    const report = await calculateReservedStockMetrics(req.db, req.query);
    return res.status(200).json({ success: true, report });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Automated Inventory Reconciliation & Consistency Validation
// @route   GET /api/reports/inventory-reconciliation
export const getInventoryReconciliationReport = async (req, res, next) => {
  try {
    const report = await validateInventoryConsistency(req.db);
    return res.status(200).json({ success: true, report });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Stock Adjustment Financial & Audit Summary Report
// @route   GET /api/reports/stock-adjustments
export const getStockAdjustmentReport = async (req, res, next) => {
  try {
    const report = await calculateStockAdjustments(req.db, req.query);
    return res.status(200).json({ success: true, report });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Inventory Valuation Drill-down / Layers Report (Odoo 19 Ledger)
// @route   GET /api/reports/valuation-layers
export const getValuationLayerReport = async (req, res, next) => {
  try {
    const report = await getValuationDrillDown(req.db, req.query);
    return res.status(200).json({ success: true, report });
  } catch (error) {
    next(error);
  }
};

