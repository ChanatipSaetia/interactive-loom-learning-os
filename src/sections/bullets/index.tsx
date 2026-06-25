import { useRef, useEffect } from 'react'
import './bullets.css'

export interface BulletItem {
  text: string
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
  animate,
}: {
  item: BulletItem
  index: number
  depth: number
  path: string
  ordered: boolean
  animate: boolean
}) {
  const rowRef = useRef<HTMLLIElement>(null)

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

  return (
    <li
      ref={rowRef}
      className="bullet-item"
      data-testid={`bullet-item-${path}`}
    >
      <div className="bullet-item-row">
        {ordered ? (
          <span className="bullet-marker bullet-marker-ordered" data-testid={`bullet-number-${path}`}>
          </span>
        ) : (
          <span className="bullet-marker bullet-marker-unordered" data-testid={`bullet-marker-${path}`}>
            &#8226;
          </span>
        )}

        <span
          className="bullet-text"
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
              animate={animate}
            />
          ))}
        </ul>
      )}
    </li>
  )
}

function BulletsSection({ title, items, ordered = false, animate = true }: BulletsSectionProps) {
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
            animate={animate}
          />
        ))}
      </ul>
    </div>
  )
}

export default BulletsSection
