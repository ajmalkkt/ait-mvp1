// frontend/src/context/CompanyContext.tsx
// Company context for multi-tenancy

import React, { createContext, useContext } from 'react'
import { useAuth } from './AuthContext'

interface CompanyContextType {
  companyId: string | null
  companyName?: string
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined)

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()

  // Extract company_id from JWT claims
  const companyId = user?.id ? user.id : null

  return (
    <CompanyContext.Provider value={{ companyId }}>
      {children}
    </CompanyContext.Provider>
  )
}

export function useCompany(): CompanyContextType {
  const context = useContext(CompanyContext)
  if (!context) {
    throw new Error('useCompany must be used within CompanyProvider')
  }
  return context
}
