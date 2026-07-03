import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { ChevronDown } from 'lucide-react'
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
  parentAccent?: string
}) {
  const [isExpanded, setIsExpanded] = useState(true)
  const hasChildren = item.children && item.children.length > 0
  const isTopLevel = depth === 0

  // Stagger delays
  const staggerDelay = (depth * 150 + index * 80) / 1000

  // Determine marker content based on depth, all using the same accent color
  let markerContent = '◆'
  const markerColor = 'var(--ctp-blue)'

  if (depth === 0) {
    markerContent = '◆'
  } else if (depth === 1) {
    markerContent = '◦'
  } else {
    markerContent = '–'
  }

  if (isTopLevel) {
    return (
      <motion.li
        className={`bullets-card ${hasChildren ? 'bullets-card-collapsible' : ''}`}
        data-testid={`bullet-item-${path}`}
        initial={animate ? { opacity: 0, y: 15 } : {}}
        whileInView={animate ? { opacity: 1, y: 0 } : {}}
        viewport={animate ? { once: true, amount: 0.3 } : {}}
        transition={
          animate
            ? { duration: 0.4, ease: [0.25, 1, 0.5, 1], delay: staggerDelay }
            : {}
        }
      >
        <div
          className="bullets-card-header"
          onClick={hasChildren ? () => setIsExpanded(!isExpanded) : undefined}
          role={hasChildren ? 'button' : undefined}
          aria-expanded={hasChildren ? isExpanded : undefined}
          tabIndex={hasChildren ? 0 : undefined}
          onKeyDown={
            hasChildren
              ? (e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setIsExpanded(!isExpanded)
                  }
                }
              : undefined
          }
        >
          <div className="bullet-item-row">
            {ordered ? (
              <span
                className="bullet-marker bullet-marker-ordered"
                data-testid={`bullet-number-${path}`}
                style={{ color: markerColor }}
              />
            ) : (
              <span
                className="bullet-marker bullet-marker-unordered"
                data-testid={`bullet-marker-${path}`}
                style={{ color: markerColor }}
              >
                {markerContent}
              </span>
            )}

            <span
              className="bullet-text bullet-text-parent"
              data-testid={`bullet-text-${path}`}
            >
              {item.text}
            </span>
          </div>

          {hasChildren && (
            <motion.div
              className="bullets-chevron-wrapper"
              animate={{ rotate: isExpanded ? 0 : -90 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown size={18} className="bullets-chevron" />
            </motion.div>
          )}
        </div>

        <AnimatePresence initial={false}>
          {hasChildren && isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              style={{ overflow: 'hidden' }}
            >
              <ul
                className={`bullet-children ${ordered ? 'bullet-children-ordered' : ''}`}
                data-testid={`bullet-children-${path}`}
              >
                {item.children!.map((child, ci) => (
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
            </motion.div>
          )}
        </AnimatePresence>
      </motion.li>
    )
  }

  // Nested levels (depth > 0)
  return (
    <motion.li
      className="bullet-item"
      data-testid={`bullet-item-${path}`}
      initial={animate ? { opacity: 0, x: -8 } : {}}
      whileInView={animate ? { opacity: 1, x: 0 } : {}}
      viewport={animate ? { once: true, amount: 0.3 } : {}}
      transition={
        animate
          ? { duration: 0.25, ease: [0.25, 1, 0.5, 1], delay: staggerDelay }
          : {}
      }
    >
      <div className="bullet-item-row">
        {ordered ? (
          <span
            className="bullet-marker bullet-marker-ordered"
            data-testid={`bullet-number-${path}`}
            style={{ color: markerColor }}
          />
        ) : (
          <span
            className="bullet-marker bullet-marker-unordered"
            data-testid={`bullet-marker-${path}`}
            style={{ color: markerColor }}
          >
            {markerContent}
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
    </motion.li>
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
