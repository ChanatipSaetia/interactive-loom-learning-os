import { useState, useRef, useEffect } from 'react'
import { useTheme, THEMES } from '../../core/theme-context'
import './theme-picker.css'

export function ThemePicker() {
  const { theme, setTheme, themes } = useTheme()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const current = THEMES.find((t) => t.id === theme)!

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div className="theme-picker" ref={ref}>
      <button
        id="theme-picker-toggle"
        className="theme-picker-btn"
        aria-label="Switch theme"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        title={`Theme: ${current.name}`}
      >
        <span className="theme-picker-icon">{current.icon}</span>
        <span className="theme-picker-label">{current.name}</span>
        <span className="theme-picker-chevron" aria-hidden="true">
          {open ? '▴' : '▾'}
        </span>
      </button>

      {open && (
        <div className="theme-picker-menu" role="listbox" aria-label="Select theme">
          {themes.map((t) => (
            <button
              key={t.id}
              id={`theme-option-${t.id}`}
              role="option"
              aria-selected={t.id === theme}
              className={`theme-picker-option${t.id === theme ? ' theme-picker-option--active' : ''}`}
              onClick={() => {
                setTheme(t.id)
                setOpen(false)
              }}
            >
              <span className="theme-picker-option-icon">{t.icon}</span>
              <span className="theme-picker-option-meta">
                <span className="theme-picker-option-name">{t.name}</span>
                <span className="theme-picker-option-author">by {t.author}</span>
              </span>
              {t.id === theme && (
                <span className="theme-picker-check" aria-hidden="true">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
