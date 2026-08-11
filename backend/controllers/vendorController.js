import { logActivity } from '../utils/activityLogger.js';
import { createNotification } from '../services/notificationService.js';


// @desc    Get all vendors with summary totals
// @route   GET /api/vendors
// @access  Private
export const getVendors = async (req, res, next) => {
  try {
    const { status, search } = req.query;

    let queryStr = `
      SELECT v.*,
             COALESCE((SELECT SUM(p.total) FROM purchases p WHERE p.vendor_id = v.id), 0) as total_purchases_calc,
             COALESCE((SELECT SUM(sp.amount) FROM supplier_payments sp WHERE sp.vendor_id = v.id), 0) as total_paid_calc,
             COALESCE((SELECT SUM(pr.total_amount) FROM purchase_returns pr WHERE pr.vendor_id = v.id), 0) as total_returns_calc,
             (SELECT MAX(sp.payment_date) FROM supplier_payments sp WHERE sp.vendor_id = v.id) as last_payment_date
      FROM vendors v 
      WHERE 1=1
    `;
    const queryParams = [];

    if (status) {
      queryStr += ` AND v.status = ?`;
      queryParams.push(status);
    }

    if (search) {
      queryStr += ` AND (v.name LIKE ? OR v.supplier_code LIKE ? OR v.company_name LIKE ? OR v.phone LIKE ? OR v.gstin LIKE ?)`;
      const s = `%${search.trim()}%`;
      queryParams.push(s, s, s, s, s);
    }

    queryStr += ` ORDER BY v.name ASC`;

    const [vendors] = await req.db.query(queryStr, queryParams);

    const processed = vendors.map(v => {
      const grossPurchases = Number(v.total_purchases_calc || v.total_purchases || 0);
      const totalPaid = Number(v.total_paid_calc || v.total_paid || 0);
      const totalReturns = Number(v.total_returns_calc || 0);
      const netPurchases = Math.max(0, grossPurchases - totalReturns);
      const openingBal = v.opening_balance_type === 'Advance' ? -Number(v.opening_balance || 0) : Number(v.opening_balance || 0);
      
      const totalObligation = netPurchases + openingBal;
      const diff = totalObligation - totalPaid;
      
      let outstandingBalance = 0;
      let advanceBalance = 0;
      let paymentStatus = 'Paid';
      
      if (diff > 0) {
        outstandingBalance = Number(diff.toFixed(2));
        paymentStatus = totalPaid > 0 ? 'Partial' : 'Pending';
      } else if (diff < 0) {
        advanceBalance = Number(Math.abs(diff).toFixed(2));
        paymentStatus = 'Advance';
      } else {
        paymentStatus = 'Paid';
      }

      return {
        ...v,
        total_purchases: Number(grossPurchases.toFixed(2)),
        total_returns: Number(totalReturns.toFixed(2)),
        net_purchases: Number(netPurchases.toFixed(2)),
        total_paid: Number(totalPaid.toFixed(2)),
        outstanding_balance: outstandingBalance,
        advance_balance: advanceBalance,
        payment_status: paymentStatus
      };
    });

    return res.status(200).json({ success: true, count: processed.length, vendors: processed });
  } catch (error) {
    next(error);
  }
};

// @desc    Get vendor by ID
// @route   GET /api/vendors/:id
// @access  Private
export const getVendorById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [vendors] = await req.db.query('SELECT * FROM vendors WHERE id = ?', [id]);
    
    if (vendors.length === 0) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    return res.status(200).json({ success: true, vendor: vendors[0] });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new vendor/supplier
