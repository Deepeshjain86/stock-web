// import { logActivity } from '../utils/activityLogger.js';
// import { createNotification, checkStockAlerts } from '../services/notificationService.js';
// import { syncProductFifoState } from '../utils/fifoQueueHelper.js';

// const parseToISODate = (val) => {
//   if (!val || val === 'N/A' || val === 'null' || val === 'undefined' || val === '0000-00-00') return null;
//   const str = String(val).trim();
//   if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
//     return str.substring(0, 10);
//   }
//   if (/^\d{2}[-/]\d{2}[-/]\d{4}/.test(str)) {
//     const parts = str.split(/[-/]/);
//     return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
//   }
//   const d = new Date(str);
//   return (!isNaN(d.getTime()) && d.getFullYear() > 2000) ? d.toISOString().substring(0, 10) : null;
// };

// // @desc    Get all purchases for tenant
// // @route   GET /api/purchases
// // @access  Private
// export const getPurchases = async (req, res, next) => {
//   try {
//     const { search, vendorId, vendor_id, paymentStatus, page = 1, limit = 50 } = req.query;
//     const offset = (Number(page) - 1) * Number(limit);

//     let query = `
//       SELECT p.*, v.name as vendor_name, w.name as warehouse_name
//       FROM purchases p
//       LEFT JOIN vendors v ON p.vendor_id = v.id
//       LEFT JOIN warehouses w ON p.warehouse_id = w.id
//       WHERE 1=1
//     `;
//     const queryParams = [];

//     if (search) {
//       query += ' AND (p.purchase_no LIKE ? OR v.name LIKE ?)';
//       const searchVal = `%${search}%`;
//       queryParams.push(searchVal, searchVal);
//     }

//     const targetVendorId = vendorId || vendor_id;
//     if (targetVendorId) {
//       query += ' AND p.vendor_id = ?';
//       queryParams.push(targetVendorId);
//     }

//     if (paymentStatus && paymentStatus !== 'all') {
//       query += ' AND p.payment_status = ?';
//       queryParams.push(paymentStatus);
//     }

//     query += ' ORDER BY p.date DESC, p.created_at DESC LIMIT ? OFFSET ?';
//     queryParams.push(Number(limit), Number(offset));

//     const [purchases] = await req.db.query(query, queryParams);
//     const mappedPurchases = purchases.map(p => {
//       const tot = Number(p.total || 0);
//       const paid = Number(p.paid_amount || 0);
//       let status = p.payment_status || 'Pending';
//       if (paid >= tot && tot > 0) {
//         status = 'Paid';
//       } else if (paid > 0) {
//         status = 'Partial';
//       } else {
//         status = 'Pending';
//       }
//       return {
//         ...p,
//         paid_amount: paid,
//         payment_status: status
//       };
//     });

//     return res.status(200).json({ success: true, count: mappedPurchases.length, purchases: mappedPurchases });
//   } catch (error) {
//     next(error);
//   }
// };

// // @desc    Get single purchase detail
// // @route   GET /api/purchases/:id
// // @access  Private
// export const getPurchaseById = async (req, res, next) => {
//   try {
//     const { id } = req.params;

//     const [purchases] = await req.db.query(`
//       SELECT p.*, v.name as vendor_name, v.phone as vendor_phone, v.email as vendor_email, 
//              v.address as vendor_address, v.gstin as vendor_gstin,
//              w.name as warehouse_name
//       FROM purchases p
//       LEFT JOIN vendors v ON p.vendor_id = v.id
//       LEFT JOIN warehouses w ON p.warehouse_id = w.id
//       WHERE p.id = ?
//     `, [id]);

//     if (purchases.length === 0) {
//       return res.status(404).json({ success: false, message: 'Purchase record not found' });
//     }

//     const purchase = purchases[0];

//     // Fetch items with already returned quantities
//     const [items] = await req.db.query(`
//       SELECT pi.*, pr.name as product_name, pr.unit,
//              COALESCE((SELECT SUM(quantity) FROM purchase_returns WHERE purchase_id = pi.purchase_id AND product_id = pi.product_id), 0) as returnedQuantity
//       FROM purchase_items pi
//       JOIN products pr ON pi.product_id = pr.id
//       WHERE pi.purchase_id = ?
//     `, [id]);

//     purchase.items = items;

//     return res.status(200).json({ success: true, purchase });
//   } catch (error) {
//     next(error);
//   }
// };

// // @desc    Create new purchase invoice (Stock In)
// // @route   POST /api/purchases
// // @access  Private
// export const createPurchase = async (req, res, next) => {
//   const connection = await req.db.getConnection();
//   try {
//     await connection.beginTransaction();

//     const {
//       vendor_id,
//       warehouse_id,
//       date,
//       subtotal,
//       discount,
//       gst_amount,
//       total,
//       payment_status,
//       delivery_status,
//       payment_method,
//       items,
//       purchase_order_id,
//       grn_id
//     } = req.body;

//     if (!vendor_id || !warehouse_id || !date || !items || items.length === 0) {
//       return res.status(400).json({ success: false, message: 'Missing purchase header details or products list' });
//     }

//     // 15-Second Duplicate Submission Guard (prevents rapid double-clicks from creating duplicate purchases)
//     const [recentDup] = await connection.query(`
//       SELECT id, purchase_no 
//       FROM purchases 
//       WHERE vendor_id = ? AND total = ? AND DATE(date) = DATE(?) AND created_at >= DATE_SUB(NOW(), INTERVAL 15 SECOND)
//       LIMIT 1
//     `, [vendor_id, total || 0, date]);

//     if (recentDup.length > 0) {
//       await connection.rollback();
//       connection.release();
//       return res.status(200).json({
//         success: true,
//         message: 'Purchase invoice created successfully (duplicate submission suppressed)',
//         purchaseNo: recentDup[0].purchase_no,
//         purchaseId: recentDup[0].id
//       });
//     }

//     // Generate tenant purchase invoice number safely (collision free)
//     const year = new Date(date).getFullYear();
//     const [allPurchases] = await connection.query('SELECT purchase_no FROM purchases WHERE purchase_no LIKE ?', [`PUR-%-${year}`]);
//     let maxSeq = 0;
//     for (const row of allPurchases) {
//       const parts = row.purchase_no.split('-');
//       const seq = parseInt(parts[1], 10);
//       if (!isNaN(seq) && seq > maxSeq) {
//         maxSeq = seq;
//       }
//     }
//     const purchaseNo = `PUR-${String(maxSeq + 1).padStart(4, '0')}-${year}`;

//     // Calculate payment status and paid amount
//     const invoiceTotal = Number(total || 0);
//     let actualPaymentStatus = payment_status || 'Pending';
//     let initialPaid = Number(req.body.paid_amount || 0);

//     if (actualPaymentStatus === 'Paid' && initialPaid === 0) {
//       initialPaid = invoiceTotal;
//     } else if (actualPaymentStatus === 'Partial' && initialPaid === 0) {
//       initialPaid = invoiceTotal / 2;
//     }

//     if (initialPaid >= invoiceTotal && invoiceTotal > 0) {
//       actualPaymentStatus = 'Paid';
//     } else if (initialPaid > 0) {
//       actualPaymentStatus = 'Partial';
//     } else {
//       actualPaymentStatus = 'Pending';
//       initialPaid = 0;
//     }

//     // Insert Purchase
//     const [result] = await connection.query(
//       `INSERT INTO purchases (purchase_no, vendor_id, warehouse_id, date, subtotal, discount, gst_amount, total, paid_amount, payment_status, delivery_status, payment_method, purchase_order_id, grn_id)
//        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
//       [
//         purchaseNo, vendor_id, warehouse_id, date, 
//         subtotal || 0, discount || 0, gst_amount || 0, invoiceTotal, initialPaid,
//         actualPaymentStatus, delivery_status || 'Received', payment_method || 'Cash',
//         purchase_order_id || null, grn_id || null
//       ]
//     );

//     const purchaseId = result.insertId;
//     const isLinkedToReceipt = !!grn_id || !!purchase_order_id;

//     // Loop items to save & update stock
//     for (const item of items) {
//       const itemMrp = Number(item.mrp || item.max_retail_price || 0);
//       const itemSellingPrice = Number(item.selling_price || item.price || 0);

//       await connection.query(
//         `INSERT INTO purchase_items (purchase_id, product_id, quantity, purchase_price, mrp, gst, total)
//          VALUES (?, ?, ?, ?, ?, ?, ?)`,
//         [purchaseId, item.product_id, item.quantity, item.purchase_price, itemMrp, item.gst, item.total]
//       );

