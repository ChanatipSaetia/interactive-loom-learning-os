import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import type { TopicRoute } from '../../core/routes'
import { useTopicFiltering, type SortDirection, type SortColumn } from '../../core/hooks/useTopicFiltering'
import { usePagination } from '../../core/hooks/usePagination'
import { ScrollReveal } from '../motion/scroll-reveal'
import { Dropdown } from '../motion/dropdown'
import { cn } from '../../lib/utils'
import './overview.css'

const rowsPerPageOptions = [5, 10, 20]

export function OverviewPage({ topics }: { topics: TopicRoute[] }) {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const [sortColumn, setSortColumn] = useState<SortColumn>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  const { categories, filteredTopics } = useTopicFiltering({
    topics, search, activeCategory, sortColumn, sortDirection,
  })

  const { pageItems: pagedTopics, totalPages, startIdx, endIdx, totalItems } = usePagination({
    items: filteredTopics, page: currentPage, pageSize: rowsPerPage,
  })

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      if (sortDirection === 'asc') {
        setSortDirection('desc')
      } else if (sortDirection === 'desc') {
        setSortColumn(null)
        setSortDirection(null)
      } else {
        setSortDirection('asc')
      }
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
    setCurrentPage(1)
  }

  const getSortIcon = (column: SortColumn) => {
    if (sortColumn !== column) {
      return <ChevronsUpDown className="h-3.5 w-3.5" />
    }
    return sortDirection === 'asc'
      ? <ChevronUp className="h-3.5 w-3.5" />
      : <ChevronDown className="h-3.5 w-3.5" />
  }

  return (
    <div className="overview-page">
      <ScrollReveal>
        <div className="overview-header">
          <h2 className="overview-page-title">Interactive Learning Platform</h2>
          <p className="overview-page-subtitle">
            Browse and search topics with interactive diagrams, animations, and exercises.
          </p>
        </div>
      </ScrollReveal>

      <ScrollReveal delay={0.1}>
        <div className="overview-controls">
          <div className="overview-search">
            <Search className="overview-search-icon h-4 w-4" />
            <input
              type="text"
              className="overview-search-input"
              placeholder="Search topics..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }}
              data-testid="overview-search"
            />
          </div>

          <div className="overview-filters" data-testid="overview-filters">
            {categories.map((cat) => (
              <button
                key={cat}
                className={cn(
                  "overview-filter-chip rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                  activeCategory === cat
                    ? "bg-primary border-primary text-primary-foreground overview-filter-chip-active"
                    : "border-border bg-card text-muted-foreground hover:text-foreground hover:bg-accent",
                )}
                onClick={() => { setActiveCategory(cat); setCurrentPage(1) }}
                data-testid={`filter-chip-${cat}`}
              >
                {cat === 'all' ? 'All' : cat}
              </button>
            ))}
          </div>
        </div>
      </ScrollReveal>

      <ScrollReveal delay={0.15}>
        <div className="overview-table-wrapper">
          <table className="overview-table" data-testid="overview-table">
            <thead>
              <tr>
                <th className="overview-table-header">
                  <button
                    className="overview-table-header-button"
                    onClick={() => handleSort('label')}
                    data-testid="sort-label"
                  >
                    Topic {getSortIcon('label')}
                  </button>
                </th>
                <th className="overview-table-header">
                  <button
                    className="overview-table-header-button"
                    onClick={() => handleSort('category')}
                    data-testid="sort-category"
                  >
                    Category {getSortIcon('category')}
                  </button>
                </th>
                <th className="overview-table-header">
                  <button
                    className="overview-table-header-button"
                    onClick={() => handleSort('description')}
                    data-testid="sort-description"
                  >
                    Description {getSortIcon('description')}
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {pagedTopics.length === 0 ? (
                <tr>
                  <td colSpan={3} className="overview-table-empty">
                    No topics found.
                  </td>
                </tr>
              ) : (
                pagedTopics.map((topic, idx) => (
                  <ScrollReveal key={topic.id} as="tr" delay={0.2 + idx * 0.05} y={8} blur={4} className="overview-table-row">
                      <td className="overview-table-cell">
                        <Link
                          to={topic.path}
                          className="overview-table-link"
                          data-testid={`topic-link-${topic.id}`}
                        >
                          {topic.label}
                        </Link>
                      </td>
                      <td className="overview-table-cell">
                        <span className="overview-table-category">{topic.category}</span>
                      </td>
                      <td className="overview-table-cell overview-table-description">
                        {topic.description}
                      </td>
                  </ScrollReveal>
                ))
              )}
            </tbody>
          </table>
        </div>
      </ScrollReveal>

      {totalItems > 0 && (
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