// @route   POST /api/vendors
// @access  Private
export const createVendor = async (req, res, next) => {
  try {
    const {
      name, phone, alternate_phone, email, address, gstin, pan, company_name, contact_person,
      city, state, pincode, categories_supplied, payment_terms,
      credit_limit, opening_balance, opening_balance_type, status, notes,
      bank_name, account_number, ifsc_code
    } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Supplier name is required', field: 'name' });
    }

    if (!phone || String(phone).trim() === '') {
      return res.status(400).json({ success: false, message: 'Supplier mobile number is required', field: 'phone' });
    }

    const cleanedPhone = String(phone).replace(/\D/g, '');
    if (cleanedPhone.length !== 10) {
      return res.status(400).json({ success: false, message: 'Supplier mobile number must be exactly 10 digits', field: 'phone' });
    }

    let cleanedAltPhone = null;
    if (alternate_phone && String(alternate_phone).trim() !== '') {
      cleanedAltPhone = String(alternate_phone).replace(/\D/g, '');
      if (cleanedAltPhone.length !== 10) {
        return res.status(400).json({ success: false, message: 'Alternate mobile number must be exactly 10 digits', field: 'alternate_phone' });
      }
    }

    // Duplicate Checks
    const [dupPhone] = await req.db.query('SELECT id FROM vendors WHERE phone = ?', [cleanedPhone]);
    if (dupPhone.length > 0) {
      return res.status(400).json({ success: false, message: `A supplier with mobile number "${cleanedPhone}" already exists.`, field: 'phone' });
    }

    if (gstin) {
      const [dupGstin] = await req.db.query('SELECT id FROM vendors WHERE gstin = ?', [gstin]);
      if (dupGstin.length > 0) {
        return res.status(400).json({ success: false, message: `A supplier with GSTIN "${gstin}" already exists.`, field: 'gstin' });
      }
    }

    if (email) {
      const [dupEmail] = await req.db.query('SELECT id FROM vendors WHERE email = ?', [email]);
      if (dupEmail.length > 0) {
        return res.status(400).json({ success: false, message: `A supplier with email address "${email}" already exists.`, field: 'email' });
      }
    }

    // Insert vendor
    const [result] = await req.db.query(
      `INSERT INTO vendors (
        name, phone, alternate_phone, email, address, gstin, pan, company_name, contact_person,
        city, state, pincode, categories_supplied, payment_terms,
        credit_limit, opening_balance, opening_balance_type, status, notes,
        bank_name, account_number, ifsc_code
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        cleanedPhone,
        cleanedAltPhone || null,
        email || null,
        address || null,
        gstin || null,
        pan || null,
        company_name || null,
        contact_person || null,
        city || null,
        state || null,
        pincode || null,
        categories_supplied || null,
        payment_terms || null,
        credit_limit || 0.00,
        opening_balance || 0.00,
        opening_balance_type || 'Payable',
        status || 'Active',
        notes || null,
        bank_name || null,
        account_number || null,
        ifsc_code || null
      ]
    );

    const newId = result.insertId;
    const supplierCode = `SUP-${String(newId).padStart(4, '0')}`;

    await req.db.query('UPDATE vendors SET supplier_code = ? WHERE id = ?', [supplierCode, newId]);

    await logActivity({
      userId: req.user.id,
      action: 'Create Supplier',
      module: 'Vendors',
      details: `Created Supplier "${name}" (${supplierCode})`,
      recordId: supplierCode,
      status: 'Success'
    });

    await createNotification({
      tenantId: req.tenantId,
      user_id: req.user.id,
      type: 'Supplier',
      title: 'New Supplier Registered',
      message: `Supplier "${name}" (${supplierCode}) was created.`,
      priority: 'Low',
      related_user: req.user.name || req.user.email,
      module: 'Supplier',
      related_module: 'Supplier',
      reference_id: newId,
      reference_type: 'Vendor',
      target_roles: 'Admin,Manager,Staff'
    });

    return res.status(201).json({
      success: true,
      message: 'Supplier created successfully',
      vendor: {
        id: newId,
        supplier_code: supplierCode,
        name,
        phone: cleanedPhone,
        email,
        company_name,
        status
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update existing vendor
// @route   PUT /api/vendors/:id
// @access  Private
export const updateVendor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name, phone, alternate_phone, email, address, gstin, pan, company_name, contact_person,
      city, state, pincode, categories_supplied, payment_terms,
      credit_limit, opening_balance, opening_balance_type, status, notes,
      bank_name, account_number, ifsc_code
    } = req.body;

    const [existing] = await req.db.query('SELECT id, name, supplier_code FROM vendors WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    let cleanedPhone = null;
    if (phone) {
      cleanedPhone = String(phone).replace(/\D/g, '');
      if (cleanedPhone.length !== 10) {
        return res.status(400).json({ success: false, message: 'Supplier mobile number must be exactly 10 digits', field: 'phone' });
      }
      const [dupPhone] = await req.db.query('SELECT id FROM vendors WHERE phone = ? AND id != ?', [cleanedPhone, id]);
      if (dupPhone.length > 0) {
        return res.status(400).json({ success: false, message: `Another supplier with mobile number "${cleanedPhone}" already exists.`, field: 'phone' });
      }
    }

    let cleanedAltPhone = null;
    if (alternate_phone && String(alternate_phone).trim() !== '') {
      cleanedAltPhone = String(alternate_phone).replace(/\D/g, '');
      if (cleanedAltPhone.length !== 10) {
        return res.status(400).json({ success: false, message: 'Alternate mobile number must be exactly 10 digits', field: 'alternate_phone' });
      }
    }

    if (gstin) {
      const [dupGstin] = await req.db.query('SELECT id FROM vendors WHERE gstin = ? AND id != ?', [gstin, id]);
      if (dupGstin.length > 0) {
        return res.status(400).json({ success: false, message: `Another supplier with GSTIN "${gstin}" already exists.`, field: 'gstin' });
      }
    }

    const previousName = existing[0].name;
    const code = existing[0].supplier_code || `SUP-${String(id).padStart(4, '0')}`;

    await req.db.query(
      `UPDATE vendors SET 
        name = COALESCE(?, name), 
        phone = ?, 
        alternate_phone = ?,
        email = ?, 
        address = ?, 
        gstin = ?, 
        pan = ?,
        company_name = ?, 
        contact_person = ?,
        city = ?, 
        state = ?, 
        pincode = ?, 
        categories_supplied = ?, 
        payment_terms = ?,
        credit_limit = ?,
        opening_balance = ?, 
        opening_balance_type = ?,
        status = ?, 
        notes = ?,
        bank_name = ?,
        account_number = ?,
        ifsc_code = ?,
        supplier_code = ?
      WHERE id = ?`,
      [
        name || previousName,
        cleanedPhone || null,
        cleanedAltPhone || null,
        email || null,
        address || null,
        gstin || null,
        pan || null,
        company_name || null,
        contact_person || null,
        city || null,
        state || null,
        pincode || null,
        categories_supplied || null,
        payment_terms || null,
        credit_limit || 0.00,
        opening_balance || 0.00,
        opening_balance_type || 'Payable',
        status || 'Active',
        notes || null,
        bank_name || null,
        account_number || null,
        ifsc_code || null,
        code,
        id
      ]
    );

    await logActivity({
      userId: req.user.id,
      action: 'Update Supplier',
      module: 'Vendors',
      details: `Updated Supplier "${name || previousName}" (ID: ${id})`,
      recordId: code,
      status: 'Success'
    });

    return res.status(200).json({ success: true, message: 'Supplier updated successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle vendor status (Active/Inactive)
// @route   PATCH /api/vendors/:id/status
// @access  Private
export const toggleVendorStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const [existing] = await req.db.query('SELECT id, name, status, supplier_code FROM vendors WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    const newStatus = status || (existing[0].status === 'Active' ? 'Inactive' : 'Active');

    await req.db.query('UPDATE vendors SET status = ? WHERE id = ?', [newStatus, id]);

    await logActivity({
      userId: req.user.id,
      action: 'Toggle Supplier Status',
      module: 'Vendors',
      details: `Toggled status of Supplier "${existing[0].name}" (ID: ${id}) to ${newStatus}`,
      recordId: existing[0].supplier_code || `SUP-${String(id).padStart(4, '0')}`,
      status: 'Success'
    });

    return res.status(200).json({
      success: true,
      message: `Supplier "${existing[0].name}" status updated to ${newStatus}`,
      status: newStatus
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete vendor (Disabled by ERP policy)
// @route   DELETE /api/vendors/:id
// @access  Private
export const deleteVendor = async (req, res, next) => {
  return res.status(403).json({
    success: false,
    message: 'Permanent deletion is disabled in Kirana ERP master settings. Please toggle status to Inactive instead.'
  });
};

// @desc    Get vendor profile details
// @route   GET /api/vendors/:id/profile
// @access  Private
export const getVendorProfile = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { date_from, date_to } = req.query;

    const [vendorRows] = await req.db.query('SELECT * FROM vendors WHERE id = ?', [id]);
    if (vendorRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }
    const vendor = vendorRows[0];

    const [ordersResult] = await req.db.query(
      `SELECT COUNT(id) as total_orders, 
              COALESCE(SUM(total), 0) as total_amount, 
              MAX(created_at) as last_purchase_date 
       FROM purchases 
       WHERE vendor_id = ?`,
      [id]
    );

    const [productsResult] = await req.db.query(`
      SELECT p.name, p.barcode, SUM(pi.quantity) as total_quantity 
      FROM purchase_items pi
      JOIN purchases pu ON pi.purchase_id = pu.id
      JOIN products p ON pi.product_id = p.id
      WHERE pu.vendor_id = ?
      GROUP BY pi.product_id
      ORDER BY total_quantity DESC
      LIMIT 5
    `, [id]);

    const [returnsResult] = await req.db.query(`
      SELECT pr.id, pr.purchase_no, pr.quantity, pr.total_amount, pr.reason, pr.created_at, p.name as product_name
      FROM purchase_returns pr
      JOIN products p ON pr.product_id = p.id
      WHERE pr.vendor_id = ?
      ORDER BY pr.created_at DESC
    `, [id]);

    return res.status(200).json({
      success: true,
      profile: {
        vendor,
        totalOrders: ordersResult[0]?.total_orders || 0,
        totalAmount: ordersResult[0]?.total_amount || 0,
        lastPurchaseDate: ordersResult[0]?.last_purchase_date || null,
        mostPurchasedProducts: productsResult,
        returnHistory: returnsResult
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get complete Vendor Ledger (Statement of Account)
// @route   GET /api/vendors/:id/ledger
// @access  Private
export const getVendorLedger = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { date_from, date_to } = req.query;

    const [vendorRows] = await req.db.query('SELECT * FROM vendors WHERE id = ?', [id]);
    if (vendorRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }
    const vendor = vendorRows[0];

    // 1. Fetch Invoices
    const [invoices] = await req.db.query(
      `SELECT id, purchase_no as reference_no, date, total as debit_amount, 0.00 as credit_amount, 
              'PURCHASE_INVOICE' as transaction_type, payment_status, COALESCE(paid_amount, 0) as paid_amount,
              CONCAT('Purchase Invoice ', purchase_no) as description, created_at
       FROM purchases
       WHERE vendor_id = ?`,
      [id]
    );

    // 2. Fetch Payments, Refunds & Adjustments
    const [payments] = await req.db.query(
      `SELECT sp.id, sp.payment_no as reference_no, sp.payment_date as date, 
              IF(sp.amount < 0, ABS(sp.amount), 0.00) as debit_amount, 
              IF(sp.amount >= 0, sp.amount, 0.00) as credit_amount,
              IF(sp.payment_no LIKE 'VREF-%', 'SUPPLIER_REFUND', IF(sp.amount < 0, 'DEBT_ADJUSTMENT', 'SUPPLIER_PAYMENT')) as transaction_type, 
              sp.payment_mode, sp.reference_no as mode_ref,
              IF(sp.payment_no LIKE 'VREF-%',
                 CONCAT('Cash Refund Received from Supplier via ', sp.payment_mode, IF(sp.reference_no IS NOT NULL AND sp.reference_no != '', CONCAT(' (Ref: ', sp.reference_no, ')'), '')),
                 IF(sp.amount < 0, 
                    CONCAT('Supplier Payable Charge Addition', IF(sp.remarks IS NOT NULL AND sp.remarks != '', CONCAT(' (', sp.remarks, ')'), '')),
                    CONCAT('Supplier Payment via ', sp.payment_mode, IF(sp.reference_no IS NOT NULL AND sp.reference_no != '', CONCAT(' (Ref: ', sp.reference_no, ')'), ''))
                 )
              ) as description,
              sp.created_at, sp.purchase_id
       FROM supplier_payments sp
       WHERE sp.vendor_id = ?`,
      [id]
    );

    // 3. Fetch Returns
    const [returns] = await req.db.query(
      `SELECT pr.id, CONCAT('VRN-', pr.id) as reference_no, pr.created_at as date, 0.00 as debit_amount, pr.total_amount as credit_amount,
              'PURCHASE_RETURN' as transaction_type,
              CONCAT('Purchase Return Write-Off: ', pr.reason) as description,
              pr.created_at
       FROM purchase_returns pr
       WHERE pr.vendor_id = ?`,
      [id]
    );

    // Combine and sort chronologically
    let rawLedger = [...invoices, ...payments, ...returns];

    if (date_from) {
      rawLedger = rawLedger.filter(item => new Date(item.date) >= new Date(date_from));
    }
    if (date_to) {
      rawLedger = rawLedger.filter(item => new Date(item.date) <= new Date(date_to + 'T23:59:59'));
    }

    rawLedger.sort((a, b) => new Date(a.date) - new Date(b.date) || new Date(a.created_at) - new Date(b.created_at));

    // Calculate running balance
    const initOpening = vendor.opening_balance_type === 'Advance' ? -Number(vendor.opening_balance || 0) : Number(vendor.opening_balance || 0);
    let runningBalance = initOpening;

    const ledger = rawLedger.map(entry => {
      runningBalance = runningBalance + Number(entry.debit_amount) - Number(entry.credit_amount);
      return {
        ...entry,
        debit_amount: Number(Number(entry.debit_amount).toFixed(2)),
        credit_amount: Number(Number(entry.credit_amount).toFixed(2)),
        running_balance: Number(runningBalance.toFixed(2))
      };
    });

    const totalPurchases = invoices.reduce((sum, inv) => sum + Number(inv.debit_amount), 0);
    const totalPaid = payments.reduce((sum, p) => sum + Number(p.credit_amount), 0);
    const totalReturns = returns.reduce((sum, r) => sum + Number(r.credit_amount), 0);
    const netPurchases = Math.max(0, totalPurchases - totalReturns);

    const totalObligation = netPurchases + initOpening;
    const diff = totalObligation - totalPaid;

    let outstandingBalance = 0;
    let advanceBalance = 0;
    let paymentStatus = 'Paid';

    if (diff > 0) {
      outstandingBalance = Number(diff.toFixed(2));
      paymentStatus = totalPaid > 0 ? 'Partial' : 'Pending';
    } else if (diff < 0) {
      advanceBalance = Number(Math.abs(diff).toFixed(2));
      paymentStatus = 'Advance';
    } else {
      paymentStatus = 'Paid';
    }

    return res.status(200).json({
      success: true,
      summary: {
        vendor_id: vendor.id,
        supplier_code: vendor.supplier_code || `SUP-${String(vendor.id).padStart(4, '0')}`,
        name: vendor.name,
        company_name: vendor.company_name,
        phone: vendor.phone,
        email: vendor.email,
        gstin: vendor.gstin,
        address: vendor.address,
        payment_terms: vendor.payment_terms || 'Net 30',
        credit_limit: Number(vendor.credit_limit || 0),
        opening_balance: Number(vendor.opening_balance || 0),
        opening_balance_type: vendor.opening_balance_type || 'Payable',
        total_purchases: Number(totalPurchases.toFixed(2)),
        total_returns: Number(totalReturns.toFixed(2)),
        net_purchases: Number(netPurchases.toFixed(2)),
        total_paid: Number(totalPaid.toFixed(2)),
        outstanding_balance: outstandingBalance,
        advance_balance: advanceBalance,
        payment_status: paymentStatus,
        last_payment_date: payments.length > 0 ? payments[payments.length - 1].date : null
      },
      ledger
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all payments recorded for a vendor
// @route   GET /api/vendors/:id/payments
// @access  Private
export const getVendorPayments = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [payments] = await req.db.query(
      `SELECT sp.*, p.purchase_no, p.total as purchase_total
       FROM supplier_payments sp
       LEFT JOIN purchases p ON sp.purchase_id = p.id
       WHERE sp.vendor_id = ?
       ORDER BY sp.payment_date DESC, sp.created_at DESC`,
      [id]
    );

    return res.status(200).json({ success: true, count: payments.length, payments });
  } catch (error) {
    next(error);
  }
};

// @desc    Get purchase invoices list for a vendor (with paid/unpaid status)
// @route   GET /api/vendors/:id/invoices
// @access  Private
export const getVendorInvoices = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [invoices] = await req.db.query(
      `SELECT p.id, p.purchase_no, p.date, p.total, COALESCE(p.paid_amount, 0) as paid_amount, 
              (p.total - COALESCE(p.paid_amount, 0)) as due_amount,
              p.payment_status, p.delivery_status
       FROM purchases p
       WHERE p.vendor_id = ?
       ORDER BY p.date DESC, p.created_at DESC`,
      [id]
    );

    const mappedInvoices = invoices.map(inv => {
      const tot = Number(inv.total || 0);
      const paid = Number(inv.paid_amount || 0);
      let status = inv.payment_status || 'Pending';
      if (paid >= tot && tot > 0) {
        status = 'Paid';
      } else if (paid > 0) {
        status = 'Partial';
      } else {
        status = 'Pending';
      }
      return {
        ...inv,
        paid_amount: paid,
        due_amount: Math.max(0, tot - paid),
        payment_status: status
      };
    });

    return res.status(200).json({ success: true, count: mappedInvoices.length, invoices: mappedInvoices });
  } catch (error) {
    next(error);
  }
};

// @desc    Record Supplier Payment, Cash Refund Received, or Debt Adjustment
// @route   POST /api/vendors/:id/payments
// @access  Private (Admin, Manager)
export const recordSupplierPayment = async (req, res, next) => {
  const connection = await req.db.getConnection();
  try {
    await connection.beginTransaction();

    const { id: vendor_id } = req.params;
    const {
      purchase_id,
      amount,
      entry_type, // 'PAYMENT' (Payment Paid), 'REFUND' (Cash Refund Received), 'ADD_DEBT' (Add Debt)
      payment_date,
      payment_mode,
      reference_no,
      bank_account,
      remarks
    } = req.body;

    const rawAmount = Number(amount);
    if (!rawAmount || isNaN(rawAmount)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid numeric payment or charge amount.' });
    }

    const absAmount = Math.abs(rawAmount);

    const [vendorRows] = await connection.query('SELECT * FROM vendors WHERE id = ?', [vendor_id]);
    if (vendorRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Supplier not found.' });
    }
    const vendor = vendorRows[0];

    // Check current balance state for the supplier
    const [allInvCheck] = await connection.query('SELECT COALESCE(SUM(total), 0) as total FROM purchases WHERE vendor_id = ?', [vendor_id]);
    const [allRetCheck] = await connection.query('SELECT COALESCE(SUM(total_amount), 0) as total FROM purchase_returns WHERE vendor_id = ?', [vendor_id]);
    const [allPayCheck] = await connection.query('SELECT COALESCE(SUM(amount), 0) as total FROM supplier_payments WHERE vendor_id = ?', [vendor_id]);
    const netPurchasesCheck = Math.max(0, Number(allInvCheck[0].total || 0) - Number(allRetCheck[0].total || 0));
    const openingBalCheck = vendor.opening_balance_type === 'Advance' ? -Number(vendor.opening_balance || 0) : Number(vendor.opening_balance || 0);
    const currentDiff = (netPurchasesCheck + openingBalCheck) - Number(allPayCheck[0].total || 0);

    let storedAmount = 0;
    let isRefund = false;
    let isAddDebt = false;

    if (entry_type === 'SUBTRACT' || entry_type === 'SUB') {
      if (currentDiff < 0) {
        // Vendor has Advance Credit. Subtracting decreases Advance Credit towards 0
        storedAmount = -absAmount;
        isRefund = true;
      } else {
        // Vendor has Outstanding Debt. Subtracting decreases Debt towards 0
        storedAmount = absAmount;
        isRefund = false;
      }
    } else if (entry_type === 'ADD') {
      if (currentDiff < 0) {
        // Vendor has Advance Credit. Adding increases Advance Credit
        storedAmount = absAmount;
        isRefund = false;
      } else {
        // Vendor has Outstanding Debt. Adding increases Debt
        storedAmount = -absAmount;
        isAddDebt = true;
      }
    } else if (entry_type === 'REFUND') {
      storedAmount = -absAmount;
      isRefund = true;
    } else if (entry_type === 'ADD_DEBT' || entry_type === 'DEBT_ADD') {
      storedAmount = -absAmount;
      isAddDebt = true;
    } else {
      storedAmount = absAmount;
    }

    // Generate Reference Number Prefix
    const year = new Date(payment_date || Date.now()).getFullYear();
    const prefix = isRefund ? 'VREF' : (isAddDebt ? 'VCHG' : 'VPAY');
    const [allPays] = await connection.query('SELECT payment_no FROM supplier_payments WHERE payment_no LIKE ?', [`${prefix}-%-${year}`]);
    let maxSeq = 0;
    for (const row of allPays) {
      if (row.payment_no) {
        const parts = row.payment_no.split('-');
        const seq = parseInt(parts[1], 10);
        if (!isNaN(seq) && seq > maxSeq) {
          maxSeq = seq;
        }
      }
    }
    const paymentNo = `${prefix}-${String(maxSeq + 1).padStart(4, '0')}-${year}`;

    // Insert Payment / Refund Record
    const [payResult] = await connection.query(
      `INSERT INTO supplier_payments 
        (payment_no, vendor_id, purchase_id, payment_date, amount, payment_mode, reference_no, bank_account, remarks, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        paymentNo,
        vendor_id,
        purchase_id || null,
        payment_date || new Date(),
        storedAmount,
        payment_mode || 'Cash',
        reference_no || null,
        bank_account || null,
        remarks || null,
        req.user.id
      ]
    );

    const paymentId = payResult.insertId;

    if (!isRefund && !isAddDebt) {
      // Distribute Payment to Purchases (Only for PAYMENT / Payment Paid)
      if (purchase_id) {
        const [pRows] = await connection.query('SELECT id, total, COALESCE(paid_amount, 0) as paid_amount FROM purchases WHERE id = ? AND vendor_id = ?', [purchase_id, vendor_id]);
        if (pRows.length > 0) {
          const p = pRows[0];
          const newPaid = Number(p.paid_amount || 0) + absAmount;
          const pTotal = Number(p.total || 0);
          let newStatus = 'Pending';
          if (newPaid >= pTotal) {
            newStatus = 'Paid';
          } else if (newPaid > 0) {
            newStatus = 'Partial';
          }

          await connection.query(
            'UPDATE purchases SET paid_amount = ?, payment_status = ? WHERE id = ?',
            [newPaid, newStatus, purchase_id]
          );
        }
      } else {
        // FIFO bulk allocation across unpaid purchases
        let remainingToAllocate = absAmount;
        const [unpaidInvoices] = await connection.query(
          `SELECT id, total, COALESCE(paid_amount, 0) as paid_amount 
           FROM purchases 
           WHERE vendor_id = ? AND payment_status IN ('Pending', 'Partial') 
           ORDER BY date ASC, created_at ASC`,
          [vendor_id]
        );

        for (const inv of unpaidInvoices) {
          if (remainingToAllocate <= 0) break;
          const invTotal = Number(inv.total || 0);
          const invPaid = Number(inv.paid_amount || 0);
          const invDue = invTotal - invPaid;

          if (invDue > 0) {
            const alloc = Math.min(remainingToAllocate, invDue);
            const updatedPaid = invPaid + alloc;
            const updatedStatus = updatedPaid >= invTotal ? 'Paid' : 'Partial';

            await connection.query(
              'UPDATE purchases SET paid_amount = ?, payment_status = ? WHERE id = ?',
              [updatedPaid, updatedStatus, inv.id]
            );

            remainingToAllocate -= alloc;
          }
        }
      }
    }

    // Single Source of Truth Supplier Balance Engine
    const [invSumSync] = await connection.query('SELECT COALESCE(SUM(total), 0) as total FROM purchases WHERE vendor_id = ? AND payment_status != "Void"', [vendor_id]);
    const [retSumSync] = await connection.query('SELECT COALESCE(SUM(total_amount), 0) as total FROM purchase_returns WHERE vendor_id = ? AND status != "Void"', [vendor_id]);
    const [paySumSync] = await connection.query('SELECT COALESCE(SUM(amount), 0) as total FROM supplier_payments WHERE vendor_id = ?', [vendor_id]);

    const grossPSync = Number(invSumSync[0].total || 0);
    const retPSync = Number(retSumSync[0].total || 0);
    const netPSync = Math.max(0, grossPSync - retPSync);
    const openBSync = vendor.opening_balance_type === 'Advance' ? -Number(vendor.opening_balance || 0) : Number(vendor.opening_balance || 0);
    const totPaidSync = Number(paySumSync[0].total || 0);

    const totalObligationSync = netPSync + openBSync;
    const diffSync = totalObligationSync - totPaidSync;

    let newOutstanding = 0;
    if (diffSync > 0) {
      newOutstanding = Number(diffSync.toFixed(2));
    }

    await connection.query(
      'UPDATE vendors SET total_purchases = ?, total_paid = ?, outstanding_balance = ? WHERE id = ?',
      [grossPSync, totPaidSync, newOutstanding, vendor_id]
    );

    // Save Vendor Ledger entry
    const debitAmt = (isRefund || isAddDebt) ? absAmount : 0.00;
    const creditAmt = (isRefund || isAddDebt) ? 0.00 : absAmount;
    const transType = (isRefund || isAddDebt) ? 'ADJUSTMENT' : 'SUPPLIER_PAYMENT';
    const descText = isRefund
      ? `Cash Refund Received from Supplier via ${payment_mode || 'Cash'}${reference_no ? ` (Ref: ${reference_no})` : ''}`
      : isAddDebt
      ? `Supplier Payable Charge Addition${remarks ? ` (${remarks})` : ''}`
      : `Supplier Payment via ${payment_mode || 'Cash'}${reference_no ? ` (Ref: ${reference_no})` : ''}`;

    await connection.query(
      `INSERT INTO vendor_ledger 
        (vendor_id, purchase_id, payment_id, date, transaction_type, reference_no, description, debit_amount, credit_amount, running_balance)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        vendor_id,
        purchase_id || null,
        paymentId,
        payment_date || new Date(),
        transType,
        paymentNo,
        descText,
        debitAmt,
        creditAmt,
        newOutstanding
      ]
    );

    await connection.commit();

    const actionText = isRefund 
      ? 'Supplier Cash Refund Received' 
      : isAddDebt 
      ? 'Supplier Debt Added (+)' 
      : 'Supplier Payment Recorded (-)';
    const msgText = isRefund
      ? `Cash Refund of ₹${absAmount.toLocaleString('en-IN')} received from Supplier "${vendor.name}" (${paymentNo}).`
      : isAddDebt
      ? `Debt/Charge of ₹${absAmount.toLocaleString('en-IN')} added to "${vendor.name}" (${paymentNo}).`
      : `Payment of ₹${absAmount.toLocaleString('en-IN')} recorded for "${vendor.name}" (${paymentNo}).`;

    await logActivity({
      userId: req.user.id,
      action: actionText,
      module: 'Vendors',
      details: msgText,
      recordId: paymentNo,
      status: 'Success'
    });

    await createNotification({
      tenantId: req.tenantId,
      user_id: req.user.id,
      type: 'Supplier Payment',
      title: actionText,
      message: msgText,
      priority: 'Medium',
      related_user: req.user.name || req.user.email,
      module: 'Supplier',
      related_module: 'Supplier',
      reference_id: paymentId,
      reference_type: 'SupplierPayment',
      target_roles: 'Admin,Manager,Staff'
    });

    return res.status(201).json({
      success: true,
      message: msgText,
      paymentNo,
      paymentId
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

// @desc    Get payment receipt for printing / viewing
// @route   GET /api/vendors/payments/:paymentId/receipt
// @access  Private
export const getPaymentReceipt = async (req, res, next) => {
  try {
    const { paymentId } = req.params;

    const [rows] = await req.db.query(
      `SELECT sp.*, v.name as vendor_name, v.supplier_code, v.company_name, v.phone as vendor_phone, 
              v.email as vendor_email, v.address as vendor_address, v.gstin as vendor_gstin,
              p.purchase_no, p.total as purchase_total
       FROM supplier_payments sp
       JOIN vendors v ON sp.vendor_id = v.id
       LEFT JOIN purchases p ON sp.purchase_id = p.id
       WHERE sp.id = ?`,
      [paymentId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Payment receipt not found.' });
    }

    return res.status(200).json({ success: true, receipt: rows[0] });
  } catch (error) {
    next(error);
  }
};
