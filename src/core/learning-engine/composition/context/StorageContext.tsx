import { createContext, useContext, type ReactNode } from 'react'
import type { OKFStoragePort } from '../../../delivery/ports'

const StorageContext = createContext<OKFStoragePort | null>(null)

/** Injects the host's OKF storage adapter. Hosts construct the adapter at their entry point. */
export function StorageProvider({ storage, children }: { storage: OKFStoragePort; children: ReactNode }) {
  return <StorageContext.Provider value={storage}>{children}</StorageContext.Provider>
}

export function useStorage(): OKFStoragePort {
  const storage = useContext(StorageContext)
  if (!storage) {
    throw new Error('useStorage must be used within a <StorageProvider> supplying an OKFStoragePort adapter.')
  }
  return storage
}
