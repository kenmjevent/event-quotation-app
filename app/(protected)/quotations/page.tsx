'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../../../lib/supabase'

type Quotation = {
  id: string
  quotation_no: string
  customer_name: string
  project_name: string
  quotation_date: string
  status: string
  selling_price: number
  total_cost: number
  gross_margin: number
  created_at: string
}

type QuotationLog = {
  id: string
  quotation_id: string | null
  quotation_no: string
  action: string
  details: string
  performed_by: string
  created_at: string
}

export default function QuotationsPage() {
  const [quotations, setQuotations] = useState<Quotation[]>([])
  const [logs, setLogs] = useState<QuotationLog[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    loadQuotations()
    loadLogs()
  }, [])

  async function loadQuotations() {
    setLoading(true)
    setErrorMessage('')

    const { data, error } = await supabase
      .from('quotations')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      setErrorMessage(error.message)
      setLoading(false)
      return
    }

    setQuotations(data || [])
    setLoading(false)
  }

  async function loadLogs() {
    const { data, error } = await supabase
      .from('quotation_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Log load error:', error)
      return
    }

    setLogs(data || [])
  }

  async function writeLog(
    quotationId: string | null,
    quotationNo: string,
    action: string,
    details: string
  ) {
    const { error } = await supabase
      .from('quotation_logs')
      .insert({
        quotation_id: quotationId,
        quotation_no: quotationNo,
        action,
        details,
        performed_by: 'Admin'
      })

    if (error) {
      console.error('Log error:', error)
    }
  }

  async function deleteQuotation(
    id: string,
    quotationNo: string,
    customerName: string,
    projectName: string
  ) {
    const confirmed = window.confirm(
      `Delete quotation ${quotationNo}?\n\nCustomer: ${customerName}\nProject: ${projectName}\n\nThis cannot be undone.`
    )

    if (!confirmed) return

    await writeLog(
      id,
      quotationNo,
      'DELETE',
      `Deleted quotation for ${customerName} - ${projectName}`
    )

    const { error } = await supabase
      .from('quotations')
      .delete()
      .eq('id', id)

    if (error) {
      alert(`Delete failed: ${error.message}`)
      return
    }

    setQuotations((current) =>
      current.filter((quotation) => quotation.id !== id)
    )

    await loadLogs()
  }

  function formatRM(value: number | null) {
    return `RM${Number(value || 0).toLocaleString('en-MY', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`
  }

  function formatDateTime(value: string) {
    return new Date(value).toLocaleString('en-MY', {
      dateStyle: 'medium',
      timeStyle: 'short'
    })
  }

  function getActionStyle(action: string) {
    const upper = action.toUpperCase()

    if (upper === 'DELETE') {
      return {
        background: '#fee2e2',
        color: '#991b1b'
      }
    }

    if (upper === 'EDIT') {
      return {
        background: '#fef3c7',
        color: '#92400e'
      }
    }

    if (upper === 'CREATE') {
      return {
        background: '#dcfce7',
        color: '#166534'
      }
    }

    return {
      background: '#eeeeee',
      color: '#333333'
    }
  }

  function getStatusStyle(status: string) {
    const lower = (status || '').toLowerCase()

    if (lower === 'approved') {
      return {
        background: '#dcfce7',
        color: '#166534'
      }
    }

    if (lower === 'sent') {
      return {
        background: '#dbeafe',
        color: '#1d4ed8'
      }
    }

    if (lower === 'rejected') {
      return {
        background: '#fee2e2',
        color: '#991b1b'
      }
    }

    return {
      background: '#f3f4f6',
      color: '#374151'
    }
  }

  return (
    <main style={pageStyle}>
      <div style={containerStyle}>
        <div style={headerStyle}>
          <div>
            <h1 style={titleStyle}>All Quotations</h1>

            <p style={subtitleStyle}>
              Saved quotation history
            </p>
          </div>

          <Link
            href="/"
            style={newQuotationButton}
          >
            + New Quotation
          </Link>
        </div>

        {loading && (
          <div style={messageBoxStyle}>
            Loading quotations...
          </div>
        )}

        {errorMessage && (
          <div
            style={{
              ...messageBoxStyle,
              color: '#b91c1c'
            }}
          >
            Error: {errorMessage}
          </div>
        )}

        {!loading &&
          !errorMessage &&
          quotations.length === 0 && (
            <div style={messageBoxStyle}>
              No quotations found.
            </div>
          )}

        {!loading &&
          !errorMessage &&
          quotations.length > 0 && (
            <>
              {/* DESKTOP TABLE */}
              <div className="desktopOnly">
                <div style={tableWrapperStyle}>
                  <table style={tableStyle}>
                    <thead>
                      <tr style={tableHeaderRowStyle}>
                        <th style={thStyle}>Quotation No.</th>
                        <th style={thStyle}>Customer</th>
                        <th style={thStyle}>Project</th>
                        <th style={thStyle}>Date</th>
                        <th style={thStyle}>Selling Price</th>
                        <th style={thStyle}>Margin</th>
                        <th style={thStyle}>Status</th>
                        <th style={thStyle}>Actions</th>
                      </tr>
                    </thead>

                    <tbody>
                      {quotations.map((quotation) => (
                        <tr
                          key={quotation.id}
                          style={tableRowStyle}
                        >
                          <td style={tdStyle}>
                            <strong>
                              {quotation.quotation_no}
                            </strong>
                          </td>

                          <td style={tdStyle}>
                            {quotation.customer_name || '-'}
                          </td>

                          <td style={tdStyle}>
                            {quotation.project_name || '-'}
                          </td>

                          <td style={tdStyle}>
                            {quotation.quotation_date || '-'}
                          </td>

                          <td style={tdStyle}>
                            {formatRM(quotation.selling_price)}
                          </td>

                          <td style={tdStyle}>
                            {Number(
                              quotation.gross_margin || 0
                            ).toFixed(2)}
                            %
                          </td>

                          <td style={tdStyle}>
                            <span
                              style={{
                                ...statusBadgeStyle,
                                ...getStatusStyle(
                                  quotation.status
                                )
                              }}
                            >
                              {quotation.status || 'draft'}
                            </span>
                          </td>

                          <td style={tdStyle}>
                            <div style={actionRowStyle}>
                              <Link
                                href={`/quotations/${quotation.id}`}
                                style={smallButtonStyle}
                              >
                                View
                              </Link>

                              <Link
                                href={`/quotations/${quotation.id}/edit`}
                                style={smallButtonStyle}
                              >
                                Edit
                              </Link>

                              <button
                                onClick={() =>
                                  deleteQuotation(
                                    quotation.id,
                                    quotation.quotation_no,
                                    quotation.customer_name,
                                    quotation.project_name
                                  )
                                }
                                style={deleteButtonStyle}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* MOBILE CARDS */}
              <div className="mobileOnly">
                <div style={mobileCardListStyle}>
                  {quotations.map((quotation) => (
                    <div
                      key={quotation.id}
                      style={mobileCardStyle}
                    >
                      <div style={mobileCardTopStyle}>
                        <div>
                          <div style={smallLabelStyle}>
                            Quotation No.
                          </div>

                          <div style={quotationNoStyle}>
                            {quotation.quotation_no}
                          </div>
                        </div>

                        <span
                          style={{
                            ...statusBadgeStyle,
                            ...getStatusStyle(
                              quotation.status
                            )
                          }}
                        >
                          {quotation.status || 'draft'}
                        </span>
                      </div>

                      <div style={mobileInfoGridStyle}>
                        <MobileInfo
                          label="Customer"
                          value={quotation.customer_name}
                        />

                        <MobileInfo
                          label="Project"
                          value={quotation.project_name}
                        />

                        <MobileInfo
                          label="Date"
                          value={quotation.quotation_date}
                        />

                        <MobileInfo
                          label="Margin"
                          value={`${Number(
                            quotation.gross_margin || 0
                          ).toFixed(2)}%`}
                        />
                      </div>

                      <div style={sellingPriceBoxStyle}>
                        <div style={smallLabelStyle}>
                          Selling Price
                        </div>

                        <div style={sellingPriceStyle}>
                          {formatRM(
                            quotation.selling_price
                          )}
                        </div>
                      </div>

                      <div style={mobileActionGridStyle}>
                        <Link
                          href={`/quotations/${quotation.id}`}
                          style={mobileActionButtonStyle}
                        >
                          View
                        </Link>

                        <Link
                          href={`/quotations/${quotation.id}/edit`}
                          style={mobileActionButtonStyle}
                        >
                          Edit
                        </Link>

                        <button
                          onClick={() =>
                            deleteQuotation(
                              quotation.id,
                              quotation.quotation_no,
                              quotation.customer_name,
                              quotation.project_name
                            )
                          }
                          style={mobileDeleteButtonStyle}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

        <div style={logSectionStyle}>
          <div style={logHeaderStyle}>
            <div>
              <h2 style={sectionTitleStyle}>
                Activity Log
              </h2>

              <p style={subtitleStyle}>
                Recent quotation activities
              </p>
            </div>

            <button
              onClick={loadLogs}
              style={refreshButtonStyle}
            >
              Refresh Log
            </button>
          </div>

          {/* DESKTOP LOG TABLE */}
          <div className="desktopOnly">
            <div style={tableWrapperStyle}>
              <table style={tableStyle}>
                <thead>
                  <tr style={tableHeaderRowStyle}>
                    <th style={thStyle}>Date / Time</th>
                    <th style={thStyle}>Action</th>
                    <th style={thStyle}>Quotation</th>
                    <th style={thStyle}>Details</th>
                    <th style={thStyle}>User</th>
                  </tr>
                </thead>

                <tbody>
                  {logs.length === 0 && (
                    <tr>
                      <td
                        style={tdStyle}
                        colSpan={5}
                      >
                        No activity yet.
                      </td>
                    </tr>
                  )}

                  {logs.map((log) => (
                    <tr
                      key={log.id}
                      style={tableRowStyle}
                    >
                      <td style={tdStyle}>
                        {formatDateTime(log.created_at)}
                      </td>

                      <td style={tdStyle}>
                        <span
                          style={{
                            ...actionBadgeStyle,
                            ...getActionStyle(log.action)
                          }}
                        >
                          {log.action}
                        </span>
                      </td>

                      <td style={tdStyle}>
                        <strong>
                          {log.quotation_no}
                        </strong>
                      </td>

                      <td style={tdStyle}>
                        {log.details || '-'}
                      </td>

                      <td style={tdStyle}>
                        {log.performed_by || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* MOBILE LOG CARDS */}
          <div className="mobileOnly">
            <div style={mobileCardListStyle}>
              {logs.length === 0 && (
                <div style={messageBoxStyle}>
                  No activity yet.
                </div>
              )}

              {logs.map((log) => (
                <div
                  key={log.id}
                  style={mobileLogCardStyle}
                >
                  <div style={mobileCardTopStyle}>
                    <div>
                      <div style={smallLabelStyle}>
                        Quotation
                      </div>

                      <div style={quotationNoStyle}>
                        {log.quotation_no}
                      </div>
                    </div>

                    <span
                      style={{
                        ...actionBadgeStyle,
                        ...getActionStyle(log.action)
                      }}
                    >
                      {log.action}
                    </span>
                  </div>

                  <div style={logMobileDetailsStyle}>
                    <div>
                      <span style={smallLabelStyle}>
                        Date / Time
                      </span>

                      <div style={mobileValueStyle}>
                        {formatDateTime(
                          log.created_at
                        )}
                      </div>
                    </div>

                    <div>
                      <span style={smallLabelStyle}>
                        Details
                      </span>

                      <div style={mobileValueStyle}>
                        {log.details || '-'}
                      </div>
                    </div>

                    <div>
                      <span style={smallLabelStyle}>
                        User
                      </span>

                      <div style={mobileValueStyle}>
                        {log.performed_by || '-'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .desktopOnly {
          display: block;
        }

        .mobileOnly {
          display: none;
        }

        @media (max-width: 767px) {
          .desktopOnly {
            display: none;
          }

          .mobileOnly {
            display: block;
          }

          body {
            overflow-x: hidden;
          }
        }
      `}</style>
    </main>
  )
}

function MobileInfo({
  label,
  value
}: {
  label: string
  value: string
}) {
  return (
    <div>
      <div style={smallLabelStyle}>
        {label}
      </div>

      <div style={mobileValueStyle}>
        {value || '-'}
      </div>
    </div>
  )
}

const pageStyle = {
  minHeight: '100vh',
  background: '#f7f8fa',
  fontFamily: 'Arial, sans-serif'
}

const containerStyle = {
  width: '100%',
  maxWidth: '1280px',
  margin: '0 auto',
  padding: '32px 20px 60px',
  boxSizing: 'border-box' as const
}

const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '16px',
  flexWrap: 'wrap' as const,
  marginBottom: '28px'
}

const titleStyle = {
  margin: 0,
  fontSize: '32px',
  lineHeight: 1.2
}

const sectionTitleStyle = {
  margin: 0,
  fontSize: '24px'
}

const subtitleStyle = {
  color: '#6b7280',
  marginTop: '6px',
  marginBottom: 0
}

const newQuotationButton = {
  display: 'inline-flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '46px',
  padding: '0 18px',
  border: '1px solid #222',
  borderRadius: '10px',
  textDecoration: 'none',
  color: '#111',
  background: '#fff',
  fontWeight: 600
}

const messageBoxStyle = {
  background: '#fff',
  border: '1px solid #e5e7eb',
  borderRadius: '12px',
  padding: '22px'
}

const tableWrapperStyle = {
  background: '#fff',
  border: '1px solid #e5e7eb',
  borderRadius: '14px',
  overflowX: 'auto' as const
}

const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse' as const,
  minWidth: '1000px'
}

const tableHeaderRowStyle = {
  background: '#f3f4f6'
}

const tableRowStyle = {
  borderTop: '1px solid #e5e7eb'
}

const thStyle = {
  textAlign: 'left' as const,
  padding: '15px',
  fontSize: '14px'
}

const tdStyle = {
  padding: '15px',
  fontSize: '14px',
  verticalAlign: 'middle' as const
}

const actionRowStyle = {
  display: 'flex',
  gap: '8px',
  flexWrap: 'wrap' as const
}

const smallButtonStyle = {
  border: '1px solid #d1d5db',
  borderRadius: '8px',
  padding: '8px 11px',
  textDecoration: 'none',
  color: '#111',
  background: '#fff'
}

const deleteButtonStyle = {
  border: '1px solid #fecaca',
  borderRadius: '8px',
  padding: '8px 11px',
  color: '#b91c1c',
  background: '#fff',
  cursor: 'pointer'
}

const statusBadgeStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '5px 10px',
  borderRadius: '999px',
  fontSize: '12px',
  fontWeight: 700,
  textTransform: 'capitalize' as const
}

const actionBadgeStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '5px 10px',
  borderRadius: '999px',
  fontSize: '12px',
  fontWeight: 700
}

const mobileCardListStyle = {
  display: 'flex',
  flexDirection: 'column' as const,
  gap: '14px'
}

const mobileCardStyle = {
  background: '#fff',
  border: '1px solid #e5e7eb',
  borderRadius: '16px',
  padding: '18px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
}

const mobileLogCardStyle = {
  background: '#fff',
  border: '1px solid #e5e7eb',
  borderRadius: '16px',
  padding: '18px'
}

const mobileCardTopStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: '12px'
}

const quotationNoStyle = {
  fontSize: '18px',
  fontWeight: 700,
  marginTop: '3px'
}

const smallLabelStyle = {
  color: '#6b7280',
  fontSize: '12px',
  lineHeight: 1.4
}

const mobileValueStyle = {
  color: '#111827',
  fontSize: '15px',
  fontWeight: 500,
  marginTop: '4px',
  wordBreak: 'break-word' as const
}

const mobileInfoGridStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '16px 12px',
  marginTop: '20px'
}

const sellingPriceBoxStyle = {
  marginTop: '18px',
  padding: '14px',
  background: '#f9fafb',
  borderRadius: '12px'
}

const sellingPriceStyle = {
  marginTop: '4px',
  fontSize: '20px',
  fontWeight: 700
}

const mobileActionGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: '8px',
  marginTop: '18px'
}

const mobileActionButtonStyle = {
  textAlign: 'center' as const,
  border: '1px solid #d1d5db',
  borderRadius: '10px',
  padding: '10px 6px',
  textDecoration: 'none',
  color: '#111',
  background: '#fff',
  fontSize: '14px'
}

const mobileDeleteButtonStyle = {
  border: '1px solid #fecaca',
  borderRadius: '10px',
  padding: '10px 6px',
  color: '#b91c1c',
  background: '#fff',
  fontSize: '14px',
  cursor: 'pointer'
}

const logSectionStyle = {
  marginTop: '42px'
}

const logHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '14px',
  flexWrap: 'wrap' as const,
  marginBottom: '16px'
}

const refreshButtonStyle = {
  border: '1px solid #d1d5db',
  borderRadius: '8px',
  padding: '9px 13px',
  background: '#fff',
  cursor: 'pointer'
}

const logMobileDetailsStyle = {
  display: 'flex',
  flexDirection: 'column' as const,
  gap: '14px',
  marginTop: '18px'
}