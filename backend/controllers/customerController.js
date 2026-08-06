import { logActivity } from '../utils/activityLogger.js';
import { createNotification } from '../services/notificationService.js';


// @desc    Get all customers with filters (search, type, status)
// @route   GET /api/customers
// @access  Private
export const getCustomers = async (req, res, next) => {
  try {
    const { search, type, status } = req.query;
    let query = `
      SELECT c.*,
             COALESCE((SELECT SUM(remaining_amount) FROM borrow_transactions WHERE customer_id = c.id AND payment_status != 'Paid'), 0) as outstanding_balance,
             COALESCE((SELECT SUM(remaining_amount) FROM borrow_transactions WHERE customer_id = c.id AND payment_status != 'Paid'), 0) as balance,
             COALESCE((SELECT SUM(total_amount) FROM borrow_transactions WHERE customer_id = c.id), 0) as total_borrowed,
             COALESCE((SELECT SUM(paid_amount) FROM borrow_transactions WHERE customer_id = c.id), 0) as total_paid
      FROM customers c
      WHERE 1=1
    `;
    const queryParams = [];

    if (search) {
      query += ' AND (c.name LIKE ? OR c.phone LIKE ? OR c.customer_code LIKE ?)';
      const s = `%${search}%`;
      queryParams.push(s, s, s);
    }

    if (type) {
      query += ' AND c.customer_type = ?';
      queryParams.push(type);
    }

    if (status) {
      query += ' AND c.status = ?';
      queryParams.push(status);
    }

    query += ' ORDER BY c.name ASC';

    const [customers] = await req.db.query(query, queryParams);
    return res.status(200).json({ success: true, count: customers.length, customers });
  } catch (error) {
    next(error);
  }
};

// @desc    Get customer by ID
// @route   GET /api/customers/:id
// @access  Private
export const getCustomerById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [customers] = await req.db.query(`
      SELECT c.*,
             COALESCE((SELECT SUM(remaining_amount) FROM borrow_transactions WHERE customer_id = c.id AND payment_status != 'Paid'), 0) as outstanding_balance,
             COALESCE((SELECT SUM(remaining_amount) FROM borrow_transactions WHERE customer_id = c.id AND payment_status != 'Paid'), 0) as balance,
             COALESCE((SELECT SUM(total_amount) FROM borrow_transactions WHERE customer_id = c.id), 0) as total_borrowed,
             COALESCE((SELECT SUM(paid_amount) FROM borrow_transactions WHERE customer_id = c.id), 0) as total_paid
      FROM customers c
      WHERE c.id = ?
    `, [id]);
    
    if (customers.length === 0) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    return res.status(200).json({ success: true, customer: customers[0] });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new customer