//       if (!isLinkedToReceipt) {
//         // Create batch record in purchase_batches for FIFO tracking
//         await connection.query(
//           `INSERT INTO purchase_batches (product_id, batch_number, purchase_quantity, remaining_quantity, purchase_date, expiry_date, purchase_price, mrp, selling_price, supplier_id, warehouse_id, purchase_id)
//            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
//           [
//             item.product_id,
//             item.batch_number || item.batch_no || `BATCH-${Date.now()}`,
//             item.quantity,
//             item.quantity,
//             date,
//             parseToISODate(item.expiry_date || item.expDate),
//             item.purchase_price || 0,
//             itemMrp,
//             itemSellingPrice,
//             vendor_id,
//             warehouse_id,
//             purchaseId
//           ]
//         );

//         // Increment stock in stock table per product + warehouse
//         const [existingStock] = await connection.query(
//           'SELECT id, quantity FROM stock WHERE product_id = ? AND warehouse_id = ? LIMIT 1',
//           [item.product_id, warehouse_id]
//         );

//         let prevQty = 0;
//         if (existingStock.length > 0) {
//           prevQty = Number(existingStock[0].quantity);
//           await connection.query(
//             'UPDATE stock SET quantity = quantity + ? WHERE id = ?',
//             [item.quantity, existingStock[0].id]
//           );
//         } else {
//           await connection.query(
//             'INSERT INTO stock (product_id, warehouse_id, quantity) VALUES (?, ?, ?)',
//             [item.product_id, warehouse_id, item.quantity]
//           );
//         }

//         // Log Stock movement per vendor
//         await connection.query(
//           `INSERT INTO stock_logs (product_id, warehouse_id, vendor_id, type, quantity, reference_no, notes, user_id, previous_quantity, new_quantity)
//            VALUES (?, ?, ?, 'Stock In', ?, ?, ?, ?, ?, ?)`,
//           [item.product_id, warehouse_id, vendor_id, item.quantity, purchaseNo, 'Purchase Invoice Entry', req.user.id, prevQty, prevQty + item.quantity]
//         );

//         // Sync FIFO active batch Expiry Date and MRP on Product master
//         await syncProductFifoState(connection, item.product_id);
//       }
//     }

//     // Update Vendor totals & outstanding balance
//     await connection.query(
//       `UPDATE vendors 
//        SET total_purchases = COALESCE(total_purchases, 0) + ?,
//            total_paid = COALESCE(total_paid, 0) + ?
//        WHERE id = ?`,
//       [invoiceTotal, initialPaid, vendor_id]
//     );

//     // Fetch updated vendor totals & calculate outstanding balance
//     const [vRow] = await connection.query('SELECT total_purchases, total_paid, opening_balance FROM vendors WHERE id = ?', [vendor_id]);
//     if (vRow.length > 0) {
//       const totP = Number(vRow[0].total_purchases || 0);
//       const totPaid = Number(vRow[0].total_paid || 0);
//       const openBal = Number(vRow[0].opening_balance || 0);
//       const newBal = Math.max(0, (totP + openBal) - totPaid);

//       await connection.query('UPDATE vendors SET outstanding_balance = ? WHERE id = ?', [newBal, vendor_id]);

//       // Save Purchase Invoice entry in vendor_ledger
//       await connection.query(
//         `INSERT INTO vendor_ledger 
//           (vendor_id, purchase_id, date, transaction_type, reference_no, description, debit_amount, credit_amount, running_balance)
//          VALUES (?, ?, ?, 'PURCHASE_INVOICE', ?, ?, ?, 0.00, ?)`,
//         [
//           vendor_id,
//           purchaseId,
//           date || new Date(),
//           purchaseNo,
//           `Purchase Invoice ${purchaseNo}`,
//           invoiceTotal,
//           newBal
//         ]
//       );
//     }

//     await connection.commit();

//     await logActivity(req.user.id, 'Create Purchase', 'Purchases', `Recorded purchase invoice "${purchaseNo}" (Vendor ID: ${vendor_id})`, req.ip);

//     const [vInfo] = await connection.query('SELECT name FROM vendors WHERE id = ?', [vendor_id]);
//     const vendorName = vInfo[0]?.name || 'Unknown Vendor';

//     await createNotification({
//       type: 'Purchase Invoice',
//       title: 'New Purchase Recorded',
//       message: `Purchase invoice "${purchaseNo}" recorded from supplier "${vendorName}" for total amount ₹${total}.`,
//       priority: 'Medium',
//       related_user: req.user.email,
//       related_module: 'Purchases',
//       target_roles: 'Admin,Manager'
//     }, connection);

//     for (const item of items) {
//       await checkStockAlerts(connection, item.product_id, req.user.id);
//     }

//     return res.status(201).json({
//       success: true,
//       message: 'Purchase invoice created successfully',
//       purchaseNo,
//       purchaseId
//     });
//   } catch (error) {
//     await connection.rollback();
//     next(error);
//   } finally {
//     connection.release();
//   }
// };

// // @desc    Delete purchase order (reverts stocks)
// // @route   DELETE /api/purchases/:id
// // @access  Private
// export const deletePurchase = async (req, res, next) => {
//   const connection = await req.db.getConnection();
//   try {
//     await connection.beginTransaction();

//     const { id } = req.params;

//     // Check purchase details including vendor_id and payment details
//     const [purchases] = await connection.query('SELECT purchase_no, warehouse_id, vendor_id, total, payment_status, purchase_order_id, grn_id FROM purchases WHERE id = ?', [id]);
//     if (purchases.length === 0) {
//       return res.status(404).json({ success: false, message: 'Purchase record not found' });
//     }

//     const { purchase_no, warehouse_id, vendor_id, total, payment_status, purchase_order_id, grn_id } = purchases[0];
//     const isLinkedToReceipt = !!grn_id;

//     // Fetch items
//     const [items] = await connection.query('SELECT product_id, quantity FROM purchase_items WHERE purchase_id = ?', [id]);

//     // Reverse outstanding balance on deletion
//     let unpaidAmount = 0;
//     if (payment_status === 'Pending') {
//       unpaidAmount = Number(total);
//     } else if (payment_status === 'Partial') {
//       const paidAmount = purchases[0].paid_amount || (Number(total) / 2);
//       unpaidAmount = Math.max(0, Number(total) - paidAmount);
//     }

//     if (unpaidAmount > 0) {
//       await connection.query(
//         'UPDATE vendors SET outstanding_balance = GREATEST(0, outstanding_balance - ?) WHERE id = ?',
//         [unpaidAmount, vendor_id]
//       );
//     }

//     // Reverse stocks (only if NOT linked to PO/GRN, since stock was managed by GRN)
//     if (!isLinkedToReceipt) {
//       for (const item of items) {
//         const [currentStock] = await connection.query(
//           'SELECT quantity FROM stock WHERE product_id = ? AND warehouse_id = ? AND vendor_id = ?',
//           [item.product_id, warehouse_id, vendor_id]
//         );

//         const stockQty = currentStock.length > 0 ? currentStock[0].quantity : 0;
//         const finalQty = Math.max(0, stockQty - item.quantity);

//         await connection.query(
//           'UPDATE stock SET quantity = ? WHERE product_id = ? AND warehouse_id = ? AND vendor_id = ?',
//           [finalQty, item.product_id, warehouse_id, vendor_id]
//         );

//         // Log reverse stock log
//         await connection.query(
//           `INSERT INTO stock_logs (product_id, warehouse_id, vendor_id, type, quantity, reference_no, notes, user_id)
//            VALUES (?, ?, ?, 'Stock Out', ?, ?, ?, ?)`,
//           [item.product_id, warehouse_id, vendor_id, -item.quantity, purchase_no, 'Purchase Invoice Cancelled', req.user.id]
//         );
//       }
//     }

//     // Delete items and invoice
//     await connection.query('DELETE FROM purchase_items WHERE purchase_id = ?', [id]);
//     await connection.query('DELETE FROM purchases WHERE id = ?', [id]);

//     await connection.commit();

//     await logActivity(req.user.id, 'Cancel Purchase', 'Purchases', `Cancelled purchase invoice "${purchase_no}" (ID: ${id})`, req.ip);

//     return res.status(200).json({ success: true, message: 'Purchase invoice deleted successfully' });
//   } catch (error) {
//     await connection.rollback();
//     next(error);
//   } finally {
//     connection.release();
//   }
// };

// // ==========================================
// // PURCHASE ORDERS CONTROLLERS
// // ==========================================

