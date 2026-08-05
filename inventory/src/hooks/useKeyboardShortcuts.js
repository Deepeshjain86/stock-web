import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const useKeyboardShortcuts = () => {
  const navigate = useNavigate();
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeTag = document.activeElement?.tagName?.toLowerCase();
      const isInputFocused = activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select' || document.activeElement?.isContentEditable;

      // 1. Function Keys (F1 - F7) -> Always trigger navigation
      if (e.key === 'F1') {
        e.preventDefault();
        setShowShortcutsModal((prev) => !prev);
        return;
      }
      if (e.key === 'F2') {
        e.preventDefault();
        navigate('/dashboard/sales');
        return;
      }
      if (e.key === 'F3') {
        e.preventDefault();
        navigate('/dashboard/sales/returns');
        return;
      }
      if (e.key === 'F4') {
        e.preventDefault();
        navigate('/dashboard/products');
        return;
      }
      if (e.key === 'F6') {
        e.preventDefault();
        navigate('/dashboard/borrow');
        return;
      }
      if (e.key === 'F7') {
        e.preventDefault();
        navigate('/dashboard/purchase');
        return;
      }

      // 2. Combo Hotkeys with Alt or Shift (Work even when typing)
      if (e.altKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowShortcutsModal((prev) => !prev);
        return;
      }
      if (e.shiftKey && e.key === '?') {
        e.preventDefault();
        setShowShortcutsModal((prev) => !prev);
        return;
      }

      // If user is typing in an input box, letter-only shortcuts won't steal focus unless Alt is held
      if (isInputFocused && !e.altKey) {
        return;
      }

      if (e.altKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        navigate('/dashboard/sales');
      } else if (e.altKey && e.key.toLowerCase() === 'r') {
        e.preventDefault();
        navigate('/dashboard/sales/returns');
      } else if (e.altKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        navigate('/dashboard/products');
      } else if (e.altKey && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        navigate('/dashboard/borrow');
      } else if (e.altKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        navigate('/dashboard/purchase');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  return {
    showShortcutsModal,
    setShowShortcutsModal,
    openShortcutsModal: () => setShowShortcutsModal(true),
    closeShortcutsModal: () => setShowShortcutsModal(false)
  };
};
