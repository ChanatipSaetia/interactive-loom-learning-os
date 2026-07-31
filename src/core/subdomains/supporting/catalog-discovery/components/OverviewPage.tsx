import { useState, useRef, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Search, ChevronDown, Check, Layers, LayoutGrid, Sparkles, Clock } from 'lucide-react'
import { useTopics, type TopicRoute } from '../../../../routes'
import { usePagination } from '../../../../hooks/usePagination'
import { ScrollReveal } from '../../../../../components/motion/scroll-reveal'
import { Dropdown } from '../../../../../components/motion/dropdown'
import { cn } from '../../../../../lib/utils'
import './overview.css'

const rowsPerPageOptions = [5, 10, 20]

const SORT_OPTIONS = [
  { value: '', label: 'Sort by' },
  { value: 'updated-desc', label: 'Recently Updated / Newest' },
  { value: 'label-asc', label: 'Topic (A-Z)' },
  { value: 'label-desc', label: 'Topic (Z-A)' },
  { value: 'category-asc', label: 'Category (A-Z)' },
  { value: 'category-desc', label: 'Category (Z-A)' },
  { value: 'description-asc', label: 'Description (A-Z)' },
  { value: 'description-desc', label: 'Description (Z-A)' },
]

function parseSortValue(val: string): { column: string; direction: string } {
  if (!val) return { column: '', direction: '' }
  const [column, direction] = val.split('-')
  return { column, direction }
}

