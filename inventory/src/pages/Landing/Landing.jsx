


import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { toggleTheme } from '../../store/slices/themeSlice';
import ThemeToggle from '../../components/common/ThemeToggle';
import {
  SunIcon,
  MoonIcon,
  ArrowRightIcon,
  SparklesIcon,
  Squares2X2Icon,
  ChevronDownIcon,
  BookOpenIcon,
  GlobeAltIcon,
  ChatBubbleLeftRightIcon,
  QrCodeIcon,
  TruckIcon,
  BellAlertIcon,
  ChartBarIcon,
  StarIcon,
  DevicePhoneMobileIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { AreaChart, Area, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid, XAxis, YAxis } from 'recharts';

// ---------------------------------------------------------------------------
// Palette (see tailwind arbitrary values used throughout):
//   brand        #1B6E4C   deep grocery green — trust, cash, fresh stock
//   brand-dark   #14523A
//   brand-tint   #EAF3EE
//   marigold     #E7A23A   festive Indian shopfront accent — CTAs, highlights
//   marigold-dk  #C7841F
//   ledger-ink   #24365A   navy ink — the credit register writing colour
//   brick        #B54C2C   warm data accent (alerts, third chart series)
//   paper        #F6F7F2   light background, faint green undertone
//   forest-950   #101A15   dark-mode background (brand-tinted, not slate)
// ---------------------------------------------------------------------------

const Landing = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const { theme, isDarkMode } = useAppSelector((state) => state.theme);
  const toggleThemeAction = () => dispatch(toggleTheme());
  const [lang, setLang] = useState('EN');
  const [openFaq, setOpenFaq] = useState(0);

  const previewChartData = [
    { name: 'Mon', Sales: 12000 },
    { name: 'Tue', Sales: 19000 },
    { name: 'Wed', Sales: 17000 },
    { name: 'Thu', Sales: 24000 },
    { name: 'Fri', Sales: 22000 },
    { name: 'Sat', Sales: 30000 },
    { name: 'Sun', Sales: 40000 }
  ];

  const previewPieData = [
    { name: 'Groceries', value: 45, color: '#1B6E4C' },
    { name: 'Snacks', value: 25, color: '#E7A23A' },
    { name: 'Beverages', value: 15, color: '#24365A' },
    { name: 'Others', value: 15, color: '#B54C2C' }
  ];

  const khataCustomers = [
    { name: 'Suresh Auto Works', due: 4250, status: 'due', last: '3 days ago' },
    { name: 'Meena Beauty Parlour', due: 1180, status: 'due', last: 'Today' },
    { name: 'Patel Tiffin Service', due: 0, status: 'clear', last: 'Yesterday' },
    { name: 'Rajesh (Flat 4B)', due: 620, status: 'due', last: '1 week ago' }
  ];

  const modules = [
    { icon: <QrCodeIcon className="w-5 h-5" />, label: 'POS Billing', desc: 'Barcode & weighing-scale ready' },
    { icon: <Squares2X2Icon className="w-5 h-5" />, label: 'Inventory', desc: 'Stock, batches & expiry dates' },
    { icon: <TruckIcon className="w-5 h-5" />, label: 'Purchases', desc: 'Supplier orders & payables' },
    { icon: <BookOpenIcon className="w-5 h-5" />, label: 'Credit Ledger', desc: 'Digital customer credit book' },
    { icon: <ChartBarIcon className="w-5 h-5" />, label: 'Reports', desc: 'GST-ready sales & profit' },
    { icon: <ChatBubbleLeftRightIcon className="w-5 h-5" />, label: 'WhatsApp Alerts', desc: 'Bills, reminders, low stock' }
  ];

  const testimonials = [
    { name: 'Ramesh Gupta', store: 'Gupta Kirana Store, Lucknow', quote: 'My entire customer credit list is now on my phone. I send WhatsApp reminders in seconds, and payments arrive on time.', rating: 5 },
    { name: 'Anita Sharma', store: 'Sharma General Store, Indore', quote: 'We now know about expiring items before it is too late. Our wastage has dropped sharply in the last two months.', rating: 5 },
    { name: 'Farhan Sheikh', store: 'Sheikh Provision Store, Pune', quote: 'GST reports used to take a full day. Now they are ready in one click, and my accountant is happy too.', rating: 4 }
  ];

  const faqs = [
    { q: 'Will it work without the internet?', a: 'Yes. Billing and stock updates work offline, and your data syncs automatically when the connection is restored.' },
    { q: 'Is the app available in Hindi too?', a: 'Yes. The dashboard and billing screen can switch between Hindi and English with a single tap.' },
    { q: 'How much training will my staff need?', a: 'Very little. The POS billing screen is as simple as a calculator, so most store teams become comfortable within a day.' },
    { q: 'Can I import data from my old stock register?', a: 'Yes. You can import your current stock from Excel or CSV, and the onboarding team can help you set it up.' }
  ];

  return (
    <div className="min-h-screen bg-[#F6F7F2] text-[#182A20] dark:bg-[#101A15] dark:text-[#EAF3EE] font-sans antialiased overflow-x-hidden transition-colors duration-300">

      {/* 1. Header Navbar */}
      <header className="sticky top-0 z-50 bg-[#F6F7F2]/85 dark:bg-[#101A15]/85 backdrop-blur-md border-b border-[#1B6E4C]/10 dark:border-[#EAF3EE]/10 px-8 py-4 flex items-center justify-between transition-all duration-300">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Stock Management Logo" className="h-10 w-10 object-contain" />
          <div>
            <h1 className="text-base font-black tracking-wide leading-none">Stock Management</h1>
            <p className="text-[10px] font-bold text-[#5C7A6B] dark:text-[#8FAE9C] mt-0.5">Store Management Built for Indian Shops</p>
          </div>
        </div>

        <nav className="hidden lg:flex items-center gap-8 text-xs font-extrabold text-[#4A6357] dark:text-[#9FBBA9]">
          <a href="#features" className="hover:text-[#1B6E4C] dark:hover:text-[#4FBE8B] transition-colors">Features</a>
          <a href="#khata" className="hover:text-[#1B6E4C] dark:hover:text-[#4FBE8B] transition-colors">Credit Ledger</a>
          <a href="#modules" className="hover:text-[#1B6E4C] dark:hover:text-[#4FBE8B] transition-colors">Modules</a>
          <a href="#pricing" className="hover:text-[#1B6E4C] dark:hover:text-[#4FBE8B] transition-colors">Pricing</a>
          <a href="#testimonials" className="hover:text-[#1B6E4C] dark:hover:text-[#4FBE8B] transition-colors">Stories</a>
          <a href="#faq" className="hover:text-[#1B6E4C] dark:hover:text-[#4FBE8B] transition-colors">FAQ</a>
        </nav>

        <div className="flex items-center gap-2.5">
          
          {/* Light/Dark Toggle */}
          <ThemeToggle />

          <Link
            to={isAuthenticated ? '/dashboard' : '/login'}
            className="flex items-center gap-1.5 px-5 py-2 bg-[#1B6E4C] hover:bg-[#14523A] text-white rounded-xl text-xs font-black shadow-md shadow-[#1B6E4C]/25 active:scale-95 transition-all"
          >
            Sign In <ArrowRightIcon className="w-3.5 h-3.5 stroke-[2.5]" />
          </Link>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative pt-16 pb-20 px-6 max-w-7xl mx-auto flex flex-col xl:flex-row gap-10 items-center">

        <div className="absolute top-10 left-1/4 -translate-x-1/2 w-96 h-96 rounded-full bg-gradient-to-tr from-[#E7A23A]/10 to-[#1B6E4C]/15 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-10 right-1/4 translate-x-1/2 w-[400px] h-[400px] rounded-full bg-gradient-to-br from-[#24365A]/10 to-[#1B6E4C]/15 blur-[150px] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex-1 space-y-6 text-center xl:text-left z-10"
        >
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#FBF0DC] border border-[#E7A23A]/30 text-[#C7841F] dark:bg-[#3A2E14] dark:border-[#E7A23A]/30 dark:text-[#E7A23A] text-xs font-black">
            <SparklesIcon className="w-3.5 h-3.5" /> Billing, Credit, and GST in One Place
          </div>

          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black leading-[1.1] tracking-tight">
            Run Your Stock Management <br />
            <span className="text-[#E7A23A]">Smarter,</span>{' '}
            <span className="text-[#24365A] dark:text-[#7C93BE]">Faster,</span>{' '}
            <span className="text-[#1B6E4C]">Better</span>
          </h2>

          <p className="text-[#4A6357] dark:text-[#9FBBA9] text-sm md:text-base leading-relaxed max-w-xl mx-auto xl:mx-0 font-medium">
            Manage inventory, POS billing, customer credit, supplier payments, and GST-ready reports in one simple system that works in Hindi or English, online or offline.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center xl:justify-start">
            <Link
              to="/login"
              className="flex items-center justify-center gap-2 px-6 py-3 bg-[#1B6E4C] hover:bg-[#14523A] text-white rounded-2xl text-xs font-bold shadow-lg shadow-[#1B6E4C]/25 active:scale-[0.98] transition-all"
            >
              Start Free Demo <ArrowRightIcon className="w-4 h-4 stroke-[2.5]" />
            </Link>
            <a
              href="#features"
              className="flex items-center justify-center gap-2 px-6 py-3 bg-white border border-[#1B6E4C]/15 hover:bg-[#EAF3EE] text-[#182A20] dark:bg-[#16241C] dark:border-[#EAF3EE]/10 dark:hover:bg-[#1D2E23] dark:text-[#EAF3EE] rounded-2xl text-xs font-bold shadow-sm transition-all"
            >
              <Squares2X2Icon className="w-4 h-4 text-[#5C7A6B] dark:text-[#8FAE9C]" /> Explore Features
            </a>
          </div>

          <div className="flex items-center justify-center xl:justify-start gap-4 pt-4">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <StarIcon key={i} className="w-4 h-4 text-[#E7A23A] fill-[#E7A23A]" />
              ))}
            </div>
            <p className="text-xs font-bold text-[#4A6357] dark:text-[#9FBBA9]">
              <span className="text-[#1B6E4C] dark:text-[#4FBE8B] font-extrabold">5,000+</span> kirana stores across India
            </p>
          </div>
        </motion.div>

        {/* Embedded dashboard preview */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex-1 w-full max-w-2xl bg-gradient-to-tr from-[#E7A23A]/10 via-[#24365A]/5 to-[#1B6E4C]/10 p-2.5 rounded-[2rem] border border-[#1B6E4C]/10 dark:border-[#EAF3EE]/10 shadow-2xl relative z-10"
        >
          <div className="absolute inset-0 bg-[#1B6E4C]/5 blur-[80px] -z-10 rounded-full" />

          <div className="w-full bg-white dark:bg-[#16241C] border border-[#1B6E4C]/10 dark:border-[#EAF3EE]/10 rounded-3xl overflow-hidden flex shadow-sm h-[400px]">

            <div className="w-[120px] sm:w-[150px] border-r border-[#1B6E4C]/10 dark:border-[#EAF3EE]/10 bg-[#F6F7F2] dark:bg-[#101A15]/60 p-3.5 flex flex-col justify-between select-none">
              <div className="space-y-4">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm bg-[#1B6E4C] text-white p-1 rounded">🛒</span>
                  <span className="text-[10px] font-black truncate">Kirana ESRP</span>
                </div>

                <div className="space-y-1">
                  {[
                    { label: 'Dashboard', active: true, icon: '📊' },
                    { label: 'POS Billing', active: false, icon: '🧾' },
                    { label: 'Inventory', active: false, icon: '📦' },
                    { label: 'Credit Ledger', active: false, icon: '📒' },
                    { label: 'Purchase', active: false, icon: '🚚' },
                    { label: 'Customers', active: false, icon: '👥' },
                    { label: 'Reports', active: false, icon: '📈' },
                    { label: 'Settings', active: false, icon: '⚙️' }
                  ].map((navItem) => (
                    <div
                      key={navItem.label}
                      className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[9px] font-bold transition-all ${
                        navItem.active
                          ? 'bg-[#EAF3EE] text-[#1B6E4C] dark:bg-[#1D2E23] dark:text-[#4FBE8B]'
                          : 'text-[#8FA79A] hover:text-[#182A20] dark:hover:text-[#EAF3EE]'
                      }`}
                    >
                      <span className="text-[10px]">{navItem.icon}</span>
                      <span className="hidden sm:inline truncate">{navItem.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-2 bg-[#FBF0DC] dark:bg-[#3A2E14] border border-[#E7A23A]/30 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between text-[7px] font-black text-[#C7841F] dark:text-[#E7A23A]">
                  <span>Business Plan</span>
                  <span className="bg-[#E7A23A] text-white px-1 rounded-sm uppercase tracking-wide scale-[0.85]">Premium</span>
                </div>
                <p className="text-[6px] text-[#8FA79A] font-bold truncate">Valid till 30 Dec 2026</p>
                <div className="text-[7px] font-black text-[#C7841F] dark:text-[#E7A23A] flex items-center justify-between hover:underline cursor-pointer">
                  <span>Upgrade Plan</span>
                  <span>→</span>
                </div>
              </div>
            </div>

            <div className="flex-1 bg-[#FAFBF9] dark:bg-[#101A15] p-4 overflow-y-auto scrollbar-thin space-y-4">

              <div className="flex justify-between items-center pb-2 border-b border-[#1B6E4C]/10 dark:border-[#EAF3EE]/10">
                <div>
                  <h4 className="text-[11px] font-black">Dashboard</h4>
                  <p className="text-[8px] font-bold text-[#8FA79A] mt-0.5">Welcome back, Ramesh 👋</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 px-2 py-1 bg-white dark:bg-[#16241C] border border-[#1B6E4C]/10 dark:border-[#EAF3EE]/10 rounded-lg text-[7px] font-bold text-[#5C7A6B] dark:text-[#9FBBA9]">
                    <span>Today, 8 Jul 2026</span>
                    <ChevronDownIcon className="w-2 h-2" />
                  </div>
                  <img className="h-4 w-4 rounded-full" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=50&q=80" alt="Ramesh Avatar" />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="bg-white dark:bg-[#16241C] border border-[#1B6E4C]/10 dark:border-[#EAF3EE]/10 p-2.5 rounded-xl space-y-1 shadow-sm">
                  <div className="flex items-center justify-between text-[7px] text-[#8FA79A] font-bold uppercase tracking-wider">
                    <span>Today's Sales</span>
                    <span className="text-[8px] bg-[#EAF3EE] text-[#1B6E4C] px-1 rounded-full font-black">₹</span>
                  </div>
                  <p className="text-[10px] font-black">₹45,820.00</p>
                  <p className="text-[6px] font-extrabold text-[#1B6E4C]">▲ 18.6% <span className="text-[#8FA79A] font-medium">vs Yesterday</span></p>
                </div>

                <div className="bg-white dark:bg-[#16241C] border border-[#1B6E4C]/10 dark:border-[#EAF3EE]/10 p-2.5 rounded-xl space-y-1 shadow-sm">
                  <div className="flex items-center justify-between text-[7px] text-[#8FA79A] font-bold uppercase tracking-wider">
                    <span>Low Stock</span>
                    <span className="text-[8px] bg-[#FBF0DC] text-[#C7841F] px-1 rounded-full font-black">⚠️</span>
                  </div>
                  <p className="text-[10px] font-black">12 Items</p>
                  <p className="text-[6px] font-extrabold text-[#C7841F] bg-[#E7A23A]/10 px-1 rounded-sm w-fit">Action Required</p>
                </div>

                <div className="bg-white dark:bg-[#16241C] border border-[#1B6E4C]/10 dark:border-[#EAF3EE]/10 p-2.5 rounded-xl space-y-1 shadow-sm">
                  <div className="flex items-center justify-between text-[7px] text-[#8FA79A] font-bold uppercase tracking-wider">
                    <span>Credit Due</span>
                    <span className="text-[8px] bg-[#EBEFF6] text-[#24365A] px-1 rounded-full font-black">📒</span>
                  </div>
                  <p className="text-[10px] font-black">₹6,050</p>
                  <p className="text-[6px] font-extrabold text-[#24365A]">4 pending balances</p>
                </div>

                <div className="bg-white dark:bg-[#16241C] border border-[#1B6E4C]/10 dark:border-[#EAF3EE]/10 p-2.5 rounded-xl space-y-1 shadow-sm">
                  <div className="flex items-center justify-between text-[7px] text-[#8FA79A] font-bold uppercase tracking-wider">
                    <span>Total Cust.</span>
                    <span className="text-[8px] bg-[#EAF3EE] text-[#1B6E4C] px-1 rounded-full font-black">👥</span>
                  </div>
                  <p className="text-[10px] font-black">1,250</p>
                  <p className="text-[6px] font-extrabold text-[#1B6E4C]">▲ 5.4% <span className="text-[#8FA79A] font-medium">this month</span></p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="sm:col-span-2 bg-white dark:bg-[#16241C] border border-[#1B6E4C]/10 dark:border-[#EAF3EE]/10 p-2.5 rounded-xl flex flex-col justify-between">
                  <div className="flex justify-between items-center text-[7px] font-bold mb-2 pb-1 border-b border-[#1B6E4C]/10 dark:border-[#EAF3EE]/10">
                    <span>Sales Overview</span>
                    <span className="text-[6px] text-[#8FA79A] bg-[#F6F7F2] dark:bg-[#101A15] px-1 rounded border border-[#1B6E4C]/10 dark:border-[#EAF3EE]/10">This Week</span>
                  </div>
                  <div className="h-28 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={previewChartData} margin={{ top: 2, right: 2, left: -32, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorPreviewSales" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#1B6E4C" stopOpacity={0.25}/>
                            <stop offset="95%" stopColor="#1B6E4C" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="2 2" stroke="#E4EAE6" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 6, fill: '#8FA79A' }} stroke="#E4EAE6" tickLine={false} />
                        <YAxis tick={{ fontSize: 6, fill: '#8FA79A' }} stroke="#E4EAE6" tickLine={false} axisLine={false} />
                        <Area type="monotone" dataKey="Sales" stroke="#1B6E4C" strokeWidth={1.5} fillOpacity={1} fill="url(#colorPreviewSales)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white dark:bg-[#16241C] border border-[#1B6E4C]/10 dark:border-[#EAF3EE]/10 p-2.5 rounded-xl flex flex-col justify-between items-center">
                  <div className="w-full text-[7px] font-bold text-left pb-1 border-b border-[#1B6E4C]/10 dark:border-[#EAF3EE]/10">
                    <span>Top Selling Categories</span>
                  </div>
                  <div className="h-16 w-full flex items-center justify-center relative my-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={previewPieData} cx="50%" cy="50%" innerRadius={18} outerRadius={26} dataKey="value">
                          {previewPieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute text-[6px] font-black">45%</div>
                  </div>
                  <div className="grid grid-cols-2 gap-1 w-full text-[5px] font-bold text-[#8FA79A]">
                    {previewPieData.map(item => (
                      <div key={item.name} className="flex items-center gap-0.5 truncate">
                        <span className="w-1 h-1 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="truncate">{item.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* 3. Feature cards */}
      <section id="features" className="py-14 bg-white dark:bg-[#16241C] border-y border-[#1B6E4C]/10 dark:border-[#EAF3EE]/10 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: <CheckCircleIcon className="w-5 h-5" />, bg: 'bg-[#EAF3EE] text-[#1B6E4C] border-[#1B6E4C]/15', title: 'Real-time Inventory', desc: 'Track stock as it moves and never run out mid-sale.' },
            { icon: <BellAlertIcon className="w-5 h-5" />, bg: 'bg-[#FBF0DC] text-[#C7841F] border-[#E7A23A]/25', title: 'Low Stock & Expiry Alerts', desc: 'WhatsApp nudges before items run out or expire.' },
            { icon: <QrCodeIcon className="w-5 h-5" />, bg: 'bg-[#EBEFF6] text-[#24365A] border-[#24365A]/15', title: 'POS Billing', desc: 'Barcode and weighing-scale ready, fast at the counter.' },
            { icon: <BookOpenIcon className="w-5 h-5" />, bg: 'bg-[#F3E6E0] text-[#B54C2C] border-[#B54C2C]/15', title: 'Digital Credit Ledger', desc: 'Replace the paper credit register with a shareable ledger.' },
            { icon: <ChartBarIcon className="w-5 h-5" />, bg: 'bg-[#EAF3EE] text-[#1B6E4C] border-[#1B6E4C]/15', title: 'GST-ready Reports', desc: 'One-click sales, tax and profit reports for your CA.' },
            { icon: <GlobeAltIcon className="w-5 h-5" />, bg: 'bg-[#FBF0DC] text-[#C7841F] border-[#E7A23A]/25', title: 'Hindi & English', desc: 'Switch the entire billing screen with a single tap.' }
          ].map((f, idx) => (
            <div key={idx} className="flex gap-3 items-start p-2">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${f.bg}`}>
                {f.icon}
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-black tracking-tight">{f.title}</h4>
                <p className="text-[11px] text-[#5C7A6B] dark:text-[#9FBBA9] font-bold leading-normal">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Digital Khata signature section */}
      <section id="khata" className="py-20 px-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="space-y-5"
        >
          <h3 className="text-xs font-black text-[#B54C2C] uppercase tracking-widest">The Credit Register, Digitized</h3>
          <h2 className="text-3xl font-black leading-tight">Every rupee owed, <br /> tracked without a pen.</h2>
          <p className="text-sm text-[#4A6357] dark:text-[#9FBBA9] font-medium leading-relaxed max-w-md">
            Paper credit registers are easy to lose and hard to search. Stock Management keeps every customer's running balance, sends WhatsApp payment reminders, and updates the ledger as soon as they pay.
          </p>
          <ul className="space-y-2.5 text-xs font-bold text-[#182A20] dark:text-[#EAF3EE]">
            <li className="flex items-center gap-2"><CheckCircleIcon className="w-4 h-4 text-[#1B6E4C]" /> One tap WhatsApp payment reminders</li>
            <li className="flex items-center gap-2"><CheckCircleIcon className="w-4 h-4 text-[#1B6E4C]" /> Full history, searchable by customer or date</li>
            <li className="flex items-center gap-2"><CheckCircleIcon className="w-4 h-4 text-[#1B6E4C]" /> Works even when the shop is offline</li>
          </ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-[#FDFBF3] dark:bg-[#16241C] border border-[#24365A]/15 dark:border-[#EAF3EE]/10 rounded-2xl shadow-xl p-6"
          style={{ backgroundImage: isDarkMode ? 'none' : 'repeating-linear-gradient(#FDFBF3 0px, #FDFBF3 35px, #E7DFC5 36px)' }}
        >
          <div className="flex items-center justify-between mb-5 pb-3 border-b-2 border-dashed border-[#24365A]/20">
            <div>
              <p className="text-[10px] font-black text-[#24365A] dark:text-[#7C93BE] uppercase tracking-wider">Credit Ledger</p>
              <p className="text-[10px] text-[#8FA79A] font-bold">Gupta Kirana Store</p>
            </div>
            <span className="text-[10px] font-black text-white bg-[#B54C2C] px-2.5 py-1 rounded-full">₹6,050 due</span>
          </div>

          <div className="space-y-3">
            {khataCustomers.map((c, i) => (
              <div key={i} className="flex items-center justify-between">
                <div>
                  <p className="text-[13px] font-black text-[#24365A] dark:text-[#EAF3EE]" style={{ fontFamily: 'Georgia, serif' }}>{c.name}</p>
                  <p className="text-[10px] text-[#8FA79A] font-bold">{c.last}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[13px] font-black ${c.status === 'clear' ? 'text-[#1B6E4C]' : 'text-[#B54C2C]'}`} style={{ fontFamily: 'Georgia, serif' }}>
                    {c.status === 'clear' ? 'Paid up' : `₹${c.due.toLocaleString()}`}
                  </span>
                  {c.status === 'due' && (
                    <button className="text-[9px] font-black bg-[#E7A23A] hover:bg-[#C7841F] text-white px-2 py-1 rounded-md transition-all flex items-center gap-1">
                      <ChatBubbleLeftRightIcon className="w-3 h-3" /> Remind
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* 5. How it works */}
      <section className="py-16 bg-white dark:bg-[#16241C] border-y border-[#1B6E4C]/10 dark:border-[#EAF3EE]/10 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center space-y-2 mb-12">
            <h3 className="text-xs font-black text-[#1B6E4C] uppercase tracking-widest">Getting Started</h3>
            <h2 className="text-3xl font-black">Live in your shop by this evening</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Add your stock', desc: 'Import from Excel or scan items in with your phone camera.' },
              { step: '02', title: 'Bill and track credit', desc: 'Ring up sales at the counter and log customer credit as you go.' },
              { step: '03', title: 'Grow with insights', desc: 'Check daily profit, GST reports and reorder points from anywhere.' }
            ].map((s, i) => (
              <div key={i} className="relative">
                <span className="text-4xl font-black text-[#1B6E4C]/15 dark:text-[#4FBE8B]/15">{s.step}</span>
                <h4 className="text-sm font-black mt-1">{s.title}</h4>
                <p className="text-[11px] text-[#5C7A6B] dark:text-[#9FBBA9] font-bold mt-1.5 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Modules grid */}
      <section id="modules" className="py-20 px-6 max-w-7xl mx-auto">
        <div className="text-center space-y-2 mb-12">
          <h3 className="text-xs font-black text-[#1B6E4C] uppercase tracking-widest">Everything In One App</h3>
          <h2 className="text-3xl font-black">Modules built for the way a kirana store runs</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {modules.map((m, i) => (
            <div key={i} className="bg-white dark:bg-[#16241C] border border-[#1B6E4C]/10 dark:border-[#EAF3EE]/10 rounded-2xl p-4 text-center hover:-translate-y-1 hover:shadow-md transition-all">
              <div className="h-10 w-10 mx-auto rounded-xl bg-[#EAF3EE] dark:bg-[#1D2E23] text-[#1B6E4C] dark:text-[#4FBE8B] flex items-center justify-center mb-3">
                {m.icon}
              </div>
              <p className="text-[11px] font-black">{m.label}</p>
              <p className="text-[9px] text-[#8FA79A] font-bold mt-1 leading-snug">{m.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 7. Trusted-by strip */}
      <section className="py-10 bg-white/60 dark:bg-[#16241C]/60 border-y border-[#1B6E4C]/10 dark:border-[#EAF3EE]/10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <h4 className="text-sm font-black tracking-tight flex items-center gap-1.5 justify-center md:justify-start">
              Trusted by <span className="text-[#1B6E4C] dark:text-[#4FBE8B]">5,000+</span>
            </h4>
            <p className="text-[10px] text-[#8FA79A] font-bold uppercase tracking-wider mt-0.5">Kirana Stores Across India</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12 text-[#8FA79A] font-black text-sm select-none">
            <div className="flex items-center gap-1"><span className="text-xs">🛒</span> <span className="font-extrabold text-[#24365A] dark:text-[#7C93BE]">More</span> <span className="text-[9px] uppercase font-black text-[#1B6E4C] dark:text-[#4FBE8B] tracking-wider">Megastore</span></div>
            <div className="flex items-center gap-1"><span className="text-xs">🌾</span> <span className="font-extrabold text-[#1B6E4C] dark:text-[#4FBE8B]">Apna Bazar</span></div>
            <div className="flex items-center gap-1"><span className="text-xs">🏪</span> <span className="font-extrabold text-[#C7841F] dark:text-[#E7A23A]">Sahaj Kirana</span></div>
            <div className="flex items-center gap-1"><span className="text-xs">🍎</span> <span className="font-extrabold text-[#B54C2C]">Goyal Store</span></div>
            <div className="flex items-center gap-1"><span className="font-extrabold text-[#24365A] dark:text-[#7C93BE]">Sharma Traders</span></div>
          </div>
        </div>
      </section>

      

      {/* 9. Pricing */}
      <section id="pricing" className="py-20 px-6 max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-3 max-w-xl mx-auto">
          <h3 className="text-xs font-black text-[#1B6E4C] uppercase tracking-widest">Flexible Pricing Plans</h3>
          <h2 className="text-3xl font-black">Choose the right fit for your shop</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {[
            { plan: 'Starter Pack', price: '₹499', features: ['Up to 500 Product Items', 'Single POS Cashier Counter', 'Basic Stock Alerts', 'Export CSV Reports'], recommend: false },
            { plan: 'Professional ERP', price: '₹999', features: ['Unlimited Product Catalog', 'Up to 3 Warehouse Locations', 'Digital Customer Credit Ledger', 'Roles & Access (Admin/Staff)', 'GST-ready Report Logs'], recommend: true },
            { plan: 'Enterprise Suite', price: 'Custom', features: ['Multi-store Syncing API', 'Automated Daily Backups', '24/7 Dedicated Support Hotline', 'Custom Integration Options'], recommend: false }
          ].map((pricing, idx) => (
            <div
              key={idx}
              className={`bg-white dark:bg-[#16241C] border rounded-2xl p-6 space-y-5 relative flex flex-col justify-between shadow-sm duration-300 transition-all ${
                pricing.recommend ? 'border-[#1B6E4C] shadow-lg shadow-[#1B6E4C]/10' : 'border-[#1B6E4C]/10 dark:border-[#EAF3EE]/10'
              }`}
            >
              {pricing.recommend && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#1B6E4C] text-white text-[8px] font-black uppercase tracking-wider px-3 py-1 rounded-full">
                  Recommended
                </span>
              )}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-[#8FA79A] uppercase tracking-wider">{pricing.plan}</h4>
                <div className="flex items-baseline gap-0.5">
                  <span className="text-3xl font-black">{pricing.price}</span>
                  {pricing.price !== 'Custom' && <span className="text-[10px] text-[#8FA79A] font-bold">/ month</span>}
                </div>
                <ul className="space-y-2 pt-3 text-[11px] font-bold text-[#4A6357] dark:text-[#9FBBA9]">
                  {pricing.features.map((feat, fIdx) => (
                    <li key={fIdx} className="flex items-center gap-1.5">
                      <span className="text-[#1B6E4C]">✓</span> {feat}
                    </li>
                  ))}
                </ul>
              </div>
              <Link
                to="/login"
                className={`w-full py-2.5 rounded-xl text-xs font-bold text-center transition-all ${
                  pricing.recommend
                    ? 'bg-[#1B6E4C] hover:bg-[#14523A] text-white shadow-md'
                    : 'bg-[#F6F7F2] hover:bg-[#EAF3EE] dark:bg-[#101A15] dark:hover:bg-[#1D2E23] text-[#182A20] dark:text-[#EAF3EE] border border-[#1B6E4C]/10 dark:border-[#EAF3EE]/10'
                }`}
              >
                Get Started Now
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* 10. FAQ */}
      <section id="faq" className="py-20 px-6 max-w-3xl mx-auto">
        <div className="text-center space-y-2 mb-10">
          <h3 className="text-xs font-black text-[#1B6E4C] uppercase tracking-widest">Common Questions</h3>
          <h2 className="text-3xl font-black">Answers to your common questions</h2>
        </div>
        <div className="space-y-3">
          {faqs.map((f, i) => (
            <div key={i} className="bg-white dark:bg-[#16241C] border border-[#1B6E4C]/10 dark:border-[#EAF3EE]/10 rounded-xl overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === i ? -1 : i)}
                className="w-full flex items-center justify-between px-5 py-4 text-left"
              >
                <span className="text-xs font-black pr-4">{f.q}</span>
                <ChevronDownIcon className={`w-4 h-4 flex-shrink-0 text-[#8FA79A] transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
              </button>
              {openFaq === i && (
                <div className="px-5 pb-4 text-[12px] text-[#4A6357] dark:text-[#9FBBA9] font-medium leading-relaxed">
                  {f.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 11. Final CTA */}
      <section className="px-6 pb-4">
        <div className="max-w-7xl mx-auto bg-gradient-to-br from-[#1B6E4C] to-[#14523A] rounded-3xl px-8 py-14 text-center text-white relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-64 h-64 rounded-full bg-[#E7A23A]/20 blur-3xl" />
          <h2 className="text-2xl md:text-3xl font-black mb-3 relative">Ready to retire your paper credit register?</h2>
          <p className="text-sm font-medium text-white/80 mb-7 relative">Free demo, no card required. Set up your shop in under an hour.</p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-7 py-3 bg-[#E7A23A] hover:bg-[#C7841F] text-white rounded-2xl text-xs font-black shadow-lg active:scale-[0.98] transition-all relative"
          >
            Start Free Demo <ArrowRightIcon className="w-4 h-4 stroke-[2.5]" />
          </Link>
        </div>
      </section>

      {/* 12. Footer */}
      <footer className="border-t border-[#1B6E4C]/10 dark:border-[#EAF3EE]/10 bg-white dark:bg-[#16241C] pt-14 pb-8 px-6 transition-all duration-300">
        <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8 mb-10">
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <img src="/logo.png" alt="Stock Management Logo" className="h-8 w-8 object-contain" />
              <span className="text-sm font-black">Stock Management</span>
            </div>
            <p className="text-[11px] text-[#8FA79A] font-bold leading-relaxed max-w-xs mb-4">
              Inventory, billing, and customer credit software built for India's neighbourhood stores.            </p>
            <div className="flex gap-2">
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F6F7F2] dark:bg-[#101A15] border border-[#1B6E4C]/10 dark:border-[#EAF3EE]/10 rounded-lg text-[9px] font-black">
                <DevicePhoneMobileIcon className="w-3.5 h-3.5" /> Android App
              </span>
            </div>
          </div>
          <div>
            <h5 className="text-[10px] font-black uppercase tracking-wider text-[#8FA79A] mb-3">Product</h5>
            <ul className="space-y-2 text-[11px] font-bold text-[#4A6357] dark:text-[#9FBBA9]">
              <li><a href="#features" className="hover:text-[#1B6E4C] dark:hover:text-[#4FBE8B]">Features</a></li>
              <li><a href="#modules" className="hover:text-[#1B6E4C] dark:hover:text-[#4FBE8B]">Modules</a></li>
              <li><a href="#pricing" className="hover:text-[#1B6E4C] dark:hover:text-[#4FBE8B]">Pricing</a></li>
            </ul>
          </div>
          <div>
            <h5 className="text-[10px] font-black uppercase tracking-wider text-[#8FA79A] mb-3">Company</h5>
            <ul className="space-y-2 text-[11px] font-bold text-[#4A6357] dark:text-[#9FBBA9]">
              <li><a href="#testimonials" className="hover:text-[#1B6E4C] dark:hover:text-[#4FBE8B]">Stories</a></li>
              <li><a href="#" className="hover:text-[#1B6E4C] dark:hover:text-[#4FBE8B]">Careers</a></li>
              <li><a href="#" className="hover:text-[#1B6E4C] dark:hover:text-[#4FBE8B]">Contact</a></li>
            </ul>
          </div>
          <div>
            <h5 className="text-[10px] font-black uppercase tracking-wider text-[#8FA79A] mb-3">Support</h5>
            <ul className="space-y-2 text-[11px] font-bold text-[#4A6357] dark:text-[#9FBBA9]">
              <li><a href="#faq" className="hover:text-[#1B6E4C] dark:hover:text-[#4FBE8B]">FAQ</a></li>
              <li className="flex items-center gap-1.5"><ClockIcon className="w-3.5 h-3.5" /> Mon–Sat, 9am–8pm</li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto pt-6 border-t border-[#1B6E4C]/10 dark:border-[#EAF3EE]/10 text-center text-[10px] font-bold text-[#8FA79A]">
          © 2026 Stock Management. All data encrypted and secured in accordance with enterprise practices.
        </div>
      </footer>
    </div>
  );
};

export default Landing;
