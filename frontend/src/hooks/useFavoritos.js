import { useState, useCallback } from 'react'

const KEY = 'strive_favoritos'

function cargarFavoritos() {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? new Set(JSON.parse(raw)) : new Set()
  } catch {
    return new Set()
  }
}

export function useFavoritos() {
  const [favoritos, setFavoritos] = useState(cargarFavoritos)

  const toggleFavorito = useCallback((id) => {
    setFavoritos(prev => {
      const next = new Set(prev)
      const key = String(id)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      localStorage.setItem(KEY, JSON.stringify([...next]))
      return next
    })
  }, [])

  const esFavorito = useCallback((id) => favoritos.has(String(id)), [favoritos])

  return { favoritos, toggleFavorito, esFavorito }
}
