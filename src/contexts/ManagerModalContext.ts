import { createContext } from 'react';
import type { LeagueId } from '../types';

export interface ManagerModalState {
  isOpen: boolean;
  managerName: string | null;
  leagueId: LeagueId | null;
}

export interface ManagerModalContextValue {
  state: ManagerModalState;
  openModal: (managerName: string, leagueId: LeagueId) => void;
  closeModal: () => void;
}

export const ManagerModalContext = createContext<ManagerModalContextValue | null>(
  null
);
