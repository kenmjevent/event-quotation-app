'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../../lib/supabase'

type ActivityLog = {
  id: string
  quotation_id: string | null
  quotation_no: string | null
  action: string
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
        action === actionFilter

      const matchesSearch =
        !keyword ||
        String(log.quotation_no || '')
          .toLowerCase()
          .includes(keyword) ||
        String(log.details || '')
          .toLowerCase()
          .includes(keyword) ||
        String(log.performed_by || '')
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
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  function getActionClass(action: string) {
    const value = action.toLowerCase()

    if (value === 'create') return 'badgeCreate'
    if (value === 'delete') return 'badgeDelete'
    if (value === 'edit' || value === 'update') return 'badgeEdit'
    if (value === 'pending') return 'badgePending'
    if (value === 'approved') return 'badgeApproved'
    if (value === 'rejected') return 'badgeRejected'

    return 'badgeDefault'
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
            System action history
          </div>
        </div>
      </header>

      <section className="summaryRow">
        <div className="summaryCard">
          <div className="summaryLabel">
            Total Logs
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
          onChange={(e) =>
            setSearch(e.target.value)
          }
          placeholder="Search costing no., action details or user..."
          className="searchInput"
        />

        <select
          value={actionFilter}
          onChange={(e) =>
            setActionFilter(e.target.value)
          }
          className="selectInput"
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

          <option value="update">
            Update
          </option>

          <option value="delete">
            Delete
          </option>

          <option value="pending">
            Pending
          </option>

          <option value="approved">
            Approved
          </option>

          <option value="rejected">
            Rejected
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
          Loading activity logs...
        </div>
      )}

      {!loading &&
        filteredLogs.length === 0 && (
          <div className="emptyCard">
            No activity found.
          </div>
        )}

      {!loading &&
        filteredLogs.length > 0 && (
          <>
            <div className="desktopTableWrap">
              <table className="activityTable">
                <thead>
                  <tr>
                    <th>Date / Time</th>
                    <th>Action</th>
                    <th>Costing No.</th>
                    <th>Details</th>
                    <th>User</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredLogs.map((log) => (
                    <tr key={log.id}>
                      <td>
                        {formatDateTime(
                          log.created_at
                        )}
                      </td>

                      <td>
                        <ActionBadge
                          action={log.action}
                          className={getActionClass(
                            log.action
                          )}
                        />
                      </td>

                      <td>
                        {log.quotation_no ? (
                          log.quotation_id ? (
                            <Link
                              href={`/quotations/${log.quotation_id}`}
                              className="quotationLink"
                            >
                              {log.quotation_no}
                            </Link>
                          ) : (
                            <strong>
                              {log.quotation_no}
                            </strong>
                          )
                        ) : (
                          '-'
                        )}
                      </td>

                      <td className="detailsCell">
                        {log.details || '-'}
                      </td>

                      <td>
                        {log.performed_by ||
                          'System'}
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
                  className="logCard"
                >
                  <div className="cardTop">
                    <ActionBadge
                      action={log.action}
                      className={getActionClass(
                        log.action
                      )}
                    />

                    <div className="dateTime">
                      {formatDateTime(
                        log.created_at
                      )}
                    </div>
                  </div>

                  <div className="quotationNo">
                    {log.quotation_id &&
                    log.quotation_no ? (
                      <Link
                        href={`/quotations/${log.quotation_id}`}
                        className="quotationLink"
                      >
                        {log.quotation_no}
                      </Link>
                    ) : (
                      log.quotation_no || '-'
                    )}
                  </div>

                  <div className="details">
                    {log.details ||
                      'No details'}
                  </div>

                  <div className="performedBy">
                    By:{' '}
                    <strong>
                      {log.performed_by ||
                        'System'}
                    </strong>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

      <nav className="bottomNav">
        <BottomNavItem
          href="/"
          icon="🏠"
          label="Home"
        />

        <BottomNavItem
          href="/calculator"
          icon="🧮"
          label="Costing"
        />

        <BottomNavItem
          href="/materials"
          icon="📦"
          label="Material"
        />

        <BottomNavItem
          href="/approvals"
          icon="✅"
          label="Approval"
        />

        <BottomNavItem
          href="/profile"
          icon="👤"
          label="Profile"
        />
      </nav>

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

        body {
          padding-bottom: 90px;
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
          color: #6b7280;
          font-size: 13px;
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
          border: 1px solid #e8ecf1;
          border-radius: 16px;
          padding: 14px;
        }

        .summaryLabel {
          color: #6b7280;
          font-size: 12px;
        }

        .summaryValue {
          margin-top: 5px;
          color: #111827;
          font-size: 23px;
          font-weight: 800;
        }

        .filterCard {
          display: grid;
          grid-template-columns:
            minmax(0, 1fr)
            180px
            auto;
          gap: 10px;
          background: white;
          border: 1px solid #e8ecf1;
          border-radius: 16px;
          padding: 14px;
          margin-bottom: 16px;
        }

        .searchInput,
        .selectInput {
          width: 100%;
          min-width: 0;
          border: 1px solid #d1d5db;
          border-radius: 10px;
          padding: 11px 12px;
          background: white;
          font-size: 14px;
        }

        .refreshButton {
          border: none;
          border-radius: 10px;
          background: #0f766e;
          color: white;
          padding: 0 14px;
          font-weight: 700;
          cursor: pointer;
        }

        .desktopTableWrap {
          background: white;
          border: 1px solid #e8ecf1;
          border-radius: 18px;
          overflow-x: auto;
        }

        .activityTable {
          width: 100%;
          min-width: 900px;
          border-collapse: collapse;
        }

        .activityTable th {
          background: #f8fafc;
          text-align: left;
          padding: 13px;
          color: #4b5563;
          font-size: 12px;
        }

        .activityTable td {
          padding: 13px;
          border-top: 1px solid #edf0f3;
          color: #111827;
          font-size: 13px;
          vertical-align: top;
        }

        .detailsCell {
          max-width: 420px;
        }

        .actionBadge {
          display: inline-flex;
          align-items: center;
          padding: 5px 9px;
          border-radius: 999px;
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .badgeCreate {
          background: #dcfce7;
          color: #166534;
        }

        .badgeEdit {
          background: #dbeafe;
          color: #1d4ed8;
        }

        .badgeDelete {
          background: #fee2e2;
          color: #991b1b;
        }

        .badgePending {
          background: #fef3c7;
          color: #92400e;
        }

        .badgeApproved {
          background: #d1fae5;
          color: #047857;
        }

        .badgeRejected {
          background: #fee2e2;
          color: #b91c1c;
        }

        .badgeDefault {
          background: #f3f4f6;
          color: #4b5563;
        }

        .quotationLink {
          color: #0f766e;
          font-weight: 800;
          text-decoration: none;
        }

        .mobileCards {
          display: none;
        }

        .logCard {
          background: white;
          border: 1px solid #e8ecf1;
          border-radius: 17px;
          padding: 15px;
          box-shadow:
            0 4px 14px
            rgba(15, 23, 42, 0.04);
        }

        .cardTop {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
        }

        .dateTime {
          color: #9ca3af;
          font-size: 10px;
          text-align: right;
        }

        .quotationNo {
          margin-top: 13px;
          color: #0f766e;
          font-size: 15px;
          font-weight: 800;
        }

        .details {
          margin-top: 7px;
          color: #374151;
          font-size: 13px;
          line-height: 1.45;
        }

        .performedBy {
          margin-top: 10px;
          padding-top: 10px;
          border-top: 1px solid #edf0f3;
          color: #9ca3af;
          font-size: 11px;
        }

        .emptyCard {
          background: white;
          border: 1px solid #e8ecf1;
          border-radius: 16px;
          padding: 22px;
          color: #6b7280;
        }

        .errorBox {
          margin-bottom: 14px;
          background: #fee2e2;
          color: #991b1b;
          border-radius: 10px;
          padding: 12px;
          font-size: 13px;
        }

        .bottomNav {
          position: fixed;
          left: 0;
          right: 0;
          bottom: 0;
          height: 72px;
          background:
            rgba(255, 255, 255, 0.97);
          border-top: 1px solid #e5e7eb;
          display: grid;
          grid-template-columns:
            repeat(5, 1fr);
          z-index: 999;
        }

        .navItem {
          text-decoration: none;
          color: #7b8491;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 3px;
          font-size: 10px;
          font-weight: 600;
        }

        .navIcon {
          font-size: 21px;
        }

        @media (max-width: 700px) {
          .filterCard {
            grid-template-columns: 1fr;
          }

          .refreshButton {
            padding: 11px;
          }

          .desktopTableWrap {
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
  className,
}: {
  action: string
  className: string
}) {
  return (
    <span
      className={`actionBadge ${className}`}
    >
      {action}
    </span>
  )
}

function BottomNavItem({
  href,
  icon,
  label,
}: {
  href: string
  icon: string
  label: string
}) {
  return (
    <Link
      href={href}
      className="navItem"
    >
      <span className="navIcon">
        {icon}
      </span>

      <span>
        {label}
      </span>
    </Link>
  )
}