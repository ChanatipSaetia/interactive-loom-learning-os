import { useTheme } from '../../core/theme/useTheme'
import './layout.css'

export function ThemeSelector() {
  const { themeId, setTheme, themes } = useTheme()

  return (
    <label className="theme-selector">
      <span className="theme-selector-label">Theme</span>
      <select
        className="theme-selector-control"
        aria-label="Select theme"
        value={themeId}
        onChange={(event) => setTheme(event.target.value)}
      >
        {themes.map((theme) => (
          <option key={theme.id || 'default'} value={theme.id}>
            {theme.label}
          </option>
        ))}
      </select>
    </label>
  )
}
