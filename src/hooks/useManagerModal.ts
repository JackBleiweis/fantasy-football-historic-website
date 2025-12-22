import { useContext } from 'react';
import { ManagerModalContext } from '../contexts/ManagerModalContext';

export function useManagerModal() {
  const context = useContext(ManagerModalContext);
  if (!context) {
    throw new Error(
      'useManagerModal must be used within a ManagerModalProvider'
    );
  }
  return context;
}

// Re-export types for convenience
export type { ManagerModalState, ManagerModalContextValue } from '../contexts/ManagerModalContext';
