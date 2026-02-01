'use client';

import { useState, useCallback } from 'react';

interface ModalState {
  [key: string]: boolean;
}

export function useModal() {
  const [modals, setModals] = useState<ModalState>({});

  const open = useCallback((modalName: string) => {
    setModals((prev) => ({ ...prev, [modalName]: true }));
  }, []);

  const close = useCallback((modalName: string) => {
    setModals((prev) => ({ ...prev, [modalName]: false }));
  }, []);

  const toggle = useCallback((modalName: string) => {
    setModals((prev) => ({ ...prev, [modalName]: !prev[modalName] }));
  }, []);

  return {
    modals,
    open,
    close,
    toggle,
    isOpen: (modalName: string) => modals[modalName] || false,
  };
}
