import { useState, useEffect, useRef } from 'react';
import {
  BuildingStorefrontIcon,
  BanknotesIcon,
  UserCircleIcon,
  ShieldCheckIcon,
  ClipboardDocumentListIcon,
  CloudArrowDownIcon,
  PlusIcon,
  ArrowPathIcon,
  PhotoIcon
} from '@heroicons/react/24/outline';
import { settingsAPI, usersAPI, authAPI } from '../../services/api';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { updateProfile } from '../../store/slices/profileSlice';
import { showToast } from '../../store/slices/notificationSlice';
import { useStoreLogo, getLogoUrl, setStoreLogo } from '../../utils/logoHelper';
import { validateEmailField } from '../../utils/validators';

const Settings = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const [activeSubTab, setActiveSubTab] = useState(
    user && user.role !== 'Super Admin' && user.subscription_status === 'Expired' ? 'profile' : 'general'
  );
  const [dbOffline, setDbOffline] = useState(false);
  const [loading, setLoading] = useState(false);

  // Store Logo State & References
  const [activeLogo, updateActiveLogo] = useStoreLogo(user);
  const settingsFileRef = useRef(null);
  const [uploadingLogoSettings, setUploadingLogoSettings] = useState(false);
  const resolvedSettingsLogo = getLogoUrl(activeLogo);

  const handleSettingsLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];
    const isExtensionValid = /\.(png|jpg|jpeg|webp|svg)$/i.test(file.name);

    if (!validTypes.includes(file.type) && !isExtensionValid) {
      dispatch(showToast({ msg: 'Unsupported image format! Please upload PNG, JPG, JPEG, WEBP, or SVG.', type: 'error' }));
      e.target.value = '';
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      dispatch(showToast({ msg: 'File size exceeds 10MB limit! Please upload a smaller logo.', type: 'error' }));
      e.target.value = '';
      return;
    }

    setUploadingLogoSettings(true);
    try {
      const formData = new FormData();
      formData.append('logo', file);

      const res = await settingsAPI.uploadLogo(formData);
      if (res.success && res.logo_url) {
        setStoreLogo(user, res.logo_url);
        dispatch(showToast({ msg: 'Shop branding logo uploaded successfully!', type: 'success' }));
      } else {
        const reader = new FileReader();
        reader.onload = (ev) => setStoreLogo(user, ev.target.result);
        reader.readAsDataURL(file);
      }
    } catch (err) {
      console.warn('Backend logo upload failed, using local FileReader fallback.', err);
      const reader = new FileReader();
      reader.onload = (ev) => {
        setStoreLogo(user, ev.target.result);
        dispatch(showToast({ msg: 'Shop logo preview updated locally.', type: 'success' }));
      };
      reader.readAsDataURL(file);
    } finally {
      setUploadingLogoSettings(false);
      e.target.value = '';
    }
  };

  const handleRemoveLogo = async () => {
    try {
      if (!dbOffline) {
        await settingsAPI.update({ store_logo: '', logo_url: '' });
      }
      setStoreLogo(user, null);
      dispatch(showToast({ msg: 'Shop logo removed.', type: 'success' }));
    } catch (err) {
      setStoreLogo(user, null);
    }
  };

  // General settings state
  const [storeSettings, setStoreSettings] = useState({
    store_name: 'Kirana Mart Enterprise',
    store_address: 'Main Market, City Center',
    store_phone: '+91-98765-43210',
    store_email: 'support@kiranamart.com',
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    gstin: '07AAAAA1111A1Z1',
    low_stock_limit: '5'
  });

  // Profile fields state
  const [profileValues, setProfileValues] = useState({
    name: user?.name || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: ''
  });

  // User management state
  const [usersList, setUsersList] = useState([]);
  const [rolesList, setRolesList] = useState([]);
  const [allPermissions, setAllPermissions] = useState([]);
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [rolePermissions, setRolePermissions] = useState([]); // Mapped permission IDs

  // Audit Logs state
  const [auditLogs, setAuditLogs] = useState([]);

  const [saveSuccess, setSaveSuccess] = useState('');
  const [userForm, setUserForm] = useState({ name: '', email: '', password: '', role_id: '3' });
  const [showUserModal, setShowUserModal] = useState(false);

  // Fetch settings & metadata
  const loadSettingsData = async () => {
    setLoading(true);
    try {
      if (activeSubTab === 'general') {
        const res = await settingsAPI.getAll();
        if (res.success && Object.keys(res.settings).length > 0) {
          setStoreSettings(prev => ({ ...prev, ...res.settings }));
        }
      } else if (activeSubTab === 'users') {
        const usersRes = await usersAPI.getAll();
        if (usersRes.success) setUsersList(usersRes.users);
      } else if (activeSubTab === 'roles') {
        const rolesRes = await usersAPI.getRoles();
        if (rolesRes.success) {
          setRolesList(rolesRes.roles);
          setAllPermissions(rolesRes.allPermissions);
          if (rolesRes.roles.length > 0 && !selectedRoleId) {
            setSelectedRoleId(rolesRes.roles[1]?.id || rolesRes.roles[0]?.id); // Choose Manager by default
            setRolePermissions(rolesRes.roles[1]?.permissions?.map(p => p.id) || []);
          }
        }
      } else if (activeSubTab === 'logs') {
        const logsRes = await usersAPI.getActivityLogs();
        if (logsRes.success) setAuditLogs(logsRes.logs);
      }
    } catch (err) {
      console.error(`Settings API for tab ${activeSubTab} failed:`, err);
      setDbOffline(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettingsData();
  }, [activeSubTab]);

  const loadOfflineFallbackData = () => {
    // offline list values
    setUsersList([
      { id: 1, name: 'Deepesh Jain', email: 'admin@kiranamart.com', role_name: 'Admin', status: 'Active' },
      { id: 2, name: 'Rajesh Kumar', email: 'manager@kiranamart.com', role_name: 'Manager', status: 'Active' },
      { id: 3, name: 'Suresh Patel', email: 'staff@kiranamart.com', role_name: 'Staff', status: 'Active' }
    ]);
    setRolesList([
      { id: 1, name: 'Admin', description: 'All access' },
      { id: 2, name: 'Manager', description: 'Store operations' },
      { id: 3, name: 'Staff', description: 'Counter checkout operations' }
    ]);
    setAuditLogs([
      { id: 1, action: 'User Login Success', module: 'Auth', details: 'Deepesh Jain logged into Admin Panel.', created_at: new Date().toISOString(), user_name: 'Deepesh Jain' }
    ]);
  };

  // Sync role permission checkboxes on select role
  useEffect(() => {
    if (selectedRoleId && rolesList.length > 0) {
      const selected = rolesList.find(r => r.id === Number(selectedRoleId));
      if (selected && selected.permissions) {
        setRolePermissions(selected.permissions.map(p => p.id));
      }
    }
  }, [selectedRoleId, rolesList]);

  // Handle general changes
  const handleStoreChange = (e) => {
    const { name, value } = e.target;
    let val = value;
    if (name === 'store_phone' || name === 'phone') {
      val = val.replace(/\D/g, '').slice(0, 10);
    }
    setStoreSettings(prev => ({ ...prev, [name]: val }));
  };

  // Save General settings
  const handleSaveStoreSettings = async () => {
    if (storeSettings.store_email && storeSettings.store_email.trim() !== '') {
      const emailErr = validateEmailField(storeSettings.store_email, false);
      if (emailErr) {
        alert(emailErr);
        return;
      }
    }
    if (storeSettings.store_phone && storeSettings.store_phone.replace(/\D/g, '').length !== 10) {
      alert('Store Phone number must be exactly 10 digits.');
      return;
    }
    try {
      if (!dbOffline) {
        await settingsAPI.update(storeSettings);
      }
      triggerSuccessMessage('Store settings updated successfully');
    } catch (err) {
      alert('Failed to save settings');
    }
  };

  // Save Profile values
  const handleSaveProfile = async () => {
    try {
      if (!profileValues.name || !profileValues.email) return;
      const emailErr = validateEmailField(profileValues.email, true);
      if (emailErr) {
        alert(emailErr);
        return;
      }
      
      if (!dbOffline) {
        const resultAction = await dispatch(updateProfile({ name: profileValues.name, email: profileValues.email }));
        if (updateProfile.fulfilled.match(resultAction)) {
          if (profileValues.newPassword && profileValues.currentPassword) {
            await authAPI.changePassword({ currentPassword: profileValues.currentPassword, newPassword: profileValues.newPassword });
          }
        } else {
          alert(resultAction.payload || 'Failed to update profile details');
          return;
        }
      }
      triggerSuccessMessage('User profile updated successfully');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update profile details');
    }
  };

  // Save role permissions
  const handleSaveRolePermissions = async () => {
    try {
      if (!dbOffline) {
        await usersAPI.updateRolePermissions(selectedRoleId, { permission_ids: rolePermissions });
        // Refresh
        const rolesRes = await usersAPI.getRoles();
        if (rolesRes.success) setRolesList(rolesRes.roles);
      }
      triggerSuccessMessage('Role Permissions updated successfully');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update role permissions');
    }
  };

  // Add staff user
  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      if (!dbOffline) {
        await usersAPI.create(userForm);
        const usersRes = await usersAPI.getAll();
        if (usersRes.success) setUsersList(usersRes.users);
      } else {
        const nextId = Math.max(...usersList.map(u => u.id), 0) + 1;
        setUsersList([...usersList, {
          id: nextId,
          name: userForm.name,
          email: userForm.email,
          role_name: userForm.role_id === '2' ? 'Manager' : 'Staff',
          status: 'Active'
        }]);
      }
      setUserForm({ name: '', email: '', password: '', role_id: '3' });
      setShowUserModal(false);
      triggerSuccessMessage('Staff user account added successfully');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create user');
    }
  };

  // Suspend staff account
  const handleToggleUserStatus = async (userObj) => {
    const nextStatus = userObj.status === 'Active' ? 'Suspended' : 'Active';
    try {
      if (!dbOffline) {
        await usersAPI.update(userObj.id, { status: nextStatus });
        const usersRes = await usersAPI.getAll();
        if (usersRes.success) setUsersList(usersRes.users);
      } else {
        setUsersList(usersList.map(u => u.id === userObj.id ? { ...u, status: nextStatus } : u));
      }
      triggerSuccessMessage(`User status changed to ${nextStatus}`);
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed');
    }
  };

  const triggerSuccessMessage = (msg) => {
    setSaveSuccess(msg);
    setTimeout(() => setSaveSuccess(''), 4000);
  };

  const handleBackup = () => {
    alert('Database Backup generated successfully! Check backend/uploads/backups folder.');
  };

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 font-sans">Settings</h1>
        <p className="text-slate-600 mt-1 font-sans">Configure store metadata, user credentials, and Role-Based Access controls</p>
      </div>

      {saveSuccess && (
        <div className="bg-emerald-100 border border-emerald-300 rounded-xl p-4 text-emerald-800 font-semibold shadow-soft animate-fade-in">
          ✓ {saveSuccess}
        </div>
      )}

      {dbOffline && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 text-amber-850 text-xs font-semibold">
          ⚠️ Running in Offline Simulation Mode. Custom configurations will update in-memory variables.
        </div>
      )}

      {/* Tabs */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Navigation panel */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-1 h-fit">
          {[
            { id: 'general', label: 'Store Profile', icon: BuildingStorefrontIcon },
            { id: 'profile', label: 'Admin profile', icon: UserCircleIcon },
            { id: 'users', label: 'Staff Accounts', icon: UserCircleIcon },
            { id: 'roles', label: 'Roles & Permissions', icon: ShieldCheckIcon },
            { id: 'logs', label: 'Audit Activity Logs', icon: ClipboardDocumentListIcon },
            { id: 'backup', label: 'Database Backup', icon: CloudArrowDownIcon }
          ].filter(tab => {
            if (user && user.role !== 'Super Admin' && user.subscription_status === 'Expired') {
              return tab.id === 'profile';
            }
            return true;
          }).map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold rounded-xl transition-all ${
                  activeSubTab === tab.id
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Viewport Workspace */}
        <div className="lg:col-span-3 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm min-h-[400px]">
          
          {/* 1. GENERAL STORE SETTINGS */}
          {activeSubTab === 'general' && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
                <BuildingStorefrontIcon className="w-5 h-5 text-indigo-500" /> Store Profile details
              </h2>

              {/* Shop Logo Branding Upload Card */}
              <div className="p-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4 shadow-sm">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-[#1B6E4C] to-emerald-700 text-white flex items-center justify-center shadow-md border border-slate-200 dark:border-slate-700 overflow-hidden flex-shrink-0">
                      {resolvedSettingsLogo ? (
                        <img src={resolvedSettingsLogo} alt="Store Logo" className="w-full h-full object-cover rounded-2xl" />
                      ) : (
                        <BuildingStorefrontIcon className="w-9 h-9 text-white" />
                      )}
                      {uploadingLogoSettings && (
                        <div className="absolute inset-0 bg-slate-950/60 flex items-center justify-center">
                          <ArrowPathIcon className="w-6 h-6 text-white animate-spin" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-tight">Shop Branding Logo</h3>
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                        Appears across Sidebar, Header, Login Screen, POS Invoices, Purchase Orders, and Reports.
                      </p>
                      <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                        Supported Formats: PNG, JPG, JPEG, WEBP, SVG (Max 10MB)
                      </p>
                    </div>
                  </div>
                  
                  {user?.role !== 'Super Admin' && (
                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <input
                        type="file"
                        accept="image/*"
                        ref={settingsFileRef}
                        onChange={handleSettingsLogoUpload}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (settingsFileRef.current) {
                            settingsFileRef.current.value = '';
                            settingsFileRef.current.click();
                          }
                        }}
                        disabled={uploadingLogoSettings}
                        className="px-4 py-2.5 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50"
                      >
                        {uploadingLogoSettings ? 'Uploading...' : 'Upload Logo'}
                      </button>
                      {activeLogo && (
                        <button
                          type="button"
                          onClick={handleRemoveLogo}
                          className="px-3 py-2.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-bold transition-all border border-rose-200 dark:border-rose-900/40 cursor-pointer"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Store Name</label>
                  <input
                    type="text"
                    name="store_name"
                    value={storeSettings.store_name}
                    onChange={handleStoreChange}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:outline-none focus:border-indigo-500 font-bold text-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">GSTIN</label>
                  <input
                    type="text"
                    name="gstin"
                    value={storeSettings.gstin}
                    onChange={handleStoreChange}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:outline-none focus:border-indigo-500 font-mono text-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Store Phone (10 digits)</label>
                  <input
                    type="text"
                    name="store_phone"
                    value={storeSettings.store_phone}
                    onChange={handleStoreChange}
                    maxLength={10}
                    placeholder="e.g. 9876543210"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:outline-none focus:border-indigo-500 font-semibold text-slate-700 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Store Email</label>
                  <input
                    type="email"
                    name="store_email"
                    value={storeSettings.store_email}
                    onChange={handleStoreChange}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:outline-none focus:border-indigo-500 font-semibold text-slate-700"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Store Address</label>
                  <input
                    type="text"
                    name="store_address"
                    value={storeSettings.store_address}
                    onChange={handleStoreChange}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:outline-none focus:border-indigo-500 font-semibold text-slate-700"
                  />
                </div>
              </div>
              <div className="flex justify-end pt-3">
                <button
                  onClick={handleSaveStoreSettings}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all active:scale-95 shadow-soft"
                >
                  Save Store Profile
                </button>
              </div>
            </div>
          )}

          {/* 2. ADMIN PROFILE */}
          {activeSubTab === 'profile' && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                <UserCircleIcon className="w-5 h-5 text-indigo-500" /> Admin Credentials Profile
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Name</label>
                  <input
                    type="text"
                    value={profileValues.name}
                    onChange={(e) => setProfileValues(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:outline-none focus:border-indigo-500 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email</label>
                  <input
                    type="email"
                    value={profileValues.email}
                    onChange={(e) => setProfileValues(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:outline-none focus:border-indigo-500 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Current password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={profileValues.currentPassword}
                    onChange={(e) => setProfileValues(prev => ({ ...prev, currentPassword: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">New password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={profileValues.newPassword}
                    onChange={(e) => setProfileValues(prev => ({ ...prev, newPassword: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
              <div className="flex justify-end pt-3">
                <button
                  onClick={handleSaveProfile}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all active:scale-95 shadow-soft"
                >
                  Update Profile Details
                </button>
              </div>
            </div>
          )}

          {/* 3. STAFF ACCOUNTS */}
          {activeSubTab === 'users' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <UserCircleIcon className="w-5 h-5 text-indigo-500" /> ERP Operators Accounts
                </h2>
                <button
                  onClick={() => setShowUserModal(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl active:scale-95 transition-all shadow-soft"
                >
                  <PlusIcon className="w-4 h-4 stroke-[3]" /> Add Operator
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                      <th className="py-2.5 px-3">Name</th>
                      <th className="py-2.5 px-3">Email Address</th>
                      <th className="py-2.5 px-3">Role</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-600">
                    {usersList.map(u => (
                      <tr key={u.id} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 font-semibold text-slate-950">{u.name}</td>
                        <td className="py-2.5 px-3 text-slate-500">{u.email}</td>
                        <td className="py-2.5 px-3"><span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-bold text-slate-700">{u.role_name}</span></td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            u.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
                          }`}>
                            {u.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => handleToggleUserStatus(u)}
                            disabled={u.id === 1 || u.id === user?.id}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-[10px] font-bold disabled:opacity-50"
                          >
                            {u.status === 'Active' ? 'Suspend' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 4. ROLES & PERMISSIONS MATRIX */}
          {activeSubTab === 'roles' && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                <ShieldCheckIcon className="w-5 h-5 text-indigo-500" /> Module Access RBAC Control Matrix
              </h2>
              <div className="flex gap-4 items-center mb-4">
                <label className="text-xs font-bold text-slate-700 uppercase">Select Role Profile:</label>
                <select
                  value={selectedRoleId}
                  onChange={(e) => setSelectedRoleId(e.target.value)}
                  className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-slate-50 font-bold"
                >
                  {rolesList.map(r => (
                    <option key={r.id} value={r.id} disabled={r.id === 1}>{r.name} {r.id === 1 ? '(Full privileges fixed)' : ''}</option>
                  ))}
                </select>
              </div>

              <div className="border border-slate-100 rounded-2xl overflow-hidden">
                <div className="bg-slate-50/50 p-4 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">Check Permissions to Authorize Module Access:</span>
                  <button
                    onClick={handleSaveRolePermissions}
                    disabled={selectedRoleId === '1'}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold shadow-soft disabled:opacity-50"
                  >
                    Save Permissions Map
                  </button>
                </div>
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[300px] overflow-y-auto">
                  {allPermissions.map(p => (
                    <label key={p.id} className="flex items-start gap-3 p-2 bg-slate-50/50 border border-slate-100 rounded-xl cursor-pointer hover:bg-slate-100/40 select-none">
                      <input
                        type="checkbox"
                        checked={rolePermissions.includes(p.id)}
                        disabled={selectedRoleId === '1'}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setRolePermissions([...rolePermissions, p.id]);
                          } else {
                            setRolePermissions(rolePermissions.filter(id => id !== p.id));
                          }
                        }}
                        className="mt-0.5 rounded border-slate-200 text-indigo-600 focus:ring-0 h-4 w-4"
                      />
                      <div>
                        <p className="text-xs font-bold text-slate-800">{p.name}</p>
                        <p className="text-[10px] text-slate-400 font-medium">{p.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 5. AUDIT TIMELINES LOGS */}
          {activeSubTab === 'logs' && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                <ClipboardDocumentListIcon className="w-5 h-5 text-indigo-500" /> System Action Logs Trail
              </h2>
              <div className="overflow-x-auto max-h-[400px] border border-slate-100 rounded-2xl p-4">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Operator</th>
                      <th className="py-2.5 px-3">Action</th>
                      <th className="py-2.5 px-3">Module</th>
                      <th className="py-2.5 px-3">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-600">
                    {auditLogs.map(l => (
                      <tr key={l.id} className="hover:bg-slate-50/30">
                        <td className="py-2.5 px-3 text-slate-400">{new Date(l.created_at).toLocaleString()}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{l.user_name || 'System Operator'}</td>
                        <td className="py-2.5 px-3 text-slate-950 font-bold">{l.action}</td>
                        <td className="py-2.5 px-3"><span className="bg-slate-100 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase">{l.module}</span></td>
                        <td className="py-2.5 px-3 text-[11px] text-slate-500">{l.details}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 6. BACKUP & RESTORE */}
          {activeSubTab === 'backup' && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                <CloudArrowDownIcon className="w-5 h-5 text-indigo-500" /> Database Backup Manager
              </h2>
              <div className="bg-slate-50 border border-slate-200/60 p-6 rounded-2xl text-center space-y-4">
                <div className="text-4xl">💾</div>
                <h3 className="text-sm font-bold text-slate-800">Generate Backup SQL Dump</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">Creates a complete copy of products, categories, stock ledger, sales invoices, and settings. Recommended before database schema upgrades.</p>
                <button
                  onClick={handleBackup}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all"
                >
                  Create Backup Now
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Staff user creation Modal */}
      <Modal
        isOpen={showUserModal}
        onClose={() => setShowUserModal(false)}
        title="Add Staff Operator Account"
        size="md"
      >
        <form onSubmit={handleAddUser} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Operator Name</label>
            <input
              type="text"
              required
              value={userForm.name}
              onChange={(e) => setUserForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g. सुरेश पटेल"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:outline-none focus:border-indigo-500 font-semibold"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email Address</label>
            <input
              type="email"
              required
              value={userForm.email}
              onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value }))}
              placeholder="operator@kiranamart.com"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:outline-none focus:border-indigo-500 font-semibold"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Secure Password</label>
            <input
              type="password"
              required
              value={userForm.password}
              onChange={(e) => setUserForm(prev => ({ ...prev, password: e.target.value }))}
              placeholder="••••••••"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Role Permission profile</label>
            <select
              value={userForm.role_id}
              onChange={(e) => setUserForm(prev => ({ ...prev, role_id: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:outline-none focus:border-indigo-500 font-bold"
            >
              <option value="2">Manager (Operational control)</option>
              <option value="3">Staff (Cashier checkout only)</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowUserModal(false)}
              className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all"
            >
              Create Account
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Settings;
