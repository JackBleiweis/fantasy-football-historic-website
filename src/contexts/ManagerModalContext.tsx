import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { LeagueId } from '../types';

interface ManagerModalState {
  isOpen: boolean;
  managerName: string | null;
  leagueId: LeagueId | null;
}

interface ManagerModalContextValue {
  state: ManagerModalState;
  openModal: (managerName: string, leagueId: LeagueId) => void;
  closeModal: () => void;
}

const ManagerModalContext = createContext<ManagerModalContextValue | null>(
  null
);

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

export function useManagerModal() {
  const context = useContext(ManagerModalContext);
  if (!context) {
    throw new Error(
      'useManagerModal must be used within a ManagerModalProvider'
    );
  }
  return context;
}
