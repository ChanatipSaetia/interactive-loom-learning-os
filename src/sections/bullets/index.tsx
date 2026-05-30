import { useState, useRef, useEffect, useCallback, type ComponentType } from 'react'
import { SectionRegistry } from '../../core/registry'
import './bullets.css'

export interface BulletItem {
  text: string
  checked?: boolean
  checkable?: boolean
  children?: BulletItem[]
}

export interface BulletsSectionProps {
  title?: string
  items: BulletItem[]
  ordered?: boolean
  animate?: boolean
}

function BulletItemRow({
  item,
  index,
  depth,
  path,
  ordered,
  checkedItems,
  onToggle,
  animate,
}: {
  item: BulletItem
  index: number
  depth: number
  path: string
  ordered: boolean
  checkedItems: Set<string>
  onToggle: (key: string) => void
  animate: boolean
}) {
  const rowRef = useRef<HTMLLIElement>(null)
  const itemKey = `${path}-${item.text}`

  useEffect(() => {
    if (!animate) return
    const el = rowRef.current
    if (!el) return
    el.style.opacity = '0'
    el.style.transform = `translateX(-12px)`
    const delay = (depth * 150) + (index * 80)
    const timer = setTimeout(() => {
      el.style.transition = 'opacity 0.3s ease, transform 0.3s ease'
      el.style.opacity = '1'
      el.style.transform = 'translateX(0)'
      setTimeout(() => {
        el.style.transition = ''
      }, 350)
    }, delay)
    return () => clearTimeout(timer)
  }, [animate, depth, index, path])

  const isChecked = item.checked || checkedItems.has(itemKey)

  return (
    <li
      ref={rowRef}
      className="bullet-item"
      data-testid={`bullet-item-${path}`}
    >
      <div className="bullet-item-row">
        {item.checkable && (
          <button
            className={`bullet-checkbox ${isChecked ? 'bullet-checkbox-checked' : ''}`}
            onClick={() => onToggle(itemKey)}
            data-testid={`bullet-checkbox-${path}`}
            aria-label={isChecked ? `Uncheck ${item.text}` : `Check ${item.text}`}
            type="button"
          >
            {isChecked ? (
              <span className="bullet-icon bullet-icon-checked" data-testid={`bullet-icon-checked-${path}`}>
                &#10003;
              </span>
            ) : (
              <span className="bullet-icon bullet-icon-unchecked" data-testid={`bullet-icon-unchecked-${path}`}>
                &#9675;
              </span>
            )}
          </button>
        )}

        {ordered ? (
          <span className="bullet-marker bullet-marker-ordered" data-testid={`bullet-number-${path}`}>
          </span>
        ) : (
          <span className="bullet-marker bullet-marker-unordered" data-testid={`bullet-marker-${path}`}>
            &#8226;
          </span>
        )}

        <span
          className={`bullet-text ${isChecked ? 'bullet-text-checked' : ''}`}
          data-testid={`bullet-text-${path}`}
        >
          {item.text}
        </span>
      </div>

      {item.children && item.children.length > 0 && (
        <ul
          className={`bullet-children ${ordered ? 'bullet-children-ordered' : ''}`}
          data-testid={`bullet-children-${path}`}
        >
          {item.children.map((child, ci) => (
            <BulletItemRow
              key={`${ci}-${child.text}`}
              item={child}
              index={ci}
              depth={depth + 1}
              path={`${path}-${ci}`}
              ordered={ordered}
              checkedItems={checkedItems}
              onToggle={onToggle}
              animate={animate}
            />
          ))}
        </ul>
      )}
    </li>
  )
}

function BulletsSection({ title, items, ordered = false, animate = true }: BulletsSectionProps) {
  const [checkedItems, setCheckedItems] = useState(new Set<string>())

  const handleToggle = useCallback((key: string) => {
    setCheckedItems((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }, [])

  return (
    <div
      className="bullets-section"
      data-testid="bullets-section"
    >
      {title && (
        <h3 className="bullets-section-title" data-testid="bullets-title">
          {title}
        </h3>
      )}

      <ul
        className={`bullets-list ${ordered ? 'bullets-list-ordered' : 'bullets-list-unordered'}`}
        data-testid="bullets-list"
      >
        {items.map((item, index) => (
          <BulletItemRow
            key={`${index}-${item.text}`}
            item={item}
            index={index}
            depth={0}
            path={`${index}`}
            ordered={ordered}
            checkedItems={checkedItems}
            onToggle={handleToggle}
            animate={animate}
          />
        ))}
      </ul>
    </div>
  )
}

SectionRegistry.register('bullets', BulletsSection as ComponentType<unknown>)

export default BulletsSection