// // @desc    Get all purchase orders
// // @route   GET /api/purchases/orders
// // @access  Private
// export const getPurchaseOrders = async (req, res, next) => {
//   try {
//     const { search, vendorId, status, page = 1, limit = 50 } = req.query;
//     const offset = (Number(page) - 1) * Number(limit);

//     let query = `
//       SELECT po.*, v.name as vendor_name, w.name as warehouse_name
//       FROM purchase_orders po
//       LEFT JOIN vendors v ON po.vendor_id = v.id
//       LEFT JOIN warehouses w ON po.warehouse_id = w.id
//       WHERE 1=1
//     `;
//     const queryParams = [];

//     if (search) {
//       query += ' AND (po.purchase_order_no LIKE ? OR v.name LIKE ?)';
//       const searchVal = `%${search}%`;
//       queryParams.push(searchVal, searchVal);
//     }

//     if (vendorId) {
//       query += ' AND po.vendor_id = ?';
//       queryParams.push(vendorId);
//     }

//     if (status && status !== 'all') {
//       query += ' AND po.status = ?';
//       queryParams.push(status);
//     }

//     query += ' ORDER BY po.date DESC, po.created_at DESC LIMIT ? OFFSET ?';
//     queryParams.push(Number(limit), Number(offset));

//     const [orders] = await req.db.query(query, queryParams);
//     return res.status(200).json({ success: true, count: orders.length, purchaseOrders: orders });
//   } catch (error) {
//     next(error);
//   }
// };

// // @desc    Get single purchase order detail
// // @route   GET /api/purchases/orders/:id
// // @access  Private
// export const getPurchaseOrderById = async (req, res, next) => {
//   try {
//     const { id } = req.params;

//     const [orders] = await req.db.query(`
//       SELECT po.*, v.name as vendor_name, v.phone as vendor_phone, v.email as vendor_email, 
//              v.address as vendor_address, v.gstin as vendor_gstin,
//              w.name as warehouse_name, COALESCE(u.name, 'Admin') as prepared_by
//       FROM purchase_orders po
//       LEFT JOIN vendors v ON po.vendor_id = v.id
//       LEFT JOIN warehouses w ON po.warehouse_id = w.id
//       LEFT JOIN users u ON po.user_id = u.id
//       WHERE po.id = ?
//     `, [id]);

//     if (orders.length === 0) {
//       return res.status(404).json({ success: false, message: 'Purchase order not found' });
//     }

//     const order = orders[0];

//     // Fetch items
//     const [items] = await req.db.query(`
//       SELECT poi.*, pr.name as product_name, pr.unit, pr.barcode, cat.name as category
//       FROM purchase_order_items poi
//       JOIN products pr ON poi.product_id = pr.id
//       LEFT JOIN categories cat ON pr.category_id = cat.id
//       WHERE poi.purchase_order_id = ?
//     `, [id]);

//     order.items = items;

//     // Fetch linked GRNs
//     const [grns] = await req.db.query(
//       'SELECT id, grn_no, date, created_at FROM grns WHERE purchase_order_id = ? ORDER BY date DESC, created_at DESC',
//       [id]
//     );
//     order.grns = grns;

//     // Fetch linked Invoices
//     const [invoices] = await req.db.query(
//       'SELECT id, purchase_no, date, total, payment_status FROM purchases WHERE purchase_order_id = ? ORDER BY date DESC, created_at DESC',
//       [id]
//     );
//     order.invoices = invoices;

//     return res.status(200).json({ success: true, order });
//   } catch (error) {
//     next(error);
//   }
// };

// // @desc    Create new purchase order
// // @route   POST /api/purchases/orders
// // @access  Private
// export const createPurchaseOrder = async (req, res, next) => {
//   const connection = await req.db.getConnection();
//   try {
//     await connection.beginTransaction();

//     const {
//       vendor_id,
//       warehouse_id,
//       date,
//       expected_delivery_date,
//       subtotal,
//       discount,
//       gst_amount,
//       total,
//       notes,
//       items
//     } = req.body;

//     if (!vendor_id || !warehouse_id || !date || !items || items.length === 0) {
//       return res.status(400).json({ success: false, message: 'Missing purchase order header details or products list' });
//     }

//     const year = new Date(date).getFullYear();
//     const [allPOs] = await connection.query('SELECT purchase_order_no FROM purchase_orders WHERE purchase_order_no LIKE ?', [`PO-%-${year}`]);
//     let maxSeq = 0;
//     for (const row of allPOs) {
//       if (row.purchase_order_no) {
//         const parts = row.purchase_order_no.split('-');
//         const seq = parseInt(parts[1], 10);
//         if (!isNaN(seq) && seq > maxSeq) {
//           maxSeq = seq;
//         }
//       }
//     }
//     const poNo = `PO-${String(maxSeq + 1).padStart(4, '0')}-${year}`;

//     // Insert PO (including user_id for tracking Prepared By metadata)
//     const [result] = await connection.query(
//       `INSERT INTO purchase_orders (purchase_order_no, vendor_id, warehouse_id, date, expected_delivery_date, subtotal, discount, gst_amount, total, status, notes, user_id)
//        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Draft', ?, ?)`,
//       [poNo, vendor_id, warehouse_id, date, expected_delivery_date || null, subtotal || 0, discount || 0, gst_amount || 0, total || 0, notes || null, req.user.id]
//     );

//     const poId = result.insertId;

//     // Loop items
//     for (const item of items) {
//       await connection.query(
//         `INSERT INTO purchase_order_items (purchase_order_id, product_id, quantity, received_quantity, purchase_price, gst, total)
//          VALUES (?, ?, ?, 0, ?, ?, ?)`,
//         [poId, item.product_id, item.quantity, item.purchase_price, item.gst, item.total]
//       );
//     }

//     await connection.commit();
//     await logActivity(req.user.id, 'Create Purchase Order', 'Purchases', `Created Purchase Order "${poNo}" (Vendor ID: ${vendor_id})`, req.ip);

//     return res.status(201).json({
//       success: true,
//       message: 'Purchase order created successfully',
//       purchaseOrderNo: poNo,
//       purchaseOrderId: poId
//     });
//   } catch (error) {
//     await connection.rollback();
//     next(error);
//   } finally {
//     connection.release();
//   }
// };

// // @desc    Update purchase order status
// // @route   PUT /api/purchases/orders/:id/status
// // @access  Private
// export const updatePurchaseOrderStatus = async (req, res, next) => {
//   try {
//     const { id } = req.params;
//     const { status } = req.body;

//     if (!status) {
//       return res.status(400).json({ success: false, message: 'Status field is required' });
//     }

//     const [po] = await req.db.query('SELECT purchase_order_no FROM purchase_orders WHERE id = ?', [id]);
//     if (po.length === 0) {
//       return res.status(404).json({ success: false, message: 'Purchase order not found' });
//     }

//     await req.db.query('UPDATE purchase_orders SET status = ? WHERE id = ?', [status, id]);
//     await logActivity(req.user.id, 'Update PO Status', 'Purchases', `Updated Purchase Order "${po[0].purchase_order_no}" status to "${status}"`, req.ip);

//     return res.status(200).json({ success: true, message: 'Purchase order status updated successfully' });
//   } catch (error) {
//     next(error);
//   }
// };

// // @desc    Delete purchase order
// // @route   DELETE /api/purchases/orders/:id
// // @access  Private
// export const deletePurchaseOrder = async (req, res, next) => {
//   const connection = await req.db.getConnection();
//   try {
//     await connection.beginTransaction();
//     const { id } = req.params;

//     const [po] = await connection.query('SELECT purchase_order_no, status FROM purchase_orders WHERE id = ?', [id]);
//     if (po.length === 0) {
//       return res.status(404).json({ success: false, message: 'Purchase order not found' });
//     }

//     if (!['Draft', 'Cancelled'].includes(po[0].status)) {
//       return res.status(400).json({ success: false, message: 'Cannot delete a purchase order that is confirmed, received, or completed. Cancel it first.' });
//     }

//     // Delete items and order
//     await connection.query('DELETE FROM purchase_order_items WHERE purchase_order_id = ?', [id]);
//     await connection.query('DELETE FROM purchase_orders WHERE id = ?', [id]);

//     await connection.commit();
//     await logActivity(req.user.id, 'Delete Purchase Order', 'Purchases', `Deleted Purchase Order "${po[0].purchase_order_no}"`, req.ip);

//     return res.status(200).json({ success: true, message: 'Purchase order deleted successfully' });
//   } catch (error) {
//     await connection.rollback();
//     next(error);
//   } finally {
//     connection.release();
//   }
// };

