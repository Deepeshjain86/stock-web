import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UserGroupIcon, 
  UserPlusIcon, 
  PencilIcon, 
  ShieldCheckIcon, 
  EnvelopeIcon, 
  LockClosedIcon,
  UserIcon,
  PhoneIcon,
  XMarkIcon,
  CheckCircleIcon,
  NoSymbolIcon
} from '@heroicons/react/24/outline';
import { usersAPI } from '../../services/api';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { showToast } from '../../store/slices/notificationSlice';
import Modal from '../../components/common/Modal';
import { validateEmailField } from '../../utils/validators';

import StatsCard from '../../components/common/StatsCard';

const PERMISSION_LABELS = {
  'view_dashboard': { label: 'View Dashboard Analytics', desc: 'Access high-level sales and inventory dashboard charts.' },
  'view_reports': { label: 'View Financial & Stock Reports', desc: 'Inspect financial statements, products ledger, and P&L logs.' },
  'export_reports': { label: 'Export Reports to PDF/Excel', desc: 'Generate downloadable PDF and Excel files of stats.' },
  'print_reports': { label: 'Print Physical Reports', desc: 'Directly send reports to active hardware printer devices.' },
  'view_products': { label: 'View Product Inventory List', desc: 'Browse the product catalog index and master inventory levels.' },
  'view_product_details': { label: 'View Detailed Product Specs', desc: 'See product metadata, category parameters, and pricing matrices.' },
  'create_products': { label: 'Create New Product Entries', desc: 'Insert new grocery listings into the catalog.' },
  'edit_products': { label: 'Edit Product Specs & Prices', desc: 'Modify cost valuations, selling rates, and item tags.' },
  'delete_products': { label: 'Delete Product Entries', desc: 'Permanently purge products from catalog database.' },
  'import_products': { label: 'Bulk Import Products via CSV/Excel', desc: 'Upload spreadsheet entries to populate catalog.' },
  'export_products': { label: 'Bulk Export Products via CSV/Excel', desc: 'Download entire active catalog sheet as spreadsheet.' },
  'view_categories': { label: 'View Category Listings', desc: 'Browse active catalog departments and groupings.' },
  'create_categories': { label: 'Create Category Master Records', desc: 'Insert new department tags into category masters.' },
  'edit_categories': { label: 'Edit Category Master Details', desc: 'Modify names and tags of existing departments.' },
  'delete_categories': { label: 'Delete Category Master Listings', desc: 'Delete unused category department groupings.' },
  'view_stock': { label: 'View Current Warehouse Stock', desc: 'Check available quantity balances at warehouse locations.' },
  'adjust_stock': { label: 'Adjust Stock Levels & Inventories', desc: 'Perform manual inventory counts corrections.' },
  'transfer_stock': { label: 'Initiate Warehouse Stock Transfers', desc: 'Approve moving stock units between warehouses.' },
  'view_stock_history': { label: 'View Stock Audit History Logs', desc: 'Access comprehensive timeline audits of stock adjustments.' },
  'view_purchases': { label: 'View Supplier Purchase Invoices', desc: 'List and search past purchase intakes invoices.' },
  'create_purchases': { label: 'Record Supplier Purchase Invoices', desc: 'Create new purchase intake notes to replenish stock.' },
  'delete_purchases': { label: 'Void / Delete Purchase Orders', desc: 'Void purchase invoices and automatically roll back inventory.' },
  'view_sales': { label: 'View Point of Sale (POS) Logs', desc: 'Browse invoices and transaction histories of counter register.' },
  'create_sales': { label: 'Generate POS Invoices & Bills', desc: 'Generate POS checkout invoices and receipts.' },
  'delete_sales': { label: 'Cancel / Void Sales Invoices', desc: 'Cancel billing sales and restore stock balances.' },
  'view_returns': { label: 'View Product Returns Logs', desc: 'Browse customer returns and vendor return notes.' },
  'create_returns': { label: 'Record Vendor / Customer Returns', desc: 'Process stock returns and refund balances.' },
  'approve_returns': { label: 'Verify & Approve Return Entries', desc: 'Validate stock return credits and checkins.' },
  'view_borrow': { label: 'View Udhaar / Customer Credit', desc: 'Check outstanding customer udhaar ledger books.' },
  'create_borrow': { label: 'Record Borrow / Payback Trx', desc: 'Record a new customer borrowing entry or cash payback.' },
  'manage_borrow': { label: 'Manage / Settle Customer Debts', desc: 'Forgive, adjust, or completely settle customer credit lines.' },
  'view_staff': { label: 'View Active Store Employees', desc: 'Inspect lists of operators and cashiers.' },
  'manage_users': { label: 'Manage Employee Logins & Rights', desc: 'Add staff and assign custom permissions sets.' },
  'view_billing': { label: 'View SaaS Subscription Details', desc: 'Check billing invoices and subscription package plans.' },
  'manage_subscription': { label: 'Modify / Renew SaaS Subscription', desc: 'Upgrade or renew subscription licenses.' },
  'view_notifications': { label: 'Read Alerts & Alarms Notifications', desc: 'Access stock alerts, low quantity warnings, and details.' },
  'manage_notifications': { label: 'Manage System Alerts & Triggers', desc: 'Clear active alarms, resolve low stocks, and config.' },
  'view_settings': { label: 'View POS System Config Options', desc: 'Inspect system metadata profiles and options.' },
  'manage_settings': { label: 'Edit POS System Config Options', desc: 'Configure company information, GST structures, etc.' },
  'view_activity_logs': { label: 'Inspect Admin Action Audit Trails', desc: 'Inspect administrative audit trails logs.' }
};

