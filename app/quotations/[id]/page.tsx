'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '../../../lib/supabase'

type Quotation = {
  id: string
  quotation_no: string
  customer_name: string
  project_name: string
  quotation_date: string
  status: string
  target_margin: number
  material_cost: number
  labour_cost: number
  logistics_cost: number
  total_cost: number
  selling_price: number
  gross_profit: number
  gross_margin: number
}

type MaterialRow = {
  id: string
  item_description: string
  width_mm: number
  height_mm: number
  length_mm: number
  quantity: number
  required_qty: number
  material_cost: number
  materials: {
    name: string
    unit: string
    cost_price: number
  } | null
}

export default function ViewQuotationPage() {
  const params = useParams()
  const id = params.id as string

  const [quotation, setQuotation] = useState<Quotation | null>(null)
  const [materialRows, setMaterialRows] = useState<MaterialRow[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (id) {
      loadQuotation()
    }
  }, [id])

  async function loadQuotation() {
    setLoading(true)
    setErrorMessage('')

    const { data: quotationData, error: quotationError } =
      await supabase
        .from('quotations')
        .select('*')
        .eq('id', id)
        .single()

    if (quotationError) {
      setErrorMessage(quotationError.message)
      setLoading(false)
      return
    }

    const { data: materialsData, error: materialsError } =
      await supabase
        .from('quotation_materials')
        .select(`
          *,
          materials (
            name,
            unit,
            cost_price
          )
        `)
        .eq('quotation_id', id)
        .order('created_at', { ascending: true })

    if (materialsError) {
      setErrorMessage(materialsError.message)
      setLoading(false)
      return
    }

    setQuotation(quotationData)
    setMaterialRows(materialsData || [])
    setLoading(false)
  }

  function formatRM(value: number | null) {
    return `RM${Number(value || 0).toLocaleString('en-MY', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`
  }

  if (loading) {
    return (
      <main style={mainStyle}>
        <p>Loading quotation...</p>
      </main>
    )
  }

  if (errorMessage) {
    return (
      <main style={mainStyle}>
        <p style={{ color: 'red' }}>
          Error: {errorMessage}
        </p>
      </main>
    )
  }

  if (!quotation) {
    return (
      <main style={mainStyle}>
        <p>Quotation not found.</p>
      </main>
    )
  }

  return (
    <main style={mainStyle}>
      <div style={topRowStyle}>
        <div>
          <h1>{quotation.quotation_no}</h1>
          <p style={{ color: '#666' }}>
            Quotation Details
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Link
            href="/quotations"
            style={buttonStyle}
          >
            Back
          </Link>

          <Link
            href={`/quotations/${quotation.id}/edit`}
            style={buttonStyle}
          >
            Edit
          </Link>
        </div>
      </div>

      <div style={sectionStyle}>
        <h2>Quotation Information</h2>

        <div style={gridStyle}>
          <Info
            label="Quotation No."
            value={quotation.quotation_no}
          />

          <Info
            label="Date"
            value={quotation.quotation_date}
          />

          <Info
            label="Customer"
            value={quotation.customer_name}
          />

          <Info
            label="Project"
            value={quotation.project_name}
          />

          <Info
            label="Status"
            value={quotation.status}
          />

          <Info
            label="Target Margin"
            value={`${Number(
              quotation.target_margin || 0
            ).toFixed(2)}%`}
          />
        </div>
      </div>

      <div style={sectionStyle}>
        <h2>Materials</h2>

        {materialRows.length === 0 && (
          <p>No materials found.</p>
        )}

        {materialRows.map((row, index) => (
          <div
            key={row.id}
            style={materialBoxStyle}
          >
            <strong>
              {index + 1}. {row.item_description || 'Item'}
            </strong>

            <div style={{ marginTop: '10px' }}>
              Material:{' '}
              <strong>
                {row.materials?.name || '-'}
              </strong>
            </div>

            {row.width_mm > 0 && (
              <div>
                Width: {row.width_mm} mm
              </div>
            )}

            {row.height_mm > 0 && (
              <div>
                Height: {row.height_mm} mm
              </div>
            )}

            {row.length_mm > 0 && (
              <div>
                Length: {row.length_mm} mm
              </div>
            )}

            <div>
              Quantity: {row.quantity}
            </div>

            <div>
              Required: {row.required_qty}{' '}
              {row.materials?.unit || ''}
            </div>

            <div>
              Material Cost:{' '}
              <strong>
                {formatRM(row.material_cost)}
              </strong>
            </div>
          </div>
        ))}
      </div>

      <div style={summaryStyle}>
        <h2>Cost Summary</h2>

        <SummaryRow
          label="Material Cost"
          value={formatRM(quotation.material_cost)}
        />

        <SummaryRow
          label="Labour"
          value={formatRM(quotation.labour_cost)}
        />

        <SummaryRow
          label="Logistics / Other Costs"
          value={formatRM(quotation.logistics_cost)}
        />

        <hr style={{ margin: '20px 0' }} />

        <SummaryRow
          label="TOTAL COST"
          value={formatRM(quotation.total_cost)}
          bold
        />

        <SummaryRow
          label="Selling Price"
          value={formatRM(quotation.selling_price)}
          bold
        />

        <SummaryRow
          label="Gross Profit"
          value={formatRM(quotation.gross_profit)}
        />

        <SummaryRow
          label="Gross Margin"
          value={`${Number(
            quotation.gross_margin || 0
          ).toFixed(2)}%`}
        />
      </div>
    </main>
  )
}

const mainStyle = {
  maxWidth: '1100px',
  margin: '0 auto',
  padding: '40px',
  fontFamily: 'Arial'
}

const topRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
}

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
  gap: '20px'
}

const sectionStyle = {
  marginTop: '25px',
  padding: '25px',
  border: '1px solid #ddd',
  borderRadius: '12px'
}

const materialBoxStyle = {
  padding: '15px',
  border: '1px solid #ddd',
  borderRadius: '8px',
  marginBottom: '12px'
}

const summaryStyle = {
  marginTop: '30px',
  padding: '25px',
  border: '2px solid #222',
  borderRadius: '12px'
}

const buttonStyle = {
  padding: '10px 14px',
  border: '1px solid #ccc',
  borderRadius: '6px',
  textDecoration: 'none',
  color: '#000'
}

function Info({
  label,
  value
}: {
  label: string
  value: string
}) {
  return (
    <div>
      <div style={{ color: '#666', fontSize: '13px' }}>
        {label}
      </div>

      <div style={{ fontWeight: 'bold', marginTop: '5px' }}>
        {value || '-'}
      </div>
    </div>
  )
}

function SummaryRow({
  label,
  value,
  bold = false
}: {
  label: string
  value: string
  bold?: boolean
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '12px',
        fontWeight: bold ? 'bold' : 'normal'
      }}
    >
      <span>{label}</span>
      <span>{value}</span>
    </div>
  )
}