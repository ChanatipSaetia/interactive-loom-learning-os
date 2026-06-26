import { useTheme } from '../../core/theme/useTheme'
import { Dropdown, type DropdownOption } from '../motion/dropdown'
import './layout.css'

export function ThemeSelector() {
  const { themeId, setTheme, themes } = useTheme()

  const options = themes.map((theme) => ({
    value: theme.id,
    label: theme.label,
    icon: theme.icon,
  }))

  const renderOption = (opt: DropdownOption) => (
    <span className="flex items-center gap-1.5 truncate">
      {opt.icon && <span aria-hidden="true">{opt.icon as string}</span>}
      {opt.label}
    </span>
  )

  return (
    <div className="theme-selector flex items-center gap-2">
      <span className="theme-selector-label text-sm font-medium text-muted-foreground">Theme</span>
      <Dropdown
        options={options}
        value={themeId}
        onChange={setTheme}
        triggerClassName="theme-selector-control h-9 min-w-[150px]"
        data-testid="theme-selector-dropdown"
        renderOption={renderOption}
      />
    </div>
  )
}
