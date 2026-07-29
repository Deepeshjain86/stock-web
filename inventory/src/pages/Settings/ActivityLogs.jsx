import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ClockIcon, 
  MagnifyingGlassIcon, 
  UserIcon, 
  ArrowPathIcon,
  PrinterIcon,
  DocumentArrowDownIcon,
  CalendarIcon,
  ComputerDesktopIcon,
  CpuChipIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  TagIcon,
  ShieldCheckIcon,
  Squares2X2Icon,
  InboxIcon
} from '@heroicons/react/24/outline';
import { usersAPI, activityLogsAPI } from '../../services/api';
import { useAppSelector } from '../../store/hooks';

const ActivityLogs = () => {
  const { user } = useAppSelector((state) => state.auth);
  
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [usersList, setUsersList] = useState([]);
  const [dbOffline, setDbOffline] = useState(false);

  // Filters state
  const [filterUser, setFilterUser] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterModule, setFilterModule] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDateRange, setFilterDateRange] = useState('all');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Selected Log for detail modal
  const [selectedLog, setSelectedLog] = useState(null);

  // Date ranges presets
  useEffect(() => {
    if (filterDateRange === 'all') {
      setFilterDateFrom('');
      setFilterDateTo('');
    } else if (filterDateRange === 'today') {
      const todayStr = new Date().toISOString().split('T')[0];
      setFilterDateFrom(todayStr);
      setFilterDateTo(todayStr);
    } else if (filterDateRange === 'week') {
      const lastWeek = new Date(Date.now() - 7 * 24 * 3600000).toISOString().split('T')[0];
      const todayStr = new Date().toISOString().split('T')[0];
      setFilterDateFrom(lastWeek);
      setFilterDateTo(todayStr);
    } else if (filterDateRange === 'month') {
      const lastMonth = new Date(Date.now() - 30 * 24 * 3600000).toISOString().split('T')[0];
      const todayStr = new Date().toISOString().split('T')[0];
      setFilterDateFrom(lastMonth);
      setFilterDateTo(todayStr);
    }
  }, [filterDateRange]);

  // Load logs and staff lists
  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = {
        user_id: filterUser,
        role: filterRole,
        department: filterDepartment,
        module: filterModule,
        action: filterAction,
        status: filterStatus,
        date_from: filterDateFrom,
        date_to: filterDateTo,
        search_query: searchTerm
      };

      const res = await activityLogsAPI.getAll(params).catch(() => ({ success: false }));
      if (res?.success) {
        setLogs(res.logs || []);
      }
      
      const canManageUsers = user?.role === 'Admin' || user?.permissions?.includes('manage_users') || user?.permissions?.includes('view_staff');
      if (canManageUsers) {
        const userRes = await usersAPI.getAll().catch(() => ({ success: false }));
        if (userRes?.success) {
          setUsersList(userRes.users || []);
        }
      }
      setDbOffline(false);
    } catch (err) {
      console.warn('Activity Logs API failed, loading offline mocks.', err);
      setDbOffline(true);
      setLogs([
        {
          id: 1,
          user_id: 2,
          user_name: 'Ramesh Patel',
          role: 'Employee',
          department: 'Sales',
          action: 'Create Sale',
          module: 'Sales',
          details: 'Generated POS sale invoice "INV-2026-0039" for Aman Kumar',
          record_id: 'INV-2026-0039',
          ip_address: '192.168.1.45',
          device_info: 'Chrome 125.0.0 / Windows 11',
          session_id: 'sess_93u48fhs74fhs',
          status: 'Success',
          created_at: new Date().toISOString()
        },
        {
          id: 2,
          user_id: 1,
          user_name: 'Deepesh Jain',
          role: 'Admin',
          department: 'Management',
          action: 'Adjust Stock',
          module: 'Stock',
          details: 'Manually adjusted stock of Fortune Soyabean Oil 1L by +10. Reason: Manual Recount',
          record_id: 'GRO-FORT-SOY',
          previous_value: '{"quantity": 12}',
          new_value: '{"quantity": 22}',
          ip_address: '192.168.1.100',
          device_info: 'Firefox 126.0 / macOS Sonoma',
          session_id: 'sess_0834hfasd89723',
          status: 'Success',
          created_at: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: 3,
          user_id: 3,
          user_name: 'Karan Malhotra',
          role: 'Sales Manager',
          department: 'Sales',
          action: 'Failed Login Attempt',
          module: 'Auth',
          details: 'Login attempt failed. Invalid password supplied for karan@kiranastore.com',
          record_id: 'karan@kiranastore.com',
          ip_address: '103.45.12.87',
          device_info: 'Chrome Mobile 124.0 / Android 14',
          session_id: null,
          status: 'Failed',
          created_at: new Date(Date.now() - 3600000 * 5).toISOString()
        }
      ]);
      setUsersList([
        { id: 1, name: 'Deepesh Jain', role: 'Admin', department: 'Management' },
        { id: 2, name: 'Ramesh Patel', role: 'Employee', department: 'Sales' },
        { id: 3, name: 'Karan Malhotra', role: 'Sales Manager', department: 'Sales' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filterUser, filterRole, filterDepartment, filterModule, filterAction, filterStatus, filterDateFrom, filterDateTo]);

  // Compute widgets statistics
  const stats = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayLogs = logs.filter(l => l.created_at.startsWith(todayStr));
    const activeOperators = new Set(logs.map(l => l.user_id)).size;
    const failedAttempts = logs.filter(l => l.status === 'Failed' || l.action.toLowerCase().includes('failed')).length;
    
    // Most active operator calculation
    const counts = {};
    logs.forEach(l => {
      if (l.user_name) counts[l.user_name] = (counts[l.user_name] || 0) + 1;
    });
    let mostActive = 'N/A';
    let max = 0;
    Object.entries(counts).forEach(([name, val]) => {
      if (val > max) {
        max = val;
        mostActive = name;
      }
    });

    return {
      todayCount: todayLogs.length,
      activeOperators,
      failedAttempts,
      mostActive: max > 0 ? `${mostActive} (${max} actions)` : 'N/A'
    };
  }, [logs]);

  // Get DOT color based on operation type or status
  const getLogDotColor = (log) => {
    if (log.status === 'Failed') return 'bg-rose-500 ring-rose-200 dark:ring-rose-900/50';
    const action = log.action.toLowerCase();
    if (action.includes('create') || action.includes('add') || action.includes('login')) {
      return 'bg-emerald-500 ring-emerald-250 dark:ring-emerald-900/50';
    }
    if (action.includes('update') || action.includes('modify') || action.includes('edit')) {
      return 'bg-indigo-500 ring-indigo-200 dark:ring-indigo-900/50';
    }
    if (action.includes('delete') || action.includes('remove') || action.includes('void')) {
      return 'bg-rose-500 ring-rose-200 dark:ring-rose-900/50';
    }
    return 'bg-slate-400 ring-slate-200 dark:ring-slate-800';
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (logs.length === 0) return;
    const headers = ['Date', 'Operator Name', 'Role', 'Department', 'Action', 'Module', 'Details', 'Record ID', 'IP Address', 'Device', 'Status'];
    const rows = logs.map(l => [
      new Date(l.created_at).toLocaleString(),
      l.user_name || 'System',
      l.role || 'N/A',
      l.department || 'N/A',
      l.action,
      l.module,
      l.details || '',
      l.record_id || '',
      l.ip_address || '',
      l.device_info || '',
      l.status
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `activity_audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12 select-none font-sans bg-slate-50 dark:bg-slate-950 p-4 rounded-3xl print:bg-white print:p-0">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm print:hidden">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span className="p-1.5 bg-[#1B6E4C] rounded-lg text-white">🛡️</span>
            Activity Logs & Audit Trail
          </h1>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">Automated, tamper-proof audit trails mapping all administrative changes.</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={fetchLogs} 
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-805 transition-all active:scale-95 cursor-pointer"
          >
            <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh Logs
          </button>
        </div>
      </div>

      {dbOffline && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 text-amber-850 text-xs font-semibold print:hidden">
          ⚠️ Running in Offline Simulation Mode. Viewing mock audit trails logs.
        </div>
      )}

      {/* STATS SUMMARY PANEL */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:grid-cols-4">
        <StatsCard title="Today's Actions" value={stats.todayCount} icon={ClockIcon} subtext="Logs created today" color="blue" />
        <StatsCard title="Active Operators" value={stats.activeOperators} icon={UserIcon} subtext="Staff logged activity" color="green" />
        <StatsCard title="Failed Attempts" value={stats.failedAttempts} icon={ExclamationCircleIcon} subtext="Security triggers count" color="red" />
        <StatsCard title="Most Active Operator" value={stats.mostActive} icon={Squares2X2Icon} subtext="Peak operational staff" color="purple" />
      </div>

      {/* FILTER & TIMELINE DASHBOARD */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-6">
        
        {/* Filters & Exports */}
        <div className="flex flex-col gap-4 border-b border-slate-100 dark:border-slate-800 pb-5 print:hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">
              Audit timeline records
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-250 dark:border-slate-800 text-[10px] font-black tracking-wider uppercase rounded-xl hover:bg-slate-50 dark:hover:bg-slate-805 text-slate-700 dark:text-slate-350 bg-white cursor-pointer"
              >
                <DocumentArrowDownIcon className="w-3.5 h-3.5" /> Export Logs CSV
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-250 dark:border-slate-800 text-[10px] font-black tracking-wider uppercase rounded-xl hover:bg-slate-50 dark:hover:bg-slate-805 text-slate-700 dark:text-slate-350 bg-white cursor-pointer"
              >
                <PrinterIcon className="w-3.5 h-3.5" /> Print Statement
              </button>
            </div>
          </div>

          {/* Filters Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80">
            
            {/* Search Input */}
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-[8px] font-black text-slate-400 uppercase mb-0.5">Keyword Search</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Reference / text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-7 pr-2.5 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-[10px] font-bold bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none"
                />
                <MagnifyingGlassIcon className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2" />
              </div>
            </div>

            {/* Operator User */}
            <div>
              <label className="block text-[8px] font-black text-slate-400 uppercase mb-0.5">Operator (User)</label>
              <select
                value={filterUser}
                onChange={(e) => setFilterUser(e.target.value)}
                className="w-full px-2 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-[10px] font-bold bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="">All Users</option>
                {usersList.map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>

            {/* Operator Role */}
            <div>
              <label className="block text-[8px] font-black text-slate-400 uppercase mb-0.5">Operator Role</label>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="w-full px-2 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-[10px] font-bold bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="">All Roles</option>
                <option value="Super Admin">Super Admin</option>
                <option value="Admin">Admin</option>
                <option value="Sales Manager">Sales Manager</option>
                <option value="Purchase Manager">Purchase Manager</option>
                <option value="Employee">Employee</option>
              </select>
            </div>

            {/* Module Name */}
            <div>
              <label className="block text-[8px] font-black text-slate-400 uppercase mb-0.5">ERP Module</label>
              <select
                value={filterModule}
                onChange={(e) => setFilterModule(e.target.value)}
                className="w-full px-2 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-[10px] font-bold bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="">All Modules</option>
                <option value="Auth">Auth & Logins</option>
                <option value="Products">Products Master</option>
                <option value="Categories">Categories Master</option>
                <option value="Vendors">Supplier Master</option>
                <option value="Stock">Stock & Adjustments</option>
                <option value="Purchase">Purchases Intake</option>
                <option value="Sales">Sales (POS Check)</option>
                <option value="Users">Staff / Employee</option>
                <option value="Billing">SaaS Subscription</option>
                <option value="Settings">System Settings</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-[8px] font-black text-slate-400 uppercase mb-0.5">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-2 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-[10px] font-bold bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="">All Statuses</option>
                <option value="Success">Success</option>
                <option value="Failed">Failed</option>
              </select>
            </div>

            {/* Date range selection */}
            <div>
              <label className="block text-[8px] font-black text-slate-400 uppercase mb-0.5">Date Filter</label>
              <select
                value={filterDateRange}
                onChange={(e) => setFilterDateRange(e.target.value)}
                className="w-full px-2 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-[10px] font-bold bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="all">Lifetime Audit</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="custom">Custom Date</option>
              </select>
            </div>

          </div>

          {/* Custom Date Filters */}
          {filterDateRange === 'custom' && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="grid grid-cols-2 gap-4 max-w-md pt-1"
            >
              <div>
                <label className="block text-[8px] font-black text-slate-400 uppercase mb-0.5">From Date</label>
                <input
                  type="date"
                  value={filterDateFrom}
                  onChange={(e) => setFilterDateFrom(e.target.value)}
                  className="w-full px-2.5 py-1 text-[10px] border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-emerald-600"
                />
              </div>
              <div>
                <label className="block text-[8px] font-black text-slate-400 uppercase mb-0.5">To Date</label>
                <input
                  type="date"
                  value={filterDateTo}
                  onChange={(e) => setFilterDateTo(e.target.value)}
                  className="w-full px-2.5 py-1 text-[10px] border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-emerald-600"
                />
              </div>
            </motion.div>
          )}

        </div>

        {/* Print Header Report */}
        <div className="hidden print:block border-b-2 border-slate-800 pb-4 mb-4">
          <h2 className="text-xl font-bold text-slate-950">Kirana ERP - Activity Logs Audit Statement</h2>
          <div className="grid grid-cols-2 text-xs font-semibold mt-2 text-slate-650 gap-1">
            <p>Generated By: <span className="text-slate-950 font-black">{user?.name} ({user?.role})</span></p>
            <p>Statement Range: <span className="text-slate-950 font-black">{filterDateRange === 'all' ? 'Lifetime' : `${filterDateFrom} to ${filterDateTo}`}</span></p>
            <p>Statement Date: <span className="text-slate-950 font-black">{new Date().toLocaleString()}</span></p>
            <p>Total logged activities: <span className="text-slate-950 font-black">{logs.length} operations</span></p>
          </div>
        </div>

        {/* TIMELINE LIST */}
        {loading ? (
          <div className="py-24 text-center">
            <span className="text-sm font-semibold text-slate-500 animate-pulse uppercase tracking-wider">
              Compiling audit logs trail database...
            </span>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center flex flex-col items-center justify-center">
            <InboxIcon className="w-12 h-12 text-slate-350 stroke-[1.2] mb-2" />
            <p className="text-sm font-black text-slate-450 uppercase tracking-wider">No audit logs matching selection</p>
            <p className="text-[10px] text-slate-400 font-semibold mt-1">Activities are generated automatically on operations.</p>
          </div>
        ) : (
          <div className="relative border-l-2 border-slate-150 dark:border-slate-800 ml-4 pl-8 py-2 space-y-6">
            {logs.map((log) => (
              <div 
                key={log.id} 
                className="relative group cursor-pointer"
                onClick={() => setSelectedLog(log)}
              >
                {/* Dot marker */}
                <div className={`absolute -left-[41px] top-1.5 w-6 h-6 rounded-full border-4 border-white dark:border-slate-900 ring-2 shadow-sm flex items-center justify-center transition-all group-hover:scale-110 ${getLogDotColor(log)}`}>
                  {log.status === 'Failed' ? (
                    <span className="text-white text-[10px] font-black">!</span>
                  ) : (
                    <span className="text-white text-[10px] font-black">✓</span>
                  )}
                </div>

                {/* Timeline Card */}
                <div className="bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800/80 rounded-2xl p-4 shadow-soft hover:shadow hover:border-emerald-350 transition-all">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                        {log.user_name || 'System / Scheduler'}
                      </span>
                      <span className="text-[9px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-850 px-2 py-0.5 rounded font-mono">
                        {log.role}
                      </span>
                      {log.department && (
                        <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-mono uppercase tracking-wide">
                          {log.department}
                        </span>
                      )}
                      {log.shop_name && (
                        <span className="text-[9px] font-bold text-indigo-700 bg-indigo-50 dark:bg-indigo-950/30 dark:text-indigo-300 px-2 py-0.5 rounded font-mono uppercase tracking-wide">
                          🏪 {log.shop_name}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 tabular-nums">
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                  </div>

                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300 leading-relaxed mb-3">
                    {log.details || log.action}
                  </p>

                  <div className="flex flex-wrap items-center justify-between gap-4 text-[9px] text-slate-400 border-t border-slate-100 dark:border-slate-850 pt-2.5 font-bold">
                    <div className="flex flex-wrap items-center gap-4">
                      {log.ip_address && (
                        <span className="flex items-center gap-1">
                          <ComputerDesktopIcon className="w-3 h-3 text-slate-400" /> IP: {log.ip_address}
                        </span>
                      )}
                      {log.device_info && (
                        <span className="flex items-center gap-1 max-w-[250px] truncate">
                          <CpuChipIcon className="w-3 h-3 text-slate-400" /> {log.device_info}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-850 text-slate-500 rounded font-mono uppercase">
                        {log.module}
                      </span>
                      {log.record_id && (
                        <span className="px-2 py-0.5 bg-[#1B6E4C]/10 text-[#1B6E4C] rounded font-mono">
                          ID: {log.record_id}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}

      </div>

      {/* DETAIL MODAL WITH DIFF */}
      <Modal
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title="Audit log transaction specifications"
        size="xl"
      >
        {selectedLog && (
          <div className="p-6 space-y-5 select-none text-xs font-semibold text-slate-700">
            
            {/* Header info */}
            <div className="bg-slate-50 border border-slate-150 p-4 rounded-xl space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Action Performed</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-black ${selectedLog.status === 'Success' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'}`}>
                  {selectedLog.status}
                </span>
              </div>
              <h4 className="text-sm font-black text-slate-900">{selectedLog.action}</h4>
              <p className="text-slate-600 leading-relaxed font-bold">{selectedLog.details}</p>
            </div>

            {/* Operator dossier */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 p-3.5 border border-slate-150 rounded-xl bg-white">
                <h5 className="text-[9px] font-black text-[#1B6E4C] uppercase tracking-wider mb-1">Operator Profile</h5>
                <p>User Name: <span className="text-slate-900 font-black">{selectedLog.user_name || 'System'} (ID: {selectedLog.user_id || 'SYSTEM'})</span></p>
                <p>Role: <span className="text-slate-900 font-bold">{selectedLog.role}</span></p>
                <p>Department: <span className="text-slate-900 font-bold">{selectedLog.department || 'N/A'}</span></p>
                {selectedLog.shop_name && <p>Shop Name: <span className="text-slate-900 font-bold">{selectedLog.shop_name}</span></p>}
              </div>

              <div className="space-y-1.5 p-3.5 border border-slate-150 rounded-xl bg-white">
                <h5 className="text-[9px] font-black text-[#1B6E4C] uppercase tracking-wider mb-1">Session Context</h5>
                <p>Session Ref: <span className="text-slate-900 font-mono font-bold">{selectedLog.session_id || 'N/A'}</span></p>
                <p>Client device: <span className="text-slate-900 font-bold truncate block">{selectedLog.device_info || 'N/A'}</span></p>
                <p>IP Address: <span className="text-slate-900 font-mono font-bold">{selectedLog.ip_address || 'N/A'}</span></p>
              </div>
            </div>

            {/* Mapped modifications / Values comparison */}
            {(selectedLog.previous_value || selectedLog.new_value) && (
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <h5 className="text-[10px] font-black text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                  🔍 State Modifications Details
                </h5>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-[11px] leading-tight">
                  <div className="space-y-1.5">
                    <span className="block text-[9px] font-bold text-slate-400 uppercase">Previous State Value</span>
                    <pre className="p-3 bg-slate-50 border border-slate-200 rounded-xl overflow-x-auto text-slate-700 max-h-48 font-bold">
                      {selectedLog.previous_value 
                        ? JSON.stringify(JSON.parse(selectedLog.previous_value), null, 2) 
                        : 'No initial record state stored.'}
                    </pre>
                  </div>

                  <div className="space-y-1.5">
                    <span className="block text-[9px] font-bold text-slate-400 uppercase">New State Value</span>
                    <pre className="p-3 bg-slate-50 border border-slate-200 rounded-xl overflow-x-auto text-slate-800 max-h-48 font-bold">
                      {selectedLog.new_value 
                        ? JSON.stringify(JSON.parse(selectedLog.new_value), null, 2) 
                        : 'No finalized record state stored.'}
                    </pre>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-2 justify-end pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer"
              >
                Close Specifications
              </button>
            </div>

          </div>
        )}
      </Modal>

    </div>
  );
};

export default ActivityLogs;
