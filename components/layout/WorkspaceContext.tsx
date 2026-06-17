"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

export type Role = 'Admin' | 'Standard User';

interface WorkspaceState {
  role: Role;
  workspaceName: string;
  setRole: (role: Role) => void;
  setWorkspaceName: (name: string) => void;
}

const WorkspaceContext = createContext<WorkspaceState | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>('Admin');
  const [workspaceName, setWorkspaceName] = useState<string>('Enterprise Workspace');

  return (
    <WorkspaceContext.Provider value={{ role, workspaceName, setRole, setWorkspaceName }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
}