const IndeterminateCheckbox = ({ checked, indeterminate, onChange, className = '', ...props }) => {
  const ref = useRef();

  useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  return (
    <input
      type="checkbox"
      ref={ref}
      checked={checked}
      onChange={onChange}
      className={`rounded border-slate-300 dark:border-slate-700 text-emerald-600 focus:ring-emerald-500 h-4 w-4 cursor-pointer ${className}`}
      {...props}
    />
  );
};

const StaffList = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const isReadOnly = user?.role === 'Super Admin';

  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    contact: '',
    password: '',
    role_id: '',
    status: 'Active',
    department: '',
    permission_ids: []
  });

  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Field Refs for Auto-Focus on Validation Error
  const nameRef = useRef(null);
  const emailRef = useRef(null);
  const contactRef = useRef(null);
  const passwordRef = useRef(null);

  const focusAndScrollToField = (fieldName) => {
    const refMap = {
      name: nameRef,
      email: emailRef,
      contact: contactRef,
      password: passwordRef
    };
    const targetRef = refMap[fieldName];
    if (targetRef && targetRef.current) {
      targetRef.current.focus();
      targetRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleFieldChange = (fieldName, value) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
    if (errors[fieldName]) {
      setErrors(prev => ({ ...prev, [fieldName]: '' }));
    }
    if (formError) {
      setFormError('');
    }
  };

  const [dbOffline, setDbOffline] = useState(false);

  const [dbPermissions, setDbPermissions] = useState([]);
  const [permissionSearch, setPermissionSearch] = useState('');

  const [selectedPerms, setSelectedPerms] = useState([]);
  const [backupPerms, setBackupPerms] = useState([]);
  const [expandedModules, setExpandedModules] = useState({});

  const ALL_PERMISSIONS = [
    { id: 1, name: 'view_dashboard', label: 'View Dashboard Metrics', module: 'Dashboard', description: 'View dashboard metrics' },
    { id: 2, name: 'view_reports', label: 'View Reports', module: 'Reports', description: 'View sales and stock reports' },
    { id: 3, name: 'export_reports', label: 'Export Reports', module: 'Reports', description: 'Export PDF/Excel statements' },
    { id: 4, name: 'view_products', label: 'View Products', module: 'Products', description: 'View product catalogue details' },
    { id: 5, name: 'create_products', label: 'Create Product', module: 'Products', description: 'Create new product listings' },
    { id: 6, name: 'edit_products', label: 'Edit Product', module: 'Products', description: 'Edit product parameters' },
    { id: 7, name: 'delete_products', label: 'Delete Product', module: 'Products', description: 'Permanently delete items' },
    { id: 8, name: 'view_stock', label: 'View Stock', module: 'Stock', description: 'View inventory levels' },
    { id: 9, name: 'adjust_stock', label: 'Adjust Stock', module: 'Stock', description: 'Manually adjust stock balances' },
    { id: 10, name: 'transfer_stock', label: 'Transfer Stock', module: 'Stock', description: 'Transfer stocks between warehouses' },
    { id: 11, name: 'view_purchases', label: 'View Purchases', module: 'Purchases', description: 'View purchase ledger lists' },
    { id: 12, name: 'create_purchases', label: 'Create Purchase', module: 'Purchases', description: 'Record distributor invoices' },
    { id: 13, name: 'delete_purchases', label: 'Cancel Purchase', module: 'Purchases', description: 'Cancel purchase orders' },
    { id: 14, name: 'view_sales', label: 'View Sales', module: 'Sales', description: 'View sales history' },
    { id: 15, name: 'create_sales', label: 'Generate Sales Billing', module: 'Sales', description: 'Generate sales POS billing' },
    { id: 16, name: 'delete_sales', label: 'Cancel Sales', module: 'Sales', description: 'Void sales invoices' },
    { id: 17, name: 'manage_customers', label: 'Manage Customers', module: 'Customers', description: 'Manage customer profiles' },
    { id: 18, name: 'manage_users', label: 'Manage Users', module: 'Users', description: 'Create employee logins' },
    { id: 19, name: 'view_activity_logs', label: 'View Activity Logs', module: 'System', description: 'Audit staff logs' },
    { id: 20, name: 'view_borrow', label: 'View Borrow', module: 'Borrow', description: 'View outstanding customer Udhaar summary' },
    { id: 21, name: 'create_borrow', label: 'Create Borrow', module: 'Borrow', description: 'Record custom borrow/payback transaction log' }
  ];

  const getAssignablePermissions = () => {
    const rawList = dbPermissions.length > 0 ? dbPermissions : ALL_PERMISSIONS;
    const list = rawList.map(p => ({
      id: p.id,
      name: p.name,
      label: p.label || p.description || p.name.replace(/_/g, ' '),
      module: p.module || p.category || 'General',
      description: p.description || p.name.replace(/_/g, ' ')
    }));

    if (user?.role === 'Admin') {
      if (isEmployeeRole) {
        return list.filter(p => p.name !== 'view_staff' && p.name !== 'manage_users');
      }
      return list;
    }
    if (user?.role === 'Sales Manager' || user?.role === 'Purchase Manager') {
      const managerPerms = user.permissions || [];
      return list.filter(p => managerPerms.includes(p.name) && p.name !== 'view_staff' && p.name !== 'manage_users');
    }
    return [];
  };

  const fetchStaffData = async () => {
    setLoading(true);
    try {
      const usersRes = await usersAPI.getAll();
      if (usersRes.success) {
        setUsers(usersRes.users);
      }
      
      const rolesRes = await usersAPI.getRoles();
      if (rolesRes.success) {
        const staffRolesOnly = (rolesRes.roles || []).filter(r => r.name !== 'Admin');
        setRoles(staffRolesOnly);
        if (rolesRes.allPermissions) {
          setDbPermissions(rolesRes.allPermissions);
        }
      }
    } catch (err) {
      console.error('Staff API error:', err);
      setDbOffline(false);
      setUsers([]);
      setRoles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffData();
  }, []);

  const handleOpenAdd = () => {
    setSelectedUser(null);
    setErrors({});
    setFormError('');
    const availableStaffRoles = roles.filter(r => r.name !== 'Admin');
    let defaultRole = availableStaffRoles[0]?.id || '';
    if (user?.role === 'Sales Manager') {
      const empRole = availableStaffRoles.find(r => r.name === 'Sales Employee' || r.name === 'Employee');
      if (empRole) defaultRole = empRole.id;
    } else if (user?.role === 'Purchase Manager') {
      const empRole = availableStaffRoles.find(r => r.name === 'Purchase Employee' || r.name === 'Employee');
      if (empRole) defaultRole = empRole.id;
    }
    const defDept = user?.role === 'Sales Manager' ? 'Sales' : user?.role === 'Purchase Manager' ? 'Purchase' : '';
    setFormData({
      name: '',
      email: '',
      contact: '',
      password: '',
      role_id: defaultRole,
      status: 'Active',
      department: defDept,
      permission_ids: []
    });
    setSelectedPerms([]);
    setBackupPerms([]);
    setShowModal(true);
  };

  const handleOpenEdit = (staffUser) => {
    setSelectedUser(staffUser);
    setErrors({});
    setFormError('');
    const assignedIds = staffUser.permission_ids || [];
    setFormData({
      name: staffUser.name || '',
      email: staffUser.email || '',
      contact: staffUser.contact || '',
      password: '',
      role_id: staffUser.role_id || '',
      status: staffUser.status || 'Active',
      department: staffUser.department || '',
      permission_ids: assignedIds
    });
    setSelectedPerms(assignedIds);
    setBackupPerms(assignedIds);
    setShowModal(true);
  };

  const handleToggleStatus = async (staffUser) => {
    if (staffUser.role_name === 'Admin' || staffUser.email === user?.email) {
      alert('Store Administrator primary account cannot be deactivated.');
      return;
    }

    const isCurrentlyActive = staffUser.status === 'Active';
    const targetStatus = isCurrentlyActive ? 'Inactive' : 'Active';
    const confirmMsg = isCurrentlyActive
      ? `Are you sure you want to DEACTIVATE staff account for "${staffUser.name}" (${staffUser.email})? They will be blocked from logging in immediately.`
      : `Are you sure you want to RE-ACTIVATE staff account for "${staffUser.name}" (${staffUser.email})? They will regain access with their existing permissions.`;

    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await usersAPI.toggleStatus(staffUser.id, targetStatus);
      if (res.success) {
        setUsers(prev => prev.map(u => u.id === staffUser.id ? { ...u, status: targetStatus } : u));
        fetchStaffData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating staff member status.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setErrors({});

    // Client-side quick validations
    const newErrors = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Full Name is required';
    }
    const emailErr = validateEmailField(formData.email, true);
    if (emailErr) {
      newErrors.email = emailErr;
    }

    if (!selectedUser && (!formData.password || formData.password.length < 6)) {
      newErrors.password = 'Password must be at least 6 characters long';
    } else if (formData.password && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long';
    }

    if (formData.contact?.trim() && formData.contact.replace(/\D/g, '').length !== 10) {
      newErrors.contact = 'Contact number must be exactly 10 digits';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      const firstInvalidField = Object.keys(newErrors)[0];
      focusAndScrollToField(firstInvalidField);
      return;
    }

    setSubmitting(true);
    try {
      let targetRoleId = Number(formData.role_id);
      if (!targetRoleId || isNaN(targetRoleId)) {
        if (user?.role === 'Sales Manager') {
          const empRole = roles.find(r => r.name === 'Sales Employee' || r.name === 'Employee');
          if (empRole) targetRoleId = empRole.id;
        } else if (user?.role === 'Purchase Manager') {
          const empRole = roles.find(r => r.name === 'Purchase Employee' || r.name === 'Employee');
          if (empRole) targetRoleId = empRole.id;
        } else if (roles.length > 0) {
          const defaultEmp = roles.find(r => r.name !== 'Admin') || roles[0];
          if (defaultEmp) targetRoleId = defaultEmp.id;
        }
      }

      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        contact: formData.contact?.trim() || '',
        role_id: targetRoleId,
        status: formData.status,
        department: formData.department || (user?.role === 'Sales Manager' ? 'Sales' : user?.role === 'Purchase Manager' ? 'Purchase' : ''),
        permission_ids: selectedPerms
      };
      if (formData.password) {
        payload.password = formData.password;
      }

      if (selectedUser) {
        const res = await usersAPI.update(selectedUser.id, payload);
        if (res.success) {
          dispatch(showToast({ msg: 'Staff member profile updated successfully!', type: 'success' }));
          fetchStaffData();
          setShowModal(false);
        }
      } else {
        const res = await usersAPI.create(payload);
        if (res.success) {
          dispatch(showToast({ msg: 'New staff member registered successfully!', type: 'success' }));
          fetchStaffData();
          setShowModal(false);
        }
      }
    } catch (err) {
      console.error('Error saving staff member:', err);
      const apiMsg = err.response?.data?.message || err.message || 'Error saving staff member';
      const returnedField = err.response?.data?.field || null;
      setFormError(apiMsg);

      let targetField = returnedField;
      if (!targetField) {
        const lowerMsg = apiMsg.toLowerCase();
        if (lowerMsg.includes('email')) targetField = 'email';
        else if (lowerMsg.includes('contact') || lowerMsg.includes('phone') || lowerMsg.includes('number')) targetField = 'contact';
        else if (lowerMsg.includes('name')) targetField = 'name';
        else if (lowerMsg.includes('password')) targetField = 'password';
      }

      if (targetField) {
        setErrors({ [targetField]: apiMsg });
        focusAndScrollToField(targetField);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const stats = {
    total: users.length,
    active: users.filter(u => u.status === 'Active').length,
    admins: users.filter(u => u.role_name === 'Admin').length,
    suspended: users.filter(u => u.status === 'Inactive' || u.status === 'Suspended').length,
  };

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.role_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.login_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedRole = roles.find(r => r.id === Number(formData.role_id));
  const isEmployeeRole = selectedRole?.name === 'Employee' || 
                         selectedRole?.name === 'Purchase Employee' || 
                         selectedRole?.name === 'Sales Employee' || 
                         ['Employee', 'Purchase Employee', 'Sales Employee'].includes(roles.find(r => r.id === Number(formData.role_id))?.name);

  const [accessPreset, setAccessPreset] = useState('custom');

  const assignablePerms = getAssignablePermissions();

  const applyAccessPreset = (presetKey) => {
    setAccessPreset(presetKey);
    if (presetKey === 'sales') {
      const salesPermNames = ['view_dashboard', 'view_sales', 'create_sales', 'view_pos', 'view_customers', 'view_products', 'view_categories'];
      const matchedIds = assignablePerms.filter(p => salesPermNames.includes(p.name)).map(p => p.id);
      setSelectedPerms(matchedIds);
      setFormData(prev => ({ ...prev, department: 'Sales' }));
    } else if (presetKey === 'purchase') {
      const purchasePermNames = ['view_dashboard', 'view_purchases', 'create_purchases', 'view_stock', 'update_stock', 'view_products', 'view_categories', 'view_suppliers'];
      const matchedIds = assignablePerms.filter(p => purchasePermNames.includes(p.name)).map(p => p.id);
      setSelectedPerms(matchedIds);
      setFormData(prev => ({ ...prev, department: 'Purchase' }));
    } else if (presetKey === 'operations') {
      const opsPermNames = ['view_dashboard', 'view_sales', 'create_sales', 'view_pos', 'view_customers', 'view_purchases', 'create_purchases', 'view_stock', 'update_stock', 'view_products', 'view_categories', 'view_suppliers', 'view_borrow', 'create_borrow'];
      const matchedIds = assignablePerms.filter(p => opsPermNames.includes(p.name)).map(p => p.id);
      setSelectedPerms(matchedIds);
      setFormData(prev => ({ ...prev, department: 'General' }));
    }
  };
  const filteredPerms = assignablePerms.filter(perm => 
    perm.label.toLowerCase().includes(permissionSearch.toLowerCase()) || 
    perm.module.toLowerCase().includes(permissionSearch.toLowerCase()) ||
    perm.description.toLowerCase().includes(permissionSearch.toLowerCase())
  );

  const groupedPermissions = {};
  filteredPerms.forEach(perm => {
    const mod = perm.module || 'General';
    if (!groupedPermissions[mod]) {
      groupedPermissions[mod] = [];
    }
    groupedPermissions[mod].push(perm);
  });

  return (
    <div className="space-y-6 pb-12 select-none font-sans">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-900 p-6 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">Staff Management</h1>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">Configure store cashiers, operators, and permissions</p>
        </div>
        {!isReadOnly && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-indigo-600 text-white rounded-xl shadow-md shadow-indigo-500/20 hover:bg-indigo-700 active:scale-95 transition-all cursor-pointer"
          >
            <UserPlusIcon className="w-4 h-4 stroke-[3]" /> Add Staff Member
          </button>
        )}
      </div>

      {/* STAFF METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total Staff" value={stats.total} icon={UserGroupIcon} subtext="Registered Store Users" color="blue" />
        <StatsCard title="Active Logins" value={stats.active} icon={CheckCircleIcon} subtext="Operational Accounts" color="green" />
        <StatsCard title="Administrators" value={stats.admins} icon={ShieldCheckIcon} subtext="Root Privileges" color="purple" />
        <StatsCard title="Suspended" value={stats.suspended} icon={NoSymbolIcon} subtext="Access Revoked Accounts" color="orange" />
      </div>

      {/* FILTER & LIST TAB */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">Employee Catalog Registry</h2>
          <div className="w-full sm:max-w-xs">
            <input 
              type="text"
              placeholder="Search by name, email, or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-indigo-500 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 font-semibold"
            />
          </div>
        </div>

        {loading ? (
          <div className="py-12 flex justify-center">
            <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 animate-pulse">Loading employee roster...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-slate-50 dark:bg-slate-800/80">
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Full Name</th>
                  <th className="py-3 px-4">Login ID</th>
                  <th className="py-3 px-4">Email Address</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Role Profile</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Last Activity</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-medium">
                {filteredUsers.map(staff => (
                  <tr key={staff.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-500 dark:text-slate-400">
                      {staff.employee_serial_id ? String(staff.employee_serial_id).padStart(4, '0') : '—'}
                    </td>
                    <td className="py-3 px-4 font-black text-slate-900 dark:text-white">{staff.name}</td>
                    <td className="py-3 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">{staff.login_id || 'N/A'}</td>
                    <td className="py-3 px-4 font-semibold text-slate-600 dark:text-slate-300">{staff.email}</td>
                    <td className="py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">
                      {staff.contact ? (
                        <span className="flex items-center gap-1">
                          <PhoneIcon className="w-3 h-3 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                          {staff.contact}
                        </span>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-600">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        staff.role_name === 'Admin' 
                          ? 'bg-purple-50 text-purple-700 border border-purple-100 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800' 
                          : staff.role_name?.includes('Manager')
                            ? 'bg-amber-50 text-amber-700 border border-amber-100 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                            : 'bg-indigo-50 text-indigo-700 border border-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800'
                      }`}>
                        {staff.role_name || 'Employee'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">
                      {staff.department || 'General'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        staff.status === 'Active' 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800' 
                          : 'bg-rose-50 text-rose-700 border border-rose-100 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
                      }`}>
                        {staff.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400 font-medium">
                      {staff.last_login ? new Date(staff.last_login).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' }) : 'Never Logged In'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {!isReadOnly ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button 
                            onClick={() => handleOpenEdit(staff)}
                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-md transition-colors cursor-pointer"
                            title="Edit Profile"
                          >
                            <PencilIcon className="w-3.5 h-3.5" />
                          </button>
                          {staff.role_name !== 'Admin' ? (
                            <button 
                              onClick={() => handleToggleStatus(staff)}
                              className={`p-1 rounded-md transition-colors cursor-pointer ${
                                staff.status === 'Inactive' || staff.status === 'Suspended'
                                  ? 'hover:bg-emerald-50 dark:hover:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400'
                                  : 'hover:bg-rose-50 dark:hover:bg-rose-950/50 text-rose-600 dark:text-rose-400'
                              }`}
                              title={staff.status === 'Inactive' || staff.status === 'Suspended' ? 'Activate Staff Account' : 'Deactivate Staff Account'}
                            >
                              {staff.status === 'Inactive' || staff.status === 'Suspended' ? (
                                <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                              ) : (
                                <NoSymbolIcon className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                              )}
                            </button>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 px-1" title="Store Admin Account (Protected)">Protected</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">Locked</span>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-400 dark:text-slate-500 font-semibold">No staff profiles found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ADD / EDIT MODAL */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={selectedUser ? 'Edit Staff Member Profile' : 'Register New Staff Member'}
        size="2xl"
        noPadding={true}
      >
        <form onSubmit={handleSubmit} autoComplete="off" className="flex flex-col h-full bg-white dark:bg-slate-900 select-none">
          <fieldset disabled={isReadOnly} className="flex-1 overflow-y-auto p-6 space-y-5">
            {/* Top Error Banner */}
            {formError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-bold text-rose-700 dark:text-rose-300 flex items-center gap-2 shadow-sm animate-pulse">
                <span className="text-base">⚠️</span>
                <span>{formError}</span>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-1.5">Full Name *</label>
              <div className="relative">
                <input 
                  ref={nameRef}
                  type="text"
                  autoComplete="off"
                  name="staff-full-name"
                  value={formData.name}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  placeholder="Name"
                  className={`w-full pl-9 pr-3 py-2 text-xs border rounded-xl focus:outline-none font-bold transition-all ${
                    errors.name 
                      ? 'border-rose-500 ring-2 ring-rose-200 text-rose-900 bg-rose-50/30 dark:bg-rose-950/40' 
                      : 'border-slate-200 dark:border-slate-800 focus:border-emerald-600 dark:focus:border-emerald-500 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500'
                  }`}
                />
                <UserIcon className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-2.5" />
              </div>
              {errors.name && (
                <p className="text-[10px] font-bold text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1">
                  <span>⚠️</span> {errors.name}
                </p>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-1.5">Email Address *</label>
              <div className="relative">
                <input 
                  ref={emailRef}
                  type="email"
                  autoComplete="off"
                  name="staff-email"
                  value={formData.email}
                  onChange={(e) => handleFieldChange('email', e.target.value)}
                  placeholder="Email"
                  className={`w-full pl-9 pr-3 py-2 text-xs border rounded-xl focus:outline-none font-bold transition-all ${
                    errors.email 
                      ? 'border-rose-500 ring-2 ring-rose-200 text-rose-900 bg-rose-50/30 dark:bg-rose-950/40' 
                      : 'border-slate-200 dark:border-slate-800 focus:border-emerald-600 dark:focus:border-emerald-500 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500'
                  }`}
                />
                <EnvelopeIcon className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-2.5" />
              </div>
              {errors.email && (
                <p className="text-[10px] font-bold text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1">
                  <span>⚠️</span> {errors.email}
                </p>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-1.5">Contact Number</label>
              <div className="relative">
                <input 
                  ref={contactRef}
                  type="tel"
                  autoComplete="off"
                  name="staff-contact"
                  inputMode="numeric"
                  value={formData.contact}
                  onChange={(e) => handleFieldChange('contact', e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="Contact No."
                  maxLength={10}
                  className={`w-full pl-9 pr-3 py-2 text-xs border rounded-xl focus:outline-none font-bold transition-all ${
                    errors.contact 
                      ? 'border-rose-500 ring-2 ring-rose-200 text-rose-900 bg-rose-50/30 dark:bg-rose-950/40' 
                      : 'border-slate-200 dark:border-slate-800 focus:border-emerald-600 dark:focus:border-emerald-500 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500'
                  }`}
                />
                <PhoneIcon className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-2.5" />
              </div>
              {errors.contact && (
                <p className="text-[10px] font-bold text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1">
                  <span>⚠️</span> {errors.contact}
                </p>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                {selectedUser ? 'New Password (Leave blank to keep current)' : 'Password *'}
              </label>
              <div className="relative">
                <input 
                  ref={passwordRef}
                  type="password"
                  autoComplete="new-password"
                  name="staff-password"
                  value={formData.password}
                  onChange={(e) => handleFieldChange('password', e.target.value)}
                  placeholder="Minimum 6 characters"
                  className={`w-full pl-9 pr-3 py-2 text-xs border rounded-xl focus:outline-none font-bold transition-all ${
                    errors.password 
                      ? 'border-rose-500 ring-2 ring-rose-200 text-rose-900 bg-rose-50/30 dark:bg-rose-950/40' 
                      : 'border-slate-200 dark:border-slate-800 focus:border-emerald-600 dark:focus:border-emerald-500 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500'
                  }`}
                />
                <LockClosedIcon className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-2.5" />
              </div>
              {errors.password && (
                <p className="text-[10px] font-bold text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1">
                  <span>⚠️</span> {errors.password}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-1.5">Role Type</label>
                {user?.role === 'Sales Manager' || user?.role === 'Purchase Manager' ? (
                  <input 
                    type="text" 
                    disabled
                    value={user?.role === 'Sales Manager' ? 'Sales Employee' : 'Purchase Employee'}
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                  />
                ) : (
                  <select
                    value={formData.role_id}
                    onChange={(e) => {
                      const selRole = roles.find(r => r.id === Number(e.target.value));
                      setFormData({ 
                        ...formData, 
                        role_id: e.target.value,
                        department: selRole?.name === 'Admin' ? '' : formData.department,
                        permission_ids: selRole?.name === 'Admin' ? [] : formData.permission_ids
                      });
                    }}
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500 font-bold bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white cursor-pointer"
                  >
                    {roles.map(role => (
                      <option key={role.id} value={role.id}>{role.name}</option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-1.5">Department</label>
                {user?.role === 'Sales Manager' || user?.role === 'Purchase Manager' ? (
                  <input 
                    type="text" 
                    disabled
                    value={formData.department}
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                  />
                ) : (
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500 font-bold bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white cursor-pointer"
                  >
                    <option value="">None / General</option>
                    <option value="Sales">Sales</option>
                    <option value="Purchase">Purchase</option>
                  </select>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-1.5">Account Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500 font-bold bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white cursor-pointer"
                >
                  <option value="Active">Active</option>
                  <option value="Suspended">Suspended</option>
                </select>
              </div>
            </div>

            {isEmployeeRole && (
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                {/* ACCESS SCOPE PRESET DROPDOWN */}
                <div className="bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/80 rounded-2xl p-4 mb-3">
                  <label className="block text-[10px] font-black text-emerald-800 dark:text-emerald-300 uppercase tracking-widest mb-1.5">
                    ⚙️ Employee Access Scope &amp; Dashboard View Dropdown
                  </label>
                  <select
                    value={accessPreset}
                    onChange={(e) => applyAccessPreset(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs font-bold border border-emerald-300 dark:border-emerald-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white cursor-pointer shadow-sm"
                  >
                    <option value="sales">🛒 Sales &amp; POS Cashier Access (Routes to Sales Employee Dashboard)</option>
                    <option value="purchase">📦 Purchase &amp; Stock Entry Access (Routes to Purchase Employee Dashboard)</option>
                    <option value="operations">🏪 Full Store Operations Access (Sales + Purchase + Stock)</option>
                    <option value="custom">⚙️ Custom Granular Matrix Permissions</option>
                  </select>
                  <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold mt-1">
                    {accessPreset === 'sales' && 'Assigns Point-of-Sale, checkout, and customer credit rights. Shows Sales Employee Dashboard.'}
                    {accessPreset === 'purchase' && 'Assigns Goods Receipt (GRN), supplier, and stock checkin rights. Shows Purchase Employee Dashboard.'}
                    {accessPreset === 'operations' && 'Assigns full store operational access across billing and stock management.'}
                    {accessPreset === 'custom' && 'Pick individual module permissions from the matrix below.'}
                  </p>
                </div>

                <div className="border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden bg-slate-50/50 dark:bg-slate-900/60 p-5 mt-3 space-y-5">
                  
                  {/* Card Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200 dark:border-slate-800">
                    <div>
                      <h4 className="text-xs font-black text-[#1B6E4C] dark:text-[#4FBE8B] uppercase tracking-wider">Assign Rights &amp; System Permissions</h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5">Define role permissions and specific access levels for this employee.</p>
                    </div>
                    <div className="flex-shrink-0">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        {selectedPerms.length} Permissions Selected
                      </span>
                    </div>
                  </div>

                  {/* Toolbar Search & Multi-Selection Actions */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        placeholder="Search system permissions..."
                        value={permissionSearch}
                        onChange={(e) => setPermissionSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                      />
                      <span className="absolute left-3 top-2.5 text-xs text-slate-400 select-none">🔍</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          const allIds = assignablePerms.map(p => p.id);
                          setSelectedPerms(allIds);
                        }}
                        className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black tracking-wider uppercase active:scale-95 transition-all shadow-sm shadow-emerald-500/20 cursor-pointer"
                      >
                        Select All
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedPerms([])}
                        className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] font-black tracking-wider uppercase active:scale-95 transition-all cursor-pointer"
                      >
                        Clear All
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const allMods = {};
                          assignablePerms.forEach(p => { allMods[p.module] = true; });
                          setExpandedModules(allMods);
                        }}
                        className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] font-black tracking-wider uppercase active:scale-95 transition-all cursor-pointer"
                      >
                        Expand All
                      </button>
                      <button
                        type="button"
                        onClick={() => setExpandedModules({})}
                        className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] font-black tracking-wider uppercase active:scale-95 transition-all cursor-pointer"
                      >
                        Collapse All
                      </button>
                    </div>
                  </div>

                  {/* Accordion Module List */}
                  <div className="space-y-3.5 max-h-[350px] overflow-y-auto pr-1">
                    {Object.entries(groupedPermissions).map(([moduleName, modulePerms]) => {
                      const moduleIds = modulePerms.map(p => p.id);
                      const isExpanded = !!expandedModules[moduleName];
                      
                      const selectedInModule = modulePerms.filter(p => selectedPerms.includes(p.id)).length;
                      const allSelected = selectedInModule === modulePerms.length;
                      const someSelected = selectedInModule > 0 && !allSelected;

                      return (
                        <div 
                          key={moduleName} 
                          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md"
                        >
                          {/* Accordion Header */}
                          <div 
                            className="flex items-center justify-between p-4 cursor-pointer select-none bg-slate-50/60 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border-b border-transparent"
                            onClick={() => setExpandedModules({ ...expandedModules, [moduleName]: !isExpanded })}
                          >
                            <div className="flex items-center gap-3.5" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                onClick={() => setExpandedModules({ ...expandedModules, [moduleName]: !isExpanded })}
                                className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-transform p-0.5 text-xs font-black"
                                style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
                              >
                                ▶
                              </button>
                              <IndeterminateCheckbox
                                checked={allSelected}
                                indeterminate={someSelected}
                                onChange={(e) => {
                                  let newPerms = [...selectedPerms];
                                  if (e.target.checked) {
                                    moduleIds.forEach(id => {
                                      if (!newPerms.includes(id)) newPerms.push(id);
                                    });
                                  } else {
                                    newPerms = newPerms.filter(id => !moduleIds.includes(id));
                                  }
                                  setSelectedPerms(newPerms);
                                }}
                              />
                              <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">{moduleName}</span>
                            </div>
                            <div>
                              <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
                                {selectedInModule} / {moduleIds.length} Selected
                              </span>
                            </div>
                          </div>

                          {/* Accordion Content Grid */}
                          {isExpanded && (
                            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                                {modulePerms.map((perm) => {
                                  const isChecked = selectedPerms.includes(perm.id);
                                  const meta = PERMISSION_LABELS[perm.name] || { label: perm.label, desc: perm.description };
                                  
                                  return (
                                    <label
                                      key={perm.id}
                                      className="flex items-start gap-2.5 p-3 bg-slate-50/40 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700 rounded-xl cursor-pointer transition-all select-none"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={(e) => {
                                          let newPerms = [...selectedPerms];
                                          if (e.target.checked) {
                                            newPerms.push(perm.id);
                                          } else {
                                            newPerms = newPerms.filter(id => id !== perm.id);
                                          }
                                          setSelectedPerms(newPerms);
                                        }}
                                        className="rounded mt-0.5 border-slate-300 dark:border-slate-700 text-emerald-600 focus:ring-emerald-500 h-4 w-4 cursor-pointer"
                                      />
                                      <div>
                                        <span className="block text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">{meta.label}</span>
                                        <span className="block text-[9px] text-slate-400 dark:text-slate-400 font-semibold leading-tight mt-0.5">{meta.desc}</span>
                                      </div>
                                    </label>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {Object.keys(groupedPermissions).length === 0 && (
                      <div className="text-center py-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold text-slate-400">
                        No matching permissions found.
                      </div>
                    )}
                  </div>

                  {/* Sticky Footer of the Permission Card */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 -mx-5 -mb-5 p-5">
                    <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Draft: {selectedPerms.length} Rights Set
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedPerms([...backupPerms])}
                        className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-[10px] font-black tracking-wider uppercase active:scale-95 transition-all cursor-pointer bg-white dark:bg-slate-800"
                      >
                        Reset Permissions
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, permission_ids: selectedPerms });
                          setBackupPerms([...selectedPerms]);
                          alert('Permissions applied to draft configuration!');
                        }}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all active:scale-95 shadow-md shadow-emerald-500/20 cursor-pointer"
                      >
                        Apply Permissions
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            )}

          </fieldset>

          {/* STICKY FOOTER ACTIONS */}
          <div className="flex-shrink-0 flex items-center justify-end gap-2.5 px-6 py-4 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-150 dark:border-slate-800 sticky bottom-0 z-30 shadow-[0_-4px_12px_rgba(0,0,0,0.02)]">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-[#1B6E4C] hover:bg-[#14523A] text-white rounded-xl text-xs font-bold shadow-md shadow-[#1B6E4C]/10 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Saving...' : selectedUser ? 'Save Updates' : 'Register Member'}
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
};

export default StaffList;
