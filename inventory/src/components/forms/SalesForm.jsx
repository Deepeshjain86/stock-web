
import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
    MagnifyingGlassIcon,
    XMarkIcon,
    PlusIcon,
    MinusIcon,
    TrashIcon,
    ShoppingCartIcon,
    CheckCircleIcon,
    ExclamationCircleIcon,
    UserIcon,
    CreditCardIcon,
    BanknotesIcon,
    ArrowPathIcon,
    DocumentArrowDownIcon,
    PrinterIcon,
    QrCodeIcon,
    CalendarDaysIcon,
    HashtagIcon,
    UserPlusIcon,
    ChevronDownIcon,
    QuestionMarkCircleIcon,
    CommandLineIcon,
} from '@heroicons/react/24/outline';
import { productsAPI, customersAPI, settingsAPI } from '../../services/api';
import { useAppSelector } from '../../store/hooks';
import { motion, AnimatePresence } from 'framer-motion';

/* ── Toast Notification ── */
const Toast = ({ toast }) => {
    if (!toast) return null;
    const isError = toast.type === 'error';
    return (
        <div
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold shadow-lg border mx-auto w-fit mb-4 ${
                isError
                    ? 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800/50'
                    : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50'
            }`}
        >
            {isError ? (
                <ExclamationCircleIcon className="w-4 h-4 flex-shrink-0" />
            ) : (
                <CheckCircleIcon className="w-4 h-4 flex-shrink-0" />
            )}
            {toast.msg}
        </div>
    );
};

const ALL_PAYMENT_MODES = [
  'Cash',
  'UPI',
  'Credit / Udhaar',
  'Credit/Debit Card',
  'Bank Transfer',
  'Wallet',
  'Cheque',
  'Gift Voucher',
  'Store Credit'
];

const PAYMENT_METHODS = ALL_PAYMENT_MODES;

const isDiscreteUnit = (unitStr) => {
    if (!unitStr) return true;
    const u = String(unitStr).trim().toLowerCase();
    const metricKeywords = ['kg', 'kilogram', 'gram', 'grams', 'g', 'litre', 'liter', 'l', 'ml', 'millilitre', 'milliliter', 'meter', 'm'];
    return !metricKeywords.includes(u);
};


const SalesForm = ({ sale, onSubmit, onCancel }) => {
    const { user } = useAppSelector((state) => state.auth);
    const today = new Date().toISOString().split('T')[0];

    const storeInfo = (() => {
        try {
            const u = JSON.parse(localStorage.getItem('user') || '{}');
            return {
                name: u.store_name || u.storeName || 'Kirana Mart',
                gstin: u.gstin || '',
                address: u.address || '',
                phone: u.phone || '',
            };
        } catch {
            return { name: 'Kirana Mart', gstin: '', address: '', phone: '' };
        }
    })();

    const printRef = useRef();
    const searchRef = useRef(null);
    const dropdownRef = useRef(null);
    const custDropdownRef = useRef(null);
    const customerSearchInputRef = useRef(null);
    const discountInputRef = useRef(null);
    const paymentSectionRef = useRef(null);

    /* ── Keyboard Shortcuts & Navigation State ── */
    const [selectedCartIndex, setSelectedCartIndex] = useState(-1);
    const [highlightedSearchIndex, setHighlightedSearchIndex] = useState(-1);
    const [showShortcutsHelpModal, setShowShortcutsHelpModal] = useState(false);

    /* ── Core State ── */
    const [items, setItems] = useState(sale?.items || []);
    const [customerType, setCustomerType] = useState('Walk-in');
    const [customerName, setCustomerName] = useState(sale?.customerName || 'Walk-in Customer');
    const [customerPhone, setCustomerPhone] = useState('');
    const [customerId, setCustomerId] = useState(sale?.customerId || 1);

    // Searchable Customer Select States
    const [searchCustomer, setSearchCustomer] = useState('');
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

    // Add Customer Popup Modal States
    const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
    const [newCustType, setNewCustType] = useState('Walk-in');
    const [newCustName, setNewCustName] = useState('');
    const [newCustPhone, setNewCustPhone] = useState('');
    const [newCustAddress, setNewCustAddress] = useState('');
    const [newCustPaymentMode, setNewCustPaymentMode] = useState('Cash');
    const [newCustNotes, setNewCustNotes] = useState('');

    // Credit / Borrow Parameters
    const [dueDate, setDueDate] = useState(
        new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    );
    const [amountPaid, setAmountPaid] = useState('0');

    const [paymentMethod, setPaymentMethod] = useState(sale?.paymentMethod || 'Cash');
    const [paymentStatus, setPaymentStatus] = useState('Paid');
    const [billDate, setBillDate] = useState(sale?.date || today);
    const [notes, setNotes] = useState(sale?.notes || '');
    const [cashReceived, setCashReceived] = useState('');
    const [globalDiscount, setGlobalDiscount] = useState(0);
    const [additionalCharges, setAdditionalCharges] = useState(0);

    // Split Payment Allocation State
    const [paymentRows, setPaymentRows] = useState(
        sale?.payments && sale.payments.length > 0
            ? sale.payments.map((p, idx) => ({
                id: idx + 1,
                paymentMethod: p.paymentMethod || 'Cash',
                amount: p.amount !== undefined ? p.amount : '',
                referenceNo: p.referenceNo || ''
              }))
            : [{ id: 1, paymentMethod: sale?.paymentMethod || 'Cash', amount: '', referenceNo: '' }]
    );

    const handleAddPaymentRow = () => {
        const totalEntered = paymentRows.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
        const rem = Math.max(0, grandTotal - totalEntered);
        setPaymentRows([
            ...paymentRows,
            { id: Date.now(), paymentMethod: 'UPI', amount: rem > 0 ? rem : '', referenceNo: '' }
        ]);
    };

    const handleRemovePaymentRow = (id) => {
        if (paymentRows.length === 1) return;
        setPaymentRows(paymentRows.filter(r => r.id !== id));
    };

    const handlePaymentRowChange = (id, field, value) => {
        setPaymentRows(paymentRows.map(r => r.id === id ? { ...r, [field]: value } : r));
    };

    const [searchQuery, setSearchQuery] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const [productsList, setProductsList] = useState([]);
    const [customersList, setCustomersList] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const showToast = (msg, type = 'error') => {
        if (type === 'error') toast.error(msg);
        else toast.success(msg);
    };

    /* ── Load Products & Customers from API ── */
    const fetchProductsAndCustomers = async () => {
        setLoadingProducts(true);
        try {
            const [prodRes, custRes] = await Promise.all([
                productsAPI.getAll({ limit: 500 }),
                customersAPI.getAll().catch(() => ({ customers: [] })),
            ]);
            if (prodRes.success) setProductsList(prodRes.products || []);
            if (custRes.success || custRes.customers) setCustomersList(custRes.customers || []);
        } catch (err) {
            console.warn('API lookup failed, loading locally...');
        } finally {
            setLoadingProducts(false);
        }
    };

    useEffect(() => {
        fetchProductsAndCustomers();
    }, []);

    /* ── Click outside to close dropdowns ── */
    useEffect(() => {
        const handler = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setShowDropdown(false);
            }
            if (custDropdownRef.current && !custDropdownRef.current.contains(e.target)) {
                setShowCustomerDropdown(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    /* ── Customer Filtering List ── */
    const filteredCustomers = useMemo(() => {
        const q = searchCustomer.trim().toLowerCase();
        return customersList
            .filter((c) => {
                const matchType = c.customer_type === customerType;
                const matchText =
                    !q ||
                    (c.name || '').toLowerCase().includes(q) ||
                    (c.phone || '').includes(q);
                return matchType && matchText;
            })
            .slice(0, 10);
    }, [searchCustomer, customersList, customerType]);

    /* ── Product Suggestions Dropdown ── */
    const filteredProducts = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q || productsList.length === 0) return productsList.slice(0, 20);
        return productsList
            .filter(
                (p) =>
                    (p.name || '').toLowerCase().includes(q) ||
                    (p.barcode || '').includes(q) ||
                    (p.sku || '').toLowerCase().includes(q)
            )
            .slice(0, 15);
    }, [searchQuery, productsList]);

    const isInCart = (id) => items.some((i) => i.productId === id);

    const handleAddProduct = useCallback(
        (product) => {
            const currentStock = Number(product.total_stock ?? product.stock ?? product.currentStock ?? 0);

            if (currentStock <= 0) {
                showToast(`"${product.name}" is OUT OF STOCK!`, 'error');
                return;
            }

            setItems((prev) => {
                const existingIdx = prev.findIndex((i) => i.productId === product.id);
                if (existingIdx !== -1) {
                    const item = { ...prev[existingIdx] };
                    if (item.quantity + 1 > currentStock) {
                        showToast(`Cannot add more. Available stock for "${product.name}" is ${currentStock} ${product.unit || 'Pcs'}.`, 'error');
                        return prev;
                    }
                    const updated = [...prev];
                    item.quantity = Number(item.quantity) + 1;
                    item.availableStock = currentStock;
                    const p = Number(item.price) || 0;
                    const q = item.quantity;
                    const d = Math.min(100, Math.max(0, Number(item.discount) || 0));
                    const g = Number(item.gst) || 0;
                    const sub = p * q;
                    const discAmt = (sub * d) / 100;
                    const taxable = sub - discAmt;
                    item.subtotal = sub;
                    item.total = taxable + (taxable * g) / 100;
                    updated[existingIdx] = item;
                    return updated;
                } else {
                    const price = Number(product.selling_price || product.sellingPrice || 0);
                    const gst = Number(product.gst || 18);
                    const baseUnit = (product.unit || 'Pcs').trim();
                    const qty = 1;
                    const subtotal = price * qty;
                    const taxAmt = (subtotal * gst) / 100;
                    return [
                        ...prev,
                        {
                            productId: product.id,
                            name: product.name,
                            barcode: product.barcode || '',
                            unit: baseUnit,
                            selectedUnit: baseUnit,
                            inputQty: 1,
                            measurement_value: product.measurement_value || '',
                            quantity: qty,
                            availableStock: currentStock,
                            price,
                            discount: 0,
                            gst,
                            subtotal,
                            total: subtotal + taxAmt,
                        },
                    ];
                }
            });
            setSearchQuery('');
            setTimeout(() => searchRef.current?.focus(), 50);
        },
        []
    );

    const handleRemoveItem = (idx) => setItems((prev) => prev.filter((_, i) => i !== idx));

    const handleUpdateItem = (idx, field, value) => {
        setItems((prev) => {
            const updated = [...prev];
            const item = { ...updated[idx] };
            
            const base = (item.unit || 'Pcs').trim().toLowerCase();

            if (field === 'selectedUnit') {
                item.selectedUnit = value;
                const sel = (value || '').trim().toLowerCase();
                const rawQty = item.inputQty === '' ? 0 : Number(item.inputQty) || 0;
                let qtyInBaseUnit = rawQty;

                if ((base === 'kg' || base === 'kilogram') && (sel === 'g' || sel === 'grams')) {
                    qtyInBaseUnit = rawQty / 1000;
                } else if ((base === 'litre' || base === 'l') && (sel === 'ml' || sel === 'millilitre')) {
                    qtyInBaseUnit = rawQty / 1000;
                } else if (base === 'grams' && (sel === 'kg' || sel === 'kilogram')) {
                    qtyInBaseUnit = rawQty * 1000;
                } else if (base === 'ml' && (sel === 'litre' || sel === 'l')) {
                    qtyInBaseUnit = rawQty * 1000;
                }
                item.quantity = qtyInBaseUnit;
            } else if (field === 'inputQty' || field === 'quantity') {
                const discrete = isDiscreteUnit(item.unit);
                let rawVal = value === '' ? '' : Number(value);
                
                // Enforce integer-only quantity for discrete count units (Packet, Box, Bottle, Piece, Pcs, Sachet, Carton, Dozen)
                if (discrete && rawVal !== '') {
                    rawVal = Math.max(1, Math.floor(rawVal));
                }

                item.inputQty = rawVal;
                let sel = (item.selectedUnit || item.unit || 'Pcs').trim().toLowerCase();

                // Smart auto-switch to Grams/Ml if user types a large number (>= 15) for Kg/Litre items while selectedUnit is Kg/Litre
                if (!discrete && (base === 'kg' || base === 'kilogram') && sel === 'kg' && Number(rawVal) >= 15) {
                    item.selectedUnit = 'g';
                    sel = 'g';
                } else if (!discrete && (base === 'litre' || base === 'l') && sel === 'litre' && Number(rawVal) >= 15) {
                    item.selectedUnit = 'ml';
                    sel = 'ml';
                }

                let qtyInBaseUnit = Number(rawVal) || 0;
                if (!discrete) {
                    if ((base === 'kg' || base === 'kilogram') && (sel === 'g' || sel === 'grams')) {
                        qtyInBaseUnit = Number(rawVal) / 1000;
                    } else if ((base === 'litre' || base === 'l') && (sel === 'ml' || sel === 'millilitre')) {
                        qtyInBaseUnit = Number(rawVal) / 1000;
                    } else if (base === 'grams' && (sel === 'kg' || sel === 'kilogram')) {
                        qtyInBaseUnit = Number(rawVal) * 1000;
                    } else if (base === 'ml' && (sel === 'litre' || sel === 'l')) {
                        qtyInBaseUnit = Number(rawVal) * 1000;
                    }
                }

                if (item.availableStock !== undefined && qtyInBaseUnit > item.availableStock) {
                    toast.error(`Cannot exceed available stock (${item.availableStock} ${item.unit || 'Pcs'}).`);
                    item.quantity = item.availableStock;
                    item.inputQty = (!discrete && (sel === 'g' || sel === 'ml')) ? item.availableStock * 1000 : item.availableStock;
                } else {
                    item.quantity = qtyInBaseUnit;
                }
            } else {
                item[field] = value;
            }

            const p = Number(item.price) || 0;
            const q = Math.max(0, Number(item.quantity) || 0);
            const d = Math.min(100, Math.max(0, Number(item.discount) || 0));
            const g = Number(item.gst) || 0;
            const sub = p * q;
            const discAmt = (sub * d) / 100;
            const taxable = sub - discAmt;
            item.subtotal = sub;
            item.total = taxable + (taxable * g) / 100;
            updated[idx] = item;
            return updated;
        });
    };

    /* ── Calculations ── */
    const subtotal = items.reduce(
        (s, i) => s + Number(i.price) * (Number(i.quantity) || 0),
        0
    );
    const totalItemDiscount = items.reduce((s, i) => {
        const sub = Number(i.price) * (Number(i.quantity) || 0);
        return s + (sub * (Number(i.discount) || 0)) / 100;
    }, 0);
    const totalGst = items.reduce((s, i) => {
        const sub = Number(i.price) * (Number(i.quantity) || 0);
        const discAmt = (sub * (Number(i.discount) || 0)) / 100;
        const taxable = sub - discAmt;
        return s + (taxable * (Number(i.gst) || 0)) / 100;
    }, 0);

    const discountAmount =
        totalItemDiscount + (subtotal * (Number(globalDiscount) || 0)) / 100;
    const afterDiscount = subtotal - discountAmount;
    const afterGst = afterDiscount + totalGst;
    const afterCharges = afterGst + Number(additionalCharges || 0);
    const grandTotal = Math.max(0, Math.round(afterCharges));

    // Live Payment & Split Payment Calculations
    const totalPaymentsEntered = paymentRows.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
    const totalCashEntered = paymentRows.filter(r => r.paymentMethod === 'Cash').reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
    const totalNonCashEntered = paymentRows.filter(r => r.paymentMethod !== 'Cash').reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
    const remainingBalance = Math.max(0, grandTotal - totalPaymentsEntered);
    const changeAmount = (totalPaymentsEntered > grandTotal && totalCashEntered > 0)
        ? Math.max(0, totalPaymentsEntered - grandTotal)
        : 0;

    // Auto-sync single payment mode amount when cart items / total changes
    useEffect(() => {
        if (customerType === 'Walk-in' && paymentRows.length === 1 && (paymentRows[0].amount === '' || paymentRows[0].isAuto)) {
            setPaymentRows([{ ...paymentRows[0], amount: grandTotal > 0 ? grandTotal : '', isAuto: true }]);
        }
    }, [grandTotal, customerType]);

    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(
        Math.floor(Math.random() * 9000) + 1000
    )}`;

    /* ── Save New Customer directly ── */
    const handleAddNewCustomerSubmit = async (e) => {
        e.preventDefault();
        const cleanedPhone = newCustPhone ? newCustPhone.replace(/\D/g, '') : '';
        if (!newCustName || !cleanedPhone) {
            toast.error('Please provide customer name and mobile.');
            return;
        }
        if (cleanedPhone.length !== 10) {
            toast.error('Mobile number must be exactly 10 digits.');
            return;
        }
        try {
            const res = await customersAPI.create({
                name: newCustName,
                phone: cleanedPhone,
                address: newCustAddress || null,
                customer_type: newCustType,
                payment_mode: newCustPaymentMode,
                notes: newCustNotes || null,
                status: 'Active',
            });
            if (res.success) {
                toast.success('Customer registered to master database successfully!');
                const custRes = await customersAPI.getAll();
                if (custRes.success || custRes.customers) {
                    setCustomersList(custRes.customers || []);
                }
                setCustomerId(res.customer.id);
                setCustomerName(res.customer.name);
                setCustomerPhone(res.customer.phone || '');
                setCustomerType(res.customer.customer_type);
                setPaymentMethod(res.customer.payment_mode || 'Cash');
                setNewCustName('');
                setNewCustPhone('');
                setNewCustAddress('');
                setNewCustNotes('');
                setShowAddCustomerModal(false);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Error creating customer');
        }
    };

    /* ── Submit POS checkout ── */
    const handleSubmit = () => {
        if (items.length === 0) {
            showToast('Please add at least one product to the cart.');
            return;
        }

        // Calculate non-credit actual money collected vs credit amounts
        const nonCreditRows = paymentRows.filter(r => 
            r.paymentMethod !== 'Credit / Udhaar' && 
            r.paymentMethod !== 'Credit/Borrow' && 
            Number(r.amount) > 0
        );
        const creditRows = paymentRows.filter(r => 
            (r.paymentMethod === 'Credit / Udhaar' || r.paymentMethod === 'Credit/Borrow') && 
            Number(r.amount) > 0
        );

        const actualMoneyCollected = nonCreditRows.reduce((sum, r) => sum + Number(r.amount || 0), 0);
        const explicitCreditAmount = creditRows.reduce((sum, r) => sum + Number(r.amount || 0), 0);

        const effectiveDueAmount = Math.max(0, explicitCreditAmount > 0 ? explicitCreditAmount : (grandTotal - actualMoneyCollected));
        const effectiveAmountPaid = Math.min(grandTotal, actualMoneyCollected);

        if (effectiveDueAmount > 0 && customerType !== 'Borrow') {
            showToast(`Unpaid credit balance of ₹${effectiveDueAmount.toFixed(2)} requires selecting a Borrow Customer profile.`);
            return;
        }

        if (customerType === 'Borrow' && (!customerId || customerId === 1)) {
            showToast('You must select or register a Borrow Customer profile for credit billing.');
            return;
        }

        const finalPaymentStatus = effectiveDueAmount <= 0 ? 'Paid' : (effectiveAmountPaid > 0 ? 'Partial' : 'Pending');

        const validPaymentRows = paymentRows.filter(r => Number(r.amount) > 0);
        let primaryPaymentMethodText = 'Cash';
        if (validPaymentRows.length === 1) {
            primaryPaymentMethodText = validPaymentRows[0].paymentMethod;
        } else if (validPaymentRows.length > 1) {
            primaryPaymentMethodText = `Split (${validPaymentRows.map(p => `${p.paymentMethod} ₹${p.amount}`).join(' + ')})`;
        } else if (effectiveDueAmount > 0) {
            primaryPaymentMethodText = 'Credit / Udhaar';
        }

        const payload = {
            customerType,
            customerName: customerType === 'Walk-in' ? customerName || 'Walk-in Customer' : customerName,
            customerPhone: customerType === 'Walk-in' ? customerPhone : '',
            customerId: customerType === 'Borrow' ? customerId : 1,
            dueDate: effectiveDueAmount > 0 ? dueDate : null,
            amountPaid: effectiveAmountPaid,
            dueAmount: effectiveDueAmount,
            paymentMethod: primaryPaymentMethodText,
            payments: validPaymentRows.map(r => ({
                paymentMethod: r.paymentMethod,
                amount: Number(r.amount || 0),
                referenceNo: r.referenceNo || ''
            })),
            paymentStatus: finalPaymentStatus,
            date: billDate,
            notes,
            items,
            subtotal,
            discount: discountAmount,
            gstAmount: totalGst,
            total: grandTotal,
            invoiceNo: invoiceNumber,
        };

        console.log(`[POS Submit Checkout Log] Front-end Payload:`, JSON.stringify(payload));
        onSubmit(payload);
    };

    /* ── Comprehensive POS Keyboard Shortcut Engine (Tally / ERP Standard) ── */
    useEffect(() => {
        const handleGlobalKeyDown = (e) => {
            const isInputTarget = ['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target?.tagName);

            // Alt + / or Alt + ? -> Toggle Keyboard Shortcuts Help Modal
            if (e.altKey && (e.key === '/' || e.key === '?')) {
                e.preventDefault();
                setShowShortcutsHelpModal((prev) => !prev);
                return;
            }

            // Esc -> Close Modals or Dropdowns
            if (e.key === 'Escape') {
                if (showShortcutsHelpModal) {
                    setShowShortcutsHelpModal(false);
                    return;
                }
                if (showAddCustomerModal) {
                    setShowAddCustomerModal(false);
                    return;
                }
                if (showDropdown) {
                    setShowDropdown(false);
                    return;
                }
                if (showCustomerDropdown) {
                    setShowCustomerDropdown(false);
                    return;
                }
            }

            // Function Keys (F1 - F12) & Ctrl shortcuts (Work everywhere on POS screen)
            if (e.key === 'F2') {
                e.preventDefault();
                setShowCustomerDropdown(true);
                setTimeout(() => customerSearchInputRef.current?.focus(), 50);
                return;
            }

            if (e.key === 'F3' || (e.ctrlKey && (e.key === 'f' || e.key === 'F'))) {
                e.preventDefault();
                searchRef.current?.focus();
                setShowDropdown(true);
                return;
            }

            if (e.key === 'F4') {
                e.preventDefault();
                if (items.length > 0) {
                    const targetIdx = selectedCartIndex >= 0 ? selectedCartIndex : items.length - 1;
                    const qtyInput = document.getElementById(`cart-item-qty-${targetIdx}`);
                    if (qtyInput) {
                        qtyInput.focus();
                        qtyInput.select();
                    }
                }
                return;
            }

            if (e.key === 'F5') {
                e.preventDefault();
                discountInputRef.current?.focus();
                discountInputRef.current?.select();
                return;
            }

            if (e.key === 'F6') {
                e.preventDefault();
                paymentSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
                return;
            }

            if (e.key === 'F7' || (e.ctrlKey && (e.key === 's' || e.key === 'S'))) {
                e.preventDefault();
                if (items.length > 0) {
                    showToast('Bill held & draft state saved successfully!', 'success');
                } else {
                    showToast('POS cart is empty. Add products before holding bill.');
                }
                return;
            }

            if (e.key === 'F8' || e.key === 'F10' || e.key === 'F12') {
                e.preventDefault();
                handleSubmit();
                return;
            }

            if (e.key === 'F9' || (e.ctrlKey && (e.key === 'p' || e.key === 'P'))) {
                e.preventDefault();
                if (printRef.current) {
                    const printContents = printRef.current.innerHTML;
                    const win = window.open('', '', 'height=600,width=800');
                    win.document.write('<html><head><title>Print Invoice</title></head><body>');
                    win.document.write(printContents);
                    win.document.write('</body></html>');
                    win.document.close();
                    win.print();
                }
                return;
            }

            if (e.key === 'F11') {
                e.preventDefault();
                handleClearCart();
                return;
            }

            if (e.ctrlKey && (e.key === 'n' || e.key === 'N')) {
                e.preventDefault();
                setShowAddCustomerModal(true);
                return;
            }

            // Cart Row Selection / Deletion when not inside text inputs
            if (!isInputTarget) {
                if (e.key === 'Delete' && selectedCartIndex >= 0 && selectedCartIndex < items.length) {
                    e.preventDefault();
                    handleRemoveItem(selectedCartIndex);
                    setSelectedCartIndex(-1);
                    return;
                }

                if (e.key === 'ArrowDown' && !showDropdown && !showCustomerDropdown) {
                    e.preventDefault();
                    setSelectedCartIndex((prev) => Math.min(prev + 1, items.length - 1));
                    return;
                }

                if (e.key === 'ArrowUp' && !showDropdown && !showCustomerDropdown) {
                    e.preventDefault();
                    setSelectedCartIndex((prev) => Math.max(prev - 1, 0));
                    return;
                }
            }

            // Search Dropdown Keyboard Navigation (when search dropdown is visible)
            if (showDropdown && filteredProducts.length > 0) {
                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setHighlightedSearchIndex((prev) => Math.min(prev + 1, filteredProducts.length - 1));
                    return;
                }

                if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setHighlightedSearchIndex((prev) => Math.max(prev - 1, 0));
                    return;
                }

                if (e.key === 'Enter' && highlightedSearchIndex >= 0 && highlightedSearchIndex < filteredProducts.length) {
                    e.preventDefault();
                    const chosen = filteredProducts[highlightedSearchIndex];
                    if (isInCart(chosen.id)) {
                        handleRemoveItem(items.findIndex((i) => i.productId === chosen.id));
                    } else {
                        handleAddProduct(chosen);
                    }
                    setHighlightedSearchIndex(-1);
                    return;
                }
            }
        };

        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, [
        items,
        selectedCartIndex,
        highlightedSearchIndex,
        showDropdown,
        showCustomerDropdown,
        showShortcutsHelpModal,
        showAddCustomerModal,
        filteredProducts,
        customerType,
        customerId,
        paymentRows,
        grandTotal,
        remainingBalance
    ]);

    const handleClearCart = () => {
        if (items.length > 0 && !window.confirm('Clear all items from current POS cart?')) return;
        setItems([]);
        setGlobalDiscount(0);
        setAdditionalCharges(0);
        setCashReceived('');
        setAmountPaid('0');
    };

    return (
        // MAIN WRAPPER - Light mode: white background, Dark mode: dark background
        <div className="flex flex-col h-[92vh] bg-white dark:bg-[#0b0d15] text-gray-800 dark:text-slate-100 font-sans select-none overflow-hidden">
            {/* ─── POS HEADER BAR (Dark Emerald) ─── */}
            <div className="bg-[#0F4C3A] dark:bg-[#0a1f18] px-6 py-3.5 flex flex-col sm:flex-row items-center justify-between border-b border-[#1a6b4f] dark:border-slate-800 flex-shrink-0 shadow-sm dark:shadow-none">
                <div className="flex items-center gap-3.5">
                    <div className="h-10 w-10 rounded-xl bg-white/20 dark:bg-emerald-500/20 flex items-center justify-center shadow-lg shadow-black/10 dark:shadow-none">
                        <ShoppingCartIcon className="w-5 h-5 text-white stroke-[2.5]" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold tracking-tight text-white dark:text-slate-100">
                            {storeInfo.name}
                            <span className="ml-2 text-[10px] font-mono bg-white/20 dark:bg-emerald-500/20 text-white dark:text-emerald-300 px-2 py-0.5 rounded border border-white/30 dark:border-emerald-500/30">
                                POS
                            </span>
                        </h1>
                        <p className="text-[10px] text-emerald-100 dark:text-slate-400 font-medium tracking-wider">
                            Terminal · {user?.name || 'Staff'}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 mt-3 sm:mt-0">
                    <button
                        type="button"
                        onClick={handleClearCart}
                        className="flex items-center gap-1 px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-white rounded-xl text-xs font-bold border border-white/30 dark:border-amber-500/40 transition-all cursor-pointer shadow-xs active:scale-95"
                        title="Start New Bill / Reset Cart (F11)"
                    >
                        <span>New Bill</span>
                        <span className="text-[9px] font-mono opacity-80 bg-black/20 px-1 py-0.5 rounded font-bold">F11</span>
                    </button>
                    <div className="flex items-center gap-2 bg-white/20 dark:bg-[#0d101a] border border-white/30 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-white dark:text-emerald-300">
                        <HashtagIcon className="w-3.5 h-3.5 text-white/70 dark:text-emerald-400" />
                        {invoiceNumber}
                    </div>
                    <div className="flex items-center gap-2 bg-white/20 dark:bg-[#0d101a] border border-white/30 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs font-medium text-white dark:text-slate-300">
                        <CalendarDaysIcon className="w-3.5 h-3.5 text-white/70 dark:text-emerald-400" />
                        <input
                            type="date"
                            value={billDate}
                            onChange={(e) => setBillDate(e.target.value)}
                            className="bg-transparent outline-none text-white dark:text-slate-200 cursor-pointer w-24 text-right text-xs font-medium"
                        />
                    </div>
                    <button
                        onClick={onCancel}
                        className="p-2 bg-white/10 dark:bg-[#0d101a] hover:bg-white/20 dark:hover:bg-slate-800/60 text-white/80 dark:text-slate-400 hover:text-white dark:hover:text-white rounded-xl border border-white/30 dark:border-slate-800 transition-all cursor-pointer"
                        title="Exit POS Console (Esc)"
                    >
                        <XMarkIcon className="w-5 h-5 stroke-[2.5]" />
                    </button>
                </div>
            </div>

            {/* ─── POS 3-COLUMN LAYOUT ─── */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden bg-gray-50 dark:bg-[#0b0d15] p-4 gap-4" style={{ minHeight: 0 }}>
                {/* ─── COLUMN 1: PRODUCT SEARCH (TOP) + CUSTOMER (BOTTOM) ─── */}
                <div className="lg:col-span-3 flex flex-col bg-white dark:bg-[#11141f] border border-gray-200 dark:border-slate-800 rounded-2xl p-4 gap-4 overflow-y-auto shadow-sm dark:shadow-xl dark:shadow-black/20">
                    
                    {/* ─── PRODUCT SEARCH (MOVED TO TOP) ─── */}
                    <div className="flex-0" ref={dropdownRef}>
                        <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 flex items-center justify-between border-b border-gray-200 dark:border-slate-800 pb-2.5 mb-2.5">
                            <span className="flex items-center gap-2">
                                <QrCodeIcon className="w-4 h-4 text-[#0F4C3A] dark:text-emerald-400" /> Search Products
                            </span>
                            <span className="text-[9px] font-mono bg-slate-100 dark:bg-[#0d101a] border border-slate-200 dark:border-slate-800 px-1.5 py-0.5 rounded text-slate-500 font-bold">F3 / Ctrl+F</span>
                        </h3>
                        <div className="relative">
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-slate-500 pointer-events-none" />
                            <input
                                ref={searchRef}
                                type="text"
                                placeholder="Type name or scan barcode..."
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setShowDropdown(true);
                                }}
                                onFocus={() => setShowDropdown(true)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        const query = searchQuery.trim();
                                        if (!query) return;
                                        let match = productsList.find(
                                            (p) => String(p.barcode) === query || String(p.sku) === query
                                        );
                                        if (!match) {
                                            match = productsList.find(
                                                (p) => p.name?.toLowerCase() === query.toLowerCase()
                                            );
                                        }
                                        if (!match && filteredProducts.length === 1) {
                                            match = filteredProducts[0];
                                        }
                                        if (match) {
                                            handleAddProduct(match);
                                        }
                                    }
                                }}
                                className="w-full pl-9 pr-4 py-2.5 text-xs border border-gray-200 dark:border-slate-800 rounded-xl bg-gray-50 dark:bg-[#0d101a] text-gray-700 dark:text-slate-200 font-medium focus:outline-none focus:border-[#0F4C3A] dark:focus:border-emerald-500 placeholder:text-gray-400 dark:placeholder:text-slate-600 transition-colors"
                            />
                        </div>

                        {showDropdown && (
                            <div className="mt-2 bg-white dark:bg-[#1a1f2e] border border-gray-200 dark:border-slate-800 rounded-xl shadow-xl dark:shadow-2xl dark:shadow-black/60 max-h-52 overflow-y-auto divide-y divide-gray-100 dark:divide-slate-800 z-30 relative">
                                {filteredProducts.length === 0 ? (
                                    <div className="p-4 text-center text-xs text-gray-400 dark:text-slate-500 font-medium">
                                        {searchQuery ? 'No matching products found' : 'Start typing to search...'}
                                    </div>
                                ) : (
                                    filteredProducts.map((p, idx) => {
                                        const inCart = isInCart(p.id);
                                        const stock = Number(p.total_stock || p.stock || 0);
                                        const isHighlighted = highlightedSearchIndex === idx;
                                        return (
                                            <div
                                                key={p.id}
                                                onClick={() =>
                                                    inCart
                                                        ? handleRemoveItem(
                                                              items.findIndex((i) => i.productId === p.id)
                                                          )
                                                        : handleAddProduct(p)
                                                }
                                                className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors ${
                                                    isHighlighted
                                                        ? 'bg-[#0F4C3A]/10 dark:bg-emerald-950/80 ring-2 ring-[#0F4C3A] dark:ring-emerald-500'
                                                        : inCart
                                                        ? 'bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50'
                                                        : 'hover:bg-gray-50 dark:hover:bg-[#21262d]'
                                                }`}
                                            >
                                                <div
                                                    className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 font-bold text-xs ${
                                                        inCart
                                                            ? 'bg-emerald-100 dark:bg-emerald-900/50 text-[#0F4C3A] dark:text-emerald-300'
                                                            : 'bg-gray-100 dark:bg-[#0d101a] text-gray-500 dark:text-slate-500'
                                                    }`}
                                                >
                                                    {(p.name || '?').charAt(0).toUpperCase()}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-semibold text-gray-800 dark:text-slate-200 truncate">
                                                        {p.name}
                                                    </p>
                                                    <p className="text-[10px] text-gray-500 dark:text-slate-400 font-medium">
                                                        {p.barcode || '—'} · {p.measurement_value ? `${p.unit || 'Pcs'} (${p.measurement_value})` : p.unit || 'Pcs'} · Stock:{' '}
                                                        <span
                                                            className={
                                                                stock <= 0 ? 'text-red-500 dark:text-red-400' : 'text-[#0F4C3A] dark:text-emerald-400'
                                                            }
                                                        >
                                                            {stock}
                                                        </span>
                                                    </p>
                                                </div>
                                                <div className="text-right flex-shrink-0 text-xs">
                                                    <p className="font-bold text-gray-800 dark:text-slate-200">
                                                        ₹{Number(p.selling_price || p.sellingPrice || 0).toFixed(2)}
                                                    </p>
                                                    {inCart ? (
                                                        <span className="text-[9px] font-bold text-[#0F4C3A] dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/50">
                                                            ✓ In Cart
                                                        </span>
                                                    ) : (
                                                        <span className="text-[9px] font-bold text-[#0F4C3A] dark:text-emerald-400">
                                                            + Add
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        )}
                    </div>

                    {/* ─── CUSTOMER SECTION (BELOW SEARCH) ─── */}
                    <div>
                        <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 flex items-center justify-between border-b border-gray-200 dark:border-slate-800 pb-2.5">
                            <span className="flex items-center gap-2">
                                <UserIcon className="w-4 h-4 text-[#0F4C3A] dark:text-emerald-400" /> Customer Profile
                            </span>
                            <span className="text-[9px] font-mono bg-slate-100 dark:bg-[#0d101a] border border-slate-200 dark:border-slate-800 px-1.5 py-0.5 rounded text-slate-500 font-bold">F2</span>
                        </h3>
                    </div>

                    {/* Segmented type switcher */}
                    <div>
                        <label className="text-[9px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest block mb-1.5">
                            Billing Type
                        </label>
                        <div className="grid grid-cols-2 gap-1 p-1 bg-gray-100 dark:bg-[#0d101a] border border-gray-200 dark:border-slate-800 rounded-xl">
                            <button
                                type="button"
                                onClick={() => {
                                    setCustomerType('Walk-in');
                                    setCustomerId(1);
                                    setCustomerName('Walk-in Customer');
                                    setCustomerPhone('');
                                    setPaymentMethod('Cash');
                                    setPaymentRows([{ id: 1, paymentMethod: 'Cash', amount: grandTotal > 0 ? grandTotal : '', isAuto: true }]);
                                }}
                                className={`py-1.5 text-[11px] font-bold rounded-lg transition-all ${
                                    customerType === 'Walk-in'
                                        ? 'bg-[#0F4C3A] text-white shadow-sm shadow-emerald-200 dark:shadow-emerald-900/30'
                                        : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
                                }`}
                            >
                                Walk-in
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setCustomerType('Borrow');
                                    const firstBorrow = customersList.find(
                                        (c) => c.customer_type === 'Borrow'
                                    );
                                    if (firstBorrow) {
                                        setCustomerId(firstBorrow.id);
                                        setCustomerName(firstBorrow.name);
                                        setCustomerPhone(firstBorrow.phone || '');
                                    } else {
                                        setCustomerId('');
                                        setCustomerName('');
                                        setCustomerPhone('');
                                    }
                                    setPaymentMethod('Credit / Udhaar');
                                    setPaymentRows([{ id: 1, paymentMethod: 'Credit / Udhaar', amount: 0, isAuto: false }]);
                                }}
                                className={`py-1.5 text-[11px] font-bold rounded-lg transition-all ${
                                    customerType === 'Borrow'
                                        ? 'bg-[#0F4C3A] text-white shadow-sm shadow-emerald-200 dark:shadow-emerald-900/30'
                                        : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
                                }`}
                            >
                                Borrow (Udhaar)
                            </button>
                        </div>
                    </div>

                    {/* Dropdown Customer Selector */}
                    <div className="relative" ref={custDropdownRef}>
                        <label className="text-[9px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest block mb-1.5">
                            Select Profile
                        </label>
                        <div className="flex gap-2">
                            <div
                                onClick={() => setShowCustomerDropdown(!showCustomerDropdown)}
                                className="flex-1 flex justify-between items-center bg-gray-50 dark:bg-[#0d101a] border border-gray-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs font-semibold text-gray-700 dark:text-slate-200 cursor-pointer hover:border-[#0F4C3A] dark:hover:border-emerald-500 transition-colors"
                            >
                                <span className="truncate">{customerName || 'Select Customer...'}</span>
                                <ChevronDownIcon className="w-4 h-4 text-gray-400 dark:text-slate-500" />
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setNewCustType(customerType);
                                    setShowAddCustomerModal(true);
                                }}
                                className="px-3 bg-[#0F4C3A] hover:bg-[#1a6b4f] text-white border border-[#0F4C3A] rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-sm shadow-emerald-200 dark:shadow-emerald-900/30"
                                title="Register New Customer (Ctrl + N)"
                            >
                                <UserPlusIcon className="w-4 h-4" /> Add <span className="text-[9px] font-mono opacity-80 bg-black/20 px-1 py-0.5 rounded">Ctrl+N</span>
                            </button>
                        </div>

                        {showCustomerDropdown && (
                            <div className="absolute z-30 w-full bg-white dark:bg-[#1a1f2e] border border-gray-200 dark:border-slate-800 rounded-xl shadow-xl dark:shadow-2xl dark:shadow-black/60 mt-1 p-2 space-y-2 max-h-[220px] overflow-y-auto">
                                <div className="flex items-center gap-2 border border-gray-200 dark:border-slate-800 rounded-lg px-2 py-1.5 bg-gray-50 dark:bg-[#0d101a]">
                                    <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 dark:text-slate-500" />
                                    <input
                                        ref={customerSearchInputRef}
                                        type="text"
                                        value={searchCustomer}
                                        onChange={(e) => setSearchCustomer(e.target.value)}
                                        placeholder="Search name or mobile (F2)..."
                                        className="w-full bg-transparent border-none text-xs text-gray-700 dark:text-slate-200 focus:outline-none py-1 font-medium"
                                    />
                                </div>
                                <div className="space-y-1">
                                    {filteredCustomers.length === 0 ? (
                                        <div className="text-center text-[11px] text-gray-400 dark:text-slate-500 py-3 italic">
                                            No matching customers found
                                        </div>
                                    ) : (
                                        filteredCustomers.map((c) => (
                                            <div
                                                key={c.id}
                                                onClick={() => {
                                                    setCustomerId(c.id);
                                                    setCustomerName(c.name);
                                                    setCustomerPhone(c.phone || '');
                                                    if (c.payment_mode) setPaymentMethod(c.payment_mode);
                                                    setShowCustomerDropdown(false);
                                                    setSearchCustomer('');
                                                }}
                                                className="text-xs font-semibold text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-[#21262d] hover:text-gray-900 dark:hover:text-white p-2 rounded-lg cursor-pointer flex flex-col gap-0.5 transition-colors"
                                            >
                                                <div className="flex justify-between items-center w-full">
                                                    <span>{c.name}</span>
                                                    <span className="text-[10px] text-gray-400 dark:text-slate-500 font-mono">
                                                        {c.phone || 'No Mobile'}
                                                    </span>
                                                </div>
                                                {customerType === 'Borrow' && Number(c.outstanding_balance || c.balance || 0) > 0 && (
                                                    <div className="flex items-center gap-1 text-[9px] font-bold text-red-500 dark:text-red-400">
                                                        <span>⚠ Bakaya:</span>
                                                        <span className="font-mono">₹{Number(c.outstanding_balance || c.balance || 0).toFixed(2)}</span>
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Selected Customer Card */}
                    {customerType === 'Walk-in' ? (
                        <div className="space-y-2 bg-gray-50/70 dark:bg-[#0d101a]/70 border border-gray-200 dark:border-slate-800 p-3 rounded-xl">
                            <span className="text-[9px] font-bold text-[#0F4C3A] dark:text-emerald-400 uppercase tracking-widest block">
                                Walk-in Details
                            </span>
                            <input
                                type="text"
                                placeholder="Customer name (optional)"
                                value={customerName === 'Walk-in Customer' ? '' : customerName}
                                onChange={(e) => setCustomerName(e.target.value || 'Walk-in Customer')}
                                className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-slate-800 rounded-xl bg-gray-50 dark:bg-[#0d101a] text-gray-700 dark:text-slate-200 font-medium focus:outline-none focus:border-[#0F4C3A] dark:focus:border-emerald-500 transition-colors"
                            />
                            <input
                                type="text"
                                placeholder="Mobile number"
                                value={customerPhone}
                                onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                maxLength={10}
                                className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-slate-800 rounded-xl bg-gray-50 dark:bg-[#0d101a] text-gray-700 dark:text-slate-200 font-medium focus:outline-none focus:border-[#0F4C3A] dark:focus:border-emerald-500 transition-colors font-mono"
                            />
                        </div>
                    ) : (
                        selectedCustomerCard(customerId, customersList)
                    )}
                </div>

                {/* ─── COLUMN 2: CART ─── */}
                <div className="lg:col-span-6 flex flex-col bg-white dark:bg-[#11141f] border border-gray-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm dark:shadow-xl dark:shadow-black/20">
                    <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-[#0d101a]/50 flex-shrink-0">
                        <div className="flex items-center gap-2.5">
                            <ShoppingCartIcon className="w-4.5 h-4.5 text-[#0F4C3A] dark:text-emerald-400 stroke-[2]" />
                            <span className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-slate-300">
                                Billing Cart
                            </span>
                            {items.length > 0 && (
                                <span className="text-[10px] font-bold text-[#0F4C3A] dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/50">
                                    {items.length} Items
                                </span>
                            )}
                        </div>
                        {items.length > 0 && (
                            <button
                                onClick={handleClearCart}
                                type="button"
                                className="text-[10px] font-bold text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 flex items-center gap-1 bg-gray-100 dark:bg-[#0d101a] border border-gray-200 dark:border-slate-800 hover:border-red-300 dark:hover:border-red-800/50 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                            >
                                <TrashIcon className="w-3.5 h-3.5" /> Clear Cart
                            </button>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto" style={{ minHeight: 0 }}>
                        {items.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-slate-500 py-16">
                                <ShoppingCartIcon className="w-14 h-14 mb-4 stroke-1 text-gray-300 dark:text-slate-700/60" />
                                <p className="text-sm font-bold text-gray-500 dark:text-slate-400">Cart is empty</p>
                                <p className="text-xs text-gray-400 dark:text-slate-600 mt-1">Search products to build the bill</p>
                            </div>
                        ) : (
                            <table className="w-full text-left border-collapse text-xs">
                                <thead className="bg-gray-50/80 dark:bg-[#0d101a]/80 border-b border-gray-200 dark:border-slate-800 sticky top-0 z-10">
                                    <tr className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400">
                                        <th className="px-4 py-3 w-[38%]">Product</th>
                                        <th className="px-3 py-3 text-center w-28">Qty</th>
                                        <th className="px-3 py-3 text-right w-24">Rate</th>
                                        <th className="px-3 py-3 text-center w-20">Disc%</th>
                                        <th className="px-3 py-3 text-center w-20">GST%</th>
                                        <th className="px-3 py-3 text-right w-28">Amount</th>
                                        <th className="px-2 py-3 w-10 text-center" />
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-slate-800 bg-white/20 dark:bg-[#0d101a]/20 font-medium text-gray-700 dark:text-slate-300">
                                    {items.map((item, idx) => {
                                        const isSelectedRow = selectedCartIndex === idx;
                                        return (
                                            <tr
                                                key={idx}
                                                onClick={() => setSelectedCartIndex(idx)}
                                                className={`transition-colors cursor-pointer ${
                                                    isSelectedRow
                                                        ? 'bg-[#0F4C3A]/10 dark:bg-emerald-950/60 font-bold border-l-4 border-l-[#0F4C3A] dark:border-l-emerald-500'
                                                        : 'hover:bg-gray-50/60 dark:hover:bg-[#1a1f2e]/50'
                                                }`}
                                            >
                                                <td className="px-4 py-3">
                                                    <p className="text-xs font-bold text-gray-800 dark:text-slate-100 truncate max-w-[220px]">
                                                        {item.name}
                                                    </p>
                                                    <div className="flex items-center gap-1.5 text-[9px] font-mono text-gray-400 dark:text-slate-500">
                                                        <span>{item.barcode || '—'}</span>
                                                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">({item.unit || 'Pcs'})</span>
                                                        {item.selectedUnit && item.selectedUnit !== item.unit && (
                                                            <span className="font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-1 py-0.5 rounded">
                                                                = {item.quantity} {item.unit}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-3 py-3">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                const discrete = isDiscreteUnit(item.unit);
                                                                const current = Number(item.inputQty !== undefined ? item.inputQty : item.quantity) || 0;
                                                                let delta = 1;
                                                                if (!discrete) {
                                                                    delta = (item.selectedUnit === 'g' || item.selectedUnit === 'ml') ? 100 : 0.1;
                                                                }
                                                                const minVal = discrete ? 1 : 0.001;
                                                                const newQty = Math.max(minVal, Number((current - delta).toFixed(3)));
                                                                handleUpdateItem(idx, 'inputQty', newQty);
                                                            }}
                                                            className="h-6 w-6 rounded bg-gray-100 dark:bg-[#0d101a] hover:bg-gray-200 dark:hover:bg-slate-800 text-gray-600 dark:text-slate-300 flex items-center justify-center font-bold cursor-pointer border border-gray-200 dark:border-slate-800 transition-colors"
                                                            title="Decrease Quantity"
                                                        >
                                                            <MinusIcon className="w-3.5 h-3.5 stroke-[2.5]" />
                                                        </button>

                                                        <input
                                                            id={`cart-item-qty-${idx}`}
                                                            type="number"
                                                            step={isDiscreteUnit(item.unit) ? '1' : (item.selectedUnit === 'g' || item.selectedUnit === 'ml' ? '1' : '0.001')}
                                                            min={isDiscreteUnit(item.unit) ? '1' : '0.001'}
                                                            value={item.inputQty !== undefined ? item.inputQty : item.quantity}
                                                            onChange={(e) =>
                                                                handleUpdateItem(
                                                                    idx,
                                                                    'inputQty',
                                                                    e.target.value
                                                                )
                                                            }
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="w-14 text-center bg-gray-50 dark:bg-[#0d101a] border border-gray-200 dark:border-slate-800 py-1 rounded text-xs font-bold text-gray-800 dark:text-slate-100 font-mono focus:outline-none focus:border-[#0F4C3A] dark:focus:border-emerald-500"
                                                        />

                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                const discrete = isDiscreteUnit(item.unit);
                                                                const current = Number(item.inputQty !== undefined ? item.inputQty : item.quantity) || 0;
                                                                let delta = 1;
                                                                if (!discrete) {
                                                                    delta = (item.selectedUnit === 'g' || item.selectedUnit === 'ml') ? 100 : 0.1;
                                                                }
                                                                const newQty = Number((current + delta).toFixed(3));
                                                                handleUpdateItem(idx, 'inputQty', newQty);
                                                            }}
                                                            className="h-6 w-6 rounded bg-gray-100 dark:bg-[#0d101a] hover:bg-gray-200 dark:hover:bg-slate-800 text-gray-600 dark:text-slate-300 flex items-center justify-center font-bold cursor-pointer border border-gray-200 dark:border-slate-800 transition-colors"
                                                            title="Increase Quantity"
                                                        >
                                                            <PlusIcon className="w-3.5 h-3.5 stroke-[2.5]" />
                                                        </button>

                                                        {/* Unit Selector Toggle dropdown (e.g. Kg vs g, Litre vs ml) */}
                                                        {((item.unit || '').toLowerCase() === 'kg' || (item.unit || '').toLowerCase() === 'kilogram' || (item.unit || '').toLowerCase() === 'grams' || (item.unit || '').toLowerCase() === 'g') ? (
                                                            <select
                                                                value={item.selectedUnit || 'Kg'}
                                                                onChange={(e) => handleUpdateItem(idx, 'selectedUnit', e.target.value)}
                                                                onClick={(e) => e.stopPropagation()}
                                                                className="text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded px-1 py-1 outline-none cursor-pointer ml-1"
                                                            >
                                                                <option value="Kg">Kg</option>
                                                                <option value="g">g (Grams)</option>
                                                            </select>
                                                        ) : ((item.unit || '').toLowerCase() === 'litre' || (item.unit || '').toLowerCase() === 'l' || (item.unit || '').toLowerCase() === 'ml') ? (
                                                            <select
                                                                value={item.selectedUnit || 'Litre'}
                                                                onChange={(e) => handleUpdateItem(idx, 'selectedUnit', e.target.value)}
                                                                onClick={(e) => e.stopPropagation()}
                                                                className="text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded px-1 py-1 outline-none cursor-pointer ml-1"
                                                            >
                                                                <option value="Litre">L (Litre)</option>
                                                                <option value="ml">ml</option>
                                                            </select>
                                                        ) : (
                                                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 ml-1">
                                                                {item.unit || 'Pcs'}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                            <td className="px-3 py-3 text-right font-mono text-gray-700 dark:text-slate-200">
                                                ₹{Number(item.price).toFixed(2)}
                                            </td>
                                            <td className="px-3 py-3">
                                                <input
                                                    type="number"
                                                    value={item.discount}
                                                    min="0"
                                                    max="100"
                                                    onChange={(e) =>
                                                        handleUpdateItem(
                                                            idx,
                                                            'discount',
                                                            Math.min(100, Math.max(0, Number(e.target.value) || 0))
                                                        )
                                                    }
                                                    className="w-12 text-center bg-gray-50 dark:bg-[#0d101a] border border-gray-200 dark:border-slate-800 py-0.5 rounded text-xs font-semibold text-gray-700 dark:text-slate-200 font-mono focus:outline-none focus:border-[#0F4C3A] dark:focus:border-emerald-500"
                                                />
                                            </td>
                                            <td className="px-3 py-3 text-center text-gray-500 dark:text-slate-400 font-mono">
                                                {item.gst}%
                                            </td>
                                            <td className="px-3 py-3 text-right font-bold font-mono text-gray-800 dark:text-slate-100">
                                                ₹{Number(item.total).toFixed(2)}
                                            </td>
                                            <td className="px-2 py-3 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveItem(idx)}
                                                    className="text-red-400 dark:text-red-500 hover:text-red-600 dark:hover:text-red-400 p-1 rounded hover:bg-gray-100 dark:hover:bg-[#0d101a] transition-all cursor-pointer"
                                                >
                                                    <TrashIcon className="w-3.5 h-3.5" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                {/* ─── COLUMN 3: SUMMARY & CHECKOUT ─── */}
                <div className="lg:col-span-3 flex flex-col h-full overflow-hidden bg-white dark:bg-[#11141f] border border-gray-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm dark:shadow-xl dark:shadow-black/20">
                    <div className="flex-1 overflow-y-auto pr-1 space-y-4">
                        <div>
                            <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 flex items-center gap-2 border-b border-gray-200 dark:border-slate-800 pb-2.5">
                                <DocumentArrowDownIcon className="w-4 h-4 text-[#0F4C3A] dark:text-emerald-400" /> Summary
                            </h3>
                        </div>

                        <div className="space-y-2 text-xs font-medium text-gray-700 dark:text-slate-300">
                            <div className="flex justify-between bg-gray-50 dark:bg-[#0d101a] border border-gray-200 dark:border-slate-800 p-2.5 rounded-xl">
                                <span className="text-gray-500 dark:text-slate-400">Subtotal</span>
                                <span className="font-mono text-gray-800 dark:text-slate-200">₹{subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between bg-gray-50 dark:bg-[#0d101a] border border-gray-200 dark:border-slate-800 p-2.5 rounded-xl">
                                <span className="text-gray-500 dark:text-slate-400">Item Discount</span>
                                <span className="font-mono text-red-500 dark:text-red-400">-₹{totalItemDiscount.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between bg-gray-50 dark:bg-[#0d101a] border border-gray-200 dark:border-slate-800 p-2.5 rounded-xl">
                                <span className="text-gray-500 dark:text-slate-400">GST</span>
                                <span className="font-mono text-gray-800 dark:text-slate-200">₹{totalGst.toFixed(2)}</span>
                            </div>

                            <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 rounded-xl p-3 flex justify-between items-center text-sm font-bold text-emerald-700 dark:text-emerald-300 shadow-inner">
                                <span>Grand Total</span>
                                <span className="font-mono text-lg text-emerald-800 dark:text-white">₹{grandTotal.toFixed(2)}</span>
                            </div>

                            {/* ── Previous Balance (Bakaya) for Borrow Customers ── */}
                            {customerType === 'Borrow' && customerId && customerId !== 1 && (() => {
                                const selectedCust = customersList.find(c => c.id === customerId);
                                const prevBal = Number(selectedCust?.outstanding_balance || selectedCust?.balance || 0);
                                if (prevBal <= 0) return null;
                                return (
                                    <>
                                        <div className="flex justify-between bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/40 p-2.5 rounded-xl">
                                            <span className="text-red-500 dark:text-red-400 font-semibold text-[11px]">⚠ Pichla Bakaya</span>
                                            <span className="font-mono text-red-600 dark:text-red-300 font-bold">₹{prevBal.toFixed(2)}</span>
                                        </div>
                                        <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-300 dark:border-orange-800/40 rounded-xl p-3 flex justify-between items-center text-sm font-bold text-orange-700 dark:text-orange-300 shadow-inner">
                                            <span className="text-[11px]">Total Outstanding</span>
                                            <span className="font-mono text-lg text-orange-800 dark:text-orange-200">₹{(grandTotal + prevBal).toFixed(2)}</span>
                                        </div>
                                    </>
                                );
                            })()}
                        </div>

                        {/* Payment & Split Allocation Section (Redesigned for Crystal Clear Cash vs Digital Breakdown) */}
                        <div className="space-y-3" ref={paymentSectionRef}>
                            <div className="flex items-center justify-between border-b border-gray-200 dark:border-slate-800 pb-2">
                                <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                    <CreditCardIcon className="w-4 h-4 text-[#0F4C3A] dark:text-emerald-400" /> Payment Breakdown
                                    <span className="text-[9px] font-mono bg-slate-100 dark:bg-[#0d101a] border border-slate-200 dark:border-slate-800 px-1.5 py-0.5 rounded text-slate-500 font-bold">F6</span>
                                </h3>
                                <div className="flex items-center gap-1.5">
                                    {customerType === 'Borrow' && (
                                        <button
                                            type="button"
                                            onClick={() => setPaymentRows([{ id: 1, paymentMethod: 'Credit / Udhaar', amount: 0 }])}
                                            className="flex items-center gap-1 text-[10px] font-black text-amber-800 dark:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-1 rounded-lg border border-amber-500/30 transition-all cursor-pointer shadow-xs active:scale-95"
                                            title="Mark 100% of bill as Udhaar Credit"
                                        >
                                            🤝 Full Udhaar
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={handleAddPaymentRow}
                                        className="flex items-center gap-1 text-[10px] font-black text-[#0F4C3A] dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-300 dark:border-emerald-700 transition-all cursor-pointer shadow-xs active:scale-95"
                                    >
                                        <PlusIcon className="w-3.5 h-3.5" /> + Split Mode
                                    </button>
                                </div>
                            </div>

                            {/* Itemized Payment Rows */}
                            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                                {paymentRows.map((row, idx) => {
                                    const isCash = row.paymentMethod === 'Cash';
                                    const isUpi = row.paymentMethod === 'UPI';
                                    const isCard = row.paymentMethod.includes('Card');
                                    const isBorrow = row.paymentMethod.includes('Udhaar');
                                    
                                    return (
                                        <div
                                            key={row.id}
                                            className={`p-2.5 rounded-xl border transition-all ${
                                                isBorrow
                                                    ? 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/50'
                                                    : isCash
                                                    ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50'
                                                    : isUpi
                                                    ? 'bg-indigo-50/60 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800/50'
                                                    : isCard
                                                    ? 'bg-blue-50/60 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/50'
                                                    : 'bg-slate-50 dark:bg-[#0d101a] border-slate-200 dark:border-slate-800'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between gap-2 mb-1.5">
                                                <div className="flex items-center gap-1.5 flex-1">
                                                    <span className="text-xs font-black text-slate-500">#{idx + 1}</span>
                                                    <select
                                                        value={row.paymentMethod}
                                                        onChange={(e) => handlePaymentRowChange(row.id, 'paymentMethod', e.target.value)}
                                                        className="w-full px-2 py-1.5 text-xs font-black border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-[#121824] text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-[#0F4C3A]"
                                                    >
                                                        <option value="Cash">💵 Cash</option>
                                                        <option value="UPI">📱 UPI / QR Code (GPay / PhonePe / Paytm)</option>
                                                        <option value="Credit/Debit Card">💳 Credit / Debit Card</option>
                                                        <option value="Bank Transfer">🏦 Bank Transfer / NEFT</option>
                                                        <option value="Wallet">👛 Mobile Wallet</option>
                                                        <option value="Cheque">📄 Cheque</option>
                                                        <option value="Gift Voucher">🎁 Gift Voucher</option>
                                                        <option value="Store Credit">🏷️ Store Credit</option>
                                                        {customerType === 'Borrow' && (
                                                            <option value="Credit / Udhaar">🤝 Credit / Udhaar (Borrow Ledger)</option>
                                                        )}
                                                    </select>
                                                </div>

                                                <div className="relative w-32">
                                                    <span className="absolute left-2.5 top-1.5 text-xs font-black text-slate-400">₹</span>
                                                    <input
                                                        type="number"
                                                        value={row.amount}
                                                        onChange={(e) => handlePaymentRowChange(row.id, 'amount', e.target.value)}
                                                        placeholder="0.00"
                                                        className="w-full pl-6 pr-2 py-1 text-xs font-mono font-black text-right border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-[#121824] text-slate-900 dark:text-white focus:ring-2 focus:ring-[#0F4C3A]"
                                                    />
                                                </div>

                                                {paymentRows.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemovePaymentRow(row.id)}
                                                        className="p-1.5 text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/60 rounded-lg transition-colors"
                                                        title="Remove Payment Row"
                                                    >
                                                        <TrashIcon className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                            </div>

                                            {/* Quick Cash Presets if Cash */}
                                            {isCash && (
                                                <div className="flex items-center gap-1.5 pt-1">
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase">Quick Cash:</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => handlePaymentRowChange(row.id, 'amount', grandTotal)}
                                                        className="px-1.5 py-0.5 bg-white dark:bg-[#121824] border border-slate-300 dark:border-slate-700 rounded text-[9px] font-extrabold hover:bg-emerald-100 dark:hover:bg-emerald-950 text-slate-700 dark:text-slate-300"
                                                    >
                                                        Exact (₹{grandTotal})
                                                    </button>
                                                    {[100, 200, 500, 2000].map(val => (
                                                        <button
                                                            key={val}
                                                            type="button"
                                                            onClick={() => handlePaymentRowChange(row.id, 'amount', val)}
                                                            className="px-1.5 py-0.5 bg-white dark:bg-[#121824] border border-slate-300 dark:border-slate-700 rounded text-[9px] font-bold hover:bg-emerald-100 dark:hover:bg-emerald-950 text-slate-600 dark:text-slate-400"
                                                        >
                                                            ₹{val}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Reference / Txn No for Non-Cash */}
                                            {!isCash && (
                                                <input
                                                    type="text"
                                                    value={row.referenceNo || ''}
                                                    onChange={(e) => handlePaymentRowChange(row.id, 'referenceNo', e.target.value)}
                                                    placeholder="Enter UTR / Approval / Txn Ref #"
                                                    className="w-full px-2 py-1 text-[10px] font-mono border border-slate-200 dark:border-slate-800 rounded-md bg-white dark:bg-[#121824] text-slate-700 dark:text-slate-300"
                                                />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* VISUAL DASHBOARD SUMMARY: CLEAR CASH vs ONLINE BREAKDOWN */}
                            <div className="p-3 bg-slate-50 dark:bg-[#0d101a] border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
                                <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Payment Mode Breakdown Summary</div>
                                
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300">
                                        <div className="text-[9px] font-bold uppercase text-emerald-600 dark:text-emerald-400">💵 Cash Paid</div>
                                        <div className="text-sm font-black font-mono">₹{totalCashEntered.toFixed(2)}</div>
                                    </div>
                                    <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-800 dark:text-indigo-300">
                                        <div className="text-[9px] font-bold uppercase text-indigo-600 dark:text-indigo-400">💳 Online / Digital Paid</div>
                                        <div className="text-sm font-black font-mono">₹{totalNonCashEntered.toFixed(2)}</div>
                                    </div>
                                </div>

                                {changeAmount > 0 && (
                                    <div className="p-2.5 rounded-xl bg-emerald-500 text-white font-extrabold flex justify-between items-center shadow-md animate-pulse">
                                        <span className="text-xs uppercase tracking-wider">🪙 Change to Return:</span>
                                        <span className="font-mono text-base">₹{changeAmount.toFixed(2)}</span>
                                    </div>
                                )}

                                {remainingBalance > 0 && (
                                    <div className="p-2.5 rounded-xl bg-rose-500 text-white font-extrabold flex justify-between items-center shadow-md">
                                        <span className="text-xs uppercase tracking-wider">⚠️ Unpaid Balance:</span>
                                        <span className="font-mono text-base">₹{remainingBalance.toFixed(2)}</span>
                                    </div>
                                )}
                            </div>

                            {/* DEDICATED BORROW / UDHAAR SETTLEMENT PANEL */}
                            {customerType === 'Borrow' && (
                                <div className="p-3.5 bg-amber-500/10 dark:bg-amber-950/40 border border-amber-500/30 dark:border-amber-700/60 rounded-2xl space-y-3">
                                    <div className="flex items-center justify-between border-b border-amber-500/20 pb-2">
                                        <div className="flex items-center gap-2">
                                            <div className="p-1.5 bg-amber-600 text-white rounded-lg font-black text-xs">
                                                🤝 UDHAAR
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-black text-amber-900 dark:text-amber-200 uppercase tracking-wider">
                                                    Borrow Credit Settlement
                                                </h4>
                                                <p className="text-[10px] font-semibold text-amber-700 dark:text-amber-400">
                                                    Customer: {customerName || 'No profile selected'}
                                                </p>
                                            </div>
                                        </div>
                                        <span className="px-2 py-0.5 bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30 rounded text-[9px] font-black uppercase">
                                            Udhaar Billing Active
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div className="p-2 bg-white dark:bg-[#121824] border border-amber-300 dark:border-amber-800/60 rounded-xl">
                                            <span className="text-[9px] font-bold text-slate-400 uppercase block">Grand Total</span>
                                            <span className="font-mono text-sm font-black text-slate-800 dark:text-slate-100">₹{grandTotal.toFixed(2)}</span>
                                        </div>
                                        <div className="p-2 bg-white dark:bg-[#121824] border border-amber-300 dark:border-amber-800/60 rounded-xl">
                                            <span className="text-[9px] font-bold text-rose-500 uppercase block">Udhaar Dues</span>
                                            <span className="font-mono text-sm font-black text-rose-600 dark:text-rose-400">₹{remainingBalance.toFixed(2)}</span>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black uppercase text-amber-900 dark:text-amber-200 tracking-wider block">
                                            Repayment Due Date *
                                        </label>
                                        <input
                                            type="date"
                                            value={dueDate}
                                            onChange={(e) => setDueDate(e.target.value)}
                                            className="w-full px-3 py-2 border border-amber-300 dark:border-amber-700 rounded-xl bg-white dark:bg-[#0d101a] text-amber-900 dark:text-amber-100 font-bold text-center cursor-pointer text-xs focus:ring-2 focus:ring-amber-500"
                                        />
                                    </div>

                                    {!customerId || customerId === 1 ? (
                                        <p className="text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 p-2 rounded-xl border border-rose-500/20">
                                            ⚠️ Please select or register a Borrow Customer profile from top panel before completing sale.
                                        </p>
                                    ) : (
                                        <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 p-2 rounded-xl border border-emerald-500/20 flex items-center gap-1.5">
                                            <span>✅</span> Bill will automatically record <strong>₹{remainingBalance.toFixed(2)}</strong> credit in <strong>{customerName}</strong>'s Borrow Ledger.
                                        </p>
                                    )}
                                </div>
                            )}

                            {customerType !== 'Borrow' && remainingBalance > 0 && (
                                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-700/60 rounded-xl text-xs space-y-1">
                                    <p className="text-[10px] font-bold text-rose-700 dark:text-rose-300">
                                        ⚠️ Unpaid balance of ₹{remainingBalance.toFixed(2)} requires switching to a Borrow Customer profile before billing.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex-shrink-0 pt-3 border-t border-gray-200 dark:border-slate-800 space-y-2 mt-2">
                        <button
                            onClick={handleSubmit}
                            type="button"
                            className="w-full flex items-center justify-center gap-2.5 py-3.5 bg-[#0F4C3A] hover:bg-[#1a6b4f] text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm shadow-emerald-200 dark:shadow-emerald-900/30 active:scale-[0.98] transition-all cursor-pointer"
                        >
                            <CheckCircleIcon className="w-4 h-4 stroke-[3]" />
                            Complete Sale <span className="text-[9px] font-mono opacity-60">(F8)</span>
                        </button>
                        <button
                            onClick={onCancel}
                            type="button"
                            className="w-full py-2.5 bg-gray-100 dark:bg-[#0d101a] hover:bg-gray-200 dark:hover:bg-slate-800/60 text-gray-600 dark:text-slate-400 hover:text-gray-800 dark:hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer border border-gray-200 dark:border-slate-800"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>

            {/* ─── ADD CUSTOMER MODAL ─── */}
            <AnimatePresence>
                {showAddCustomerModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/30 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-[99999] p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 10 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 10 }}
                            className="bg-white dark:bg-[#141825] border border-gray-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-xl dark:shadow-2xl dark:shadow-black/60 relative font-sans text-xs"
                        >
                            <button
                                onClick={() => setShowAddCustomerModal(false)}
                                className="absolute right-4 top-4 text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-white transition-colors cursor-pointer"
                            >
                                <XMarkIcon className="w-5 h-5" />
                            </button>

                            <div>
                                <h2 className="text-sm font-bold text-gray-800 dark:text-slate-100 flex items-center gap-2 uppercase tracking-wide">
                                    <UserPlusIcon className="w-5 h-5 text-[#0F4C3A] dark:text-emerald-400" /> Register Customer
                                </h2>
                                <p className="text-[10px] text-gray-500 dark:text-slate-400 font-medium mt-0.5">
                                    Creates a new customer profile in the ledger
                                </p>
                            </div>

                            <form onSubmit={handleAddNewCustomerSubmit} className="space-y-3">
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase mb-1">
                                        Customer Type
                                    </label>
                                    <div className="grid grid-cols-2 gap-1 p-1 bg-gray-100 dark:bg-[#0d101a] border border-gray-200 dark:border-slate-800 rounded-xl">
                                        <button
                                            type="button"
                                            onClick={() => setNewCustType('Walk-in')}
                                            className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                                                newCustType === 'Walk-in'
                                                    ? 'bg-[#0F4C3A] text-white shadow-sm shadow-emerald-200 dark:shadow-emerald-900/30'
                                                    : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
                                            }`}
                                        >
                                            Walk-in
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setNewCustType('Borrow')}
                                            className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                                                newCustType === 'Borrow'
                                                    ? 'bg-[#0F4C3A] text-white shadow-sm shadow-emerald-200 dark:shadow-emerald-900/30'
                                                    : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
                                            }`}
                                        >
                                            Borrow
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase mb-1">
                                        Full Name *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={newCustName}
                                        onChange={(e) => setNewCustName(e.target.value)}
                                        placeholder="Name"
                                        className="w-full px-3 py-2 border border-gray-200 dark:border-slate-800 rounded-xl bg-gray-50 dark:bg-[#0d101a] text-gray-700 dark:text-slate-200 font-medium focus:outline-none focus:border-[#0F4C3A] dark:focus:border-emerald-500 transition-colors"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase mb-1">
                                        Mobile Number *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={newCustPhone}
                                        onChange={(e) => setNewCustPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                        maxLength={10}
                                        placeholder="Mobile Number"
                                        className="w-full px-3 py-2 border border-gray-200 dark:border-slate-800 rounded-xl bg-gray-50 dark:bg-[#0d101a] text-gray-700 dark:text-slate-200 font-medium focus:outline-none focus:border-[#0F4C3A] dark:focus:border-emerald-500 transition-colors font-mono"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase mb-1">
                                        Address
                                    </label>
                                    <input
                                        type="text"
                                        value={newCustAddress}
                                        onChange={(e) => setNewCustAddress(e.target.value)}
                                        placeholder="Address"
                                        className="w-full px-3 py-2 border border-gray-200 dark:border-slate-800 rounded-xl bg-gray-50 dark:bg-[#0d101a] text-gray-700 dark:text-slate-200 font-medium focus:outline-none focus:border-[#0F4C3A] dark:focus:border-emerald-500 transition-colors"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase mb-1">
                                        Payment Mode
                                    </label>
                                    <select
                                        value={newCustPaymentMode}
                                        onChange={(e) => setNewCustPaymentMode(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-200 dark:border-slate-800 rounded-xl bg-gray-50 dark:bg-[#0d101a] text-gray-700 dark:text-slate-200 font-medium focus:outline-none focus:border-[#0F4C3A] dark:focus:border-emerald-500 transition-colors"
                                    >
                                        <option value="Cash">Cash</option>
                                        <option value="UPI">UPI</option>
                                        <option value="Card">Card</option>
                                        <option value="Bank Transfer">Bank Transfer</option>
                                        <option value="Credit/Borrow">Credit/Borrow</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase mb-1">
                                        Notes (optional)
                                    </label>
                                    <textarea
                                        rows="2"
                                        value={newCustNotes}
                                        onChange={(e) => setNewCustNotes(e.target.value)}
                                        placeholder="Additional notes..."
                                        className="w-full px-3 py-2 border border-gray-200 dark:border-slate-800 rounded-xl bg-gray-50 dark:bg-[#0d101a] text-gray-700 dark:text-slate-200 font-medium focus:outline-none focus:border-[#0F4C3A] dark:focus:border-emerald-500 transition-colors resize-none"
                                    />
                                </div>

                                <div className="flex justify-end gap-2 pt-2 border-t border-gray-200 dark:border-slate-800">
                                    <button
                                        type="button"
                                        onClick={() => setShowAddCustomerModal(false)}
                                        className="px-4 py-2 bg-gray-100 dark:bg-[#0d101a] hover:bg-gray-200 dark:hover:bg-slate-800/60 text-gray-600 dark:text-slate-400 hover:text-gray-800 dark:hover:text-white font-bold rounded-xl cursor-pointer border border-gray-200 dark:border-slate-800 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-[#0F4C3A] hover:bg-[#1a6b4f] text-white font-bold rounded-xl cursor-pointer shadow-sm shadow-emerald-200 dark:shadow-emerald-900/30 transition-all"
                                    >
                                        Save Profile
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ─── KEYBOARD SHORTCUTS HELP MODAL (Alt + /) ─── */}
            <AnimatePresence>
                {showShortcutsHelpModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50"
                        onClick={() => setShowShortcutsHelpModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white dark:bg-[#111422] border border-gray-200 dark:border-slate-800 rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-5"
                        >
                            <div className="flex items-center justify-between border-b border-gray-200 dark:border-slate-800 pb-3.5">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl border border-emerald-500/20">
                                        <CommandLineIcon className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-black text-slate-900 dark:text-white">
                                            POS Keyboard Shortcuts Guide
                                        </h2>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            Ultra-fast cashier billing shortcuts (Tally / Retail ERP Standard)
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowShortcutsHelpModal(false)}
                                    className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                >
                                    <XMarkIcon className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto pr-1 text-xs">
                                {/* Category 1: Navigation & Focus */}
                                <div className="p-3.5 bg-slate-50 dark:bg-[#0d101a] border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2.5">
                                    <h3 className="font-black uppercase text-[10px] tracking-wider text-emerald-600 dark:text-emerald-400">
                                        🚀 Navigation & Search Focus
                                    </h3>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-600 dark:text-slate-300 font-medium">Search Product Box</span>
                                            <kbd className="px-2 py-1 bg-white dark:bg-[#1a2030] border border-slate-300 dark:border-slate-700 rounded-lg font-mono font-bold text-slate-800 dark:text-slate-200">F3 / Ctrl+F</kbd>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-600 dark:text-slate-300 font-medium">Customer Profile Search</span>
                                            <kbd className="px-2 py-1 bg-white dark:bg-[#1a2030] border border-slate-300 dark:border-slate-700 rounded-lg font-mono font-bold text-slate-800 dark:text-slate-200">F2</kbd>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-600 dark:text-slate-300 font-medium">Focus Global Discount</span>
                                            <kbd className="px-2 py-1 bg-white dark:bg-[#1a2030] border border-slate-300 dark:border-slate-700 rounded-lg font-mono font-bold text-slate-800 dark:text-slate-200">F5</kbd>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-600 dark:text-slate-300 font-medium">Jump to Payment Breakdown</span>
                                            <kbd className="px-2 py-1 bg-white dark:bg-[#1a2030] border border-slate-300 dark:border-slate-700 rounded-lg font-mono font-bold text-slate-800 dark:text-slate-200">F6</kbd>
                                        </div>
                                    </div>
                                </div>

                                {/* Category 2: Cart Operations */}
                                <div className="p-3.5 bg-slate-50 dark:bg-[#0d101a] border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2.5">
                                    <h3 className="font-black uppercase text-[10px] tracking-wider text-indigo-600 dark:text-indigo-400">
                                        🛒 Cart & Line Items
                                    </h3>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-600 dark:text-slate-300 font-medium">Edit Item Quantity</span>
                                            <kbd className="px-2 py-1 bg-white dark:bg-[#1a2030] border border-slate-300 dark:border-slate-700 rounded-lg font-mono font-bold text-slate-800 dark:text-slate-200">F4</kbd>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-600 dark:text-slate-300 font-medium">Navigate Search / Cart Items</span>
                                            <kbd className="px-2 py-1 bg-white dark:bg-[#1a2030] border border-slate-300 dark:border-slate-700 rounded-lg font-mono font-bold text-slate-800 dark:text-slate-200">↑ / ↓ Arrows</kbd>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-600 dark:text-slate-300 font-medium">Select Product from Dropdown</span>
                                            <kbd className="px-2 py-1 bg-white dark:bg-[#1a2030] border border-slate-300 dark:border-slate-700 rounded-lg font-mono font-bold text-slate-800 dark:text-slate-200">Enter</kbd>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-600 dark:text-slate-300 font-medium">Delete Active Cart Line</span>
                                            <kbd className="px-2 py-1 bg-white dark:bg-[#1a2030] border border-slate-300 dark:border-slate-700 rounded-lg font-mono font-bold text-slate-800 dark:text-slate-200">Delete</kbd>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-600 dark:text-slate-300 font-medium">Start New Bill / Clear Cart</span>
                                            <kbd className="px-2 py-1 bg-white dark:bg-[#1a2030] border border-slate-300 dark:border-slate-700 rounded-lg font-mono font-bold text-slate-800 dark:text-slate-200">F11</kbd>
                                        </div>
                                    </div>
                                </div>

                                {/* Category 3: Payment & Checkout */}
                                <div className="p-3.5 bg-slate-50 dark:bg-[#0d101a] border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2.5">
                                    <h3 className="font-black uppercase text-[10px] tracking-wider text-rose-600 dark:text-rose-400">
                                        💳 Settlement & Checkout
                                    </h3>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-600 dark:text-slate-300 font-medium">Complete Sale Checkout</span>
                                            <kbd className="px-2 py-1 bg-white dark:bg-[#1a2030] border border-slate-300 dark:border-slate-700 rounded-lg font-mono font-bold text-slate-800 dark:text-slate-200">F8 / F10 / F12</kbd>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-600 dark:text-slate-300 font-medium">Hold / Save Draft Bill</span>
                                            <kbd className="px-2 py-1 bg-white dark:bg-[#1a2030] border border-slate-300 dark:border-slate-700 rounded-lg font-mono font-bold text-slate-800 dark:text-slate-200">F7 / Ctrl+S</kbd>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-600 dark:text-slate-300 font-medium">Print Invoice Receipt</span>
                                            <kbd className="px-2 py-1 bg-white dark:bg-[#1a2030] border border-slate-300 dark:border-slate-700 rounded-lg font-mono font-bold text-slate-800 dark:text-slate-200">F9 / Ctrl+P</kbd>
                                        </div>
                                    </div>
                                </div>

                                {/* Category 4: Customer & Dialogs */}
                                <div className="p-3.5 bg-slate-50 dark:bg-[#0d101a] border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2.5">
                                    <h3 className="font-black uppercase text-[10px] tracking-wider text-amber-600 dark:text-amber-400">
                                        👤 Customer & Modals
                                    </h3>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-600 dark:text-slate-300 font-medium">Register New Customer</span>
                                            <kbd className="px-2 py-1 bg-white dark:bg-[#1a2030] border border-slate-300 dark:border-slate-700 rounded-lg font-mono font-bold text-slate-800 dark:text-slate-200">Ctrl + N</kbd>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-600 dark:text-slate-300 font-medium">Close Active Dialog</span>
                                            <kbd className="px-2 py-1 bg-white dark:bg-[#1a2030] border border-slate-300 dark:border-slate-700 rounded-lg font-mono font-bold text-slate-800 dark:text-slate-200">Esc</kbd>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-600 dark:text-slate-300 font-medium">Shortcuts Help Guide</span>
                                            <kbd className="px-2 py-1 bg-white dark:bg-[#1a2030] border border-slate-300 dark:border-slate-700 rounded-lg font-mono font-bold text-slate-800 dark:text-slate-200">Alt + /</kbd>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-gray-200 dark:border-slate-800 pt-3 text-center text-[10px] text-slate-400 font-semibold">
                                Press <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-mono font-bold text-slate-700 dark:text-slate-300">Esc</kbd> or click anywhere outside to close this shortcuts guide.
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ─── PRINT TEMPLATE ─── */}
            <div style={{ display: 'none' }}>
                <div ref={printRef} style={{ width: '100%' }}>
                    <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                            {storeInfo.name}
                        </h2>
                        <p>{storeInfo.address}</p>
                        <p>Ph: {storeInfo.phone} | GSTIN: {storeInfo.gstin}</p>
                    </div>
                    <hr style={{ margin: '15px 0' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                        <div>
                            <p>
                                <strong>INVOICE NO:</strong> {invoiceNumber}
                            </p>
                            <p>
                                <strong>DATE:</strong> {billDate}
                            </p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <p>
                                <strong>CUSTOMER:</strong> {customerName}
                            </p>
                            <p>
                                <strong>PAYMENT:</strong> {paymentMethod}{' '}
                                ({paymentMethod === 'Credit/Borrow' ? 'Credit' : 'Paid'})
                            </p>
                        </div>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                        <thead>
                            <tr style={{ background: '#f1f5f9' }}>
                                <th style={{ padding: '8px 10px', textAlign: 'left' }}>Item</th>
                                <th style={{ padding: '8px 10px', textAlign: 'center' }}>Qty</th>
                                <th style={{ padding: '8px 10px', textAlign: 'right' }}>Price</th>
                                <th style={{ padding: '8px 10px', textAlign: 'right' }}>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item, idx) => (
                                <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                    <td style={{ padding: '8px 10px' }}>{item.name}</td>
                                    <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                                        {item.quantity}
                                    </td>
                                    <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                                        ₹{Number(item.price).toFixed(2)}
                                    </td>
                                    <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                                        ₹{Number(item.total).toFixed(2)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                        <div style={{ width: '250px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                                <span>Subtotal:</span>
                                <span>₹{subtotal.toFixed(2)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                                <span>Discounts:</span>
                                <span>-₹{discountAmount.toFixed(2)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                                <span>GST:</span>
                                <span>₹{totalGst.toFixed(2)}</span>
                            </div>
                            <hr style={{ margin: '8px 0' }} />
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    fontSize: '15px',
                                    fontWeight: 'bold',
                                }}
                            >
                                <span>Total Amount:</span>
                                <span>₹{grandTotal.toFixed(2)}</span>
                            </div>

                            {/* Split Payment Print Breakdown */}
                            <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px dashed #cbd5e1', fontSize: '11px' }}>
                                <div style={{ fontWeight: 'bold', marginBottom: '4px', textTransform: 'uppercase', fontSize: '10px', color: '#64748b' }}>
                                    Payment Breakdown:
                                </div>
                                {paymentRows.map((pm, i) => (
                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                                        <span>{pm.paymentMethod}{pm.referenceNo ? ` (${pm.referenceNo})` : ''}:</span>
                                        <span>₹{Number(pm.amount || 0).toFixed(2)}</span>
                                    </div>
                                ))}
                                {changeAmount > 0 && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', color: '#0F4C3A', fontWeight: 'bold' }}>
                                        <span>Change Returned:</span>
                                        <span>₹{changeAmount.toFixed(2)}</span>
                                    </div>
                                )}
                                {remainingBalance > 0 && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', color: '#dc2626', fontWeight: 'bold' }}>
                                        <span>Remaining Balance / Credit:</span>
                                        <span>₹{remainingBalance.toFixed(2)}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <div style={{ marginTop: '30px', textAlign: 'center', fontSize: '10px', color: '#94a3b8' }}>
                        <p>Thank you for shopping with us!</p>
                        <p>This is a system-generated statement.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ─── Customer Profile Card ───
const selectedCustomerCard = (customerId, list) => {
    const match = list.find((c) => c.id === customerId);
    if (!match) {
        return (
            <div className="bg-gray-50 dark:bg-[#0d101a] border border-gray-200 dark:border-slate-800 p-3 rounded-xl text-[11px] text-gray-400 dark:text-slate-500 font-medium italic text-center">
                No borrow profile selected. Search or add one.
            </div>
        );
    }

    const prevBalance = Number(match.outstanding_balance || match.balance || 0);

    return (
        <div className="bg-gray-50 dark:bg-[#0d101a] border border-gray-200 dark:border-slate-800 p-3 rounded-xl text-xs font-medium text-gray-700 dark:text-slate-300 space-y-1.5">
            <div className="flex justify-between items-center mb-0.5">
                <span className="text-[9px] font-bold text-[#0F4C3A] dark:text-emerald-400 uppercase tracking-widest">
                    Active Profile
                </span>
                <span className="text-[8px] bg-emerald-50 dark:bg-emerald-950/40 text-[#0F4C3A] dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                    {match.customer_code || 'CUST'}
                </span>
            </div>
            <div>
                Name: <span className="text-gray-900 dark:text-white font-bold">{match.name}</span>
            </div>
            <div>
                Mobile: <span className="text-gray-800 dark:text-slate-200 font-mono">{match.phone || '—'}</span>
            </div>
            <div>
                Payment: <span className="text-gray-800 dark:text-slate-200">{match.payment_mode || 'Cash'}</span>
            </div>
            {match.address && (
                <div>
                    Address: <span className="text-gray-500 dark:text-slate-400">{match.address}</span>
                </div>
            )}
            {match.notes && (
                <div>
                    Notes: <span className="text-gray-500 dark:text-slate-400 italic">{match.notes}</span>
                </div>
            )}
            {/* ── Previous Outstanding Balance (Bakaya) ── */}
            {match.customer_type === 'Borrow' && (
                <div className={`mt-1.5 flex justify-between items-center p-2 rounded-lg border ${
                    prevBalance > 0
                        ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800/50'
                        : 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800/50'
                }`}>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${
                        prevBalance > 0
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-green-600 dark:text-green-400'
                    }`}>
                        {prevBalance > 0 ? '⚠ Pichla Bakaya' : '✓ No Dues'}
                    </span>
                    <span className={`font-mono font-bold text-sm ${
                        prevBalance > 0
                            ? 'text-red-700 dark:text-red-300'
                            : 'text-green-700 dark:text-green-300'
                    }`}>
                        ₹{prevBalance.toFixed(2)}
                    </span>
                </div>
            )}
        </div>
    );
};

export default SalesForm;