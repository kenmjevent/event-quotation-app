'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../../lib/supabase'

type Costing = {
  id: string
  quotation_no: string
  customer_name: string | null
  project_name: string | null
  quotation_date: string | null
  status: string | null
  total_cost: number | null
  selling_price: number | null
  gross_profit: number | null
  gross_margin: number | null
  created_at: string
}

export default function CostListingsPage() {
  const [costings, setCostings] = useState<Costing[]>([])
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    loadCostings()
  }, [])

  async function loadCostings() {
    setLoading(true)
    setErrorMessage('')

    const { data, error } = await supabase
      .from('quotations')
      .select(`
        id,
        quotation_no,
        customer_name,
        project_name,
        quotation_date,
        status,
        total_cost,
        selling_price,
        gross_profit,
        gross_margin,
        created_at
      `)
      .order('created_at', {
        ascending: false,
      })

    if (error) {
      setErrorMessage(error.message)
      setLoading(false)
      return
    }

    setCostings(data || [])
    setLoading(false)
  }

  const filteredCostings = useMemo(() => {
    const keyword = search.trim().toLowerCase()

    return costings.filter((item) => {
      const matchesSearch =
        !keyword ||
        String(item.quotation_no || '')
          .toLowerCase()
          .includes(keyword) ||
        String(item.customer_name || '')
          .toLowerCase()
          .includes(keyword) ||
        String(item.project_name || '')
          .toLowerCase()
          .includes(keyword)

      const matchesStatus =
        statusFilter === 'all' ||
        String(item.status || 'draft').toLowerCase() ===
          statusFilter.toLowerCase()

      return matchesSearch && matchesStatus
    })
  }, [costings, search, statusFilter])

  async function deleteCosting(item: Costing) {
    const confirmed = window.confirm(
      `Delete ${item.quotation_no}?\n\n${item.project_name || ''}\n\nThis cannot be undone.`
    )

    if (!confirmed) return

    setMessage('')
    setErrorMessage('')

    try {
      // Delete material details first
      const { error: materialError } = await supabase
        .from('quotation_materials')
        .delete()
        .eq('quotation_id', item.id)

      if (materialError) {
        throw materialError
      }

      // Delete quotation
      const { error: quotationError } = await supabase
        .from('quotations')
        .delete()
        .eq('id', item.id)

      if (quotationError) {
        throw quotationError
      }

      // Log deletion
      const { error: logError } = await supabase
        .from('quotation_logs')
        .insert({
          quotation_id: null,
          quotation_no: item.quotation_no,
          action: 'DELETE',
          details: `Deleted costing - ${item.customer_name || ''} ${item.project_name || ''}`.trim(),
          performed_by: 'Admin',
        })

      if (logError) {
        console.error('Delete log error:', logError)
      }

      setMessage(`${item.quotation_no} deleted successfully.`)

      await loadCostings()
    } catch (error: any) {
      setErrorMessage(
        error?.message || 'Unable to delete costing.'
      )
    }
  }

  function formatRM(value: number | null) {
    return `RM${Number(value || 0).toLocaleString('en-MY', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`
  }

  function formatDate(value: string | null) {
    if (!value) return '-'

    return new Date(value).toLocaleDateString('en-MY', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
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
            Cost Listings
          </div>

          <div className="topSubtitle">
            Saved project costings
          </div>
        </div>
      </header>

      <section className="summaryRow">
        <div className="summaryCard">
          <div className="summaryLabel">
            Total Costings
          </div>

          <div className="summaryValue">
            {costings.length}
          </div>
        </div>

        <div className="summaryCard">
          <div className="summaryLabel">
            Showing
          </div>

          <div className="summaryValue">
            {filteredCostings.length}
          </div>
        </div>
      </section>

      <section className="filterCard">
        <input
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          placeholder="Search costing no., customer or project..."
          className="searchInput"
        />

        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value)
          }
          className="statusSelect"
        >
          <option value="all">
            All Status
          </option>

          <option value="draft">
            Draft
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
          onClick={loadCostings}
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

      {message && (
        <div className="successBox">
          {message}
        </div>
      )}

      {loading && (
        <div className="emptyCard">
          Loading costings...
        </div>
      )}

      {!loading &&
        filteredCostings.length === 0 && (
          <div className="emptyCard">
            No costings found.
          </div>
        )}

      {!loading &&
        filteredCostings.length > 0 && (
          <>
            <div className="desktopTable">
              <table>
                <thead>
                  <tr>
                    <th>Costing No.</th>
                    <th>Date</th>
                    <th>Customer</th>
                    <th>Project</th>
                    <th>Total Cost</th>
                    <th>Selling</th>
                    <th>Margin</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredCostings.map(
                    (item) => (
                      <tr key={item.id}>
                        <td>
                          <strong>
                            {item.quotation_no}
                          </strong>
                        </td>

                        <td>
                          {formatDate(
                            item.quotation_date
                          )}
                        </td>

                        <td>
                          {item.customer_name ||
                            '-'}
                        </td>

                        <td>
                          {item.project_name ||
                            '-'}
                        </td>

                        <td>
                          {formatRM(
                            item.total_cost
                          )}
                        </td>

                        <td>
                          {formatRM(
                            item.selling_price
                          )}
                        </td>

                        <td>
                          {Number(
                            item.gross_margin || 0
                          ).toFixed(1)}
                          %
                        </td>

                        <td>
                          <StatusBadge
                            status={
                              item.status ||
                              'draft'
                            }
                          />
                        </td>

                        <td>
                          <div className="actions">
                            <Link
                              href={`/quotations/${item.id}`}
                              className="actionButton"
                            >
                              View
                            </Link>

                            <Link
                              href={`/quotations/${item.id}/edit`}
                              className="actionButton"
                            >
                              Edit
                            </Link>

                            <button
                              type="button"
                              onClick={() =>
                                deleteCosting(
                                  item
                                )
                              }
                              className="actionButton deleteButton"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>

            <div className="mobileCards">
              {filteredCostings.map(
                (item) => (
                  <div
                    key={item.id}
                    className="costingCard"
                  >
                    <div className="cardTop">
                      <div>
                        <div className="costingNo">
                          {item.quotation_no}
                        </div>

                        <div className="costingDate">
                          {formatDate(
                            item.quotation_date
                          )}
                        </div>
                      </div>

                      <StatusBadge
                        status={
                          item.status ||
                          'draft'
                        }
                      />
                    </div>

                    <div className="projectName">
                      {item.project_name ||
                        'Untitled Project'}
                    </div>

                    <div className="customerName">
                      {item.customer_name ||
                        'No customer'}
                    </div>

                    <div className="costGrid">
                      <InfoItem
                        label="Total Cost"
                        value={formatRM(
                          item.total_cost
                        )}
                      />

                      <InfoItem
                        label="Selling"
                        value={formatRM(
                          item.selling_price
                        )}
                      />

                      <InfoItem
                        label="Margin"
                        value={`${Number(
                          item.gross_margin ||
                            0
                        ).toFixed(1)}%`}
                      />
                    </div>

                    <div className="mobileActions">
                      <Link
                        href={`/quotations/${item.id}`}
                        className="mobileButton"
                      >
                        View
                      </Link>

                      <Link
                        href={`/quotations/${item.id}/edit`}
                        className="mobileButton"
                      >
                        Edit
                      </Link>

                      <button
                        type="button"
                        onClick={() =>
                          deleteCosting(item)
                        }
                        className="mobileButton deleteButton"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>
          </>
        )}

      <Link
        href="/calculator"
        className="newCostingButton"
      >
        + New Costing
      </Link>

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
          font-size: 13px;
          color: #6b7280;
        }

        .summaryRow {
          display: grid;
          grid-template-columns: repeat(
            2,
            minmax(0, 1fr)
          );
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
        .statusSelect {
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
          min-width: 1000px;
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
        }

        .actions {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .actionButton,
        .mobileButton {
          text-decoration: none;
          border: 1px solid #d1d5db;
          background: white;
          color: #374151;
          border-radius: 8px;
          padding: 7px 9px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }

        .deleteButton {
          color: #b91c1c;
          border-color: #fecaca;
        }

        .statusBadge {
          display: inline-flex;
          padding: 5px 9px;
          border-radius: 999px;
          font-size: 10px;
          font-weight: 800;
          text-transform: capitalize;
        }

        .statusDraft {
          background: #f3f4f6;
          color: #4b5563;
        }

        .statusPending {
          background: #fef3c7;
          color: #92400e;
        }

        .statusApproved {
          background: #dcfce7;
          color: #166534;
        }

        .statusRejected {
          background: #fee2e2;
          color: #991b1b;
        }

        .mobileCards {
          display: none;
        }

        .costingCard {
          background: white;
          border: 1px solid #e8ecf1;
          border-radius: 18px;
          padding: 15px;
          box-shadow:
            0 4px 14px
            rgba(15, 23, 42, 0.04);
        }

        .cardTop {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 10px;
        }

        .costingNo {
          font-size: 16px;
          font-weight: 800;
          color: #0f766e;
        }

        .costingDate {
          margin-top: 3px;
          font-size: 11px;
          color: #9ca3af;
        }

        .projectName {
          margin-top: 14px;
          font-size: 17px;
          font-weight: 800;
          color: #111827;
        }

        .customerName {
          margin-top: 4px;
          font-size: 13px;
          color: #6b7280;
        }

        .costGrid {
          display: grid;
          grid-template-columns:
            repeat(3, minmax(0, 1fr));
          gap: 8px;
          margin-top: 16px;
          background: #f8fafc;
          padding: 10px;
          border-radius: 12px;
        }

        .infoLabel {
          font-size: 10px;
          color: #9ca3af;
        }

        .infoValue {
          margin-top: 4px;
          font-size: 12px;
          font-weight: 800;
          color: #111827;
          word-break: break-word;
        }

        .mobileActions {
          display: grid;
          grid-template-columns:
            repeat(3, minmax(0, 1fr));
          gap: 8px;
          margin-top: 14px;
        }

        .mobileButton {
          text-align: center;
        }

        .newCostingButton {
          display: block;
          margin-top: 16px;
          padding: 14px;
          border-radius: 13px;
          background: #0f766e;
          color: white;
          font-weight: 800;
          text-align: center;
          text-decoration: none;
        }

        .emptyCard {
          background: white;
          border-radius: 16px;
          border: 1px solid #e8ecf1;
          padding: 22px;
          color: #6b7280;
        }

        .errorBox,
        .successBox {
          margin-bottom: 14px;
          padding: 12px;
          border-radius: 10px;
          font-size: 13px;
        }

        .errorBox {
          background: #fee2e2;
          color: #991b1b;
        }

        .successBox {
          background: #dcfce7;
          color: #166534;
          font-weight: 700;
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

function StatusBadge({
  status,
}: {
  status: string
}) {
  const value =
    status.toLowerCase()

  let className =
    'statusBadge statusDraft'

  if (value === 'pending') {
    className =
      'statusBadge statusPending'
  }

  if (value === 'approved') {
    className =
      'statusBadge statusApproved'
  }

  if (value === 'rejected') {
    className =
      'statusBadge statusRejected'
  }

  return (
    <span className={className}>
      {status}
    </span>
  )
}

function InfoItem({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div>
      <div className="infoLabel">
        {label}
      </div>

      <div className="infoValue">
        {value}
      </div>
    </div>
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