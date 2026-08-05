import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { 
  CreditCardIcon, 
  CalendarIcon, 
  CheckCircleIcon, 
  ArrowPathIcon,
  ShieldCheckIcon,
  ArrowDownTrayIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { billingAPI } from '../../services/api';
import Loader from '../../components/common/Loader';

const PLANS = [
  {
    name: 'Monthly',
    price: 800,
    duration: '1 Month',
    features: ['All inventory modules', 'POS sales & billings', 'Outstanding customer Udhaar ledger', 'Isolated database storage', 'SaaS automatic backups'],
    color: 'from-indigo-500 to-indigo-600',
    popular: false
  },
  {
    name: 'Quarterly',
    price: 2100,
    duration: '3 Months',
    features: ['All inventory modules', 'POS sales & billings', 'Outstanding customer Udhaar ledger', 'Isolated database storage', 'SaaS automatic backups', 'Priority support ticketing'],
    color: 'from-purple-500 to-pink-600',
    popular: false
  },
  {
    name: 'Half-Yearly',
    price: 3600,
    duration: '6 Months',
    features: ['All inventory modules', 'POS sales & billings', 'Outstanding customer Udhaar ledger', 'Isolated database storage', 'SaaS automatic backups', 'Priority support ticketing', 'Detailed performance charts'],
    color: 'from-green-500 to-teal-600',
    popular: false
  },
  {
    name: 'Yearly',
    price: 6000,
    duration: '12 Months',
    features: ['All inventory modules', 'POS sales & billings', 'Outstanding customer Udhaar ledger', 'Isolated database storage', 'SaaS automatic backups', '24/7 dedicated support representative', 'Advanced analytical audits', 'Save ₹3,600 compared to monthly!'],
    color: 'from-amber-500 to-orange-600',
    popular: true
  }
];

const Billing = () => {
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [logs, setLogs] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const wasRedirectedDueToExpiry = location.state?.expired;

  const fetchBillingDetails = async () => {
    try {
      setLoading(true);
      const res = await billingAPI.getStatus();
      if (res.success) {
        setSubscription(res.subscription);
        setInvoices(res.invoices);
        setLogs(res.logs);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch billing status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBillingDetails();
    if (wasRedirectedDueToExpiry) {
      setError('Your SaaS trial or subscription has expired. Please choose a plan below to renew license access.');
    }
  }, [wasRedirectedDueToExpiry]);

  const handleSubscribe = async (planName) => {
    try {
      setSubmitting(true);
      setError('');
      setMessage('');

      // 1. Try Razorpay payment order
      try {
        const orderRes = await billingAPI.createOrder({ planName });
        if (orderRes.success && orderRes.key_id && !orderRes.key_id.startsWith('your_')) {
          const { order_id, amount, currency, key_id } = orderRes;

          const loadScript = () => {
            return new Promise((resolve) => {
              if (window.Razorpay) { resolve(true); return; }
              const script = document.createElement('script');
              script.src = 'https://checkout.razorpay.com/v1/checkout.js';
              script.onload = () => resolve(true);
              script.onerror = () => resolve(false);
              document.body.appendChild(script);
            });
          };

          const scriptLoaded = await loadScript();
          if (scriptLoaded) {
            const options = {
              key: key_id,
              amount: amount,
              currency: currency,
              name: 'Kirana ERP Cloud',
              description: `${planName} License Subscription`,
              order_id: order_id,
              handler: async function (response) {
                try {
                  setSubmitting(true);
                  const verifyRes = await billingAPI.verifyPayment({
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_signature: response.razorpay_signature,
                    planName
                  });

                  if (verifyRes.success) {
                    setMessage(`Subscription activated successfully! Ref: ${response.razorpay_payment_id}`);
                    await fetchBillingDetails();
                    setTimeout(() => { window.location.reload(); }, 1500);
                  } else {
                    setError(verifyRes.message || 'Payment signature verification failed.');
                  }
                } catch (err) {
                  setError(err.response?.data?.message || 'Payment verification failed.');
                } finally {
                  setSubmitting(false);
                }
              },
              prefill: {
                name: subscription?.owner_name || '',
                email: subscription?.email || ''
              },
              theme: { color: '#4F46E5' },
              modal: {
                ondismiss: function () {
                  setSubmitting(false);
                  setError('Payment checkout cancelled.');
                }
              }
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
            return;
          }
        }
      } catch (orderErr) {
        console.warn('[Billing] Razorpay Order Creation bypassed, switching to direct subscription upgrade.', orderErr);
      }

      // 2. Direct Instant Upgrade Fallback
      const subRes = await billingAPI.subscribe({ planName });
      if (subRes.success) {
        setMessage(`Subscription activated successfully on ${planName} plan! Next renewal on ${new Date(subRes.expiresAt).toLocaleDateString()}.`);
        await fetchBillingDetails();
        setTimeout(() => { window.location.reload(); }, 1500);
      } else {
        setError(subRes.message || 'Failed to update subscription');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || err.response?.data?.message || 'Payment processing failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelAutoPay = async () => {
    if (!window.confirm('Are you sure you want to cancel your AutoPay renewal? Your store profile will be suspended at the end of the current billing cycle.')) return;
    try {
      setSubmitting(true);
      const res = await billingAPI.cancel();
      if (res.success) {
        setMessage('AutoPay recurring subscription billing cancelled successfully.');
        await fetchBillingDetails();
      }
    } catch (err) {
      console.error(err);
      setError('Failed to cancel AutoPay settings.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <Loader size="lg" />
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Trial': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'Suspended': return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'Expired': return 'bg-amber-100 text-amber-800 border-amber-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const remainingDays = () => {
    if (!subscription?.subscription_expires_at) return 0;
    const expiry = new Date(subscription.subscription_expires_at);
    const diffTime = expiry - new Date();
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-4 md:p-6 select-none">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">SaaS Subscription & Billing</h1>
          <p className="text-slate-500 mt-1">Manage your recurring store license, invoices, and billing metrics.</p>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`px-4 py-1.5 rounded-full text-sm font-semibold border ${getStatusColor(subscription?.subscription_status)}`}>
            {subscription?.subscription_status} Mode
          </span>
        </div>
      </div>

      {/* Notifications Alert */}
      {message && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-emerald-50 border-l-4 border-emerald-500 text-emerald-800 rounded-r-lg shadow-sm"
        >
          <div className="flex space-x-2">
            <CheckCircleIcon className="h-5 w-5 text-emerald-500 flex-shrink-0" />
            <span>{message}</span>
          </div>
        </motion.div>
      )}

      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-rose-50 border-l-4 border-rose-500 text-rose-800 rounded-r-lg shadow-sm"
        >
          <div className="flex space-x-2">
            <ExclamationTriangleIcon className="h-5 w-5 text-rose-500 flex-shrink-0" />
            <span>{error}</span>
          </div>
        </motion.div>
      )}

      {/* Subscription Metrics Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Metric 1 */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex items-start space-x-4 hover:shadow-md transition-shadow">
          <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
            <CreditCardIcon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-400">Current Plan</p>
            <h2 className="text-xl font-bold text-slate-800 mt-1">{subscription?.subscription_plan}</h2>
            <p className="text-xs text-slate-400 mt-1">Status: {subscription?.subscription_status}</p>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex items-start space-x-4 hover:shadow-md transition-shadow">
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
            <CalendarIcon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-400">Expiry / Renewal Date</p>
            <h2 className="text-xl font-bold text-slate-800 mt-1">
              {subscription?.subscription_expires_at 
                ? new Date(subscription.subscription_expires_at).toLocaleDateString('en-IN', { dateStyle: 'medium' }) 
                : 'Not Started'}
            </h2>
            <p className="text-xs text-slate-400 mt-1">Secure AutoPay extension enabled</p>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex items-start space-x-4 hover:shadow-md transition-shadow">
          <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
            <ClockIcon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-400">Remaining Days</p>
            <h2 className="text-3xl font-extrabold text-slate-800 mt-0.5">{remainingDays()} Days</h2>
            <p className="text-xs text-slate-400 mt-1">Trial/Service period coverage</p>
          </div>
        </div>
      </div>

      {/* Plans Pricing Grid */}
      <div>
        <div className="text-center max-w-xl mx-auto space-y-2 mb-8">
          <h2 className="text-2xl font-bold text-slate-900">Upgrade or Renew Store License</h2>
          <p className="text-slate-500 text-sm">Pick a plan matching your budget. Razorpay gateway guarantees instant activation and secure transaction processing.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {PLANS.map((plan) => (
            <div 
              key={plan.name}
              className={`bg-white border rounded-3xl shadow-sm relative overflow-hidden flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${plan.popular ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-slate-100'}`}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[10px] uppercase font-bold tracking-wider px-4 py-1 rounded-bl-xl shadow-sm animate-pulse">
                  Best Value
                </div>
              )}
              
              <div className="p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">{plan.name}</h3>
                  <div className="flex items-baseline mt-2">
                    <span className="text-4xl font-extrabold text-slate-900">₹{plan.price.toLocaleString('en-IN')}</span>
                    <span className="text-slate-400 text-sm ml-2">/ {plan.duration}</span>
                  </div>
                </div>

                <ul className="space-y-3">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start space-x-2 text-sm text-slate-600">
                      <ShieldCheckIcon className="h-5 w-5 text-indigo-500 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-6 border-t border-slate-50">
                <button
                  disabled={submitting}
                  onClick={() => handleSubscribe(plan.name)}
                  className={`w-full py-3 rounded-2xl font-semibold text-sm transition-all duration-200 ${plan.popular ? 'bg-indigo-600 text-white hover:bg-indigo-750 shadow-lg shadow-indigo-600/20' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'} disabled:opacity-50`}
                >
                  {submitting ? 'Processing Payment...' : `Subscribe to ${plan.name}`}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AutoPay settings */}
      {subscription?.subscription_plan !== 'Trial' && subscription?.subscription_status === 'Active' && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
          <div>
            <h3 className="text-lg font-bold text-slate-800">AutoPay Settings</h3>
            <p className="text-slate-500 text-sm mt-0.5">Cancel recurring AutoPay if you plan to close or pause the Kirana store subscription license.</p>
          </div>
          <button
            disabled={submitting}
            onClick={handleCancelAutoPay}
            className="px-6 py-2.5 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl font-semibold text-sm hover:bg-rose-100 transition-all duration-200 disabled:opacity-50"
          >
            Cancel Recurring Autopay
          </button>
        </div>
      )}

      {/* Invoices and logs section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Invoices */}
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-50 flex items-center space-x-2">
            <ArrowDownTrayIcon className="h-5 w-5 text-indigo-500" />
            <h3 className="text-lg font-bold text-slate-800">Payment Invoices & Statements</h3>
          </div>
          <div className="overflow-x-auto">
            {invoices.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-sm">No transactions logs found.</div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[11px] tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-6">Transaction ID</th>
                    <th className="py-3 px-6">Plan</th>
                    <th className="py-3 px-6">Amount</th>
                    <th className="py-3 px-6">Date</th>
                    <th className="py-3 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/50">
                      <td className="py-3.5 px-6 font-mono text-xs text-indigo-600 font-semibold">{inv.transaction_id}</td>
                      <td className="py-3.5 px-6 text-slate-800 font-semibold">{inv.plan}</td>
                      <td className="py-3.5 px-6 text-slate-900 font-bold">₹{Number(inv.amount).toLocaleString('en-IN')}</td>
                      <td className="py-3.5 px-6 text-slate-500 font-medium">
                        {new Date(inv.billing_date).toLocaleDateString('en-IN', { dateStyle: 'short' })}
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        <a
                          href={`/api/billing/invoice/${inv.id}/download`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-850"
                        >
                          <ArrowDownTrayIcon className="w-3.5 h-3.5 stroke-[2.5]" /> Invoice
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Subscription Logs */}
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-50 flex items-center space-x-2">
            <ArrowPathIcon className="h-5 w-5 text-indigo-500" />
            <h3 className="text-lg font-bold text-slate-800">Subscription Lifecycle History</h3>
          </div>
          <div className="p-6 space-y-6 max-h-[300px] overflow-y-auto">
            {logs.length === 0 ? (
              <div className="text-center text-slate-400 text-sm">No subscription changes recorded.</div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="flex space-x-3 text-sm">
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-1.5 flex-shrink-0" />
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-slate-800">{log.action}</span>
                      <span className="text-xs text-slate-400">
                        {new Date(log.created_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                    </div>
                    <p className="text-slate-600 text-xs leading-relaxed">{log.description}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

export default Billing;
