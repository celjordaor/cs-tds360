import { useState } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'
import Spinner from '@/components/ui/Spinner'
import EmptyState from '@/components/ui/EmptyState'

// columns: [{key, header, render?(row)=>, sortable?, width?}]
// rows: any[]
export default function DataTable({ columns = [], rows = [], loading = false,
  onRowClick, emptyTitle, emptyDescription, keyExtractor = r => r.id }) {
  const [sort, setSort] = useState({ key: null, dir: 'asc' })

  function toggleSort(key) {
    setSort(s => ({ key, dir: s.key === key && s.dir === 'asc' ? 'desc' : 'asc' }))
  }

  const sorted = sort.key
    ? [...rows].sort((a, b) => {
      const av = a[sort.key] ?? '', bv = b[sort.key] ?? ''
      const cmp = String(av).localeCompare(String(bv), 'pt-BR')
      return sort.dir === 'asc' ? cmp : -cmp
    })
    : rows

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50">
            {columns.map(col => (
              <th key={col.key}
                className={`px-4 py-3 text-left font-semibold text-slate-500 text-xs uppercase tracking-wide whitespace-nowrap
                  ${col.sortable ? 'cursor-pointer select-none hover:text-slate-700' : ''}`}
                style={col.width ? { width: col.width } : {}}
                onClick={() => col.sortable && toggleSort(col.key)}
              >
                <span className="inline-flex items-center gap-1">
                  {col.header}
                  {col.sortable && sort.key === col.key
                    ? sort.dir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                    : col.sortable ? <ChevronDown className="w-3 h-3 opacity-20" /> : null
                  }
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading
            ? <tr><td colSpan={columns.length} className="py-16 text-center"><Spinner size="lg" /></td></tr>
            : sorted.length === 0
              ? <tr><td colSpan={columns.length}><EmptyState title={emptyTitle} description={emptyDescription} /></td></tr>
              : sorted.map(row => (
                <tr key={keyExtractor(row)}
                  onClick={() => onRowClick?.(row)}
                  className={`border-b border-slate-50 last:border-0 transition-colors ${onRowClick ? 'cursor-pointer hover:bg-orange-50/50' : 'hover:bg-slate-50/50'}`}
                >
                  {columns.map(col => (
                    <td key={col.key} className="px-4 py-3 text-slate-700">
                      {col.render ? col.render(row) : row[col.key] ?? '—'}
                    </td>
                  ))}
                </tr>
              ))
          }
        </tbody>
      </table>
    </div>
  )
}