function MultiSelectDropdown({
  options,
  selected,
  onChange,
  placeholder,
  dataTestId,
}: {
  options: string[]
  selected: string[]
  onChange: (values: string[]) => void
  placeholder?: string
  dataTestId?: string
}) {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  const allSelected = selected.length === options.length
  const displayLabel = allSelected
    ? 'All'
    : selected.length === 0
      ? placeholder || 'Filter'
      : `${selected.length} selected`

  const toggleOption = (opt: string) => {
    const next = selected.includes(opt)
      ? selected.filter((s) => s !== opt)
      : [...selected, opt]
    onChange(next)
  }

  const toggleAll = () => {
    onChange(allSelected ? [] : options)
  }

  return (
    <div ref={ref} className="relative inline-block min-w-[140px]" data-testid={dataTestId}>
      <button
        type="button"
        onClick={() => setIsOpen((p) => !p)}
        className="flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground transition-colors hover:border-accent outline-none focus:border-accent"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="truncate">{displayLabel}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
            isOpen && "rotate-180",
          )}
        />
      </button>
      {isOpen && (
        <div
          className="absolute top-full left-0 z-50 mt-1 w-full max-h-[240px] overflow-y-auto rounded-lg border border-border bg-card p-1 shadow-lg"
          role="listbox"
        >
          <button
            type="button"
            onClick={toggleAll}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-primary/5 hover:text-foreground"
          >
            <span className="flex h-4 w-4 items-center justify-center rounded border border-border">
              {allSelected && <Check className="h-3 w-3" />}
            </span>
            <span className="font-medium">All</span>
          </button>
          {options.map((opt) => {
            const checked = selected.includes(opt)
            return (
              <button
                key={opt}
                type="button"
                onClick={() => toggleOption(opt)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-primary/5 hover:text-foreground"
                role="option"
                aria-selected={checked}
                data-testid={`filter-chip-${opt}`}
              >
                <span className="flex h-4 w-4 items-center justify-center rounded border border-border">
                  {checked && <Check className="h-3 w-3" />}
                </span>
                <span>{opt}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function TopicCard({ topic }: { topic: TopicRoute }) {
  return (
    <Link
      to={topic.path}
      className="overview-card"
      data-testid={`topic-link-${topic.id}`}
    >
      <div className="overview-card-header">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="overview-card-title">{topic.label}</span>
          {topic.isNew && (
            <span className="overview-badge-new">
              <Sparkles className="h-3 w-3" /> NEW
            </span>
          )}
          {topic.updatedAt && !topic.isNew && (
            <span className="overview-badge-updated">
              <Clock className="h-3 w-3" /> UPDATED
            </span>
          )}
        </div>
        <span className="overview-card-category">{topic.category}</span>
      </div>
      <p className="overview-card-description">{topic.description}</p>
      
      {((topic.tags && topic.tags.length > 0) || topic.difficulty) && (
        <div className="overview-card-footer">
          {topic.difficulty && (
            <span className="overview-card-difficulty">{topic.difficulty}</span>
          )}
          {topic.tags && topic.tags.map((tag) => (
            <span key={tag} className="overview-card-tag">
              #{tag}
            </span>
          ))}
        </div>
      )}
    </Link>
  )
}

export function OverviewPage() {
  const { topics, loading } = useTopics()
  const [search, setSearch] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [sortValue, setSortValue] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [viewMode, setViewMode] = useState<'shelves' | 'grid'>('shelves')

  const { column: sortColumn, direction: sortDirection } = parseSortValue(sortValue)

  // Map of categories and their topic counts
  const categoryStats = useMemo(() => {
    const map = new Map<string, number>()
    topics.forEach((t) => {
      const cat = t.category || 'Uncategorized'
      map.set(cat, (map.get(cat) || 0) + 1)
    })
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]))
  }, [topics])

  const categories = useMemo(() => {
    return categoryStats.map(([cat]) => cat)
  }, [categoryStats])

  const filteredTopics = useMemo(() => {
    let result = [...topics]

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (t) =>
          t.label.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          (t.tags && t.tags.some((tag) => tag.toLowerCase().includes(q))),
      )
    }

    if (selectedCategories.length > 0) {
      result = result.filter((t) => selectedCategories.includes(t.category))
    }

    if (sortColumn && sortDirection) {
      result.sort((a, b) => {
        if (sortColumn === 'updated') {
          const aDate = a.updatedAt || '0'
          const bDate = b.updatedAt || '0'
          const cmp = aDate.localeCompare(bDate)
          return sortDirection === 'asc' ? cmp : -cmp
        }
        const aVal = String((a as unknown as Record<string, string>)[sortColumn] || '')
        const bVal = String((b as unknown as Record<string, string>)[sortColumn] || '')
        const cmp = aVal.localeCompare(bVal)
        return sortDirection === 'asc' ? cmp : -cmp
      })
    }

    return result
  }, [topics, search, selectedCategories, sortColumn, sortDirection])

  // Grouped topics by Category for Shelves view
  const categoryShelves = useMemo(() => {
    const map = new Map<string, TopicRoute[]>()
    filteredTopics.forEach((topic) => {
      const cat = topic.category || 'Uncategorized'
      if (!map.has(cat)) map.set(cat, [])
      map.get(cat)!.push(topic)
    })
    return Array.from(map.entries())
  }, [filteredTopics])

  const handleCategoryCardClick = (category: string) => {
    if (category === 'ALL') {
      setSelectedCategories([])
    } else if (selectedCategories.includes(category) && selectedCategories.length === 1) {
      setSelectedCategories([])
    } else {
      setSelectedCategories([category])
    }
    setCurrentPage(1)
  }

  const { pageItems: pagedTopics, totalPages, startIdx, endIdx, totalItems } = usePagination({
    items: filteredTopics, page: currentPage, pageSize: rowsPerPage,
  })

  if (loading) {
    return (
      <div className="overview-page">
        <div className="topic-loading">Loading topics...</div>
      </div>
    )
  }

  const isAllSelected = selectedCategories.length === 0

  return (
    <div className="overview-page">
      <ScrollReveal>
        <div className="overview-header">
          <h2 className="overview-page-title">Interactive Learning Platform</h2>
          <p className="overview-page-subtitle">
            Select a category to explore topics with interactive diagrams, animations, and trade-off sandboxes.
          </p>
        </div>
      </ScrollReveal>

      {/* Category Selection Cards */}
      <ScrollReveal delay={0.1}>
        <section className="overview-category-selector" aria-label="Category Selection">
          <div className="overview-category-cards">
            <button
              type="button"
              onClick={() => handleCategoryCardClick('ALL')}
              className={cn(
                "overview-category-card",
                isAllSelected && "active",
              )}
            >
              <div className="overview-category-card-header">
                <span className="overview-category-card-title">All Topics</span>
                <span className="overview-category-card-count">{topics.length}</span>
              </div>
              <p className="overview-category-card-sub">View full curriculum catalog</p>
            </button>

            {categoryStats.map(([cat, count]) => {
              const isSelected = selectedCategories.includes(cat)
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => handleCategoryCardClick(cat)}
                  className={cn(
                    "overview-category-card",
                    isSelected && "active",
                  )}
                  data-testid={`category-card-${cat}`}
                >
                  <div className="overview-category-card-header">
                    <span className="overview-category-card-title">{cat}</span>
                    <span className="overview-category-card-count">{count}</span>
                  </div>
                  <p className="overview-category-card-sub">
                    {count === 1 ? '1 topic' : `${count} topics`}
                  </p>
                </button>
              )
            })}
          </div>
        </section>
      </ScrollReveal>

      <div className="overview-controls">
        <div className="overview-search">
          <Search className="overview-search-icon h-4 w-4" />
          <input
            type="text"
            className="overview-search-input"
            placeholder="Search topics or #tags..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }}
            data-testid="overview-search"
          />
        </div>

        <div className="overview-dropdowns">
          <MultiSelectDropdown
            options={categories}
            selected={selectedCategories}
            onChange={(vals) => { setSelectedCategories(vals); setCurrentPage(1) }}
            placeholder="Categories"
            dataTestId="overview-filters"
          />

          <Dropdown
            value={sortValue}
            onChange={(val) => { setSortValue(val); setCurrentPage(1) }}
            options={SORT_OPTIONS}
            data-testid="sort-dropdown"
            triggerClassName="overview-sort-select"
            className="overview-sort-dropdown min-w-[130px]"
            native={true}
          />

          <div className="overview-view-toggle">
            <button
              type="button"
              className={cn(
                "overview-toggle-btn",
                viewMode === 'shelves' && "active",
              )}
              onClick={() => setViewMode('shelves')}
              title="Category Shelves View"
              aria-label="Switch to Category Shelves View"
            >
              <Layers className="h-4 w-4" />
            </button>
            <button
              type="button"
              className={cn(
                "overview-toggle-btn",
                viewMode === 'grid' && "active",
              )}
              onClick={() => setViewMode('grid')}
              title="All Topics Grid View"
              aria-label="Switch to All Topics Grid View"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <ScrollReveal delay={0.15}>
        {filteredTopics.length === 0 ? (
          <div className="overview-empty" data-testid="overview-table">
            No topics found.
          </div>
        ) : viewMode === 'shelves' ? (
          /* CATEGORY SHELVES VIEW */
          <div className="overview-shelves" data-testid="overview-table">
            {categoryShelves.map(([category, catTopics]) => (
              <div key={category} className="overview-shelf">
                <div className="overview-shelf-header">
                  <div className="flex items-center gap-2">
                    <h3 className="overview-shelf-title">{category}</h3>
                    <span className="overview-shelf-count">{catTopics.length}</span>
                  </div>
                </div>
                <div className="overview-cards">
                  {catTopics.map((topic) => (
                    <TopicCard key={topic.id} topic={topic} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* FLAT GRID VIEW (with pagination) */
          <div className="overview-cards" data-testid="overview-table">
            {pagedTopics.map((topic) => (
              <TopicCard key={topic.id} topic={topic} />
            ))}
          </div>
        )}
      </ScrollReveal>

      {/* Pagination controls for Grid View */}
      {viewMode === 'grid' && totalItems > 0 && (
        <ScrollReveal delay={0.3}>
          <div className="overview-pagination" data-testid="overview-pagination">
            <div className="overview-pagination-info">
              Showing {startIdx + 1}&#8211;{endIdx} of {totalItems}
            </div>

            <div className="overview-pagination-controls">
              <button
                className="overview-pagination-button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                data-testid="pagination-prev"
              >
                Previous
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  className={cn(
                    "overview-pagination-page h-8 w-8 rounded-full text-sm font-medium transition-colors",
                    page === currentPage
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent",
                  )}
                  onClick={() => setCurrentPage(page)}
                  data-testid={`pagination-page-${page}`}
                >
                  {page}
                </button>
              ))}

              <button
                className="overview-pagination-button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                data-testid="pagination-next"
              >
                Next
              </button>
            </div>

            <div className="overview-rows-per-page">
              <label htmlFor="rows-per-page" className="overview-rows-label">
                Rows per page:
              </label>
              <Dropdown
                value={String(rowsPerPage)}
                onChange={(val) => { setRowsPerPage(Number(val)); setCurrentPage(1) }}
                options={rowsPerPageOptions.map(opt => ({ value: String(opt), label: String(opt) }))}
                data-testid="rows-per-page"
                triggerClassName="overview-rows-select"
                className="overview-rows-dropdown"
                native={true}
              />
            </div>
          </div>
        </ScrollReveal>
      )}
    </div>
  )
}

