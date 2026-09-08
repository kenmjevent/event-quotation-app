'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../../lib/supabase'

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

    // 先记录 log，避免 quotation 删除后资料也找不到
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

  function actionBadge(action: string) {
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
      background: '#eee',
      color: '#333'
    }
  }

  return (
    <main
      style={{
        maxWidth: '1300px',
        margin: '0 auto',
        padding: '40px',
        fontFamily: 'Arial'
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px'
        }}
      >
        <div>
          <h1 style={{ marginBottom: '5px' }}>
            All Quotations
          </h1>

          <p style={{ color: '#666', marginTop: 0 }}>
            Saved quotation history
          </p>
        </div>

        <Link
          href="/"
          style={{
            padding: '12px 18px',
            border: '1px solid #222',
            borderRadius: '8px',
            textDecoration: 'none',
            color: '#000'
          }}
        >
          + New Quotation
        </Link>
      </div>

      {loading && <p>Loading quotations...</p>}

      {errorMessage && (
        <p style={{ color: 'red' }}>
          Error: {errorMessage}
        </p>
      )}

      {!loading &&
        !errorMessage &&
        quotations.length > 0 && (
          <div
            style={{
              border: '1px solid #ddd',
              borderRadius: '12px',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  '1.2fr 1.4fr 1.8fr 1fr 1.2fr 0.8fr 0.8fr 1.5fr',
                gap: '10px',
                padding: '15px',
                background: '#f5f5f5',
                fontWeight: 'bold'
              }}
            >
              <div>Quotation No.</div>
              <div>Customer</div>
              <div>Project</div>
              <div>Date</div>
              <div>Selling Price</div>
              <div>Margin</div>
              <div>Status</div>
              <div>Actions</div>
            </div>

            {quotations.map((quotation) => (
              <div
                key={quotation.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    '1.2fr 1.4fr 1.8fr 1fr 1.2fr 0.8fr 0.8fr 1.5fr',
                  gap: '10px',
                  padding: '15px',
                  borderTop: '1px solid #eee',
                  alignItems: 'center'
                }}
              >
                <div>
                  <strong>
                    {quotation.quotation_no || '-'}
                  </strong>
                </div>

                <div>
                  {quotation.customer_name || '-'}
                </div>

                <div>
                  {quotation.project_name || '-'}
                </div>

                <div>
                  {quotation.quotation_date || '-'}
                </div>

                <div>
                  {formatRM(quotation.selling_price)}
                </div>

                <div>
                  {Number(
                    quotation.gross_margin || 0
                  ).toFixed(2)}
                  %
                </div>

                <div
                  style={{
                    textTransform: 'capitalize'
                  }}
                >
                  {quotation.status || 'draft'}
                </div>

                <div
                  style={{
                    display: 'flex',
                    gap: '8px'
                  }}
                >
                  <Link
                    href={`/quotations/${quotation.id}`}
                    style={actionButton}
                  >
                    View
                  </Link>

                  <Link
                    href={`/quotations/${quotation.id}/edit`}
                    style={actionButton}
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
                    style={{
                      ...actionButton,
                      background: '#fff',
                      cursor: 'pointer'
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      {!loading &&
        !errorMessage &&
        quotations.length === 0 && (
          <div
            style={{
              padding: '30px',
              border: '1px solid #ddd',
              borderRadius: '10px'
            }}
          >
            No quotations found.
          </div>
        )}

      <div
        style={{
          marginTop: '45px'
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div>
            <h2 style={{ marginBottom: '5px' }}>
              Activity Log
            </h2>

            <p style={{ color: '#666', marginTop: 0 }}>
              Recent quotation activities
            </p>
          </div>

          <button
            onClick={loadLogs}
            style={{
              padding: '9px 14px',
              cursor: 'pointer'
            }}
          >
            Refresh Log
          </button>
        </div>

        <div
          style={{
            border: '1px solid #ddd',
            borderRadius: '12px',
            overflow: 'hidden',
            marginTop: '15px'
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1.2fr 0.8fr 1.2fr 3fr 1fr',
              gap: '10px',
              padding: '14px',
              background: '#f5f5f5',
              fontWeight: 'bold'
            }}
          >
            <div>Date / Time</div>
            <div>Action</div>
            <div>Quotation</div>
            <div>Details</div>
            <div>User</div>
          </div>

          {logs.length === 0 && (
            <div style={{ padding: '20px' }}>
              No activity yet.
            </div>
          )}

          {logs.map((log) => (
            <div
              key={log.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '1.2fr 0.8fr 1.2fr 3fr 1fr',
                gap: '10px',
                padding: '14px',
                borderTop: '1px solid #eee',
                alignItems: 'center'
              }}
            >
              <div>
                {formatDateTime(log.created_at)}
              </div>

              <div>
                <span
                  style={{
                    ...actionBadge(log.action),
                    padding: '5px 9px',
                    borderRadius: '999px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}
                >
                  {log.action}
                </span>
              </div>

              <div>
                <strong>
                  {log.quotation_no}
                </strong>
              </div>

              <div>
                {log.details || '-'}
              </div>

              <div>
                {log.performed_by || '-'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}

const actionButton = {
  padding: '7px 10px',
  border: '1px solid #ccc',
  borderRadius: '6px',
  textDecoration: 'none',
  color: '#000',
  fontSize: '13px'
}