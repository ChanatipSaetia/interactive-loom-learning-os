import { motion } from 'motion/react'
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
  const staggerDelay = (depth * 150 + index * 80) / 1000

  return (
    <motion.li
      className="bullet-item"
      data-testid={`bullet-item-${path}`}
      initial={animate ? { opacity: 0, x: -12 } : {}}
      whileInView={animate ? { opacity: 1, x: 0 } : {}}
      viewport={animate ? { once: true, amount: 0.3 } : {}}
      transition={
        animate
          ? { duration: 0.3, ease: [0.25, 1, 0.5, 1], delay: staggerDelay }
          : {}
      }
    >
      <div className="bullet-item-row">
        {ordered ? (
          <motion.span
            className="bullet-marker bullet-marker-ordered"
            data-testid={`bullet-number-${path}`}
            initial={animate ? { opacity: 0 } : {}}
            whileInView={animate ? { opacity: 1 } : {}}
            viewport={animate ? { once: true, amount: 0.3 } : {}}
            transition={
              animate
                ? { duration: 0.3, ease: [0.25, 1, 0.5, 1], delay: staggerDelay }
                : {}
            }
          />
        ) : (
          <motion.span
            className="bullet-marker bullet-marker-unordered"
            data-testid={`bullet-marker-${path}`}
            initial={animate ? { opacity: 0 } : {}}
            whileInView={animate ? { opacity: 1 } : {}}
            viewport={animate ? { once: true, amount: 0.3 } : {}}
            transition={
              animate
                ? { duration: 0.3, ease: [0.25, 1, 0.5, 1], delay: staggerDelay }
                : {}
            }
          >
            &#8226;
          </motion.span>
        )}

        <motion.span
          className="bullet-text"
          data-testid={`bullet-text-${path}`}
          initial={animate ? { opacity: 0, x: -8 } : {}}
          whileInView={animate ? { opacity: 1, x: 0 } : {}}
          viewport={animate ? { once: true, amount: 0.3 } : {}}
          transition={
            animate
              ? { duration: 0.3, ease: [0.25, 1, 0.5, 1], delay: staggerDelay + 0.05 }
              : {}
          }
        >
          {item.text}
        </motion.span>
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
