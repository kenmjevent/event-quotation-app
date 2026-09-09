'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../../../lib/supabase'

type ActivityLog = {
  id: string
  quotation_id: string | null
  quotation_no: string | null
  action: string | null
  details: string | null
  performed_by: string | null
  created_at: string
}

export default function ActivityPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('all')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    loadLogs()
  }, [])

  async function loadLogs() {
    setLoading(true)
    setErrorMessage('')

    const { data, error } = await supabase
      .from('quotation_logs')
      .select(`
        id,
        quotation_id,
        quotation_no,
        action,
        details,
        performed_by,
        created_at
      `)
      .order('created_at', {
        ascending: false,
      })
      .limit(200)

    if (error) {
      setErrorMessage(error.message)
      setLoading(false)
      return
    }

    setLogs(data || [])
    setLoading(false)
  }

  const filteredLogs = useMemo(() => {
    const keyword = search.trim().toLowerCase()

    return logs.filter((log) => {
      const action = String(log.action || '').toLowerCase()

      const matchesAction =
        actionFilter === 'all' ||
        action === actionFilter.toLowerCase()

      const matchesSearch =
        !keyword ||
        String(log.quotation_no || '')
          .toLowerCase()
          .includes(keyword) ||
        String(log.performed_by || '')
          .toLowerCase()
          .includes(keyword) ||
        String(log.details || '')
          .toLowerCase()
          .includes(keyword) ||
        String(log.action || '')
          .toLowerCase()
          .includes(keyword)

      return matchesAction && matchesSearch
    })
  }, [logs, search, actionFilter])

  function formatDateTime(value: string) {
    return new Date(value).toLocaleString('en-MY', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <main className="page">
      <header className="topBar">
        <Link href="/" className="backButton">
          ←
        </Link>

        <div>
          <div className="topTitle">
            Activity Log
          </div>

          <div className="topSubtitle">
            Costing history and user actions
          </div>
        </div>
      </header>

      <section className="summaryRow">
        <div className="summaryCard">
          <div className="summaryLabel">
            Total Records
          </div>

          <div className="summaryValue">
            {logs.length}
          </div>
        </div>

        <div className="summaryCard">
          <div className="summaryLabel">
            Showing
          </div>

          <div className="summaryValue">
            {filteredLogs.length}
          </div>
        </div>
      </section>

      <section className="filterCard">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search costing no., user or details..."
          className="searchInput"
        />

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="actionSelect"
        >
          <option value="all">
            All Actions
          </option>

          <option value="create">
            Create
          </option>

          <option value="edit">
            Edit
          </option>

          <option value="submit">
            Submit
          </option>

          <option value="approve">
            Approve
          </option>

          <option value="reject">
            Reject
          </option>

          <option value="delete">
            Delete
          </option>
        </select>

        <button
          type="button"
          onClick={loadLogs}
          className="refreshButton"
        >
          Refresh
        </button>
      </section>

      {errorMessage && (
        <div className="errorBox">
          {errorMessage}
        </div>
      )}

      {loading && (
        <div className="emptyCard">
          Loading activity...
        </div>
      )}

      {!loading && filteredLogs.length === 0 && (
        <div className="emptyCard">
          No activity found.
        </div>
      )}

      {!loading && filteredLogs.length > 0 && (
        <>
          <div className="desktopTable">
            <table>
              <thead>
                <tr>
                  <th>
                    Date / Time
                  </th>

                  <th>
                    Costing No.
                  </th>

                  <th>
                    Action
                  </th>

                  <th>
                    Performed By
                  </th>

                  <th>
                    Details
                  </th>

                  <th>
                    View
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="dateCell">
                      {formatDateTime(log.created_at)}
                    </td>

                    <td>
                      <strong>
                        {log.quotation_no || '-'}
                      </strong>
                    </td>

                    <td>
                      <ActionBadge action={log.action || ''} />
                    </td>

                    <td>
                      {log.performed_by || '-'}
                    </td>

                    <td className="detailsCell">
                      {log.details || '-'}
                    </td>

                    <td>
                      {log.quotation_id ? (
                        <Link
                          href={`/quotations/${log.quotation_id}`}
                          className="viewButton"
                        >
                          View
                        </Link>
                      ) : (
                        <span className="deletedText">
                          Deleted
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mobileCards">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className="activityCard"
              >
                <div className="cardTop">
                  <div>
                    <div className="quotationNo">
                      {log.quotation_no || '-'}
                    </div>

                    <div className="dateTime">
                      {formatDateTime(log.created_at)}
                    </div>
                  </div>

                  <ActionBadge action={log.action || ''} />
                </div>

                <div className="infoRow">
                  <span>
                    Performed By
                  </span>

                  <strong>
                    {log.performed_by || '-'}
                  </strong>
                </div>

                <div className="detailsBox">
                  {log.details || '-'}
                </div>

                {log.quotation_id ? (
                  <Link
                    href={`/quotations/${log.quotation_id}`}
                    className="mobileViewButton"
                  >
                    View Costing
                  </Link>
                ) : (
                  <div className="deletedBox">
                    This costing was deleted
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      <style jsx global>{`
        * {
          box-sizing: border-box;
        }

        html,
        body {
          margin: 0;
          padding: 0;
          background: #f4f6fa;
          font-family: Arial, sans-serif;
        }

        .page {
          min-height: 100vh;
          max-width: 1200px;
          margin: 0 auto;
          padding: 18px 14px 40px;
        }

        .topBar {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 18px;
        }

        .backButton {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          background: white;
          border: 1px solid #e5e7eb;
          display: flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          color: #0f766e;
          font-size: 24px;
          font-weight: 800;
        }

        .topTitle {
          font-size: 24px;
          font-weight: 800;
          color: #111827;
        }

        .topSubtitle {
          margin-top: 3px;
          font-size: 13px;
          color: #6b7280;
        }

        .summaryRow {
          display: grid;
          grid-template-columns:
            repeat(2, minmax(0, 1fr));
          gap: 10px;
          margin-bottom: 14px;
        }

        .summaryCard {
          background: white;
          border-radius: 16px;
          padding: 14px;
          border: 1px solid #e8ecf1;
        }

        .summaryLabel {
          font-size: 12px;
          color: #6b7280;
        }

        .summaryValue {
          margin-top: 4px;
          font-size: 23px;
          font-weight: 800;
          color: #111827;
        }

        .filterCard {
          display: grid;
          grid-template-columns:
            minmax(0, 1fr)
            180px
            auto;
          gap: 10px;
          background: white;
          padding: 14px;
          border: 1px solid #e8ecf1;
          border-radius: 16px;
          margin-bottom: 16px;
        }

        .searchInput,
        .actionSelect {
          width: 100%;
          min-width: 0;
          padding: 11px 12px;
          border: 1px solid #d1d5db;
          border-radius: 10px;
          background: white;
          font-size: 14px;
        }

        .refreshButton {
          border: none;
          border-radius: 10px;
          padding: 0 14px;
          background: #0f766e;
          color: white;
          font-weight: 700;
          cursor: pointer;
        }

        .desktopTable {
          overflow-x: auto;
          background: white;
          border: 1px solid #e8ecf1;
          border-radius: 18px;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          min-width: 950px;
        }

        th {
          text-align: left;
          background: #f8fafc;
          padding: 13px;
          font-size: 12px;
          color: #4b5563;
        }

        td {
          padding: 13px;
          border-top: 1px solid #edf0f3;
          font-size: 13px;
          color: #111827;
          vertical-align: top;
        }

        .dateCell {
          white-space: nowrap;
        }

        .detailsCell {
          max-width: 320px;
          line-height: 1.4;
        }

        .viewButton {
          text-decoration: none;
          border: 1px solid #d1d5db;
          background: white;
          color: #374151;
          border-radius: 8px;
          padding: 7px 9px;
          font-size: 12px;
          font-weight: 700;
        }

        .deletedText {
          color: #9ca3af;
          font-size: 12px;
        }

        .actionBadge {
          display: inline-flex;
          padding: 5px 9px;
          border-radius: 999px;
          font-size: 10px;
          font-weight: 800;
        }

        .actionCreate {
          background: #dbeafe;
          color: #1d4ed8;
        }

        .actionEdit {
          background: #e0e7ff;
          color: #4338ca;
        }

        .actionSubmit {
          background: #fef3c7;
          color: #92400e;
        }

        .actionApprove {
          background: #dcfce7;
          color: #166534;
        }

        .actionReject {
          background: #fee2e2;
          color: #991b1b;
        }

        .actionDelete {
          background: #f3f4f6;
          color: #4b5563;
        }

        .actionDefault {
          background: #f3f4f6;
          color: #374151;
        }

        .mobileCards {
          display: none;
        }

        .activityCard {
          background: white;
          border: 1px solid #e8ecf1;
          border-radius: 18px;
          padding: 15px;
        }

        .cardTop {
          display: flex;
          justify-content: space-between;
          gap: 12px;
        }

        .quotationNo {
          font-size: 16px;
          font-weight: 800;
          color: #0f766e;
        }

        .dateTime {
          margin-top: 3px;
          color: #9ca3af;
          font-size: 11px;
        }

        .infoRow {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          margin-top: 14px;
          font-size: 12px;
        }

        .infoRow span {
          color: #6b7280;
        }

        .detailsBox {
          margin-top: 12px;
          padding: 11px;
          border-radius: 11px;
          background: #f8fafc;
          color: #374151;
          font-size: 12px;
          line-height: 1.45;
          word-break: break-word;
        }

        .mobileViewButton {
          display: block;
          margin-top: 12px;
          text-align: center;
          text-decoration: none;
          background: #0f766e;
          color: white;
          font-size: 12px;
          font-weight: 800;
          padding: 10px;
          border-radius: 10px;
        }

        .deletedBox {
          margin-top: 12px;
          text-align: center;
          background: #f3f4f6;
          color: #6b7280;
          padding: 10px;
          border-radius: 10px;
          font-size: 12px;
        }

        .errorBox {
          margin-bottom: 14px;
          padding: 12px;
          border-radius: 10px;
          background: #fee2e2;
          color: #991b1b;
          font-size: 13px;
        }

        .emptyCard {
          background: white;
          border: 1px solid #e8ecf1;
          border-radius: 16px;
          padding: 20px;
          color: #6b7280;
        }

        @media (max-width: 700px) {
          .filterCard {
            grid-template-columns: 1fr;
          }

          .refreshButton {
            padding: 11px;
          }

          .desktopTable {
            display: none;
          }

          .mobileCards {
            display: grid;
            gap: 12px;
          }
        }
      `}</style>
    </main>
  )
}

function ActionBadge({
  action,
}: {
  action: string
}) {
  const value = action.toLowerCase()

  let className =
    'actionBadge actionDefault'

  if (value === 'create') {
    className =
      'actionBadge actionCreate'
  }

  if (value === 'edit') {
    className =
      'actionBadge actionEdit'
  }

  if (value === 'submit') {
    className =
      'actionBadge actionSubmit'
  }

  if (value === 'approve') {
    className =
      'actionBadge actionApprove'
  }

  if (value === 'reject') {
    className =
      'actionBadge actionReject'
  }

  if (value === 'delete') {
    className =
      'actionBadge actionDelete'
  }

  return (
    <span className={className}>
      {action || 'UNKNOWN'}
    </span>
  )
}