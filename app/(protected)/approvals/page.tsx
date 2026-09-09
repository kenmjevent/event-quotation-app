'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../../../lib/supabase'
import {
  getCurrentProfile,
  type UserProfile,
} from '../../../lib/authRole'

type Quotation = {
  id: string
  quotation_no: string
  customer_name: string | null
  project_name: string | null
  quotation_date: string | null
  status: string | null
  rejection_reason: string | null
  total_cost: number | null
  selling_price: number | null
  gross_profit: number | null
  gross_margin: number | null
  created_at: string
}

export default function ApprovalsPage() {
  const [profile, setProfile] =
    useState<UserProfile | null>(null)

  const [quotations, setQuotations] =
    useState<Quotation[]>([])

  const [loading, setLoading] =
    useState(true)

  const [statusFilter, setStatusFilter] =
    useState('pending')

  const [search, setSearch] =
    useState('')

  const [message, setMessage] =
    useState('')

  const [errorMessage, setErrorMessage] =
    useState('')

  const [processingId, setProcessingId] =
    useState<string | null>(null)

  useEffect(() => {
    loadPage()
  }, [])

  async function loadPage() {
    setLoading(true)

    await Promise.all([
      loadProfile(),
      loadQuotations(),
    ])

    setLoading(false)
  }

  async function loadProfile() {
    const data =
      await getCurrentProfile()

    setProfile(data)
  }

  async function loadQuotations() {
    setErrorMessage('')

    const { data, error } =
      await supabase
        .from('quotations')
        .select(`
          id,
          quotation_no,
          customer_name,
          project_name,
          quotation_date,
          status,
          rejection_reason,
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
      setErrorMessage(
        error.message
      )
      return
    }

    setQuotations(
      data || []
    )
  }

  const filteredQuotations =
    useMemo(() => {
      const keyword =
        search
          .trim()
          .toLowerCase()

      return quotations.filter(
        (item) => {
          const status =
            String(
              item.status ||
                'draft'
            ).toLowerCase()

          const matchesStatus =
            statusFilter === 'all' ||
            status === statusFilter

          const matchesSearch =
            !keyword ||
            String(
              item.quotation_no || ''
            )
              .toLowerCase()
              .includes(keyword) ||
            String(
              item.customer_name || ''
            )
              .toLowerCase()
              .includes(keyword) ||
            String(
              item.project_name || ''
            )
              .toLowerCase()
              .includes(keyword)

          return (
            matchesStatus &&
            matchesSearch
          )
        }
      )
    }, [
      quotations,
      statusFilter,
      search,
    ])

  async function approveQuotation(
    item: Quotation
  ) {
    if (
      profile?.role !== 'admin'
    ) {
      alert(
        'Only Admin can approve costing.'
      )
      return
    }

    const confirmed =
      window.confirm(
        `Approve ${item.quotation_no}?\n\n${item.project_name || ''}`
      )

    if (!confirmed) {
      return
    }

    setProcessingId(
      item.id
    )
    setMessage('')
    setErrorMessage('')

    try {
      const {
        error: updateError,
      } = await supabase
        .from('quotations')
        .update({
          status: 'approved',
          rejection_reason: null,
          updated_at:
            new Date().toISOString(),
        })
        .eq(
          'id',
          item.id
        )

      if (updateError) {
        throw updateError
      }

      const {
        error: logError,
      } = await supabase
        .from('quotation_logs')
        .insert({
          quotation_id:
            item.id,

          quotation_no:
            item.quotation_no,

          action:
            'APPROVE',

          details:
            `Approved costing - ${item.customer_name || ''} ${item.project_name || ''}`.trim(),

          performed_by:
            profile.full_name ||
            profile.email ||
            'Admin',
        })

      if (logError) {
        console.error(
          'Approve log error:',
          logError
        )
      }

      setMessage(
        `${item.quotation_no} approved successfully.`
      )

      await loadQuotations()
    } catch (error: any) {
      setErrorMessage(
        error?.message ||
          'Unable to approve costing.'
      )
    } finally {
      setProcessingId(null)
    }
  }

  async function rejectQuotation(
    item: Quotation
  ) {
    if (
      profile?.role !== 'admin'
    ) {
      alert(
        'Only Admin can reject costing.'
      )
      return
    }

    const reason =
      window.prompt(
        `Reject ${item.quotation_no}\n\nPlease enter rejection reason:`
      )

    if (reason === null) {
      return
    }

    const cleanReason =
      reason.trim()

    if (!cleanReason) {
      alert(
        'Rejection reason is required.'
      )
      return
    }

    const confirmed =
      window.confirm(
        `Reject ${item.quotation_no}?\n\nReason:\n${cleanReason}`
      )

    if (!confirmed) {
      return
    }

    setProcessingId(
      item.id
    )
    setMessage('')
    setErrorMessage('')

    try {
      const {
        error: updateError,
      } = await supabase
        .from('quotations')
        .update({
          status: 'rejected',
          rejection_reason:
            cleanReason,
          updated_at:
            new Date().toISOString(),
        })
        .eq(
          'id',
          item.id
        )

      if (updateError) {
        throw updateError
      }

      const {
        error: logError,
      } = await supabase
        .from('quotation_logs')
        .insert({
          quotation_id:
            item.id,

          quotation_no:
            item.quotation_no,

          action:
            'REJECT',

          details:
            `Rejected costing. Reason: ${cleanReason}`,

          performed_by:
            profile.full_name ||
            profile.email ||
            'Admin',
        })

      if (logError) {
        console.error(
          'Reject log error:',
          logError
        )
      }

      setMessage(
        `${item.quotation_no} rejected successfully.`
      )

      await loadQuotations()
    } catch (error: any) {
      setErrorMessage(
        error?.message ||
          'Unable to reject costing.'
      )
    } finally {
      setProcessingId(null)
    }
  }

  function formatRM(
    value: number | null
  ) {
    return `RM${Number(
      value || 0
    ).toLocaleString(
      'en-MY',
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    )}`
  }

  function formatDate(
    value: string | null
  ) {
    if (!value) {
      return '-'
    }

    return new Date(
      value
    ).toLocaleDateString(
      'en-MY',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }
    )
  }

  return (
    <main className="page">
      <header className="topBar">
        <Link
          href="/"
          className="backButton"
        >
          ←
        </Link>

        <div>
          <div className="topTitle">
            Approval Status
          </div>

          <div className="topSubtitle">
            Review submitted costings
          </div>
        </div>
      </header>

      <section className="summaryRow">
        <SummaryCard
          label="Pending"
          value={
            quotations.filter(
              (q) =>
                String(
                  q.status || ''
                ).toLowerCase() ===
                'pending'
            ).length
          }
        />

        <SummaryCard
          label="Approved"
          value={
            quotations.filter(
              (q) =>
                String(
                  q.status || ''
                ).toLowerCase() ===
                'approved'
            ).length
          }
        />

        <SummaryCard
          label="Rejected"
          value={
            quotations.filter(
              (q) =>
                String(
                  q.status || ''
                ).toLowerCase() ===
                'rejected'
            ).length
          }
        />
      </section>

      <section className="filterCard">
        <input
          value={search}
          onChange={(e) =>
            setSearch(
              e.target.value
            )
          }
          placeholder="Search costing no., customer or project..."
          className="searchInput"
        />

        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(
              e.target.value
            )
          }
          className="statusSelect"
        >
          <option value="pending">
            Pending
          </option>

          <option value="approved">
            Approved
          </option>

          <option value="rejected">
            Rejected
          </option>

          <option value="all">
            All
          </option>
        </select>

        <button
          type="button"
          onClick={loadPage}
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
          Loading approvals...
        </div>
      )}

      {!loading &&
        filteredQuotations.length ===
          0 && (
          <div className="emptyCard">
            No quotations found.
          </div>
        )}

      {!loading &&
        filteredQuotations.map(
          (item) => {
            const status =
              String(
                item.status ||
                  'draft'
              ).toLowerCase()

            const processing =
              processingId ===
              item.id

            return (
              <section
                key={item.id}
                className="approvalCard"
              >
                <div className="cardHeader">
                  <div>
                    <div className="quotationNo">
                      {
                        item.quotation_no
                      }
                    </div>

                    <div className="dateText">
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
                    'No Customer'}
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
                    ).toFixed(
                      1
                    )}%`}
                  />
                </div>

                {status ===
                  'rejected' &&
                  item.rejection_reason && (
                    <div className="reasonBox">
                      <div className="reasonLabel">
                        Rejection Reason
                      </div>

                      <div className="reasonText">
                        {
                          item.rejection_reason
                        }
                      </div>
                    </div>
                  )}

                <div className="actions">
                  <Link
                    href={`/quotations/${item.id}`}
                    className="viewButton"
                  >
                    View
                  </Link>

                  {status ===
                    'pending' && (
                    <>
                      <button
                        type="button"
                        disabled={
                          processing
                        }
                        onClick={() =>
                          approveQuotation(
                            item
                          )
                        }
                        className="approveButton"
                      >
                        {processing
                          ? 'Processing...'
                          : 'Approve'}
                      </button>

                      <button
                        type="button"
                        disabled={
                          processing
                        }
                        onClick={() =>
                          rejectQuotation(
                            item
                          )
                        }
                        className="rejectButton"
                      >
                        Reject
                      </button>
                    </>
                  )}
                </div>
              </section>
            )
          }
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

        .summaryRow {
          display: grid;
          grid-template-columns:
            repeat(3, minmax(0, 1fr));
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
          margin-top: 4px;
          font-size: 23px;
          font-weight: 800;
        }

        .filterCard {
          display: grid;
          grid-template-columns:
            1fr 180px auto;
          gap: 10px;
          padding: 14px;
          background: white;
          border: 1px solid #e8ecf1;
          border-radius: 16px;
          margin-bottom: 16px;
        }

        .searchInput,
        .statusSelect {
          width: 100%;
          padding: 11px 12px;
          border: 1px solid #d1d5db;
          border-radius: 10px;
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

        .approvalCard {
          background: white;
          border: 1px solid #e8ecf1;
          border-radius: 18px;
          padding: 16px;
          margin-bottom: 12px;
        }

        .cardHeader {
          display: flex;
          justify-content: space-between;
          gap: 12px;
        }

        .quotationNo {
          font-size: 17px;
          font-weight: 800;
          color: #0f766e;
        }

        .dateText {
          margin-top: 3px;
          color: #9ca3af;
          font-size: 11px;
        }

        .projectName {
          margin-top: 14px;
          font-size: 18px;
          font-weight: 800;
        }

        .customerName {
          margin-top: 4px;
          color: #6b7280;
          font-size: 13px;
        }

        .costGrid {
          display: grid;
          grid-template-columns:
            repeat(3, minmax(0, 1fr));
          gap: 8px;
          margin-top: 14px;
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
          font-size: 13px;
          font-weight: 800;
        }

        .reasonBox {
          margin-top: 14px;
          padding: 12px;
          background: #fff1f2;
          border: 1px solid #fecdd3;
          border-radius: 12px;
        }

        .reasonLabel {
          color: #9f1239;
          font-size: 11px;
          font-weight: 800;
        }

        .reasonText {
          margin-top: 5px;
          color: #881337;
          font-size: 13px;
          line-height: 1.5;
        }

        .actions {
          display: flex;
          gap: 8px;
          margin-top: 14px;
        }

        .viewButton,
        .approveButton,
        .rejectButton {
          flex: 1;
          min-height: 42px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 800;
          text-decoration: none;
          cursor: pointer;
        }

        .viewButton {
          background: white;
          border: 1px solid #d1d5db;
          color: #374151;
        }

        .approveButton {
          border: 1px solid #bbf7d0;
          background: #dcfce7;
          color: #166534;
        }

        .rejectButton {
          border: 1px solid #fecaca;
          background: #fee2e2;
          color: #991b1b;
        }

        .statusBadge {
          display: inline-flex;
          height: fit-content;
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

        .emptyCard {
          padding: 20px;
          background: white;
          border: 1px solid #e8ecf1;
          border-radius: 16px;
          color: #6b7280;
        }

        @media (max-width: 650px) {
          .summaryRow {
            grid-template-columns: 1fr;
          }

          .filterCard {
            grid-template-columns: 1fr;
          }

          .refreshButton {
            padding: 11px;
          }

          .actions {
            flex-direction: column;
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

function SummaryCard({
  label,
  value,
}: {
  label: string
  value: number
}) {
  return (
    <div className="summaryCard">
      <div className="summaryLabel">
        {label}
      </div>

      <div className="summaryValue">
        {value}
      </div>
    </div>
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