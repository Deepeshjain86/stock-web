import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowPathIcon,
  DocumentTextIcon,
  UserGroupIcon,
  ExclamationCircleIcon,
  ArrowUturnLeftIcon,
  CheckCircleIcon,
  ArrowDownTrayIcon,
  PrinterIcon,
  TrashIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
  ClockIcon,
  BanknotesIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import StatsCard from '../../components/common/StatsCard';
import Loader from '../../components/common/Loader';
import Modal from '../../components/common/Modal';
import { useAppSelector } from '../../store/hooks';
import { vendorsAPI, vendorReturnsAPI } from '../../services/api';

const VendorReturnManagement = () => {
  const { user } = useAppSelector((state) => state.auth);
  const isReadOnly = user?.role === 'Super Admin';
  const [activeTab, setActiveTab] = useState('process'); // 'process', 'notes', 'profiles'
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  // Core Data State
  const [vendors, setVendors] = useState([]);
  const [returns, setReturns] = useState([]);
  
  // Searchable selections
  const [searchSupplier, setSearchSupplier] = useState('');
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);

  const [vendorProducts, setVendorProducts] = useState([]);
  const [searchProduct, setSearchProduct] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [purchasesForProduct, setPurchasesForProduct] = useState([]);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [currentStock, setCurrentStock] = useState(0);

  // Form inputs
  const [returnQty, setReturnQty] = useState('');
  const [returnReason, setReturnReason] = useState('Damaged');
  const [returnType, setReturnType] = useState('Refund'); // Refund, Replacement
  const [remarks, setRemarks] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [formVendorAnalytics, setFormVendorAnalytics] = useState(null);

  const storeSettings = {
    storeName: 'Aman Supermarket & Inventory Solutions',
    storeAddress: 'Shop No. 12, Ground Floor, Kirana Market Complex, Sector 4, New Delhi - 110001',
    storePhone: '+91 98765 43210',
    storeEmail: 'contact@kiranaerp.com',
    gstin: '07AAAAA1111A1Z1',
    shopRegNo: 'SRN-2026-98745'
  };

  // Filtering states for Notes & Stats Tab
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSupplier, setFilterSupplier] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  // Selected ledger details for Supplier Ledgers Tab
  const [selectedLedgerVendor, setSelectedLedgerVendor] = useState(null);
  const [ledgerAnalytics, setLedgerAnalytics] = useState(null);
  const [ledgerHistory, setLedgerHistory] = useState([]);
  const [loadingLedger, setLoadingLedger] = useState(false);

  // Modal triggers
  const [viewingNote, setViewingNote] = useState(null);
  const [updatingStatusNote, setUpdatingStatusNote] = useState(null);
  const [statusUpdateVal, setStatusUpdateVal] = useState('Pending');
  const [statusUpdateNotes, setStatusUpdateNotes] = useState('');

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const vendRes = await vendorsAPI.getAll();
      if (vendRes.success) setVendors(vendRes.vendors);
      await fetchReturnNotes();
    } catch (err) {
      console.error('Failed to load initial data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReturnNotes = async () => {
    try {
      const res = await vendorReturnsAPI.getAll();
      if (res.success) {
        setReturns(res.returns || []);
      }
    } catch (err) {
      console.error('Failed to fetch returns history:', err);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Fetch products purchased from selected vendor
  useEffect(() => {
    const fetchVendorProductsList = async () => {
      if (!selectedVendor) {
        setVendorProducts([]);
        setSelectedProduct(null);
        setSearchProduct('');
        return;
      }
      try {
        const res = await vendorReturnsAPI.getProductsPurchased(selectedVendor.id);
        if (res.success) {
          setVendorProducts(res.products || []);
        }
      } catch (err) {
        console.error('Failed to load vendor products:', err);
      }
    };
    fetchVendorProductsList();
  }, [selectedVendor]);

  // Fetch selected vendor ledger analytics for form metadata preview
  useEffect(() => {
    const fetchFormVendorAnalytics = async () => {
      if (!selectedVendor) {
        setFormVendorAnalytics(null);
        return;
      }
      try {
        const res = await vendorReturnsAPI.getLedger(selectedVendor.id);
        if (res.success) {
          setFormVendorAnalytics(res.analytics);
        }
      } catch (err) {
        console.error('Failed to load selected vendor analytics:', err);
      }
    };
    fetchFormVendorAnalytics();
  }, [selectedVendor]);

  // Fetch purchase details once product is selected
  useEffect(() => {
    const fetchPurchaseDetails = async () => {
      if (!selectedVendor || !selectedProduct) {
        setPurchasesForProduct([]);
        setSelectedPurchase(null);
        setCurrentStock(0);
        return;
      }
      try {
        const res = await vendorReturnsAPI.getPurchasesByProduct(selectedVendor.id, selectedProduct.id);
        if (res.success) {
          setPurchasesForProduct(res.purchases || []);
          setCurrentStock(res.currentStock || 0);
          if (res.purchases?.length > 0) {
            setSelectedPurchase(res.purchases[0]); // Select most recent purchase by default
          }
        }
      } catch (err) {
        console.error('Failed to load purchase records for product:', err);
      }
    };
    fetchPurchaseDetails();
  }, [selectedVendor, selectedProduct]);

  // Fetch Supplier Ledger analytics
  useEffect(() => {
    const fetchLedger = async () => {
      if (!selectedLedgerVendor) {
        setLedgerAnalytics(null);
        setLedgerHistory([]);
        return;
      }
      setLoadingLedger(true);
      try {
        const res = await vendorReturnsAPI.getLedger(selectedLedgerVendor.id);
        if (res.success) {
          setLedgerAnalytics(res.analytics);
          setLedgerHistory(res.history || []);
        }
      } catch (err) {
        console.error('Failed to load supplier ledger analytics:', err);
      } finally {
        setLoadingLedger(false);
      }
    };
    fetchLedger();
  }, [selectedLedgerVendor]);

  // Calculate live summary details
  const liveSummary = useMemo(() => {
    if (!selectedProduct || !selectedPurchase || !returnQty) {
      return {
        purchaseRate: 0,
        gstRate: 0,
        returnValue: 0,
        gstAmount: 0,
        totalRefund: 0,
        remainingQty: 0
      };
    }
    const qty = Number(returnQty) || 0;
    const rate = Number(selectedPurchase.purchasePrice || 0);
    const gstPct = Number(selectedPurchase.gst || 0);
    const val = rate * qty;
    const gst = val * (gstPct / 100);

    return {
      purchaseRate: rate,
      gstRate: gstPct,
      returnValue: val,
      gstAmount: gst,
      totalRefund: val + gst,
      remainingQty: Math.max(0, Number(selectedPurchase.availableReturnQuantity || 0) - qty)
    };
  }, [selectedProduct, selectedPurchase, returnQty]);

  // Submit vendor return
  const handleSubmitReturn = async (e) => {
    e.preventDefault();
    if (!selectedVendor || !selectedProduct || !returnQty || !returnReason) {
      alert('Please fill out all required fields.');
      return;
    }

    // 1. Validate that the selected product belongs to the selected supplier
    const productBelongsToVendor = vendorProducts.some((p) => Number(p.id) === Number(selectedProduct.id));
    if (!productBelongsToVendor) {
      alert('Validation Error: Selected product does not belong to the selected supplier.');
      return;
    }

    // 2. Validate return quantity constraints
    const availableLimit = Number(selectedPurchase?.availableReturnQuantity || 0);
    if (Number(returnQty) > availableLimit) {
      alert(`Validation Error: Return quantity (${returnQty}) cannot be greater than the available return limit (${availableLimit} Units) from this purchase invoice.`);
      return;
    }

    // 3. Batch selection verify
    const purchaseBatch = selectedPurchase?.batchNo || 'BATCH-001';

    setProcessing(true);
    try {
      const payload = {
        purchase_id: selectedPurchase?.purchaseId || null,
        vendor_id: Number(selectedVendor.id),
        product_id: Number(selectedProduct.id),
        quantity: Number(returnQty),
        reason: returnReason,
        return_type: returnType,
        remarks,
        image_url: imageUrl,
        batch_number: purchaseBatch,
        expiry_date: selectedPurchase?.expiryDate || null
      };

      console.log('[VendorReturn] Submitting payload:', payload);

      const res = await vendorReturnsAPI.create(payload);
      if (res.success) {
        alert(`✅ Vendor Return Note processed successfully!\nNote No: ${res.vrn}\nTotal Refund: ₹${Number(res.totalAmount || 0).toFixed(2)}`);
        // Reset form inputs
        setReturnQty('');
        setRemarks('');
        setImageUrl('');
        setSelectedProduct(null);
        setSearchProduct('');
        // Reload data
        await fetchReturnNotes();
        const vendRes = await vendorsAPI.getAll();
        if (vendRes.success) setVendors(vendRes.vendors);
      } else {
        // Server returned success: false with a message
        const serverMsg = res.message || 'Vendor return processing failed. Please try again.';
        console.error('[VendorReturn] Server returned failure:', res);
        alert(`❌ Return Failed:\n${serverMsg}`);
      }
    } catch (err) {
      // Extract the real error from the API response if available
      const serverError =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'An unexpected error occurred while processing the supplier return.';
      console.error('[VendorReturn] Error details:', {
        status: err?.response?.status,
        statusText: err?.response?.statusText,
        data: err?.response?.data,
        message: err?.message
      });
      alert(`❌ Error processing supplier return note:\n\n${serverError}`);
    } finally {
      setProcessing(false);
    }
  };

  // Update Status Workflow
  const handleUpdateStatusSubmit = async (e) => {
    e.preventDefault();
    if (!updatingStatusNote) return;
    try {
      const res = await vendorReturnsAPI.updateStatus(updatingStatusNote.id, statusUpdateVal, statusUpdateNotes);
      if (res.success) {
        alert('✅ Workflow status updated successfully.');
        setUpdatingStatusNote(null);
        setStatusUpdateNotes('');
        await fetchReturnNotes();
      } else {
        alert(`❌ Status update failed:\n${res.message || 'Unknown error'}`);
      }
    } catch (err) {
      const serverError = err?.response?.data?.message || err?.message || 'Failed to update status workflow';
      console.error('[VendorReturn] Status update error:', err?.response?.data || err);
      alert(`❌ Status update failed:\n${serverError}`);
    }
  };

  // Void Return Note
  const handleDeleteReturn = async (id) => {
    if (window.confirm('Are you sure you want to void this Return Note? This will restore stock levels and add the balance back to supplier outstandings.')) {
      try {
        const res = await vendorReturnsAPI.delete(id);
        if (res.success) {
          alert(`✅ ${res.message || 'Return note voided successfully.'}`);
          await fetchReturnNotes();
        } else {
          alert(`❌ Void failed:\n${res.message || 'Unknown error'}`);
        }
      } catch (err) {
        const serverError = err?.response?.data?.message || err?.message || 'Voiding return note failed';
        console.error('[VendorReturn] Delete error:', err?.response?.data || err);
        alert(`❌ Void failed:\n${serverError}`);
      }
    }
  };

  // Print Return Note Layout
  const handlePrintReturnNote = (note) => {
    const win = window.open('', '_blank');
    const itemsValue = Number(note.quantity) * Number(note.return_price);
    const gstPct = note.gst || 18;
    const gstAmount = itemsValue * (gstPct / 100);
    const grandTotal = itemsValue + gstAmount;

    win.document.write(`
      <html>
      <head>
        <title>Vendor Return Note - ${note.return_no}</title>
        <style>
          @page { size: A4 portrait; margin: 0.4in; }
          body { font-family: 'Segoe UI', system-ui, sans-serif; color: #1e293b; line-height: 1.4; margin: 0; background: #fff; font-size: 11px; }
          .container { width: 100%; max-width: 800px; margin: 0 auto; padding: 10px; }
          .header-grid { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #047857; padding-bottom: 12px; margin-bottom: 20px; }
          .store-title { font-size: 20px; font-weight: 900; color: #0f172a; margin: 0; }
          .store-meta { font-size: 10px; color: #64748b; margin-top: 3px; }
          .doc-type { text-align: right; }
          .doc-title { font-size: 22px; font-weight: 900; color: #065f46; margin: 0; letter-spacing: 0.5px; }
          
          .banner { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 18px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
          .banner-col { display: flex; flex-direction: column; }
          .banner-lbl { font-size: 8px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
          .banner-val { font-size: 11px; font-weight: 700; color: #0f172a; margin-top: 2px; }
          
          .details-section { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
          .details-box { border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; background: #fff; }
          .details-title { font-size: 9px; font-weight: 900; text-transform: uppercase; color: #065f46; margin-bottom: 8px; border-bottom: 1px solid #f1f5f9; padding-bottom: 4px; letter-spacing: 0.5px; }
          .details-row { margin: 4px 0; font-weight: 600; color: #475569; }
          .details-row span { color: #0f172a; font-weight: 700; }
          
          .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 10px; }
          .items-table th { background: #f8fafc; border: 1px solid #cbd5e1; color: #475569; font-weight: 800; text-transform: uppercase; font-size: 8px; padding: 8px 6px; }
          .items-table td { border: 1px solid #cbd5e1; padding: 8px 6px; }
          
          .summary-grid { display: grid; grid-template-columns: 3fr 2fr; gap: 20px; margin-bottom: 20px; align-items: start; }
          .notes-box { border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; background: #fff; color: #64748b; font-size: 9.5px; }
          .notes-title { font-weight: 800; color: #065f46; margin-bottom: 6px; text-transform: uppercase; font-size: 8px; }
          .totals-box { border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; background: #065f46; color: #fff; }
          .total-row { display: flex; justify-content: space-between; margin: 4px 0; font-weight: 600; }
          .total-row.grand { border-top: 1px solid rgba(255,255,255,0.2); padding-top: 6px; margin-top: 6px; font-weight: 950; font-size: 13px; color: #a7f3d0; }
          
          .sig-seal-section { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 40px; }
          .signatures-grid { width: 70%; display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; text-align: center; }
          .sig-line { border-top: 1px solid #cbd5e1; padding-top: 4px; font-size: 8px; font-weight: 800; color: #64748b; text-transform: uppercase; }
          .sig-value { font-weight: 700; color: #0f172a; margin-bottom: 30px; font-size: 11px; }
          .seal-box { width: 25%; display: flex; flex-direction: column; align-items: center; }
          .seal-ring { border: 2px dashed #cbd5e1; width: 65px; height: 65px; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 8px; font-weight: 900; color: #cbd5e1; text-transform: uppercase; text-align: center; line-height: 10px; }
          .seal-title { font-size: 8px; font-weight: 850; color: #64748b; text-transform: uppercase; margin-top: 6px; }
          
          .footer { text-align: center; margin-top: 40px; font-size: 8px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header-grid">
            <div>
              <h1 class="store-title">${storeSettings.storeName}</h1>
              <div class="store-meta">${storeSettings.storeAddress}</div>
              <div class="store-meta">📞 Ph: ${storeSettings.storePhone} | ✉ Email: ${storeSettings.storeEmail}</div>
            </div>
            <div class="doc-type">
              <h2 class="doc-title">VENDOR RETURN NOTE</h2>
              <div class="store-meta">GSTIN: <strong>${storeSettings.gstin}</strong> | Reg No: <strong>${storeSettings.shopRegNo}</strong></div>
            </div>
          </div>
          
          <div class="banner">
            <div class="banner-col">
              <span class="banner-lbl">Return Number (VRN)</span>
              <span class="banner-val" style="font-family: monospace;">${note.return_no}</span>
            </div>
            <div class="banner-col">
              <span class="banner-lbl">Return Date</span>
              <span class="banner-val">${new Date(note.created_at).toLocaleDateString('en-IN')}</span>
            </div>
            <div class="banner-col">
              <span class="banner-lbl">Purchase Invoice Ref</span>
              <span class="banner-val" style="font-family: monospace;">${note.purchase_no || 'N/A'}</span>
            </div>
            <div class="banner-col">
              <span class="banner-lbl">Workflow Status</span>
              <span class="banner-val" style="color: #d97706;">${note.status || 'Pending'}</span>
            </div>
          </div>
          
          <div class="details-section">
            <div class="details-box">
              <div class="details-title">Vendor / Supplier Details</div>
              <div class="details-row">Company Name: <span>${note.vendor_company_name || note.vendor_name || 'Vendor Company'}</span></div>
              <div class="details-row">Contact Person: <span>${note.vendor_name || '—'}</span></div>
              <div class="details-row">Mobile Number: <span>${note.vendor_phone || '—'}</span></div>
              <div class="details-row">GSTIN: <span>${note.vendor_gstin || '—'}</span></div>
              <div class="details-row">Address: <span>${note.vendor_address || '—'}</span></div>
            </div>
            <div class="details-box">
              <div class="details-title">Return Parameters</div>
              <div class="details-row">Settlement Type: <span>${note.return_type || 'Refund'}</span></div>
              <div class="details-row">Return Reason: <span style="color: #b45309;">${note.reason}</span></div>
              <div class="details-row">Batch Number: <span>${note.batch_number || 'BATCH-001'}</span></div>
              <div class="details-row">Expiry Date: <span>${note.expiry_date ? new Date(note.expiry_date).toLocaleDateString('en-IN') : 'N/A'}</span></div>
            </div>
          </div>
          
          <table class="items-table">
            <thead>
              <tr>
                <th style="width: 5%; text-align: center;">Sr. No.</th>
                <th style="width: 50%; text-align: left;">Product Description</th>
                <th style="width: 15%; text-align: center;">Returned Qty</th>
                <th style="width: 15%; text-align: right;">Purchase Rate</th>
                <th style="width: 15%; text-align: right;">Total Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="text-align: center;">1</td>
                <td>
                  <div style="font-weight: bold; color: #0f172a;">${note.product_name}</div>
                  ${note.barcode ? `<div style="font-size: 8px; color: #64748b; font-family: monospace; margin-top: 2px;">Barcode: ${note.barcode}</div>` : ''}
                </td>
                <td style="text-align: center; font-weight: 700;">${note.quantity} Pcs</td>
                <td style="text-align: right;">₹${Number(note.return_price).toFixed(2)}</td>
                <td style="text-align: right; font-weight: 900; color: #0f172a;">₹${Number(note.total_amount).toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
          
          <div class="summary-grid">
            <div class="notes-box">
              <div class="notes-title">Terms & Internal Notes</div>
              <div style="margin-bottom: 4px;">1. Remarks: ${note.remarks || 'No remarks provided.'}</div>
              <div style="margin-bottom: 4px;">2. This return note decreases store inventory count and updates supplier ledger balances dynamically.</div>
              <div>3. Damaged goods must be retained for audits until vendor acknowledgement.</div>
            </div>
            <div class="totals-box">
              <div class="total-row"><span>Returned Value:</span><span>₹${itemsValue.toFixed(2)}</span></div>
              <div class="total-row"><span>Estimated GST (${gstPct}%):</span><span>+₹${gstAmount.toFixed(2)}</span></div>
              <div class="total-row grand"><span>Total Refund Value:</span><span>₹${grandTotal.toFixed(2)}</span></div>
            </div>
          </div>
          
          <div class="sig-seal-section">
            <div class="signatures-grid">
              <div>
                <div class="sig-value">${note.user_name || 'System'}</div>
                <div class="sig-line">Prepared By</div>
              </div>
              <div>
                <div class="sig-value" style="height: 18px;"></div>
                <div class="sig-line">Authorized Signatory</div>
              </div>
              <div>
                <div class="sig-value" style="height: 18px;"></div>
                <div class="sig-line">Vendor Signature</div>
              </div>
            </div>
            <div class="seal-box">
              <div class="seal-ring">Company Seal</div>
              <div class="seal-title">Official Seal</div>
            </div>
          </div>
          
          <div class="footer">
            <p>This is an official system-generated Vendor Return Note (VRN).</p>
            <p>Printed on: ${new Date().toLocaleString('en-IN')}</p>
          </div>
        </div>
      </body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
      win.close();
    }, 450);
  };

  // Export to Excel (CSV)
  const handleExportExcel = () => {
    if (processedReturnsHistory.length === 0) {
      alert('No returns available to export.');
      return;
    }
    const headers = ['Return Number', 'Date', 'Supplier', 'Invoice Ref', 'Product', 'Batch Number', 'Qty', 'Unit Cost', 'Refund Amt', 'Reason', 'Type', 'Status'];
    const rows = processedReturnsHistory.map(r => [
      r.return_no,
      new Date(r.created_at).toLocaleDateString('en-IN'),
      r.vendor_company_name || r.vendor_name,
      r.purchase_no || 'N/A',
      r.product_name,
      r.batch_number || 'BATCH-001',
      r.quantity,
      Number(r.return_price).toFixed(2),
      Number(r.total_amount).toFixed(2),
      r.reason,
      r.return_type || 'Refund',
      r.status
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Vendor_Returns_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to PDF
  const handleExportPDF = () => {
    if (processedReturnsHistory.length === 0) {
      alert('No returns available to export.');
      return;
    }
    const win = window.open('', '_blank');
    win.document.write(`
      <html>
      <head>
        <title>Vendor Returns Report</title>
        <style>
          @page { size: A4 landscape; margin: 0.4in; }
          body { font-family: 'Segoe UI', system-ui, sans-serif; color: #1e293b; font-size: 10px; margin: 0; }
          .header { text-align: center; border-bottom: 2px solid #cbd5e1; padding-bottom: 12px; margin-bottom: 20px; }
          .title { font-size: 18px; font-weight: 800; text-transform: uppercase; color: #1e293b; margin: 0; }
          .subtitle { font-size: 10px; color: #64748b; margin-top: 4px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th { background: #f1f5f9; border: 1px solid #cbd5e1; font-weight: 800; text-transform: uppercase; font-size: 8px; padding: 6px; text-align: left; }
          td { border: 1px solid #cbd5e1; padding: 6px; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .total-row { font-weight: bold; background: #f8fafc; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="title">Vendor Stock Returns Report</h1>
          <div class="subtitle">Generated on: ${new Date().toLocaleString('en-IN')}</div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Return No.</th>
              <th>Date</th>
              <th>Supplier</th>
              <th>Invoice No.</th>
              <th>Product</th>
              <th>Batch No.</th>
              <th class="text-center">Qty</th>
              <th class="text-right">Unit Rate</th>
              <th class="text-right">Refund Total</th>
              <th>Reason</th>
              <th>Type</th>
              <th class="text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            ${processedReturnsHistory.map(r => `
              <tr>
                <td>${r.return_no}</td>
                <td>${new Date(r.created_at).toLocaleDateString('en-IN')}</td>
                <td>${r.vendor_company_name || r.vendor_name}</td>
                <td>${r.purchase_no || '—'}</td>
                <td>${r.product_name}</td>
                <td>${r.batch_number || 'BATCH-001'}</td>
                <td class="text-center">${r.quantity}</td>
                <td class="text-right">₹${Number(r.return_price).toFixed(2)}</td>
                <td class="text-right">₹${Number(r.total_amount).toFixed(2)}</td>
                <td>${r.reason}</td>
                <td>${r.return_type || 'Refund'}</td>
                <td class="text-center">${r.status}</td>
              </tr>
            `).join('')}
            <tr class="total-row">
              <td colspan="6" class="text-right">Total:</td>
              <td class="text-center">${processedReturnsHistory.reduce((sum, r) => sum + Number(r.quantity), 0)}</td>
              <td></td>
              <td class="text-right">₹${processedReturnsHistory.reduce((sum, r) => sum + Number(r.total_amount), 0).toFixed(2)}</td>
              <td colspan="3"></td>
            </tr>
          </tbody>
        </table>
        <script>
          window.print();
          setTimeout(() => window.close(), 500);
        </script>
      </body>
      </html>
    `);
    win.document.close();
  };

  // Search filter for Supplier Select box in form
  const filteredSuppliersForForm = useMemo(() => {
    if (!searchSupplier.trim()) return vendors;
    return vendors.filter(v =>
      v.company_name?.toLowerCase().includes(searchSupplier.toLowerCase()) ||
      v.name?.toLowerCase().includes(searchSupplier.toLowerCase())
    );
  }, [vendors, searchSupplier]);

  // Search filter for Product Select box in form
  const filteredProductsForForm = useMemo(() => {
    if (!searchProduct.trim()) return vendorProducts;
    return vendorProducts.filter(p =>
      p.name?.toLowerCase().includes(searchProduct.toLowerCase()) ||
      p.sku?.toLowerCase().includes(searchProduct.toLowerCase())
    );
  }, [vendorProducts, searchProduct]);

  // Unified Dashboard Metrics (Task-2 summary cards)
  const dashboardStats = useMemo(() => {
    const totalReturns = returns.length;
    const pendingReturns = returns.filter(r => r.status === 'Pending' || r.status === 'Sent to Vendor').length;
    const refundedValue = returns.filter(r => r.return_type === 'Refund' && (r.status === 'Refund Received' || r.status === 'Closed')).reduce((sum, r) => sum + Number(r.total_amount), 0);
    const replacementPending = returns.filter(r => r.return_type === 'Replacement' && r.status !== 'Closed').length;
    const totalReturnedUnits = returns.reduce((sum, r) => sum + Number(r.quantity), 0);
    const returnValSum = returns.reduce((sum, r) => sum + Number(r.total_amount), 0);

    return {
      totalReturns,
      pendingReturns,
      refundedValue: refundedValue.toLocaleString('en-IN', { maximumFractionDigits: 2 }),
      replacementPending,
      totalReturnedUnits,
      returnValSum: returnValSum.toLocaleString('en-IN', { maximumFractionDigits: 2 })
    };
  }, [returns]);

  // Tab 2 History Filtering
  const processedReturnsHistory = useMemo(() => {
    return returns.filter(r => {
      const matchSearch = searchQuery.trim() === '' ||
        r.return_no?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.product_name?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchSupplier = filterSupplier === 'All' || String(r.vendor_id) === filterSupplier;
      const matchStatus = filterStatus === 'All' || r.status === filterStatus;
      
      let matchDate = true;
      if (filterDateFrom) matchDate = matchDate && new Date(r.created_at) >= new Date(filterDateFrom);
      if (filterDateTo) matchDate = matchDate && new Date(r.created_at) <= new Date(filterDateTo + 'T23:59:59');

      return matchSearch && matchSupplier && matchStatus && matchDate;
    });
  }, [returns, searchQuery, filterSupplier, filterStatus, filterDateFrom, filterDateTo]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-3">
        <Loader size="lg" />
        <p className="text-sm font-semibold text-slate-500 animate-pulse">Loading Supplier Returns Portal...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 select-none font-sans">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 border border-slate-200/80 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            ↩️ Vendor Return Management System
          </h1>
          <p className="text-xs font-medium text-slate-500 mt-0.5">Return defective products, track vendor credits, replacements, and status workflows</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('process')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'process' 
                ? 'bg-white text-indigo-600 shadow-sm' 
                : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            Process Return
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'notes' 
                ? 'bg-white text-indigo-600 shadow-sm' 
                : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            Return Notes & Stats
          </button>
          <button
            onClick={() => setActiveTab('profiles')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'profiles' 
                ? 'bg-white text-indigo-600 shadow-sm' 
                : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            Supplier Ledgers
          </button>
        </div>
      </div>

      {/* TOP DASHBOARD METRIC SUMMARY CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatsCard title="Total Returns" value={dashboardStats.totalReturns} icon={ArrowUturnLeftIcon} color="blue" />
        <StatsCard title="Pending Returns" value={dashboardStats.pendingReturns} icon={ClockIcon} color="orange" />
        <StatsCard title="Refunded Amt" value={`₹${dashboardStats.refundedValue}`} icon={CheckCircleIcon} color="green" />
        <StatsCard title="Replacements Pending" value={dashboardStats.replacementPending} icon={ArrowPathIcon} color="yellow" />
        <StatsCard title="Returned Units" value={dashboardStats.totalReturnedUnits} icon={DocumentTextIcon} color="purple" />
        <StatsCard title="Total Return Value" value={`₹${dashboardStats.returnValSum}`} icon={BanknotesIcon} color="orange" />
      </div>

      {/* RENDER ACTIVE TAB */}
      
      {activeTab === 'process' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* FORM CONTAINER (LEFT) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm lg:col-span-2 space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900">Record Vendor Stock Return</h2>
              <p className="text-xs text-slate-400 font-medium">Reverts inventory levels and reduces outstanding supplier balances dynamically</p>
            </div>
            
            <form onSubmit={handleSubmitReturn} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Searchable Vendor Selector */}
                <div className="relative">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Search & Select Supplier</label>
                  <div
                    className="flex justify-between items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold cursor-pointer"
                    onClick={() => setShowSupplierDropdown(!showSupplierDropdown)}
                  >
                    <span>{selectedVendor ? `${selectedVendor.company_name} (${selectedVendor.name})` : '-- Select Vendor --'}</span>
                    <ChevronDownIcon className="w-4 h-4 text-slate-500" />
                  </div>
                  {showSupplierDropdown && (
                    <div className="absolute z-20 w-full bg-white border border-slate-200 rounded-xl shadow-xl mt-1 p-2 space-y-2 max-h-[220px] overflow-y-auto">
                      <div className="flex items-center gap-2 border border-slate-100 rounded-lg px-2 py-1 bg-slate-50">
                        <MagnifyingGlassIcon className="w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          value={searchSupplier}
                          onChange={(e) => setSearchSupplier(e.target.value)}
                          placeholder="Search supplier..."
                          className="w-full bg-transparent border-none text-xs focus:outline-none py-1 font-semibold"
                        />
                      </div>
                      <div className="space-y-1">
                        {filteredSuppliersForForm.map(v => (
                          <div
                            key={v.id}
                            onClick={() => {
                              setSelectedVendor(v);
                              setSelectedProduct(null);
                              setShowSupplierDropdown(false);
                            }}
                            className="text-xs font-semibold hover:bg-slate-50 p-2 rounded-lg cursor-pointer flex justify-between"
                          >
                            <span>{v.company_name} ({v.name})</span>
                            <span className="text-[10px] text-slate-400">Bal: ₹{Number(v.outstanding_balance).toFixed(0)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Dynamic Vendor Information Preview */}
                  {selectedVendor && (
                    <div className="mt-2 bg-indigo-50/50 border border-indigo-100 rounded-xl p-3 text-[10px] text-indigo-900 font-bold space-y-1">
                      <div>GSTIN: <span className="font-mono text-slate-800">{selectedVendor.gstin || '—'}</span></div>
                      <div>Mobile: <span className="font-mono text-slate-800">{selectedVendor.phone}</span></div>
                      <div>Outstanding Balance: <span className="text-slate-850">₹{Number(selectedVendor.outstanding_balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
                      <div>Total Purchases: <span className="text-slate-850 font-black">₹{Number(formVendorAnalytics?.totalPurchases || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
                    </div>
                  )}
                </div>

                {/* Searchable Product Selector */}
                <div className="relative">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Select Purchased Product</label>
                  <div
                    className={`flex justify-between items-center border rounded-xl px-3 py-2 text-xs font-bold cursor-pointer ${selectedVendor ? 'bg-slate-50 border-slate-200' : 'bg-slate-100 border-slate-200 text-slate-400 pointer-events-none'}`}
                    onClick={() => setShowProductDropdown(!showProductDropdown)}
                  >
                    <span>{selectedProduct ? `${selectedProduct.name}` : '-- Select Product --'}</span>
                    <ChevronDownIcon className="w-4 h-4 text-slate-500" />
                  </div>
                  {showProductDropdown && (
                    <div className="absolute z-20 w-full bg-white border border-slate-200 rounded-xl shadow-xl mt-1 p-2 space-y-2 max-h-[220px] overflow-y-auto">
                      <div className="flex items-center gap-2 border border-slate-100 rounded-lg px-2 py-1 bg-slate-50">
                        <MagnifyingGlassIcon className="w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          value={searchProduct}
                          onChange={(e) => setSearchProduct(e.target.value)}
                          placeholder="Search product..."
                          className="w-full bg-transparent border-none text-xs focus:outline-none py-1 font-semibold"
                        />
                      </div>
                      <div className="space-y-1">
                        {filteredProductsForForm.map(p => (
                          <div
                            key={p.id}
                            onClick={() => {
                              setSelectedProduct(p);
                              setShowProductDropdown(false);
                            }}
                            className="text-xs font-semibold hover:bg-slate-50 p-2 rounded-lg cursor-pointer"
                          >
                            {p.name} ({p.sku})
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Multi Purchase Invoice Select Dropdown */}
                  {selectedProduct && purchasesForProduct.length > 1 && (
                    <div className="mt-2.5">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Select Purchase Invoice Reference</label>
                      <select
                        value={selectedPurchase?.purchaseId || ''}
                        onChange={(e) => {
                          const found = purchasesForProduct.find(p => p.purchaseId === Number(e.target.value));
                          if (found) setSelectedPurchase(found);
                        }}
                        className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 font-bold bg-slate-50"
                      >
                        {purchasesForProduct.map(p => (
                          <option key={p.purchaseId} value={p.purchaseId}>
                            {p.purchaseNo} ({new Date(p.purchaseDate).toLocaleDateString('en-IN')}) - Qty: {p.purchaseQuantity} (Avail: {p.availableReturnQuantity})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Dynamic Product Metadata Fields */}
                  {selectedProduct && selectedPurchase && (
                    <div className="mt-2 bg-indigo-50/50 border border-indigo-100 rounded-xl p-3 text-[10px] text-indigo-900 font-bold space-y-1.5">
                      <div>Purchase Invoice: <span className="font-mono text-slate-800">{selectedPurchase.purchaseNo}</span></div>
                      <div>Batch Number: <span className="font-mono text-slate-800">{selectedPurchase.batchNo || 'BATCH-001'}</span></div>
                      <div>Purchase Date: <span className="text-slate-800">{new Date(selectedPurchase.purchaseDate).toLocaleDateString('en-IN')}</span></div>
                      <div>Purchase Quantity: <span className="text-slate-800">{selectedPurchase.purchaseQuantity} Pcs</span></div>
                      <div>Already Returned Qty: <span className="text-slate-800">{selectedPurchase.returnedQuantity} Pcs</span></div>
                      <div>Available Return Qty: <span className="text-emerald-750 font-extrabold">{selectedPurchase.availableReturnQuantity} Pcs</span></div>
                      <div>Purchase Rate: <span className="font-mono text-slate-800">₹{Number(selectedPurchase.purchasePrice).toFixed(2)}</span></div>
                      <div>GST %: <span className="text-slate-800">{selectedPurchase.gst || 0}%</span></div>
                      <div>Expiry Date: <span className="text-slate-800">{selectedPurchase.expiryDate ? new Date(selectedPurchase.expiryDate).toLocaleDateString('en-IN') : 'N/A'}</span></div>
                      <div>Current Stock: <span className="text-slate-850 font-black">{currentStock} Pcs</span></div>
                    </div>
                  )}
                </div>

                {/* Return Type Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Return Action Settlement</label>
                  <select
                    value={returnType}
                    onChange={(e) => setReturnType(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 font-bold bg-slate-50"
                  >
                    <option value="Refund">Refund / Store Credit</option>
                    <option value="Replacement">Replacement Item Pending</option>
                  </select>
                </div>

                {/* Reason Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Reason for Return</label>
                  <select
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 font-bold bg-slate-50"
                  >
                    <option value="Damaged">Damaged Batch</option>
                    <option value="Expired">Expired Stock</option>
                    <option value="Defective">Defective Product</option>
                    <option value="Overstock">Overstock Return</option>
                    <option value="Wrong Item">Wrong Items Delivered</option>
                  </select>
                </div>

                {/* Quantity Input */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Return Quantity</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={returnQty}
                    onChange={(e) => setReturnQty(e.target.value)}
                    placeholder="Enter quantity to return..."
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 font-bold bg-slate-50"
                  />
                </div>

                {/* Image Upload Mock Input */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Upload Damaged Product Image (URL)</label>
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="Paste image URL (Optional)..."
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 font-semibold bg-slate-50"
                  />
                </div>

                {/* Remarks textarea */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Internal Audit Remarks</label>
                  <textarea
                    rows="2"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Explain return details for accounting checks..."
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 font-medium bg-slate-50"
                  />
                </div>

              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={processing || isReadOnly || !selectedProduct || !returnQty || Number(returnQty) > Number(selectedPurchase?.availableReturnQuantity || 0)}
                  className="px-6 py-2.5 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 transition-all active:scale-95 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none cursor-pointer"
                >
                  {processing ? 'Processing Return...' : 'Record Return to Vendor'}
                </button>
              </div>
            </form>
          </div>

          {/* DYNAMIC RETURN SUMMARY CARD (RIGHT) */}
          <div className="bg-indigo-950 text-white rounded-2xl p-6 space-y-5 shadow-lg h-fit">
            <div>
              <h3 className="text-sm font-extrabold tracking-wider text-indigo-400 uppercase">Live Return Summary Card</h3>
              <p className="text-[10px] text-slate-350 mt-0.5">Calculations update in real time as you adjust inputs</p>
            </div>
            
            <div className="space-y-3.5 text-xs">
              <div className="flex justify-between border-b border-indigo-900 pb-2">
                <span className="text-slate-400">Invoice Number:</span>
                <span className="font-mono font-bold">{selectedPurchase ? selectedPurchase.purchaseNo : '—'}</span>
              </div>
              <div className="flex justify-between border-b border-indigo-900 pb-2">
                <span className="text-slate-400">Batch Number:</span>
                <span className="font-mono font-bold">{selectedPurchase ? (selectedPurchase.batchNo || 'BATCH-001') : '—'}</span>
              </div>
              <div className="flex justify-between border-b border-indigo-900 pb-2">
                <span className="text-slate-400">Purchase Quantity:</span>
                <span className="font-mono font-bold">{selectedPurchase ? `${selectedPurchase.purchaseQuantity} Pcs` : '—'}</span>
              </div>
              <div className="flex justify-between border-b border-indigo-900 pb-2">
                <span className="text-slate-400">Already Returned Qty:</span>
                <span className="font-mono font-bold">{selectedPurchase ? `${selectedPurchase.returnedQuantity} Pcs` : '—'}</span>
              </div>
              <div className="flex justify-between border-b border-indigo-900 pb-2">
                <span className="text-slate-400">Current Return Qty:</span>
                <span className="font-mono font-bold">{returnQty ? `${returnQty} Pcs` : '0 Pcs'}</span>
              </div>
              <div className="flex justify-between border-b border-indigo-900 pb-2">
                <span className="text-slate-400">Remaining Return Qty:</span>
                <span className="font-mono font-bold text-emerald-300">{selectedPurchase ? `${liveSummary.remainingQty} Pcs` : '—'}</span>
              </div>
              <div className="flex justify-between border-b border-indigo-900 pb-2">
                <span className="text-slate-400">Purchase Price:</span>
                <span className="font-mono font-bold">₹{liveSummary.purchaseRate.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-b border-indigo-900 pb-2">
                <span className="text-slate-400">Return Value:</span>
                <span className="font-mono font-bold">₹{liveSummary.returnValue.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-b border-indigo-900 pb-2">
                <span className="text-slate-400">GST Amount:</span>
                <span className="font-mono font-bold">₹{liveSummary.gstAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-b border-indigo-900 pb-2">
                <span className="text-slate-400">Expected Stock After Return:</span>
                <span className="font-mono font-bold text-amber-300">{selectedProduct ? `${Math.max(0, currentStock - (Number(returnQty) || 0))} Pcs` : '—'}</span>
              </div>
              
              <div className="pt-2 flex justify-between items-center text-sm font-black text-indigo-300">
                <span>Total Refund Amount:</span>
                <span className="font-mono text-base text-white">₹{liveSummary.totalRefund.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'notes' && (
        <div className="space-y-5 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
          
          {/* Filters Area */}
          <div className="flex flex-col gap-4 mb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
              <div className="relative flex items-center col-span-1 lg:col-span-2">
                <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by VRN or product..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-indigo-500 font-medium"
                />
              </div>
              
              <select
                value={filterSupplier}
                onChange={(e) => setFilterSupplier(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none font-bold"
              >
                <option value="All">All Suppliers</option>
                {vendors.map(v => (
                  <option key={v.id} value={v.id}>{v.company_name || v.name}</option>
                ))}
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none font-bold"
              >
                <option value="All">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Sent to Vendor">Sent to Vendor</option>
                <option value="Vendor Accepted">Vendor Accepted</option>
                <option value="Replacement Received">Replacement Received</option>
                <option value="Refund Received">Refund Received</option>
                <option value="Closed">Closed</option>
              </select>

              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
                <span className="text-[9px] font-extrabold text-slate-450 uppercase">From</span>
                <input
                  type="date"
                  value={filterDateFrom}
                  onChange={(e) => setFilterDateFrom(e.target.value)}
                  className="bg-transparent border-none text-xs focus:outline-none font-bold text-slate-700 w-full"
                />
              </div>

              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
                <span className="text-[9px] font-extrabold text-slate-450 uppercase">To</span>
                <input
                  type="date"
                  value={filterDateTo}
                  onChange={(e) => setFilterDateTo(e.target.value)}
                  className="bg-transparent border-none text-xs focus:outline-none font-bold text-slate-700 w-full"
                />
              </div>
            </div>

            <div className="flex justify-between items-center border-t border-slate-100 pt-3">
              <div className="flex gap-2">
                <button
                  onClick={handleExportExcel}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-bold transition-all border border-emerald-200 cursor-pointer"
                >
                  <ArrowDownTrayIcon className="w-4 h-4" /> Export Excel
                </button>
                <button
                  onClick={handleExportPDF}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition-all border border-rose-200 cursor-pointer"
                >
                  <PrinterIcon className="w-4 h-4" /> Export PDF
                </button>
              </div>

              <button
                onClick={() => {
                  setSearchQuery('');
                  setFilterSupplier('All');
                  setFilterStatus('All');
                  setFilterDateFrom('');
                  setFilterDateTo('');
                }}
                className="px-4 py-1.5 text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 rounded-xl transition-all cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                  <th className="py-3 px-3">Return Number</th>
                  <th className="py-3 px-3">Return Date</th>
                  <th className="py-3 px-3">Supplier</th>
                  <th className="py-3 px-3">Purchase Invoice Number</th>
                  <th className="py-3 px-3">Product</th>
                  <th className="py-3 px-3">Batch Number</th>
                  <th className="py-3 px-3 text-center">Returned Quantity</th>
                  <th className="py-3 px-3 text-right">Return Amount</th>
                  <th className="py-3 px-3">Return Reason</th>
                  <th className="py-3 px-3">Return Type</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-650">
                {processedReturnsHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-slate-950">{item.return_no}</td>
                    <td className="py-3 px-3 text-slate-450">{new Date(item.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                    <td className="py-3 px-3 font-bold text-slate-900">{item.vendor_company_name || item.vendor_name}</td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-800">{item.purchase_no || '—'}</td>
                    <td className="py-3 px-3 font-bold text-slate-900">{item.product_name}</td>
                    <td className="py-3 px-3 font-mono text-slate-500">{item.batch_number || 'BATCH-001'}</td>
                    <td className="py-3 px-3 text-center tabular-nums font-bold">{item.quantity}</td>
                    <td className="py-3 px-3 text-right font-black text-rose-600 tabular-nums">₹{Number(item.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="py-3 px-3 font-bold text-amber-700">{item.reason}</td>
                    <td className="py-3 px-3">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${item.return_type === 'Replacement' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                        {item.return_type || 'Refund'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* View VRN */}
                        <button
                          onClick={() => setViewingNote(item)}
                          title="View Return Note"
                          className="p-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition-all cursor-pointer border border-indigo-150"
                        >
                          <EyeIcon className="w-3.5 h-3.5" />
                        </button>
                        {/* Print Return Note */}
                        <button
                          onClick={() => handlePrintReturnNote(item)}
                          title="Print Return Note"
                          className="p-1 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg transition-all cursor-pointer border border-slate-200"
                        >
                          <PrinterIcon className="w-3.5 h-3.5" />
                        </button>
                        {/* Download PDF (Triggers Print to PDF) */}
                        <button
                          onClick={() => handlePrintReturnNote(item)}
                          title="Download PDF"
                          className="p-1 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg transition-all cursor-pointer border border-slate-200"
                        >
                          <ArrowDownTrayIcon className="w-3.5 h-3.5" />
                        </button>
                        {/* Update Workflow Status */}
                        <button
                          onClick={() => {
                            setUpdatingStatusNote(item);
                            setStatusUpdateVal(item.status);
                          }}
                          title="Change Workflow Status"
                          className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[9px] font-bold cursor-pointer"
                        >
                          Status
                        </button>
                        {/* Delete/Void Return Note */}
                        {!isReadOnly && (
                          <button
                            onClick={() => handleDeleteReturn(item.id)}
                            title="Void Return Note"
                            className="p-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-all cursor-pointer border border-rose-250"
                          >
                            <TrashIcon className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'profiles' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Suppliers list sidebar (Left 1/4) */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">Active Suppliers</h3>
            <div className="space-y-1 max-h-[450px] overflow-y-auto">
              {vendors.map(v => (
                <div
                  key={v.id}
                  onClick={() => setSelectedLedgerVendor(v)}
                  className={`p-3 rounded-xl cursor-pointer text-xs font-bold transition-all ${selectedLedgerVendor?.id === v.id ? 'bg-indigo-600 text-white' : 'hover:bg-slate-50 text-slate-700'}`}
                >
                  <div>{v.company_name || 'Individual Supplier'}</div>
                  <div className={`text-[10px] font-semibold mt-0.5 ${selectedLedgerVendor?.id === v.id ? 'text-indigo-200' : 'text-slate-400'}`}>Contact: {v.name}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Supplier Ledger Analytics View (Right 3/4) */}
          <div className="lg:col-span-3 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm min-h-[400px]">
            {loadingLedger ? (
              <div className="flex h-full items-center justify-center py-16 text-xs text-slate-400">Loading ledger data...</div>
            ) : !ledgerAnalytics ? (
              <div className="flex h-full items-center justify-center py-16 text-xs text-slate-400">Select a Supplier to load the Return Settlement Ledger</div>
            ) : (
              <div className="space-y-6">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900">{ledgerAnalytics.companyName}</h2>
                  <p className="text-xs text-slate-400 mt-0.5">GSTIN: <span className="font-mono font-bold text-slate-750">{ledgerAnalytics.gstin || '—'}</span> | Phone: {ledgerAnalytics.phone}</p>
                </div>

                 {/* Ledger Metrics Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 shadow-xs">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Total Purchases</span>
                    <span className="font-mono text-xs font-extrabold text-slate-800 block mt-1">₹{ledgerAnalytics.totalPurchases.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 shadow-xs">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Total Returns</span>
                    <span className="font-mono text-xs font-extrabold text-indigo-700 block mt-1">{ledgerAnalytics.totalReturns} Notes</span>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 shadow-xs">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Total Return Value</span>
                    <span className="font-mono text-xs font-extrabold text-rose-600 block mt-1">₹{ledgerAnalytics.totalReturnPriceValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 shadow-xs">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Refund Received</span>
                    <span className="font-mono text-xs font-extrabold text-emerald-600 block mt-1">₹{ledgerAnalytics.totalRefundReceived.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 shadow-xs">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Replacement Pending</span>
                    <span className="font-mono text-xs font-extrabold text-amber-600 block mt-1">{ledgerAnalytics.replacementPendingCount} Notes</span>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 shadow-xs">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Replacement Value</span>
                    <span className="font-mono text-xs font-extrabold text-slate-800 block mt-1">₹{ledgerAnalytics.replacementPendingValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 shadow-xs">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Outstanding Balance</span>
                    <span className="font-mono text-xs font-extrabold text-red-600 block mt-1">₹{ledgerAnalytics.outstandingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 shadow-xs">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Last Return Date</span>
                    <span className="font-mono text-xs font-extrabold text-slate-800 block mt-1">
                      {ledgerAnalytics.lastReturnDate 
                        ? new Date(ledgerAnalytics.lastReturnDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) 
                        : '—'}
                    </span>
                  </div>
                </div>

                {/* Return Note History List */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Returns Settlement History</h3>
                  <div className="overflow-x-auto max-h-[250px] overflow-y-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase bg-slate-50">
                          <th className="py-2.5 px-3">Date</th>
                          <th className="py-2.5 px-3">Note Number</th>
                          <th className="py-2.5 px-3">Product</th>
                          <th className="py-2.5 px-3 text-center">Returned Qty</th>
                          <th className="py-2.5 px-3 text-right">Refund Amount</th>
                          <th className="py-2.5 px-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                        {ledgerHistory.map(h => (
                          <tr key={h.id}>
                            <td className="py-2.5 px-3 text-slate-405">{new Date(h.created_at).toLocaleDateString('en-IN')}</td>
                            <td className="py-2.5 px-3 font-mono text-slate-850 font-bold">{h.return_no}</td>
                            <td className="py-2.5 px-3">{h.productName}</td>
                            <td className="py-2.5 px-3 text-center">{h.quantity}</td>
                            <td className="py-2.5 px-3 text-right text-rose-500">₹{Number(h.total_amount).toFixed(2)}</td>
                            <td className="py-2.5 px-3 text-center">
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-250">{h.status}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW VRN DETAIL MODAL */}
      {viewingNote && (
        <Modal
          isOpen={!!viewingNote}
          onClose={() => setViewingNote(null)}
          title="Vendor Return Note (VRN) Details"
          size="xl"
          noPadding={true}
        >
          <div className="flex flex-col bg-slate-50 text-slate-800 select-none max-h-[80vh] overflow-y-auto font-sans p-6 space-y-4">
            <div className="bg-amber-700 text-white rounded-xl p-5 flex justify-between items-start">
              <div>
                <p className="text-[10px] font-bold text-amber-200 uppercase tracking-wider mb-1">Return Statement</p>
                <h1 className="text-lg font-black tracking-tight">{viewingNote.vendor_company_name || viewingNote.vendor_name}</h1>
                <p className="text-[10px] text-amber-100 mt-0.5">Supplier Refund Settlement Ledger</p>
              </div>
              <div className="text-right">
                <span className="inline-block bg-white/20 text-white text-[9px] font-black uppercase px-2.5 py-1 rounded-md tracking-wider mb-1.5">
                  {viewingNote.status.toUpperCase()}
                </span>
                <p className="text-xs font-bold text-white">#{viewingNote.return_no}</p>
                <p className="text-[10px] text-amber-100 mt-0.5">Date: {new Date(viewingNote.created_at).toLocaleDateString('en-IN')}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-1">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Item Details</span>
                <div>Product: <span className="text-slate-900 font-bold">{viewingNote.product_name}</span></div>
                <div>Quantity: <span className="text-slate-900 font-bold">{viewingNote.quantity} Pcs</span></div>
                <div>Return Rate: <span className="text-slate-900 font-bold">₹{Number(viewingNote.return_price).toFixed(2)}</span></div>
                <div>Return Type: <span className="text-slate-900 font-bold">{viewingNote.return_type || 'Refund'}</span></div>
                <div>Invoice Ref: <span className="text-slate-900 font-mono font-bold">{viewingNote.purchase_no || '—'}</span></div>
                <div>Batch No: <span className="text-slate-900 font-mono">{viewingNote.batch_number || 'BATCH-001'}</span></div>
                <div>Expiry Date: <span className="text-slate-900">{viewingNote.expiry_date ? new Date(viewingNote.expiry_date).toLocaleDateString('en-IN') : 'N/A'}</span></div>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Settlement Summary</span>
                <div>Subtotal Value: <span className="text-slate-900">₹{(Number(viewingNote.quantity) * Number(viewingNote.return_price)).toFixed(2)}</span></div>
                <div>GST Adjustment: <span className="text-slate-900">₹{(Number(viewingNote.total_amount) - (Number(viewingNote.quantity) * Number(viewingNote.return_price))).toFixed(2)}</span></div>
                <div className="border-t border-slate-100 pt-1.5 mt-1.5 flex justify-between font-black text-rose-600">
                  <span>Refund Deducted:</span>
                  <span>₹{Number(viewingNote.total_amount).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Remarks & Image */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-2">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block border-b border-slate-100 pb-1">Internal Remarks & Evidence</span>
              <p className="text-xs font-semibold text-slate-650">{viewingNote.remarks || 'No audit remarks provided.'}</p>
              {viewingNote.image_url && (
                <div className="mt-3">
                  <span className="text-[9px] font-black text-slate-400 uppercase block mb-1">Damaged Product Evidence</span>
                  <img src={viewingNote.image_url} alt="Damaged Product Evidence" className="max-h-[160px] object-contain rounded-lg border border-slate-200" />
                </div>
              )}
            </div>

            {/* Status workflow history tracker */}
            {viewingNote.statusHistory && viewingNote.statusHistory.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-2.5">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block border-b border-slate-100 pb-1">Workflow Status Audit Logs</span>
                <div className="space-y-2">
                  {viewingNote.statusHistory.map(h => (
                    <div key={h.id} className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                      <div>
                        <span className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded text-[8px] uppercase">{h.status}</span>
                        <span className="ml-2 font-medium text-slate-800">{h.notes || 'Status updated'}</span>
                      </div>
                      <div className="text-[9px] text-slate-400">By: {h.user_name} • {new Date(h.created_at).toLocaleString('en-IN')}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                onClick={() => handlePrintReturnNote(viewingNote)}
                className="px-4 py-2 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold active:scale-95"
              >
                Print Note
              </button>
              <button
                onClick={() => setViewingNote(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold active:scale-95"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* UPDATE STATUS WORKFLOW MODAL */}
      {updatingStatusNote && (
        <Modal
          isOpen={!!updatingStatusNote}
          onClose={() => setUpdatingStatusNote(null)}
          title="Advance Status Workflow"
          size="sm"
        >
          <form onSubmit={handleUpdateStatusSubmit} className="p-4 space-y-4 font-sans text-xs">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Select Workflow Status</label>
              <select
                value={statusUpdateVal}
                onChange={(e) => setStatusUpdateVal(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 font-bold bg-slate-50"
              >
                <option value="Pending">Pending</option>
                <option value="Sent to Vendor">Sent to Vendor</option>
                <option value="Vendor Accepted">Vendor Accepted</option>
                <option value="Replacement Received">Replacement Received</option>
                <option value="Refund Received">Refund Received</option>
                <option value="Closed">Closed</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Status Notes / Action Remarks</label>
              <textarea
                rows="2"
                required
                value={statusUpdateNotes}
                onChange={(e) => setStatusUpdateNotes(e.target.value)}
                placeholder="e.g. Shipment dispatched to vendor counter..."
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 font-semibold bg-slate-50"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setUpdatingStatusNote(null)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1.5 bg-indigo-650 hover:bg-indigo-700 text-white font-bold rounded-lg"
              >
                Save status
              </button>
            </div>
          </form>
        </Modal>
      )}

    </div>
  );
};

export default VendorReturnManagement;