// // ==========================================
// // GRN CONTROLLERS
// // ==========================================

// // @desc    Create GRN (Goods Received Note) and adjust stock levels
// // @route   POST /api/purchases/orders/:id/grn
// // @access  Private
// export const createGRN = async (req, res, next) => {
//   const connection = await req.db.getConnection();
//   try {
//     await connection.beginTransaction();

//     const { id: poId } = req.params;
//     const { date, notes, items } = req.body;

//     if (!date || !items || items.length === 0) {
//       return res.status(400).json({ success: false, message: 'Missing GRN details or products list' });
//     }

//     // Get PO details
//     const [orders] = await connection.query('SELECT purchase_order_no, vendor_id, warehouse_id FROM purchase_orders WHERE id = ?', [poId]);
//     if (orders.length === 0) {
//       return res.status(404).json({ success: false, message: 'Linked Purchase Order not found' });
//     }

//     const { purchase_order_no, vendor_id, warehouse_id } = orders[0];

//     // Generate GRN number
//     const year = new Date(date).getFullYear();
//     const [allGRNs] = await connection.query('SELECT grn_no FROM grns WHERE grn_no LIKE ?', [`GRN-%-${year}`]);
//     let maxSeq = 0;
//     for (const row of allGRNs) {
//       if (row.grn_no) {
//         const parts = row.grn_no.split('-');
//         const seq = parseInt(parts[1], 10);
//         if (!isNaN(seq) && seq > maxSeq) {
//           maxSeq = seq;
//         }
//       }
//     }
//     const grnNo = `GRN-${String(maxSeq + 1).padStart(4, '0')}-${year}`;

//     // Insert GRN
//     const [grnResult] = await connection.query(
//       `INSERT INTO grns (grn_no, purchase_order_id, vendor_id, warehouse_id, date, notes)
//        VALUES (?, ?, ?, ?, ?, ?)`,
//       [grnNo, poId, vendor_id, warehouse_id, date, notes || null]
//     );

//     const grnId = grnResult.insertId;

//     // Fetch PO items
//     const [poItems] = await connection.query('SELECT id, product_id, quantity, received_quantity FROM purchase_order_items WHERE purchase_order_id = ?', [poId]);

//     // Process items, increment stock, add stock logs, update PO received quantities
//     for (const item of items) {
//       const targetProdId = item.product_id || item.productId || item.id;
//       const poItem = poItems.find(p => String(p.product_id) === String(targetProdId) || String(p.id) === String(item.id));
//       const productId = poItem ? poItem.product_id : targetProdId;
//       if (!productId) continue;

//       const qtyRec = Number(item.quantity_received || 0);
//       const qtyDam = Number(item.quantity_damaged || 0);
//       const qtyRej = Number(item.quantity_rejected || 0);
//       const formattedExpiry = parseToISODate(item.expiry_date);

//       // Insert grn item
//       await connection.query(
//         `INSERT INTO grn_items (grn_id, product_id, quantity_received, quantity_damaged, quantity_rejected, batch_number, mrp, expiry_date)
//          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
//         [grnId, productId, qtyRec, qtyDam, qtyRej, item.batch_number || null, item.mrp ? Number(item.mrp) : null, formattedExpiry]
//       );

//       if (formattedExpiry) {
//         const [fifoGrn] = await connection.query(
//           `SELECT expiry_date FROM grn_items 
//            WHERE product_id = ? AND expiry_date IS NOT NULL AND expiry_date != '' AND expiry_date != 'N/A'
//            ORDER BY id DESC LIMIT 1`,
//           [productId]
//         );
//         const fifoDate = fifoGrn.length > 0 ? fifoGrn[0].expiry_date : formattedExpiry;
//         await connection.query(
//           'UPDATE products SET expiry_date = ? WHERE id = ?',
//           [fifoDate, productId]
//         );
//       }

//       if (item.mrp && Number(item.mrp) > 0) {
//         const [fifoGrnMrp] = await connection.query(
//           `SELECT mrp FROM grn_items 
//            WHERE product_id = ? AND mrp IS NOT NULL AND mrp > 0
//            ORDER BY id DESC LIMIT 1`,
//           [productId]
//         );
//         const fifoMrp = fifoGrnMrp.length > 0 ? Number(fifoGrnMrp[0].mrp) : Number(item.mrp);
//         await connection.query(
//           'UPDATE products SET mrp = ? WHERE id = ?',
//           [fifoMrp, productId]
//         );
//       }

//         if (qtyRec > 0) {
//           const [[prod]] = await connection.query('SELECT mrp, selling_price FROM products WHERE id = ?', [productId]);
//           const defaultProdMrp = prod ? Number(prod.mrp || 0) : 0;
//           const defaultProdSellingPrice = prod ? Number(prod.selling_price || 0) : 0;

//           const itemMrp = item.mrp && Number(item.mrp) > 0 ? Number(item.mrp) : (item.max_retail_price && Number(item.max_retail_price) > 0 ? Number(item.max_retail_price) : defaultProdMrp);
//           const itemSellingPrice = item.selling_price && Number(item.selling_price) > 0 ? Number(item.selling_price) : (item.price && Number(item.price) > 0 ? Number(item.price) : defaultProdSellingPrice);

//           // Create dedicated batch record in purchase_batches for FIFO inventory management
//           await connection.query(
//             `INSERT INTO purchase_batches (product_id, batch_number, purchase_quantity, remaining_quantity, purchase_date, expiry_date, purchase_price, mrp, selling_price, supplier_id, warehouse_id, grn_id)
//              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
//             [productId, item.batch_number || `BATCH-${Date.now()}`, qtyRec, qtyRec, date, formattedExpiry, item.unit_price || 0, itemMrp, itemSellingPrice, vendor_id, warehouse_id, grnId]
//           );

//           // Update PO item received quantity
//           if (poItem) {
//             await connection.query(
//               'UPDATE purchase_order_items SET received_quantity = received_quantity + ? WHERE id = ?',
//               [qtyRec, poItem.id]
//             );
//           }

//           // Update Stock levels
//           const [existingStock] = await connection.query(
//             'SELECT id, quantity FROM stock WHERE product_id = ? AND warehouse_id = ? LIMIT 1',
//             [productId, warehouse_id]
//           );

//           let prevQty = 0;
//           if (existingStock.length > 0) {
//             prevQty = Number(existingStock[0].quantity);
//             await connection.query(
//               'UPDATE stock SET quantity = quantity + ? WHERE id = ?',
//               [qtyRec, existingStock[0].id]
//             );
//           } else {
//             await connection.query(
//               'INSERT INTO stock (product_id, warehouse_id, quantity) VALUES (?, ?, ?)',
//               [productId, warehouse_id, qtyRec]
//             );
//           }

//           // Sync FIFO active batch Expiry Date and MRP on Product master
//           await syncProductFifoState(connection, productId);
//         }

//         // Log Stock movement
//         await connection.query(
//           `INSERT INTO stock_logs (product_id, warehouse_id, vendor_id, type, quantity, reference_no, notes, user_id, previous_quantity, new_quantity)
//            VALUES (?, ?, ?, 'Stock In', ?, ?, ?, ?, ?, ?)`,
//           [productId, warehouse_id, vendor_id, qtyRec, grnNo, `Goods Received (PO: ${purchase_order_no})`, req.user.id, prevQty, prevQty + qtyRec]
//         );
//       }
//     }

//     // Update PO Status based on quantities
//     const [updatedPOItems] = await connection.query('SELECT quantity, received_quantity FROM purchase_order_items WHERE purchase_order_id = ?', [poId]);
//     let allReceived = true;
//     let anyReceived = false;

//     for (const it of updatedPOItems) {
//       if (it.received_quantity < it.quantity) {
//         allReceived = false;
//       }
//       if (it.received_quantity > 0) {
//         anyReceived = true;
//       }
//     }

//     const newPOStatus = allReceived ? 'Completed' : (anyReceived ? 'Partially Received' : 'Confirmed');

//     await connection.query(
//       'UPDATE purchase_orders SET status = ? WHERE id = ?',
//       [newPOStatus, poId]
//     );

//     await connection.commit();
//     await logActivity(req.user.id, 'Create GRN', 'Purchases', `Created Goods Received Note "${grnNo}" for PO "${purchase_order_no}"`, req.ip);

//     return res.status(201).json({
//       success: true,
//       message: 'Goods Received Note saved and stock levels updated successfully',
//       grnNo,
//       grnId
//     });
//   } catch (error) {
//     await connection.rollback();
//     next(error);
//   } finally {
//     connection.release();
//   }
// };

