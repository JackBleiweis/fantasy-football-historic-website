import { useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { LeagueId } from '../types';
import { ManagerModalContext, type ManagerModalState } from './ManagerModalContext';

export function ManagerModalProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ManagerModalState>({
    isOpen: false,
    managerName: null,
    leagueId: null,
  });

  const openModal = useCallback((managerName: string, leagueId: LeagueId) => {
    setState({
      isOpen: true,
      managerName,
      leagueId,
    });
  }, []);

  const closeModal = useCallback(() => {
    setState({
      isOpen: false,
      managerName: null,
      leagueId: null,
    });
  }, []);

  return (
    <ManagerModalContext.Provider value={{ state, openModal, closeModal }}>
      {children}
    </ManagerModalContext.Provider>
  );
}
