import { createContext, useContext } from 'react'
export const OrbitContext = createContext(null)
export const useOrbit = () => useContext(OrbitContext)