// // @desc    Get all GRNs linked to a Purchase Order
// // @route   GET /api/purchases/orders/:id/grns
// // @access  Private
// export const getGRNsForPO = async (req, res, next) => {
//   try {
//     const { id: poId } = req.params;

//     const [grns] = await req.db.query(`
//       SELECT g.*, w.name as warehouse_name, v.name as vendor_name
//       FROM grns g
//       LEFT JOIN warehouses w ON g.warehouse_id = w.id
//       LEFT JOIN vendors v ON g.vendor_id = v.id
//       WHERE g.purchase_order_id = ?
//       ORDER BY g.date DESC, g.created_at DESC
//     `, [poId]);

//     // For each GRN, fetch its items
//     for (const grn of grns) {
//       const [items] = await req.db.query(`
//         SELECT gi.*, pr.name as product_name, pr.unit
//         FROM grn_items gi
//         JOIN products pr ON gi.product_id = pr.id
//         WHERE gi.grn_id = ?
//       `, [grn.id]);
//       grn.items = items;
//     }

//     return res.status(200).json({ success: true, grns });
//   } catch (error) {
//     next(error);
//   }
// };


import { logActivity } from '../utils/activityLogger.js';
import { createNotification, checkStockAlerts } from '../services/notificationService.js';
import { syncProductFifoState } from '../utils/fifoQueueHelper.js';
import { formatDateToYYYYMMDD } from '../utils/dateFormatter.js';

const parseToISODate = (val) => {
  if (!val || val === 'N/A' || val === 'null' || val === 'undefined' || val === '0000-00-00') return null;
  const str = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    return str.substring(0, 10);
  }
  if (/^\d{2}[-/]\d{2}[-/]\d{4}/.test(str)) {
    const parts = str.split(/[-/]/);
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  }
  const d = new Date(str);
  return (!isNaN(d.getTime()) && d.getFullYear() > 2000) ? formatDateToYYYYMMDD(d) : null;
};

