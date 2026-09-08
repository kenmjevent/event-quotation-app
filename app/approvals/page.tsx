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

export default function ApprovalsPage() {
  const [costings, setCostings] = useState<Costing[]>([])
  const [loading, setLoading] = useState(true)

  const [filter, setFilter] = useState('pending')
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [processingId, setProcessingId] = useState<string | null>(null)

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
      .in('status', [
        'pending',
        'approved',
        'rejected',
        'draft'
      ])
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
    if (filter === 'all') return costings

    return costings.filter(
      (item) =>
        String(item.status || 'draft').toLowerCase() ===
        filter
    )
  }, [costings, filter])

  const pendingCount = costings.filter(
    (item) =>
      String(item.status || '').toLowerCase() === 'pending'
  ).length

  const approvedCount = costings.filter(
    (item) =>
      String(item.status || '').toLowerCase() === 'approved'
  ).length

  const rejectedCount = costings.filter(
    (item) =>
      String(item.status || '').toLowerCase() === 'rejected'
  ).length

  async function updateStatus(
    item: Costing,
    newStatus: 'pending' | 'approved' | 'rejected'
  ) {
    let confirmText = ''

    if (newStatus === 'pending') {
      confirmText = `Submit ${item.quotation_no} for approval?`
    }

    if (newStatus === 'approved') {
      confirmText = `Approve ${item.quotation_no}?`
    }

    if (newStatus === 'rejected') {
      confirmText = `Reject ${item.quotation_no}?`
    }

    const confirmed = window.confirm(confirmText)

    if (!confirmed) return

    setProcessingId(item.id)
    setMessage('')
    setErrorMessage('')

    try {
      const { error: updateError } = await supabase
        .from('quotations')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', item.id)

      if (updateError) {
        throw updateError
      }

      let action = ''
      let detail = ''

      if (newStatus === 'pending') {
        action = 'PENDING'
        detail = `Submitted costing for approval - ${item.customer_name || ''} ${item.project_name || ''}`.trim()
      }

      if (newStatus === 'approved') {
        action = 'APPROVED'
        detail = `Approved costing - ${item.customer_name || ''} ${item.project_name || ''}`.trim()
      }

      if (newStatus === 'rejected') {
        action = 'REJECTED'
        detail = `Rejected costing - ${item.customer_name || ''} ${item.project_name || ''}`.trim()
      }

      const { error: logError } = await supabase
        .from('quotation_logs')
        .insert({
          quotation_id: item.id,
          quotation_no: item.quotation_no,
          action,
          details: detail,
          performed_by: 'Admin',
        })

      if (logError) {
        console.error('Log error:', logError)
      }

      setMessage(
        `${item.quotation_no} changed to ${newStatus}.`
      )

      await loadCostings()
    } catch (error: any) {
      setErrorMessage(
        error?.message || 'Status update failed.'
      )
    } finally {
      setProcessingId(null)
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
            Approval Status
          </div>

          <div className="topSubtitle">
            Review and approve project costings
          </div>
        </div>
      </header>

      <section className="summaryGrid">
        <SummaryCard
          title="Pending"
          value={pendingCount}
          type="pending"
        />

        <SummaryCard
          title="Approved"
          value={approvedCount}
          type="approved"
        />

        <SummaryCard
          title="Rejected"
          value={rejectedCount}
          type="rejected"
        />
      </section>

      <section className="filterCard">
        <button
          className={
            filter === 'pending'
              ? 'filterButton activeFilter'
              : 'filterButton'
          }
          onClick={() => setFilter('pending')}
        >
          Pending
        </button>

        <button
          className={
            filter === 'approved'
              ? 'filterButton activeFilter'
              : 'filterButton'
          }
          onClick={() => setFilter('approved')}
        >
          Approved
        </button>

        <button
          className={
            filter === 'rejected'
              ? 'filterButton activeFilter'
              : 'filterButton'
          }
          onClick={() => setFilter('rejected')}
        >
          Rejected
        </button>

        <button
          className={
            filter === 'draft'
              ? 'filterButton activeFilter'
              : 'filterButton'
          }
          onClick={() => setFilter('draft')}
        >
          Draft
        </button>

        <button
          className={
            filter === 'all'
              ? 'filterButton activeFilter'
              : 'filterButton'
          }
          onClick={() => setFilter('all')}
        >
          All
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
          Loading approval records...
        </div>
      )}

      {!loading && filteredCostings.length === 0 && (
        <div className="emptyCard">
          No {filter === 'all' ? '' : filter} costings found.
        </div>
      )}

      {!loading && filteredCostings.length > 0 && (
        <div className="approvalList">
          {filteredCostings.map((item) => {
            const status = String(
              item.status || 'draft'
            ).toLowerCase()

            return (
              <div
                key={item.id}
                className="approvalCard"
              >
                <div className="cardTop">
                  <div>
                    <div className="quotationNo">
                      {item.quotation_no}
                    </div>

                    <div className="dateText">
                      {formatDate(item.quotation_date)}
                    </div>
                  </div>

                  <StatusBadge status={status} />
                </div>

                <div className="projectName">
                  {item.project_name || 'Untitled Project'}
                </div>

                <div className="customerName">
                  {item.customer_name || 'No customer'}
                </div>

                <div className="costGrid">
                  <InfoItem
                    label="Total Cost"
                    value={formatRM(item.total_cost)}
                  />

                  <InfoItem
                    label="Selling"
                    value={formatRM(item.selling_price)}
                  />

                  <InfoItem
                    label="Margin"
                    value={`${Number(
                      item.gross_margin || 0
                    ).toFixed(1)}%`}
                  />
                </div>

                <div className="actions">
                  <Link
                    href={`/quotations/${item.id}`}
                    className="viewButton"
                  >
                    View
                  </Link>

                  {status === 'draft' && (
                    <button
                      type="button"
                      disabled={processingId === item.id}
                      onClick={() =>
                        updateStatus(item, 'pending')
                      }
                      className="submitButton"
                    >
                      Submit
                    </button>
                  )}

                  {status === 'pending' && (
                    <>
                      <button
                        type="button"
                        disabled={processingId === item.id}
                        onClick={() =>
                          updateStatus(item, 'approved')
                        }
                        className="approveButton"
                      >
                        Approve
                      </button>

                      <button
                        type="button"
                        disabled={processingId === item.id}
                        onClick={() =>
                          updateStatus(item, 'rejected')
                        }
                        className="rejectButton"
                      >
                        Reject
                      </button>
                    </>
                  )}

                  {status === 'rejected' && (
                    <button
                      type="button"
                      disabled={processingId === item.id}
                      onClick={() =>
                        updateStatus(item, 'pending')
                      }
                      className="submitButton"
                    >
                      Resubmit
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
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
          active
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
          max-width: 1000px;
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

        .summaryGrid {
          display: grid;
          grid-template-columns:
            repeat(3, minmax(0, 1fr));
          gap: 10px;
          margin-bottom: 16px;
        }

        .summaryCard {
          background: white;
          border-radius: 16px;
          padding: 14px;
          border: 1px solid #e8ecf1;
        }

        .summaryTitle {
          font-size: 12px;
          color: #6b7280;
        }

        .summaryValue {
          margin-top: 5px;
          font-size: 24px;
          font-weight: 800;
        }

        .summaryPending {
          color: #d97706;
        }

        .summaryApproved {
          color: #059669;
        }

        .summaryRejected {
          color: #dc2626;
        }

        .filterCard {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          margin-bottom: 16px;
          padding-bottom: 3px;
        }

        .filterButton {
          flex-shrink: 0;
          border: 1px solid #d1d5db;
          background: white;
          color: #4b5563;
          border-radius: 999px;
          padding: 9px 14px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }

        .activeFilter {
          background: #0f766e;
          color: white;
          border-color: #0f766e;
        }

        .approvalList {
          display: grid;
          gap: 12px;
        }

        .approvalCard {
          background: white;
          border: 1px solid #e8ecf1;
          border-radius: 18px;
          padding: 16px;
          box-shadow:
            0 4px 14px rgba(15, 23, 42, 0.04);
        }

        .cardTop {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 10px;
        }

        .quotationNo {
          font-size: 16px;
          font-weight: 800;
          color: #0f766e;
        }

        .dateText {
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

        .statusBadge {
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

        .costGrid {
          margin-top: 15px;
          display: grid;
          grid-template-columns:
            repeat(3, minmax(0, 1fr));
          gap: 8px;
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

        .actions {
          display: grid;
          grid-template-columns:
            repeat(3, minmax(0, 1fr));
          gap: 8px;
          margin-top: 15px;
        }

        .viewButton,
        .submitButton,
        .approveButton,
        .rejectButton {
          border-radius: 10px;
          padding: 10px 8px;
          font-size: 12px;
          font-weight: 800;
          text-align: center;
          text-decoration: none;
          cursor: pointer;
        }

        .viewButton {
          background: white;
          color: #374151;
          border: 1px solid #d1d5db;
        }

        .submitButton {
          border: none;
          background: #2563eb;
          color: white;
        }

        .approveButton {
          border: none;
          background: #059669;
          color: white;
        }

        .rejectButton {
          border: none;
          background: #dc2626;
          color: white;
        }

        button:disabled {
          opacity: 0.5;
          cursor: default;
        }

        .emptyCard {
          background: white;
          border: 1px solid #e8ecf1;
          border-radius: 16px;
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
            rgba(255,255,255,0.97);
          border-top: 1px solid #e5e7eb;
          display: grid;
          grid-template-columns:
            repeat(5,1fr);
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

        .navItemActive {
          color: #0f766e;
        }

        .navIcon {
          font-size: 21px;
        }

        @media (max-width: 600px) {
          .summaryGrid {
            grid-template-columns:
              repeat(3, minmax(0,1fr));
          }

          .summaryCard {
            padding: 12px;
          }

          .summaryValue {
            font-size: 21px;
          }
        }
      `}</style>
    </main>
  )
}

function SummaryCard({
  title,
  value,
  type,
}: {
  title: string
  value: number
  type: 'pending' | 'approved' | 'rejected'
}) {
  return (
    <div className="summaryCard">
      <div className="summaryTitle">
        {title}
      </div>

      <div
        className={`summaryValue ${
          type === 'pending'
            ? 'summaryPending'
            : type === 'approved'
            ? 'summaryApproved'
            : 'summaryRejected'
        }`}
      >
        {value}
      </div>
    </div>
  )
}

function StatusBadge({
  status,
}: {
  status: string
}) {
  let className =
    'statusBadge statusDraft'

  if (status === 'pending') {
    className =
      'statusBadge statusPending'
  }

  if (status === 'approved') {
    className =
      'statusBadge statusApproved'
  }

  if (status === 'rejected') {
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
  active = false,
}: {
  href: string
  icon: string
  label: string
  active?: boolean
}) {
  return (
    <Link
      href={href}
      className={
        active
          ? 'navItem navItemActive'
          : 'navItem'
      }
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