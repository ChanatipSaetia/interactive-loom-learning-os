import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import type { TopicRoute } from '../../core/routes'
import { useTopicFiltering, type SortDirection, type SortColumn } from '../../core/hooks/useTopicFiltering'
import { usePagination } from '../../core/hooks/usePagination'
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
      return <ChevronsUpDown className="overview-sort-icon" size={14} />
    }
    return sortDirection === 'asc'
      ? <ChevronUp className="overview-sort-icon" size={14} />
      : <ChevronDown className="overview-sort-icon" size={14} />
  }

  return (
    <div className="overview-page">
      <h2 className="overview-page-title">Interactive Learning Platform</h2>
      <p className="overview-page-subtitle">
        Browse and search topics with interactive diagrams, animations, and exercises.
      </p>

      <div className="overview-controls">
        <div className="overview-search">
          <Search size={16} className="overview-search-icon" />
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
              className={`overview-filter-chip${activeCategory === cat ? ' overview-filter-chip-active' : ''}`}
              onClick={() => { setActiveCategory(cat); setCurrentPage(1) }}
              data-testid={`filter-chip-${cat}`}
            >
              {cat === 'all' ? 'All' : cat}
            </button>
          ))}
        </div>
      </div>

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
              pagedTopics.map((topic) => (
                <tr key={topic.id} className="overview-table-row">
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
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalItems > 0 && (
        <div className="overview-pagination" data-testid="overview-pagination">
          <div className="overview-pagination-info">
            Showing {startIdx + 1}–{endIdx} of {totalItems}
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
                className={`overview-pagination-page${page === currentPage ? ' overview-pagination-page-active' : ''}`}
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
            <select
              id="rows-per-page"
              className="overview-rows-select"
              value={rowsPerPage}
              onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1) }}
              data-testid="rows-per-page"
            >
              {rowsPerPageOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  )
}
