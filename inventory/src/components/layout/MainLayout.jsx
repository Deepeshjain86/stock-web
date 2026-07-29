import { Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { setSidebarOpen } from '../../store/slices/sidebarSlice';

/* ── Match Sidebar constants exactly ── */
const SIDEBAR_COLLAPSED_W = 64;  // px — icons-only
const SIDEBAR_EXPANDED_W  = 260; // px — full width

const MainLayout = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { isPinned } = useAppSelector((state) => state.sidebar);

  const monitoredTenant = localStorage.getItem('monitoredTenant');
  const tenantInfo = monitoredTenant ? JSON.parse(monitoredTenant) : null;

  /*
   * The desktop spacer width mirrors exactly what Sidebar renders:
   *  - Pinned       → 260px (full sidebar, permanent)
   *  - Not pinned   → 64px  (collapsed sidebar, icons only)
   *
   * When user hovers the sidebar, it overlays the content (no layout shift on hover).
   * This is intentional — hover is transient, pinning causes layout shift.
   */
  const spacerWidth = isPinned ? SIDEBAR_EXPANDED_W : SIDEBAR_COLLAPSED_W;

  /* Page transition variants */
  const pageTransitionVariants = {
    initial: { opacity: 0, y: 12 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: [0.25, 1, 0.5, 1] },
    },
    exit: {
      opacity: 0,
      y: -12,
      transition: { duration: 0.25, ease: 'easeIn' },
    },
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gradient-to-tr from-slate-50 via-indigo-50/30 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 antialiased">

      {/*
        ── DESKTOP SIDEBAR SPACER ──
        Fixed-position sidebar sits outside the flex flow.
        This spacer reserves the exact pixel width the sidebar occupies
        so the main content starts at the right offset.
        On mobile: sidebar is a drawer (off-canvas), so no spacer needed.
      */}
      <div
        className="hidden md:block flex-shrink-0 h-full"
        style={{
          width: `${spacerWidth}px`,
          transition: 'width 250ms cubic-bezier(0.25,0.1,0.25,1)',
        }}
        aria-hidden="true"
      />

      {/* Sidebar — rendered for all viewports */}
      <Sidebar />

      {/* ── MAIN CONTENT AREA ── */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative overflow-hidden">

        {/* Ambient background glows */}
        <div className="absolute top-20 left-1/4 w-96 h-96 rounded-full bg-gradient-to-tr from-pink-300/5 to-indigo-500/10 blur-[120px] pointer-events-none z-0" />
        <div className="absolute bottom-20 right-1/4 w-[400px] h-[400px] rounded-full bg-gradient-to-br from-indigo-300/5 to-purple-500/10 blur-[150px] pointer-events-none z-0" />

        <div className="relative z-10 flex flex-col flex-1 h-full w-full overflow-hidden">

          {/* Super Admin Monitoring Banner */}
          {user?.role === 'Super Admin' && tenantInfo && (
            <div className="bg-amber-500 text-slate-950 px-4 py-2 text-center text-xs font-black tracking-wider uppercase flex items-center justify-between border-b border-amber-600 shadow-md relative z-50">
              <div className="flex-1 text-center">
                ⚠️ MONITORING MODE (READ-ONLY) &mdash; You are viewing &quot;{tenantInfo.name}&quot; ERP as Super Admin. All updates are locked.
              </div>
              <button
                onClick={() => {
                  localStorage.removeItem('monitoredTenant');
                  window.location.href = '/superadmin';
                }}
                className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-[10px] uppercase tracking-wide font-black active:scale-95 transition-all"
              >
                Exit Monitor
              </button>
            </div>
          )}

          {/* Sticky Header */}
          <div className="sticky top-0 z-30 flex-shrink-0 w-full shadow-sm backdrop-blur-md bg-white/90 dark:bg-slate-900/90">
            <Header />
          </div>

          {/* Scrollable workspace */}
          <div className="flex-1 flex flex-col justify-between overflow-y-auto overflow-x-hidden min-h-0 select-text scroll-smooth">
            <main className="w-full flex-1 flex flex-col items-center">
              <div className="w-full max-w-[1600px] flex-1 flex flex-col px-4 py-4 sm:px-6 sm:py-5 md:px-8 md:py-6 gap-6">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={window.location.pathname}
                    variants={pageTransitionVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="w-full flex-1 flex flex-col"
                  >
                    <Outlet />
                  </motion.div>
                </AnimatePresence>
              </div>
            </main>

            {/* Footer */}
            <div className="w-full flex-shrink-0 mt-auto border-t border-slate-200/60 bg-white/50 backdrop-blur-sm">
              <Footer />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default MainLayout;