// @desc    Get all purchases for tenant
// @route   GET /api/purchases
// @access  Private
export const getPurchases = async (req, res, next) => {
  try {
    const { search, vendorId, vendor_id, paymentStatus, page = 1, limit = 50 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = `
      SELECT p.*, v.name as vendor_name, w.name as warehouse_name
      FROM purchases p
      LEFT JOIN vendors v ON p.vendor_id = v.id
      LEFT JOIN warehouses w ON p.warehouse_id = w.id
      WHERE 1=1
    `;
    const queryParams = [];

    if (search) {
      query += ' AND (p.purchase_no LIKE ? OR v.name LIKE ?)';
      const searchVal = `%${search}%`;
      queryParams.push(searchVal, searchVal);
    }

    const targetVendorId = vendorId || vendor_id;
    if (targetVendorId) {
      query += ' AND p.vendor_id = ?';
      queryParams.push(targetVendorId);
    }

    if (paymentStatus && paymentStatus !== 'all') {
      query += ' AND p.payment_status = ?';
      queryParams.push(paymentStatus);
    }

    query += ' ORDER BY p.date DESC, p.created_at DESC LIMIT ? OFFSET ?';
    queryParams.push(Number(limit), Number(offset));

    const [purchases] = await req.db.query(query, queryParams);
    const mappedPurchases = purchases.map(p => {
      const tot = Number(p.total || 0);
      const paid = Number(p.paid_amount || 0);
      let status = p.payment_status || 'Pending';
      if (paid >= tot && tot > 0) {
        status = 'Paid';
      } else if (paid > 0) {
        status = 'Partial';
      } else {
        status = 'Pending';
      }
      return {
        ...p,
        paid_amount: paid,
        payment_status: status
      };
    });

    return res.status(200).json({ success: true, count: mappedPurchases.length, purchases: mappedPurchases });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single purchase detail
// @route   GET /api/purchases/:id
// @access  Private
export const getPurchaseById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [purchases] = await req.db.query(`
      SELECT p.*, v.name as vendor_name, v.phone as vendor_phone, v.email as vendor_email, 
             v.address as vendor_address, v.gstin as vendor_gstin,
             w.name as warehouse_name
      FROM purchases p
      LEFT JOIN vendors v ON p.vendor_id = v.id
      LEFT JOIN warehouses w ON p.warehouse_id = w.id
      WHERE p.id = ?
    `, [id]);

    if (purchases.length === 0) {
      return res.status(404).json({ success: false, message: 'Purchase record not found' });
    }

    const purchase = purchases[0];

    // Fetch items with already returned quantities
    const [items] = await req.db.query(`
      SELECT pi.*, pr.name as product_name, pr.unit,
             COALESCE((SELECT SUM(quantity) FROM purchase_returns WHERE purchase_id = pi.purchase_id AND product_id = pi.product_id), 0) as returnedQuantity
      FROM purchase_items pi
      JOIN products pr ON pi.product_id = pr.id
      WHERE pi.purchase_id = ?
    `, [id]);

    purchase.items = items;

    return res.status(200).json({ success: true, purchase });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new purchase invoice (Stock In)
// @route   POST /api/purchases
// @access  Private
export const createPurchase = async (req, res, next) => {
  const connection = await req.db.getConnection();
  try {
    await connection.beginTransaction();

    const {
      vendor_id,
      warehouse_id,
      date,
      subtotal,
      discount,
      gst_amount,
      total,
      payment_status,
      delivery_status,
      payment_method,
      items,
      purchase_order_id,
      grn_id
    } = req.body;

    if (!vendor_id || !warehouse_id || !date || !items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Missing purchase header details or products list' });
    }

    // 15-Second Duplicate Submission Guard (prevents rapid double-clicks from creating duplicate purchases)
    const [recentDup] = await connection.query(`
      SELECT id, purchase_no 
      FROM purchases 
      WHERE vendor_id = ? AND total = ? AND DATE(date) = DATE(?) AND created_at >= DATE_SUB(NOW(), INTERVAL 15 SECOND)
      LIMIT 1
    `, [vendor_id, total || 0, date]);

    if (recentDup.length > 0) {
      await connection.rollback();
      connection.release();
      return res.status(200).json({
        success: true,
        message: 'Purchase invoice created successfully (duplicate submission suppressed)',
        purchaseNo: recentDup[0].purchase_no,
        purchaseId: recentDup[0].id
      });
    }

    // Generate tenant purchase invoice number safely (collision free)
    const year = new Date(date).getFullYear();
    const [allPurchases] = await connection.query('SELECT purchase_no FROM purchases WHERE purchase_no LIKE ?', [`PUR-%-${year}`]);
    let maxSeq = 0;
    for (const row of allPurchases) {
      const parts = row.purchase_no.split('-');
      const seq = parseInt(parts[1], 10);
      if (!isNaN(seq) && seq > maxSeq) {
        maxSeq = seq;
      }
    }
    const purchaseNo = `PUR-${String(maxSeq + 1).padStart(4, '0')}-${year}`;

    // Calculate payment status and paid amount
    const invoiceTotal = Number(total || 0);
    let actualPaymentStatus = payment_status || 'Pending';
    let initialPaid = Number(req.body.paid_amount || 0);

    if (actualPaymentStatus === 'Paid' && initialPaid === 0) {
      initialPaid = invoiceTotal;
    } else if (actualPaymentStatus === 'Partial' && initialPaid === 0) {
      initialPaid = invoiceTotal / 2;
    }

    if (initialPaid >= invoiceTotal && invoiceTotal > 0) {
      actualPaymentStatus = 'Paid';
    } else if (initialPaid > 0) {
      actualPaymentStatus = 'Partial';
    } else {
      actualPaymentStatus = 'Pending';
      initialPaid = 0;
    }

    // Insert Purchase
    const [result] = await connection.query(
      `INSERT INTO purchases (purchase_no, vendor_id, warehouse_id, date, subtotal, discount, gst_amount, total, paid_amount, payment_status, delivery_status, payment_method, purchase_order_id, grn_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        purchaseNo, vendor_id, warehouse_id, date, 
        subtotal || 0, discount || 0, gst_amount || 0, invoiceTotal, initialPaid,
        actualPaymentStatus, delivery_status || 'Received', payment_method || 'Cash',
        purchase_order_id || null, grn_id || null
      ]
    );

    const purchaseId = result.insertId;
    let isLinkedToReceipt = !!grn_id;

    if (!isLinkedToReceipt && purchase_order_id) {
      const [existingGrn] = await connection.query(
        'SELECT id FROM grns WHERE purchase_order_id = ? LIMIT 1',
        [purchase_order_id]
      );
      if (existingGrn.length > 0) {
        isLinkedToReceipt = true;
        await connection.query('UPDATE purchases SET grn_id = ? WHERE id = ?', [existingGrn[0].id, purchaseId]);
      }
    }

    // Loop items to save & update stock
    for (const item of items) {
      const [[prod]] = await connection.query('SELECT mrp, selling_price FROM products WHERE id = ?', [item.product_id]);
      const defaultProdSellingPrice = prod ? Number(prod.selling_price || 0) : 0;
      const defaultProdMrp = prod ? Number(prod.mrp || 0) : 0;

      const itemMrp = Number(item.mrp || item.max_retail_price || defaultProdMrp);
      const itemSellingPrice = item.selling_price && Number(item.selling_price) > 0 ? Number(item.selling_price) : defaultProdSellingPrice;

      await connection.query(
        `INSERT INTO purchase_items (purchase_id, product_id, quantity, purchase_price, mrp, gst, total)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [purchaseId, item.product_id, item.quantity, item.purchase_price, itemMrp, item.gst, item.total]
      );

      if (!isLinkedToReceipt) {
        // Create batch record in purchase_batches for FIFO tracking
        await connection.query(
          `INSERT INTO purchase_batches (product_id, batch_number, purchase_quantity, remaining_quantity, purchase_date, expiry_date, purchase_price, mrp, selling_price, supplier_id, warehouse_id, purchase_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            item.product_id,
            item.batch_number || item.batch_no || `BATCH-${Date.now()}`,
            item.quantity,
            item.quantity,
            date,
            parseToISODate(item.expiry_date || item.expDate),
            item.purchase_price || 0,
            itemMrp,
            itemSellingPrice,
            vendor_id,
            warehouse_id,
            purchaseId
          ]
        );

        // Increment stock in stock table per product + warehouse
        const [existingStock] = await connection.query(
          'SELECT id, quantity FROM stock WHERE product_id = ? AND warehouse_id = ? LIMIT 1',
          [item.product_id, warehouse_id]
        );

        let prevQty = 0;
        if (existingStock.length > 0) {
          prevQty = Number(existingStock[0].quantity);
          await connection.query(
            'UPDATE stock SET quantity = quantity + ? WHERE id = ?',
            [item.quantity, existingStock[0].id]
          );
        } else {
          await connection.query(
            'INSERT INTO stock (product_id, warehouse_id, quantity) VALUES (?, ?, ?)',
            [item.product_id, warehouse_id, item.quantity]
          );
        }

        // Log Stock movement per vendor
        await connection.query(
          `INSERT INTO stock_logs (product_id, warehouse_id, vendor_id, type, quantity, reference_no, notes, user_id, previous_quantity, new_quantity)
           VALUES (?, ?, ?, 'Stock In', ?, ?, ?, ?, ?, ?)`,
          [item.product_id, warehouse_id, vendor_id, item.quantity, purchaseNo, 'Purchase Invoice Entry', req.user.id, prevQty, prevQty + item.quantity]
        );

        // Sync FIFO active batch Expiry Date and MRP on Product master
        await syncProductFifoState(connection, item.product_id);
      }
    }

    // Update Vendor totals & outstanding balance
    await connection.query(
      `UPDATE vendors 
       SET total_purchases = COALESCE(total_purchases, 0) + ?,
           total_paid = COALESCE(total_paid, 0) + ?
       WHERE id = ?`,
      [invoiceTotal, initialPaid, vendor_id]
    );

    // Fetch updated vendor totals & calculate outstanding balance
    const [vRow] = await connection.query('SELECT total_purchases, total_paid, opening_balance FROM vendors WHERE id = ?', [vendor_id]);
    if (vRow.length > 0) {
      const totP = Number(vRow[0].total_purchases || 0);
      const totPaid = Number(vRow[0].total_paid || 0);
      const openBal = Number(vRow[0].opening_balance || 0);
      const newBal = Math.max(0, (totP + openBal) - totPaid);

      await connection.query('UPDATE vendors SET outstanding_balance = ? WHERE id = ?', [newBal, vendor_id]);

      // Save Purchase Invoice entry in vendor_ledger
      await connection.query(
        `INSERT INTO vendor_ledger 
          (vendor_id, purchase_id, date, transaction_type, reference_no, description, debit_amount, credit_amount, running_balance)
         VALUES (?, ?, ?, 'PURCHASE_INVOICE', ?, ?, ?, 0.00, ?)`,
        [
          vendor_id,
          purchaseId,
          date || new Date(),
          purchaseNo,
          `Purchase Invoice ${purchaseNo}`,
          invoiceTotal,
          newBal
        ]
      );
    }

    await connection.commit();

    await logActivity(req.user.id, 'Create Purchase', 'Purchases', `Recorded purchase invoice "${purchaseNo}" (Vendor ID: ${vendor_id})`, req.ip);

    const [vInfo] = await connection.query('SELECT name FROM vendors WHERE id = ?', [vendor_id]);
    const vendorName = vInfo[0]?.name || 'Unknown Vendor';

    await createNotification({
      type: 'Purchase Invoice',
      title: 'New Purchase Recorded',
      message: `Purchase invoice "${purchaseNo}" recorded from supplier "${vendorName}" for total amount ₹${total}.`,
      priority: 'Medium',
      related_user: req.user.email,
      related_module: 'Purchases',
      target_roles: 'Admin,Manager,Staff'
    }, connection);

    for (const item of items) {
      await checkStockAlerts(connection, item.product_id, req.user.id);
    }

    return res.status(201).json({
      success: true,
      message: 'Purchase invoice created successfully',
      purchaseNo,
      purchaseId
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

// @desc    Delete purchase order (reverts stocks)
// @route   DELETE /api/purchases/:id
// @access  Private
export const deletePurchase = async (req, res, next) => {
  const connection = await req.db.getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;

    // Check purchase details including vendor_id and payment details
    const [purchases] = await connection.query('SELECT purchase_no, warehouse_id, vendor_id, total, payment_status, purchase_order_id, grn_id FROM purchases WHERE id = ?', [id]);
    if (purchases.length === 0) {
      return res.status(404).json({ success: false, message: 'Purchase record not found' });
    }

    const { purchase_no, warehouse_id, vendor_id, total, payment_status, purchase_order_id, grn_id } = purchases[0];
    const isLinkedToReceipt = !!grn_id;

    // Fetch items
    const [items] = await connection.query('SELECT product_id, quantity FROM purchase_items WHERE purchase_id = ?', [id]);

    // Reverse outstanding balance on deletion
    let unpaidAmount = 0;
    if (payment_status === 'Pending') {
      unpaidAmount = Number(total);
    } else if (payment_status === 'Partial') {
      const paidAmount = purchases[0].paid_amount || (Number(total) / 2);
      unpaidAmount = Math.max(0, Number(total) - paidAmount);
    }

    if (unpaidAmount > 0) {
      await connection.query(
        'UPDATE vendors SET outstanding_balance = GREATEST(0, outstanding_balance - ?) WHERE id = ?',
        [unpaidAmount, vendor_id]
      );
    }

    // Reverse stocks (only if NOT linked to PO/GRN, since stock was managed by GRN)
    if (!isLinkedToReceipt) {
      for (const item of items) {
        const [currentStock] = await connection.query(
          'SELECT quantity FROM stock WHERE product_id = ? AND warehouse_id = ? AND vendor_id = ?',
          [item.product_id, warehouse_id, vendor_id]
        );

        const stockQty = currentStock.length > 0 ? currentStock[0].quantity : 0;
        const finalQty = Math.max(0, stockQty - item.quantity);

        await connection.query(
          'UPDATE stock SET quantity = ? WHERE product_id = ? AND warehouse_id = ? AND vendor_id = ?',
          [finalQty, item.product_id, warehouse_id, vendor_id]
        );

        // Log reverse stock log
        await connection.query(
          `INSERT INTO stock_logs (product_id, warehouse_id, vendor_id, type, quantity, reference_no, notes, user_id)
           VALUES (?, ?, ?, 'Stock Out', ?, ?, ?, ?)`,
          [item.product_id, warehouse_id, vendor_id, -item.quantity, purchase_no, 'Purchase Invoice Cancelled', req.user.id]
        );
      }
    }

    // Delete items and invoice
    await connection.query('DELETE FROM purchase_items WHERE purchase_id = ?', [id]);
    await connection.query('DELETE FROM purchases WHERE id = ?', [id]);

    await connection.commit();

    await logActivity(req.user.id, 'Cancel Purchase', 'Purchases', `Cancelled purchase invoice "${purchase_no}" (ID: ${id})`, req.ip);

    return res.status(200).json({ success: true, message: 'Purchase invoice deleted successfully' });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

// ==========================================
// PURCHASE ORDERS CONTROLLERS
// ==========================================

// @desc    Get all purchase orders
// @route   GET /api/purchases/orders
// @access  Private
export const getPurchaseOrders = async (req, res, next) => {
  try {
    const { search, vendorId, status, page = 1, limit = 50 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = `
      SELECT po.*, v.name as vendor_name, w.name as warehouse_name
      FROM purchase_orders po
      LEFT JOIN vendors v ON po.vendor_id = v.id
      LEFT JOIN warehouses w ON po.warehouse_id = w.id
      WHERE 1=1
    `;
    const queryParams = [];

    if (search) {
      query += ' AND (po.purchase_order_no LIKE ? OR v.name LIKE ?)';
      const searchVal = `%${search}%`;
      queryParams.push(searchVal, searchVal);
    }

    if (vendorId) {
      query += ' AND po.vendor_id = ?';
      queryParams.push(vendorId);
    }

    if (status && status !== 'all') {
      query += ' AND po.status = ?';
      queryParams.push(status);
    }

    query += ' ORDER BY po.date DESC, po.created_at DESC LIMIT ? OFFSET ?';
    queryParams.push(Number(limit), Number(offset));

    const [orders] = await req.db.query(query, queryParams);
    return res.status(200).json({ success: true, count: orders.length, purchaseOrders: orders });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single purchase order detail
// @route   GET /api/purchases/orders/:id
// @access  Private
export const getPurchaseOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [orders] = await req.db.query(`
      SELECT po.*, v.name as vendor_name, v.phone as vendor_phone, v.email as vendor_email, 
             v.address as vendor_address, v.gstin as vendor_gstin,
             w.name as warehouse_name, COALESCE(u.name, 'Admin') as prepared_by
      FROM purchase_orders po
      LEFT JOIN vendors v ON po.vendor_id = v.id
      LEFT JOIN warehouses w ON po.warehouse_id = w.id
      LEFT JOIN users u ON po.user_id = u.id
      WHERE po.id = ?
    `, [id]);

    if (orders.length === 0) {
      return res.status(404).json({ success: false, message: 'Purchase order not found' });
    }

    const order = orders[0];

    // Fetch items
    const [items] = await req.db.query(`
      SELECT poi.*, pr.name as product_name, pr.unit, pr.barcode, cat.name as category
      FROM purchase_order_items poi
      JOIN products pr ON poi.product_id = pr.id
      LEFT JOIN categories cat ON pr.category_id = cat.id
      WHERE poi.purchase_order_id = ?
    `, [id]);

    order.items = items;

    // Fetch linked GRNs
    const [grns] = await req.db.query(
      'SELECT id, grn_no, date, created_at FROM grns WHERE purchase_order_id = ? ORDER BY date DESC, created_at DESC',
      [id]
    );
    order.grns = grns;

    // Fetch linked Invoices
    try {
      const [invoices] = await req.db.query(
        'SELECT id, purchase_no, date, total, payment_status FROM purchases WHERE purchase_order_id = ? ORDER BY date DESC, created_at DESC',
        [id]
      );
      order.invoices = invoices;
    } catch (e) {
      order.invoices = [];
    }

    return res.status(200).json({ success: true, order });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new purchase order
// @route   POST /api/purchases/orders
// @access  Private
export const createPurchaseOrder = async (req, res, next) => {
  const connection = await req.db.getConnection();
  try {
    await connection.beginTransaction();

    const {
      vendor_id,
      warehouse_id,
      date,
      expected_delivery_date,
      subtotal,
      discount,
      gst_amount,
      total,
      notes,
      items
    } = req.body;

    if (!vendor_id || !warehouse_id || !date || !items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Missing purchase order header details or products list' });
    }

    const year = new Date(date).getFullYear();
    const [allPOs] = await connection.query('SELECT purchase_order_no FROM purchase_orders WHERE purchase_order_no LIKE ?', [`PO-%-${year}`]);
    let maxSeq = 0;
    for (const row of allPOs) {
      if (row.purchase_order_no) {
        const parts = row.purchase_order_no.split('-');
        const seq = parseInt(parts[1], 10);
        if (!isNaN(seq) && seq > maxSeq) {
          maxSeq = seq;
        }
      }
    }
    const poNo = `PO-${String(maxSeq + 1).padStart(4, '0')}-${year}`;

    // Insert PO (including user_id for tracking Prepared By metadata)
    const [result] = await connection.query(
      `INSERT INTO purchase_orders (purchase_order_no, vendor_id, warehouse_id, date, expected_delivery_date, subtotal, discount, gst_amount, total, status, notes, user_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Draft', ?, ?)`,
      [poNo, vendor_id, warehouse_id, date, expected_delivery_date || null, subtotal || 0, discount || 0, gst_amount || 0, total || 0, notes || null, req.user.id]
    );

    const poId = result.insertId;

    // Loop items
    for (const item of items) {
      await connection.query(
        `INSERT INTO purchase_order_items (purchase_order_id, product_id, quantity, received_quantity, purchase_price, gst, total)
         VALUES (?, ?, ?, 0, ?, ?, ?)`,
        [poId, item.product_id, item.quantity, item.purchase_price, item.gst, item.total]
      );
    }

    await connection.commit();
    await logActivity(req.user.id, 'Create Purchase Order', 'Purchases', `Created Purchase Order "${poNo}" (Vendor ID: ${vendor_id})`, req.ip);

    return res.status(201).json({
      success: true,
      message: 'Purchase order created successfully',
      purchaseOrderNo: poNo,
      purchaseOrderId: poId
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

// @desc    Update purchase order status
// @route   PUT /api/purchases/orders/:id/status
// @access  Private
export const updatePurchaseOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: 'Status field is required' });
    }

    const [po] = await req.db.query('SELECT purchase_order_no FROM purchase_orders WHERE id = ?', [id]);
    if (po.length === 0) {
      return res.status(404).json({ success: false, message: 'Purchase order not found' });
    }

    await req.db.query('UPDATE purchase_orders SET status = ? WHERE id = ?', [status, id]);
    await logActivity(req.user.id, 'Update PO Status', 'Purchases', `Updated Purchase Order "${po[0].purchase_order_no}" status to "${status}"`, req.ip);

    return res.status(200).json({ success: true, message: 'Purchase order status updated successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete purchase order
// @route   DELETE /api/purchases/orders/:id
// @access  Private
export const deletePurchaseOrder = async (req, res, next) => {
  const connection = await req.db.getConnection();
  try {
    await connection.beginTransaction();
    const { id } = req.params;

    const [po] = await connection.query('SELECT purchase_order_no, status FROM purchase_orders WHERE id = ?', [id]);
    if (po.length === 0) {
      return res.status(404).json({ success: false, message: 'Purchase order not found' });
    }

    if (!['Draft', 'Cancelled'].includes(po[0].status)) {
      return res.status(400).json({ success: false, message: 'Cannot delete a purchase order that is confirmed, received, or completed. Cancel it first.' });
    }

    // Delete items and order
    await connection.query('DELETE FROM purchase_order_items WHERE purchase_order_id = ?', [id]);
    await connection.query('DELETE FROM purchase_orders WHERE id = ?', [id]);

    await connection.commit();
    await logActivity(req.user.id, 'Delete Purchase Order', 'Purchases', `Deleted Purchase Order "${po[0].purchase_order_no}"`, req.ip);

    return res.status(200).json({ success: true, message: 'Purchase order deleted successfully' });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

// ==========================================
// GRN CONTROLLERS
// ==========================================

// @desc    Create GRN (Goods Received Note) and adjust stock levels
// @route   POST /api/purchases/orders/:id/grn
// @access  Private
export const createGRN = async (req, res, next) => {
  const connection = await req.db.getConnection();
  try {
    await connection.beginTransaction();

    const { id: poId } = req.params;
    const { date, notes, items } = req.body;

    if (!date || !items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Missing GRN details or products list' });
    }

    // Get PO details
    const [orders] = await connection.query('SELECT purchase_order_no, vendor_id, warehouse_id FROM purchase_orders WHERE id = ?', [poId]);
    if (orders.length === 0) {
      return res.status(404).json({ success: false, message: 'Linked Purchase Order not found' });
    }

    const { purchase_order_no, vendor_id, warehouse_id } = orders[0];

    // Generate GRN number
    const year = new Date(date).getFullYear();
    const [allGRNs] = await connection.query('SELECT grn_no FROM grns WHERE grn_no LIKE ?', [`GRN-%-${year}`]);
    let maxSeq = 0;
    for (const row of allGRNs) {
      if (row.grn_no) {
        const parts = row.grn_no.split('-');
        const seq = parseInt(parts[1], 10);
        if (!isNaN(seq) && seq > maxSeq) {
          maxSeq = seq;
        }
      }
    }
    const grnNo = `GRN-${String(maxSeq + 1).padStart(4, '0')}-${year}`;

    // Insert GRN
    const [grnResult] = await connection.query(
      `INSERT INTO grns (grn_no, purchase_order_id, vendor_id, warehouse_id, date, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [grnNo, poId, vendor_id, warehouse_id, date, notes || null]
    );

    const grnId = grnResult.insertId;

    const [existingPurchases] = await connection.query(
      'SELECT id FROM purchases WHERE purchase_order_id = ? LIMIT 1',
      [poId]
    );
    let purchaseAlreadyAddedStock = false;
    if (existingPurchases.length > 0) {
      const [pBatches] = await connection.query(
        'SELECT id FROM purchase_batches WHERE purchase_id = ? LIMIT 1',
        [existingPurchases[0].id]
      );
      if (pBatches.length > 0) {
        purchaseAlreadyAddedStock = true;
        await connection.query('UPDATE purchases SET grn_id = ? WHERE id = ?', [grnId, existingPurchases[0].id]);
      }
    }

    // Fetch PO items
    const [poItems] = await connection.query('SELECT id, product_id, quantity, received_quantity FROM purchase_order_items WHERE purchase_order_id = ?', [poId]);

    // Process items, increment stock, add stock logs, update PO received quantities
    for (const item of items) {
      const targetProdId = item.product_id || item.productId || item.id;
      const poItem = poItems.find(p => String(p.product_id) === String(targetProdId) || String(p.id) === String(item.id));
      const productId = poItem ? poItem.product_id : targetProdId;
      if (!productId) continue;

      const qtyRec = Number(item.quantity_received || 0);
      const qtyDam = Number(item.quantity_damaged || 0);
      const qtyRej = Number(item.quantity_rejected || 0);
      const formattedExpiry = parseToISODate(item.expiry_date);

      // Insert grn item
      await connection.query(
        `INSERT INTO grn_items (grn_id, product_id, quantity_received, quantity_damaged, quantity_rejected, batch_number, mrp, expiry_date)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [grnId, productId, qtyRec, qtyDam, qtyRej, item.batch_number || null, item.mrp ? Number(item.mrp) : null, formattedExpiry]
      );

      if (formattedExpiry) {
        const [fifoGrn] = await connection.query(
          `SELECT expiry_date FROM grn_items 
           WHERE product_id = ? AND expiry_date IS NOT NULL AND expiry_date != '' AND expiry_date != 'N/A'
           ORDER BY id DESC LIMIT 1`,
          [productId]
        );
        const fifoDate = fifoGrn.length > 0 ? fifoGrn[0].expiry_date : formattedExpiry;
        await connection.query(
          'UPDATE products SET expiry_date = ? WHERE id = ?',
          [fifoDate, productId]
        );
      }

      if (item.mrp && Number(item.mrp) > 0) {
        const [fifoGrnMrp] = await connection.query(
          `SELECT mrp FROM grn_items 
           WHERE product_id = ? AND mrp IS NOT NULL AND mrp > 0
           ORDER BY id DESC LIMIT 1`,
          [productId]
        );
        const fifoMrp = fifoGrnMrp.length > 0 ? Number(fifoGrnMrp[0].mrp) : Number(item.mrp);
        await connection.query(
          'UPDATE products SET mrp = ? WHERE id = ?',
          [fifoMrp, productId]
        );
      }

      if (poItem) {
        await connection.query(
          'UPDATE purchase_order_items SET received_quantity = received_quantity + ? WHERE id = ?',
          [qtyRec, poItem.id]
        );
      }

      if (qtyRec > 0 && !purchaseAlreadyAddedStock) {
        const [[prod]] = await connection.query('SELECT mrp, selling_price FROM products WHERE id = ?', [productId]);
        const defaultProdMrp = prod ? Number(prod.mrp || 0) : 0;
        const defaultProdSellingPrice = prod ? Number(prod.selling_price || 0) : 0;

        const itemMrp = item.mrp && Number(item.mrp) > 0 ? Number(item.mrp) : (item.max_retail_price && Number(item.max_retail_price) > 0 ? Number(item.max_retail_price) : defaultProdMrp);
        const itemSellingPrice = item.selling_price && Number(item.selling_price) > 0 ? Number(item.selling_price) : defaultProdSellingPrice;

        // Create dedicated batch record in purchase_batches for FIFO inventory management
        await connection.query(
          `INSERT INTO purchase_batches (product_id, batch_number, purchase_quantity, remaining_quantity, purchase_date, expiry_date, purchase_price, mrp, selling_price, supplier_id, warehouse_id, grn_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [productId, item.batch_number || `BATCH-${Date.now()}`, qtyRec, qtyRec, date, formattedExpiry, item.unit_price || 0, itemMrp, itemSellingPrice, vendor_id, warehouse_id, grnId]
        );

        // Update Stock levels
        const [existingStock] = await connection.query(
          'SELECT id, quantity FROM stock WHERE product_id = ? AND warehouse_id = ? LIMIT 1',
          [productId, warehouse_id]
        );

        let prevQty = 0;
        if (existingStock.length > 0) {
          prevQty = Number(existingStock[0].quantity);
          await connection.query(
            'UPDATE stock SET quantity = quantity + ? WHERE id = ?',
            [qtyRec, existingStock[0].id]
          );
        } else {
          await connection.query(
            'INSERT INTO stock (product_id, warehouse_id, quantity) VALUES (?, ?, ?)',
            [productId, warehouse_id, qtyRec]
          );
        }

        // Sync FIFO active batch Expiry Date and MRP on Product master
        await syncProductFifoState(connection, productId);

        // Log Stock movement
        await connection.query(
          `INSERT INTO stock_logs (product_id, warehouse_id, vendor_id, type, quantity, reference_no, notes, user_id, previous_quantity, new_quantity)
           VALUES (?, ?, ?, 'Stock In', ?, ?, ?, ?, ?, ?)`,
          [productId, warehouse_id, vendor_id, qtyRec, grnNo, `Goods Received (PO: ${purchase_order_no})`, req.user.id, prevQty, prevQty + qtyRec]
        );
      }
    }

    // Update PO Status based on quantities
    const [updatedPOItems] = await connection.query('SELECT quantity, received_quantity FROM purchase_order_items WHERE purchase_order_id = ?', [poId]);
    let allReceived = true;
    let anyReceived = false;

    for (const it of updatedPOItems) {
      if (it.received_quantity < it.quantity) {
        allReceived = false;
      }
      if (it.received_quantity > 0) {
        anyReceived = true;
      }
    }

    const newPOStatus = allReceived ? 'Completed' : (anyReceived ? 'Partially Received' : 'Confirmed');

    await connection.query(
      'UPDATE purchase_orders SET status = ? WHERE id = ?',
      [newPOStatus, poId]
    );

    await connection.commit();
    await logActivity(req.user.id, 'Create GRN', 'Purchases', `Created Goods Received Note "${grnNo}" for PO "${purchase_order_no}"`, req.ip);

    return res.status(201).json({
      success: true,
      message: 'Goods Received Note saved and stock levels updated successfully',
      grnNo,
      grnId
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

// @desc    Get all GRNs linked to a Purchase Order
// @route   GET /api/purchases/orders/:id/grns
// @access  Private
export const getGRNsForPO = async (req, res, next) => {
  try {
    const { id: poId } = req.params;

    const [grns] = await req.db.query(`
      SELECT g.*, w.name as warehouse_name, v.name as vendor_name
      FROM grns g
      LEFT JOIN warehouses w ON g.warehouse_id = w.id
      LEFT JOIN vendors v ON g.vendor_id = v.id
      WHERE g.purchase_order_id = ?
      ORDER BY g.date DESC, g.created_at DESC
    `, [poId]);

    // For each GRN, fetch its items
    for (const grn of grns) {
      const [items] = await req.db.query(`
        SELECT gi.*, pr.name as product_name, pr.unit
        FROM grn_items gi
        JOIN products pr ON gi.product_id = pr.id
        WHERE gi.grn_id = ?
      `, [grn.id]);
      grn.items = items;
    }

    return res.status(200).json({ success: true, grns });
  } catch (error) {
    next(error);
  }
};