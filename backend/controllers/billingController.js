import Razorpay from 'razorpay';
import crypto from 'crypto';
import { masterPool, getTenantPool } from '../config/tenantDb.js';
import { createNotification } from '../services/notificationService.js';

// Plan rates configuration
const PLAN_RATES = {
  Monthly: { price: 800, months: 1 },
  Quarterly: { price: 2100, months: 3 },
  'Half-Yearly': { price: 3600, months: 6 },
  Yearly: { price: 6000, months: 12 }
};

// Initialize Razorpay SDK instance (support mock state as fallback)
const getRazorpayInstance = () => {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret || key_id.startsWith('your_') || key_secret.startsWith('your_')) {
    console.warn('[Billing] Razorpay API credentials are not set or are placeholder values. Operating in Mock mode.');
    return null;
  }
  return new Razorpay({ key_id, key_secret });
};

// @desc    Get subscription status and billing invoices for Admin
// @route   GET /api/billing/status
// @access  Private (Admin only)
export const getBillingStatus = async (req, res, next) => {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      return res.status(400).json({ success: false, message: 'Invalid tenant specifications' });
    }

    // 1. Fetch store metadata from Master Database
    const [tenants] = await masterPool.query(
      'SELECT store_name, owner_name, email, phone, gstin, subscription_status, subscription_plan, subscription_expires_at, trial_started_at, trial_ended_at, trial_used, first_login_at FROM tenants WHERE id = ?',
      [tenantId]
    );

    if (tenants.length === 0) {
      return res.status(404).json({ success: false, message: 'Store not found in Master registry' });
    }

    // 2. Fetch invoicing history
    const [invoices] = await masterPool.query(
      'SELECT * FROM billing_history WHERE tenant_id = ? ORDER BY billing_date DESC',
      [tenantId]
    );

    // 3. Fetch audit logs of billing actions
    const [logs] = await masterPool.query(
      'SELECT * FROM subscription_logs WHERE tenant_id = ? ORDER BY created_at DESC',
      [tenantId]
    );

    return res.status(200).json({
      success: true,
      subscription: tenants[0],
      invoices,
      logs
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Simulate stripe/razorpay recurring autopay subscription renewal
// @route   POST /api/billing/subscribe
// @access  Private (Admin only)
export const subscribeStorePlan = async (req, res, next) => {
  try {
    const tenantId = req.tenantId;
    const { planName } = req.body;

    if (!PLAN_RATES[planName]) {
      return res.status(400).json({ success: false, message: 'Invalid subscription package selected' });
    }

    const { price, months } = PLAN_RATES[planName];

    // Get current subscription status
    const [tenants] = await masterPool.query(
      'SELECT subscription_expires_at, subscription_status, store_name FROM tenants WHERE id = ?',
      [tenantId]
    );

    if (tenants.length === 0) {
      return res.status(404).json({ success: false, message: 'Store metadata not found' });
    }

    const tenant = tenants[0];
    let startDate = new Date();
    
    // If tenant subscription is currently active, extend from current expiry date
    if (tenant.subscription_expires_at && new Date(tenant.subscription_expires_at) > new Date() && tenant.subscription_status === 'Active') {
      startDate = new Date(tenant.subscription_expires_at);
    }

    const expiryDate = new Date(startDate);
    expiryDate.setMonth(expiryDate.getMonth() + months);

    const transactionId = 'TXN-' + Math.random().toString(36).substr(2, 9).toUpperCase();

    // Perform transaction update in Master Database
    await masterPool.query(
      `UPDATE tenants 
       SET subscription_status = 'Active', 
           subscription_plan = ?, 
           subscription_expires_at = ?
       WHERE id = ?`,
      [planName, expiryDate, tenantId]
    );

    // Insert Invoice Log
    await masterPool.query(
      `INSERT INTO billing_history (tenant_id, transaction_id, amount, plan, payment_status, billing_date, next_renewal_date, payment_method)
       VALUES (?, ?, ?, ?, 'Paid', CURRENT_DATE(), ?, 'Online Upgrade')`,
      [tenantId, transactionId, price, planName, expiryDate]
    );

    // Also insert subscription record for Super Admin analytics
    try {
      await masterPool.query(
        `INSERT INTO subscriptions (tenant_id, plan, status, subscription_start_date, subscription_expiry_date, payment_status, payment_gateway, amount)
         VALUES (?, ?, 'Active', CURRENT_DATE(), ?, 'Paid', 'Online Upgrade', ?)`,
        [tenantId, planName, expiryDate, price]
      );
    } catch (subErr) {
      console.warn('[Billing] Subscription insert error:', subErr.message);
    }

    // Log action audit
    await masterPool.query(
      'INSERT INTO subscription_logs (tenant_id, action, description) VALUES (?, "Renewed", ?)',
      [tenantId, `Subscribed to ${planName} package (₹${price.toLocaleString('en-IN')}). Next AutoPay renewal on ${expiryDate.toLocaleDateString()}.`]
    );

    // Reactivate users under this tenant in case they were suspended
    await masterPool.query(
      'UPDATE users SET status = "Active" WHERE tenant_id = ?',
      [tenantId]
    );

    return res.status(200).json({
      success: true,
      message: `Successfully renewed subscription on ${planName} plan!`,
      transactionId,
      expiresAt: expiryDate
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel recurring AutoPay renewal settings
// @route   POST /api/billing/cancel
// @access  Private (Admin only)
export const cancelStorePlan = async (req, res, next) => {
  try {
    const tenantId = req.tenantId;

    await masterPool.query(
      'INSERT INTO subscription_logs (tenant_id, action, description) VALUES (?, "Cancelled", "AutoPay recurring subscription cancelled by customer admin. Account access will suspend upon plan expiration date.")',
      [tenantId]
    );

    return res.status(200).json({
      success: true,
      message: 'AutoPay recurring subscription billing cancelled successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create Razorpay order for subscription plan
// @route   POST /api/billing/create-order
// @access  Private (Admin only)
export const createPaymentOrder = async (req, res, next) => {
  try {
    const tenantId = req.tenantId;
    const { planName } = req.body;

    if (!PLAN_RATES[planName]) {
      return res.status(400).json({ success: false, message: 'Invalid subscription package selected' });
    }

    const { price } = PLAN_RATES[planName];
    const amountInPaise = price * 100;

    const rzp = getRazorpayInstance();
    let orderId = '';

    if (rzp) {
      const order = await rzp.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: `rcpt_${tenantId}_${Date.now()}`
      });
      orderId = order.id;
    } else {
      orderId = `order_mock_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    }

    // Insert pending subscription record in DB to track progress
    await masterPool.query(
      `INSERT INTO subscriptions (tenant_id, plan, status, payment_status, order_id, amount, payment_gateway)
       VALUES (?, ?, 'Pending', 'Pending', ?, ?, 'Razorpay')`,
      [tenantId, planName, orderId, price]
    );

    return res.status(200).json({
      success: true,
      order_id: orderId,
      amount: amountInPaise,
      currency: 'INR',
      key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_mock_key_id'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify payment signature and update plan
// @route   POST /api/billing/verify-payment
// @access  Private (Admin only)
export const verifyPaymentSignature = async (req, res, next) => {
  try {
    const tenantId = req.tenantId;
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, planName } = req.body;

    if (!razorpay_payment_id || !razorpay_order_id || !planName) {
      return res.status(400).json({ success: false, message: 'Missing payment validation credentials' });
    }

    const rzp = getRazorpayInstance();
    let isSignatureValid = false;

    if (rzp) {
      const text = `${razorpay_order_id}|${razorpay_payment_id}`;
      const generated_signature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(text)
        .digest('hex');
      isSignatureValid = generated_signature === razorpay_signature;
    } else {
      // Operation in Mock Mode
      isSignatureValid = true;
    }

    if (!isSignatureValid) {
      // Mark as failed in DB
      await masterPool.query(
        `UPDATE subscriptions SET status = 'Expired', payment_status = 'Failed' WHERE order_id = ?`,
        [razorpay_order_id]
      );
      return res.status(400).json({ success: false, message: 'Invalid payment signature verification failed' });
    }

    const { price, months } = PLAN_RATES[planName];

    // Fetch store subscription current expiry
    const [tenants] = await masterPool.query(
      'SELECT subscription_expires_at, subscription_status, store_name FROM tenants WHERE id = ?',
      [tenantId]
    );

    if (tenants.length === 0) {
      return res.status(404).json({ success: false, message: 'Store metadata not found' });
    }

    const tenant = tenants[0];
    let startDate = new Date();

    // Extend if subscription is active and not expired
    if (tenant.subscription_expires_at && new Date(tenant.subscription_expires_at) > new Date() && tenant.subscription_status === 'Active') {
      startDate = new Date(tenant.subscription_expires_at);
    }

    const expiryDate = new Date(startDate);
    expiryDate.setMonth(expiryDate.getMonth() + months);

    // Format new invoice number INV-YYYYMMDD-XXXX
    const randNum = Math.floor(1000 + Math.random() * 9000);
    const invoiceNo = `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${randNum}`;

    // Perform transaction update in Master Database
    await masterPool.query(
      `UPDATE tenants 
       SET subscription_status = 'Active', 
           subscription_plan = ?, 
           subscription_expires_at = ?
       WHERE id = ?`,
      [planName, expiryDate, tenantId]
    );

    // Update subscriptions table
    await masterPool.query(
      `UPDATE subscriptions 
       SET status = 'Active', 
           payment_status = 'Paid',
           payment_id = ?,
           signature = ?,
           subscription_start_date = CURRENT_DATE(),
           subscription_expiry_date = ?,
           invoice_number = ?
       WHERE order_id = ?`,
      [razorpay_payment_id, razorpay_signature || 'mock_signature', expiryDate, invoiceNo, razorpay_order_id]
    );

    // Insert Invoice Log
    await masterPool.query(
      `INSERT INTO billing_history (tenant_id, transaction_id, amount, plan, payment_status, billing_date, next_renewal_date, payment_method, invoice_url)
       VALUES (?, ?, ?, ?, 'Paid', CURRENT_DATE(), ?, 'Razorpay Gateway', ?)`,
      [tenantId, razorpay_payment_id, price, planName, expiryDate, invoiceNo]
    );

    // Log action audit
    await masterPool.query(
      'INSERT INTO subscription_logs (tenant_id, action, description) VALUES (?, "Renewed", ?)',
      [tenantId, `Renewed to ${planName} package (₹${price.toLocaleString('en-IN')}). Next renewal date on ${expiryDate.toLocaleDateString()}.`]
    );

    // Reactivate users under this tenant in case they were suspended
    await masterPool.query(
      'UPDATE users SET status = "Active" WHERE tenant_id = ?',
      [tenantId]
    );

    const [tenantRows] = await masterPool.query('SELECT store_name, email, database_name FROM tenants WHERE id = ?', [tenantId]);
    const storeName = tenantRows[0]?.store_name || 'Store';
    const ownerEmail = tenantRows[0]?.email || '';
    const dbName = tenantRows[0]?.database_name;

    await createNotification({
      tenantId: tenantId,
      type: 'Subscription',
      title: 'Subscription Activated / Renewed',
      message: `Tenant "${storeName}" (${ownerEmail}) successfully activated/renewed plan "${planName}". Payment ID: ${razorpay_payment_id}.`,
      priority: 'High',
      related_user: ownerEmail,
      related_module: 'Billing',
      target_roles: 'Super Admin',
      isMaster: true
    });

    if (dbName) {
      try {
        const tenantDb = getTenantPool(dbName);
        await createNotification({
          type: 'Subscription',
          title: 'SaaS Subscription Renewed',
          message: `Your SaaS subscription was renewed to plan "${planName}". Valid until ${expiryDate.toLocaleDateString()}.`,
          priority: 'High',
          related_user: ownerEmail || 'System',
          related_module: 'Billing',
          target_roles: 'Admin'
        }, tenantDb);
      } catch (err) {
        console.error('Failed to log tenant subscription renewal notification:', err);
      }
    }

    return res.status(200).json({
      success: true,
      message: `Successfully renewed subscription on ${planName} plan!`,
      expiresAt: expiryDate,
      invoice_number: invoiceNo
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Download Printable Tax Invoice
// @route   GET /api/billing/invoice/:id/download
// @access  Private (Admin only)
export const downloadInvoice = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId;

    const [invoices] = await masterPool.query(
      'SELECT bh.*, t.store_name, t.owner_name, t.email, t.phone, t.address, t.gstin FROM billing_history bh JOIN tenants t ON bh.tenant_id = t.id WHERE bh.id = ? AND bh.tenant_id = ?',
      [id, tenantId]
    );

    if (invoices.length === 0) {
      return res.status(404).send('<h1>Invoice details not found</h1>');
    }

    const invoice = invoices[0];

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Invoice - ${invoice.transaction_id}</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 40px; color: #333; }
        .invoice-box { max-width: 800px; margin: auto; border: 1px solid #eee; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1); padding: 30px; border-radius: 10px; background: #fff; }
        .header { display: flex; justify-content: space-between; border-bottom: 2px solid #5046E5; padding-bottom: 20px; margin-bottom: 20px; }
        .logo { font-size: 24px; font-weight: bold; color: #5046E5; }
        .title { font-size: 28px; font-weight: bold; text-align: right; text-transform: uppercase; color: #4B5563; }
        .details-grid { display: flex; justify-content: space-between; margin-bottom: 30px; }
        .details-col { width: 48%; }
        .details-col h3 { border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-bottom: 10px; color: #374151; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; }
        .details-col p { margin: 4px 0; font-size: 13px; line-height: 1.5; color: #6B7280; }
        .details-col strong { color: #1F2937; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { background: #F9FAFB; border-bottom: 2px solid #E5E7EB; padding: 12px; font-size: 12px; text-transform: uppercase; color: #4B5563; text-align: left; }
        td { border-bottom: 1px solid #F3F4F6; padding: 14px 12px; font-size: 13px; color: #4B5563; }
        .total-row { text-align: right; font-size: 16px; font-weight: bold; color: #5046E5; }
        .footer { margin-top: 50px; text-align: center; font-size: 11px; color: #9CA3AF; border-top: 1px solid #E5E7EB; padding-top: 20px; }
        .btn-print { background: #5046E5; color: white; border: none; padding: 10px 20px; border-radius: 6px; font-weight: bold; cursor: pointer; margin-bottom: 20px; display: inline-block; font-size: 13px; text-decoration: none; }
        @media print {
          .btn-print { display: none; }
          body { margin: 0; }
          .invoice-box { border: none; box-shadow: none; padding: 0; }
        }
      </style>
    </head>
    <body>
      <div style="text-align: center;">
        <button class="btn-print" onclick="window.print()">Print / Save as PDF</button>
      </div>
      <div class="invoice-box">
        <div class="header">
          <div>
            <div class="logo">Kirana ERP Cloud</div>
            <p style="margin: 5px 0 0 0; font-size: 12px; color: #6B7280;">SaaS Subscription License Billing</p>
          </div>
          <div>
            <div class="title">Tax Invoice</div>
            <p style="margin: 5px 0 0 0; font-size: 12px; color: #6B7280; text-align: right;">Invoice No: <strong>${invoice.invoice_url || 'N/A'}</strong></p>
          </div>
        </div>
        
        <div class="details-grid">
          <div class="details-col">
            <h3>Billed To:</h3>
            <p><strong>Store Name:</strong> ${invoice.store_name}</p>
            <p><strong>Owner Name:</strong> ${invoice.owner_name}</p>
            <p><strong>Email Address:</strong> ${invoice.email}</p>
            <p><strong>GSTIN:</strong> ${invoice.gstin || 'Not Provided'}</p>
            <p><strong>Billing Address:</strong> ${invoice.address || 'Address not listed'}</p>
          </div>
          <div class="details-col">
            <h3>Invoice Details:</h3>
            <p><strong>Order ID:</strong> ${invoice.transaction_id ? 'order_id_' + invoice.transaction_id.slice(-6) : 'N/A'}</p>
            <p><strong>Payment Gateway ID:</strong> ${invoice.transaction_id}</p>
            <p><strong>Billing Date:</strong> ${new Date(invoice.billing_date).toLocaleDateString('en-IN', { dateStyle: 'long' })}</p>
            <p><strong>Subscription Plan:</strong> ${invoice.plan} Plan</p>
            <p><strong>Subscription Valid Till:</strong> ${new Date(invoice.next_renewal_date).toLocaleDateString('en-IN', { dateStyle: 'long' })}</p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th style="text-align: right;">Rate</th>
              <th style="text-align: center;">Quantity</th>
              <th style="text-align: right;">Total Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <strong>Kirana ERP SaaS Store Subscription License</strong><br>
                <span style="font-size: 11px; color: #9CA3AF;">License validity term: 1 Cycle (${invoice.plan} Plan)</span>
              </td>
              <td style="text-align: right;">₹${(Number(invoice.amount)).toFixed(2)}</td>
              <td style="text-align: center;">1</td>
              <td style="text-align: right; font-weight: bold; color: #1F2937;">₹${(Number(invoice.amount)).toFixed(2)}</td>
            </tr>
            <tr style="border-top: 2px solid #E5E7EB;">
              <td colspan="2"></td>
              <td style="text-align: center; font-weight: bold; color: #4B5563;">Subtotal:</td>
              <td style="text-align: right; font-weight: bold; color: #4B5563;">₹${(Number(invoice.amount)).toFixed(2)}</td>
            </tr>
            <tr>
              <td colspan="2"></td>
              <td style="text-align: center; font-weight: bold; color: #4B5563;">GST Tax (0%):</td>
              <td style="text-align: right; font-weight: bold; color: #4B5563;">₹0.00</td>
            </tr>
            <tr class="total-row">
              <td colspan="2"></td>
              <td style="text-align: center;">Grand Total:</td>
              <td style="text-align: right;">₹${(Number(invoice.amount)).toFixed(2)}</td>
            </tr>
          </tbody>
        </table>

        <div class="footer">
          <p>Thank you for subscribing to Kirana ERP Cloud Platform. For questions or support, contact support@kiranamart.com.</p>
          <p style="margin-top: 10px;">&copy; ${new Date().getFullYear()} Kirana ERP Inc. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
    `;
    return res.status(200).send(htmlContent);
  } catch (error) {
    next(error);
  }
};