// @route   POST /api/customers
// @access  Private
export const createCustomer = async (req, res, next) => {
  try {
    const {
      name, phone, address, customer_type, status, payment_mode, notes
    } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ success: false, message: 'Customer Full Name is required' });
    }

    if (!phone || String(phone).trim() === '') {
      return res.status(400).json({ success: false, message: 'Mobile / Phone Number is required' });
    }

    // Clean phone number (strip non-digits)
    const cleanedPhone = String(phone).replace(/\D/g, '');
    if (cleanedPhone.length !== 10) {
      return res.status(400).json({ success: false, message: 'Mobile / Phone Number must be exactly 10 digits' });
    }

    const type = customer_type || 'Walk-in';
    const activeStatus = status || 'Active';
    const pm = payment_mode || 'Cash';

    // Validation: Unique Mobile for Borrow Customers
    if (type === 'Borrow') {
      const [dup] = await req.db.query(
        "SELECT id FROM customers WHERE phone = ? AND customer_type = 'Borrow'",
        [cleanedPhone]
      );
      if (dup.length > 0) {
        return res.status(400).json({ success: false, message: 'A Borrow Customer with this Mobile Number already exists.' });
      }
    }

    // Set expiry date for Walk-in Customer (30 days from now)
    let expiresAt = null;
    if (type === 'Walk-in') {
      const d = new Date();
      d.setDate(d.getDate() + 30);
      expiresAt = d.toISOString().slice(0, 19).replace('T', ' ');
    }

    const [result] = await req.db.query(
      `INSERT INTO customers (
        name, phone, address, customer_type, status, payment_mode, notes,
        created_by, expires_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name.trim(),
        cleanedPhone,
        address || null,
        type,
        activeStatus,
        pm,
        notes || null,
        req.user?.id || null,
        expiresAt
      ]
    );

    const newId = result.insertId;
    const customerCode = `CUST-${String(newId).padStart(5, '0')}`;
    await req.db.query('UPDATE customers SET customer_code = ? WHERE id = ?', [customerCode, newId]);

    await logActivity(
      req.user.id,
      'Create Customer',
      'Customers',
      `Created customer "${name}" (${customerCode}, Type: ${type})`,
      req.ip
    );

    await createNotification({
      tenantId: req.tenantId,
      user_id: req.user?.id,
      type: 'Customer',
      title: 'New Customer Registered',
      message: `New ${type} customer "${name.trim()}" (${customerCode}) was registered.`,
      priority: 'Low',
      related_user: req.user?.name || req.user?.email || 'Staff',
      module: 'Customer',
      related_module: 'Customer',
      reference_id: newId,
      reference_type: 'Customer',
      target_roles: 'Admin,Manager,Staff'
    });

    return res.status(201).json({
      success: true,
      message: 'Customer registered successfully',
      customer: {
        id: newId,
        customer_code: customerCode,
        name,
        phone: cleanedPhone,
        customer_type: type,
        status: activeStatus,
        payment_mode: pm,
        notes
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update customer details
// @route   PUT /api/customers/:id
// @access  Private
export const updateCustomer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name, phone, address, customer_type, status, payment_mode
    } = req.body;

    const [existing] = await req.db.query('SELECT * FROM customers WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    if (existing[0].name === 'Walk-in Customer' && id === '1') {
      return res.status(400).json({ success: false, message: 'Cannot modify system default Walk-in Customer profile' });
    }

    // Phone format validation (10 digits) if provided
    let cleanedPhone = null;
    if (phone) {
      cleanedPhone = String(phone).replace(/\D/g, '');
      if (cleanedPhone.length !== 10) {
        return res.status(400).json({ success: false, message: 'Mobile / Phone Number must be exactly 10 digits' });
      }
    }

    const type = customer_type || existing[0].customer_type;
    const activeStatus = status || existing[0].status;
    const pm = payment_mode || existing[0].payment_mode || 'Cash';

    // Validation: Unique Mobile for Borrow Customers
    if (type === 'Borrow' && phone) {
      const [dup] = await req.db.query(
        "SELECT id FROM customers WHERE phone = ? AND customer_type = 'Borrow' AND id != ?",
        [phone.trim(), id]
      );
      if (dup.length > 0) {
        return res.status(400).json({ success: false, message: 'A Borrow Customer with this Mobile Number already exists.' });
      }
    }

    // Set expiry if type changed to Walk-in, or keep/nullify appropriately
    let expiresAt = existing[0].expires_at;
    if (type === 'Walk-in' && existing[0].customer_type !== 'Walk-in') {
      const d = new Date();
      d.setDate(d.getDate() + 30);
      expiresAt = d.toISOString().slice(0, 19).replace('T', ' ');
    } else if (type === 'Borrow') {
      expiresAt = null; // Borrow is permanent
    }

    await req.db.query(
      `UPDATE customers SET 
        name = COALESCE(?, name), 
        phone = COALESCE(?, phone), 
        address = ?, 
        customer_type = ?, 
        status = ?, 
        payment_mode = ?,
        updated_by = ?,
        expires_at = ?
       WHERE id = ?`,
      [
        name ? name.trim() : null,
        cleanedPhone || null,
        address || null,
        type,
        activeStatus,
        pm,
        req.user?.id || null,
        expiresAt,
        id
      ]
    );

    await logActivity(
      req.user.id,
      'Update Customer',
      'Customers',
      `Updated customer ID: ${id} (${existing[0].customer_code})`,
      req.ip
    );

    return res.status(200).json({ success: true, message: 'Customer profile updated successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete customer
// @route   DELETE /api/customers/:id
// @access  Private
export const deleteCustomer = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [existing] = await req.db.query('SELECT name, customer_code FROM customers WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    if (id === '1' || existing[0].name === 'Walk-in Customer') {
      return res.status(400).json({ success: false, message: 'Cannot delete default Walk-in Customer record' });
    }

    // Check sales dependencies
    const [sales] = await req.db.query('SELECT id FROM sales WHERE customer_id = ?', [id]);
    if (sales.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete customer. Active sales invoices are linked to this customer account. Suggest deactivating instead.'
      });
    }

    // Check borrow transactions dependencies
    const [borrows] = await req.db.query('SELECT id FROM borrow_transactions WHERE customer_id = ?', [id]);
    if (borrows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete customer. Outstanding borrow transactions exist for this customer.'
      });
    }

    await req.db.query('DELETE FROM customers WHERE id = ?', [id]);

    await logActivity(
      req.user.id,
      'Delete Customer',
      'Customers',
      `Deleted customer "${existing[0].name}" (Code: ${existing[0].customer_code})`,
      req.ip
    );

    return res.status(200).json({ success: true, message: 'Customer deleted successfully' });
  } catch (error) {
    next(error);
  }
};
