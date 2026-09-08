'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '../../../../lib/supabase'

type Material = {
  id: string
  name: string
  category: string
  unit: string
  cost_price: number
  wastage_percent: number
}

type ItemMaterial = {
  id: number
  materialId: string
  width: string
  height: string
  length: string
  quantity: string
}

type QuoteItem = {
  id: number
  description: string
  materials: ItemMaterial[]
}

export default function EditQuotationPage() {
  const params = useParams()
  const router = useRouter()

  const quotationId = params.id as string

  const [materials, setMaterials] = useState<Material[]>([])
  const [items, setItems] = useState<QuoteItem[]>([])

  const [quotationNo, setQuotationNo] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [projectName, setProjectName] = useState('')
  const [quotationDate, setQuotationDate] = useState('')
  const [status, setStatus] = useState('draft')

  const [labourCost, setLabourCost] = useState('0')
  const [transportCost, setTransportCost] = useState('0')
  const [installationCost, setInstallationCost] = useState('0')
  const [dismantlingCost, setDismantlingCost] = useState('0')
  const [targetMargin, setTargetMargin] = useState('40')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (quotationId) {
      loadEverything()
    }
  }, [quotationId])

  async function loadEverything() {
    setLoading(true)
    setMessage('')

    const { data: materialData, error: materialError } =
      await supabase
        .from('materials')
        .select('*')
        .eq('is_active', true)
        .order('name')

    if (materialError) {
      setMessage(materialError.message)
      setLoading(false)
      return
    }

    setMaterials(materialData || [])

    const { data: quotation, error: quotationError } =
      await supabase
        .from('quotations')
        .select('*')
        .eq('id', quotationId)
        .single()

    if (quotationError) {
      setMessage(quotationError.message)
      setLoading(false)
      return
    }

    setQuotationNo(quotation.quotation_no || '')
    setCustomerName(quotation.customer_name || '')
    setProjectName(quotation.project_name || '')
    setQuotationDate(quotation.quotation_date || '')
    setStatus(quotation.status || 'draft')

    setLabourCost(String(quotation.labour_cost || 0))
    setTransportCost(String(quotation.transport_cost || 0))
    setInstallationCost(String(quotation.installation_cost || 0))
    setDismantlingCost(String(quotation.dismantling_cost || 0))
    setTargetMargin(String(quotation.target_margin || 40))

    const { data: rows, error: rowsError } =
      await supabase
        .from('quotation_materials')
        .select('*')
        .eq('quotation_id', quotationId)
        .order('created_at', { ascending: true })

    if (rowsError) {
      setMessage(rowsError.message)
      setLoading(false)
      return
    }

    const grouped: Record<string, QuoteItem> = {}

    ;(rows || []).forEach((row: any, index: number) => {
      const description = row.item_description || 'Item'

      if (!grouped[description]) {
        grouped[description] = {
          id: Date.now() + index,
          description,
          materials: []
        }
      }

      grouped[description].materials.push({
        id: Date.now() + index + 1000,
        materialId: row.material_id || '',
        width: String(row.width_mm || 0),
        height: String(row.height_mm || 0),
        length: String(row.length_mm || 0),
        quantity: String(row.quantity || 1)
      })
    })

    const groupedItems = Object.values(grouped)

    if (groupedItems.length === 0) {
      groupedItems.push({
        id: Date.now(),
        description: '',
        materials: [
          {
            id: Date.now() + 1,
            materialId: materialData?.[0]?.id || '',
            width: '1000',
            height: '1000',
            length: '1000',
            quantity: '1'
          }
        ]
      })
    }

    setItems(groupedItems)
    setLoading(false)
  }

  function addItem() {
    setItems((current) => [
      ...current,
      {
        id: Date.now(),
        description: '',
        materials: [
          {
            id: Date.now() + 1,
            materialId: materials[0]?.id || '',
            width: '1000',
            height: '1000',
            length: '1000',
            quantity: '1'
          }
        ]
      }
    ])
  }

  function removeItem(itemId: number) {
    if (items.length === 1) return

    setItems((current) =>
      current.filter((item) => item.id !== itemId)
    )
  }

  function updateDescription(
    itemId: number,
    value: string
  ) {
    setItems((current) =>
      current.map((item) =>
        item.id === itemId
          ? { ...item, description: value }
          : item
      )
    )
  }

  function addMaterial(itemId: number) {
    setItems((current) =>
      current.map((item) =>
        item.id === itemId
          ? {
              ...item,
              materials: [
                ...item.materials,
                {
                  id: Date.now(),
                  materialId: materials[0]?.id || '',
                  width: '1000',
                  height: '1000',
                  length: '1000',
                  quantity: '1'
                }
              ]
            }
          : item
      )
    )
  }

  function removeMaterial(
    itemId: number,
    rowId: number
  ) {
    setItems((current) =>
      current.map((item) => {
        if (item.id !== itemId) return item
        if (item.materials.length === 1) return item

        return {
          ...item,
          materials: item.materials.filter(
            (row) => row.id !== rowId
          )
        }
      })
    )
  }

  function updateMaterial(
    itemId: number,
    rowId: number,
    field: keyof ItemMaterial,
    value: string
  ) {
    setItems((current) =>
      current.map((item) => {
        if (item.id !== itemId) return item

        return {
          ...item,
          materials: item.materials.map((row) =>
            row.id === rowId
              ? { ...row, [field]: value }
              : row
          )
        }
      })
    )
  }

  function calculateMaterial(row: ItemMaterial) {
    const material = materials.find(
      (m) => m.id === row.materialId
    )

    if (!material) {
      return {
        unit: '',
        requiredQty: 0,
        materialCost: 0,
        areaSqft: 0
      }
    }

    const unit =
      material.unit?.toLowerCase().trim() || ''

    const qty = Number(row.quantity) || 0
    const rate = Number(material.cost_price) || 0

    const wastage =
      1 +
      (Number(material.wastage_percent) || 0) / 100

    let requiredQty = 0
    let materialCost = 0
    let areaSqft = 0

    if (unit === 'sheet' || unit === 'sqft') {
      const widthFt =
        (Number(row.width) || 0) / 304.8

      const heightFt =
        (Number(row.height) || 0) / 304.8

      areaSqft =
        widthFt * heightFt * qty

      if (unit === 'sheet') {
        requiredQty = Math.ceil(
          (areaSqft * wastage) / 32
        )

        materialCost =
          requiredQty * rate
      } else {
        requiredQty =
          areaSqft * wastage

        materialCost =
          requiredQty * rate
      }
    } else if (unit === 'ft') {
      const lengthFt =
        (Number(row.length) || 0) / 304.8

      requiredQty =
        lengthFt * qty * wastage

      materialCost =
        requiredQty * rate
    } else {
      requiredQty = qty
      materialCost =
        qty * rate
    }

    return {
      unit,
      requiredQty,
      materialCost,
      areaSqft
    }
  }

  const totals = useMemo(() => {
    const materialCost =
      items.reduce(
        (itemTotal, item) =>
          itemTotal +
          item.materials.reduce(
            (materialTotal, row) =>
              materialTotal +
              calculateMaterial(row).materialCost,
            0
          ),
        0
      )

    const labour =
      Number(labourCost) || 0

    const transport =
      Number(transportCost) || 0

    const installation =
      Number(installationCost) || 0

    const dismantling =
      Number(dismantlingCost) || 0

    const totalCost =
      materialCost +
      labour +
      transport +
      installation +
      dismantling

    const margin =
      Number(targetMargin) || 0

    const sellingPrice =
      margin > 0 && margin < 100
        ? totalCost / (1 - margin / 100)
        : totalCost

    const grossProfit =
      sellingPrice - totalCost

    const grossMargin =
      sellingPrice > 0
        ? (grossProfit / sellingPrice) * 100
        : 0

    return {
      materialCost,
      totalCost,
      sellingPrice,
      grossProfit,
      grossMargin
    }
  }, [
    items,
    materials,
    labourCost,
    transportCost,
    installationCost,
    dismantlingCost,
    targetMargin
  ])

  async function saveChanges() {
    try {
      setSaving(true)
      setMessage('')

      const { error: updateError } =
        await supabase
          .from('quotations')
          .update({
            customer_name: customerName.trim(),
            project_name: projectName.trim(),
            quotation_date: quotationDate,
            status,

            target_margin:
              Number(targetMargin) || 0,

            material_cost:
              totals.materialCost,

            labour_cost:
              Number(labourCost) || 0,

            transport_cost:
              Number(transportCost) || 0,

            installation_cost:
              Number(installationCost) || 0,

            dismantling_cost:
              Number(dismantlingCost) || 0,

            logistics_cost:
              (Number(transportCost) || 0) +
              (Number(installationCost) || 0) +
              (Number(dismantlingCost) || 0),

            total_cost:
              totals.totalCost,

            selling_price:
              totals.sellingPrice,

            gross_profit:
              totals.grossProfit,

            gross_margin:
              totals.grossMargin,

            updated_at:
              new Date().toISOString()
          })
          .eq('id', quotationId)

      if (updateError) {
        throw updateError
      }

      const { error: deleteError } =
        await supabase
          .from('quotation_materials')
          .delete()
          .eq('quotation_id', quotationId)

      if (deleteError) {
        throw deleteError
      }

      const materialRows =
        items.flatMap((item) =>
          item.materials.map((row) => {
            const calculation =
              calculateMaterial(row)

            return {
              quotation_id: quotationId,
              item_description: item.description,
              material_id: row.materialId,
              width_mm: Number(row.width) || 0,
              height_mm: Number(row.height) || 0,
              length_mm: Number(row.length) || 0,
              quantity: Number(row.quantity) || 0,
              required_qty:
                calculation.requiredQty,
              material_cost:
                calculation.materialCost
            }
          })
        )

      const { error: insertError } =
        await supabase
          .from('quotation_materials')
          .insert(materialRows)

      if (insertError) {
        throw insertError
      }

      await supabase
        .from('quotation_logs')
        .insert({
          quotation_id: quotationId,
          quotation_no: quotationNo,
          action: 'EDIT',
          details:
            `Updated quotation for ${customerName.trim()} - ${projectName.trim()}`,
          performed_by: 'Admin'
        })

      setMessage(
        'Quotation updated successfully.'
      )

      setTimeout(() => {
        router.push(
          `/quotations/${quotationId}`
        )
      }, 700)

    } catch (error: any) {
      setMessage(
        `Update failed: ${
          error?.message ||
          'Unknown error'
        }`
      )
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <main style={mainStyle}>
        Loading quotation...
      </main>
    )
  }

  return (
    <main style={mainStyle}>
      <div style={topRow}>
        <div>
          <h1>
            Edit {quotationNo}
          </h1>

          <p style={{ color: '#666' }}>
            Update quotation details
          </p>
        </div>

        <Link
          href="/quotations"
          style={buttonStyle}
        >
          Back to List
        </Link>
      </div>

      <section style={sectionStyle}>
        <h2>
          Quotation Information
        </h2>

        <div style={gridStyle}>
          <Field
            label="Quotation No."
            value={quotationNo}
            readOnly
          />

          <div>
            <label>Date</label>

            <input
              type="date"
              value={quotationDate}
              onChange={(e) =>
                setQuotationDate(
                  e.target.value
                )
              }
              style={inputStyle}
            />
          </div>

          <Field
            label="Customer Name"
            value={customerName}
            onChange={setCustomerName}
          />

          <Field
            label="Project Name"
            value={projectName}
            onChange={setProjectName}
          />

          <div>
            <label>Status</label>

            <select
              value={status}
              onChange={(e) =>
                setStatus(
                  e.target.value
                )
              }
              style={inputStyle}
            >
              <option value="draft">
                Draft
              </option>

              <option value="sent">
                Sent
              </option>

              <option value="approved">
                Approved
              </option>

              <option value="rejected">
                Rejected
              </option>
            </select>
          </div>
        </div>
      </section>

      <h2>
        Quotation Items
      </h2>

      {items.map(
        (item, itemIndex) => (
          <section
            key={item.id}
            style={itemStyle}
          >
            <div style={topRow}>
              <h2>
                Item {itemIndex + 1}
              </h2>

              <button
                onClick={() =>
                  removeItem(item.id)
                }
                disabled={
                  items.length === 1
                }
              >
                Remove Item
              </button>
            </div>

            <label>
              Description
            </label>

            <input
              value={item.description}
              onChange={(e) =>
                updateDescription(
                  item.id,
                  e.target.value
                )
              }
              style={inputStyle}
            />

            <h3>
              Materials
            </h3>

            {item.materials.map(
              (
                row,
                materialIndex
              ) => {
                const result =
                  calculateMaterial(row)

                const isArea =
                  result.unit === 'sheet' ||
                  result.unit === 'sqft'

                const isLength =
                  result.unit === 'ft'

                return (
                  <div
                    key={row.id}
                    style={materialStyle}
                  >
                    <div style={topRow}>
                      <strong>
                        Material{' '}
                        {materialIndex + 1}
                      </strong>

                      <button
                        onClick={() =>
                          removeMaterial(
                            item.id,
                            row.id
                          )
                        }
                        disabled={
                          item.materials.length ===
                          1
                        }
                      >
                        Remove
                      </button>
                    </div>

                    <label>
                      Material
                    </label>

                    <select
                      value={row.materialId}
                      onChange={(e) =>
                        updateMaterial(
                          item.id,
                          row.id,
                          'materialId',
                          e.target.value
                        )
                      }
                      style={inputStyle}
                    >
                      {materials.map(
                        (material) => (
                          <option
                            key={material.id}
                            value={material.id}
                          >
                            {material.name}
                            {' - RM'}
                            {material.cost_price}
                            /
                            {material.unit}
                          </option>
                        )
                      )}
                    </select>

                    {isArea && (
                      <div style={gridStyle}>
                        <NumberField
                          label="Width (mm)"
                          value={row.width}
                          onChange={(value) =>
                            updateMaterial(
                              item.id,
                              row.id,
                              'width',
                              value
                            )
                          }
                        />

                        <NumberField
                          label="Height (mm)"
                          value={row.height}
                          onChange={(value) =>
                            updateMaterial(
                              item.id,
                              row.id,
                              'height',
                              value
                            )
                          }
                        />
                      </div>
                    )}

                    {isLength && (
                      <NumberField
                        label="Length (mm)"
                        value={row.length}
                        onChange={(value) =>
                          updateMaterial(
                            item.id,
                            row.id,
                            'length',
                            value
                          )
                        }
                      />
                    )}

                    <NumberField
                      label="Quantity"
                      value={row.quantity}
                      onChange={(value) =>
                        updateMaterial(
                          item.id,
                          row.id,
                          'quantity',
                          value
                        )
                      }
                    />

                    <div style={resultStyle}>
                      {isArea && (
                        <div>
                          Area:{' '}
                          {result.areaSqft.toFixed(2)}
                          {' '}
                          sqft
                        </div>
                      )}

                      <div>
                        Required:{' '}
                        {result.unit === 'sheet'
                          ? `${result.requiredQty} sheets`
                          : `${result.requiredQty.toFixed(
                              2
                            )} ${result.unit}`}
                      </div>

                      <strong>
                        Cost: RM
                        {result.materialCost.toFixed(2)}
                      </strong>
                    </div>
                  </div>
                )
              }
            )}

            <button
              onClick={() =>
                addMaterial(item.id)
              }
              style={buttonStyle}
            >
              + Add Material
            </button>
          </section>
        )
      )}

      <button
        onClick={addItem}
        style={buttonStyle}
      >
        + Add Item
      </button>

      <section style={sectionStyle}>
        <h2>
          Other Costs
        </h2>

        <div style={gridStyle}>
          <NumberField
            label="Labour Cost (RM)"
            value={labourCost}
            onChange={setLabourCost}
          />

          <NumberField
            label="Transport Cost (RM)"
            value={transportCost}
            onChange={setTransportCost}
          />

          <NumberField
            label="Installation Cost (RM)"
            value={installationCost}
            onChange={setInstallationCost}
          />

          <NumberField
            label="Dismantling Cost (RM)"
            value={dismantlingCost}
            onChange={setDismantlingCost}
          />
        </div>
      </section>

      <section style={sectionStyle}>
        <h2>
          Pricing
        </h2>

        <NumberField
          label="Target Gross Margin (%)"
          value={targetMargin}
          onChange={setTargetMargin}
        />
      </section>

      <section style={summaryStyle}>
        <h2>
          Updated Summary
        </h2>

        <Summary
          label="Material Cost"
          value={totals.materialCost}
        />

        <Summary
          label="TOTAL COST"
          value={totals.totalCost}
          bold
        />

        <Summary
          label="Selling Price"
          value={totals.sellingPrice}
          bold
        />

        <Summary
          label="Gross Profit"
          value={totals.grossProfit}
        />

        <div style={summaryRow}>
          <span>
            Gross Margin
          </span>

          <strong>
            {totals.grossMargin.toFixed(2)}%
          </strong>
        </div>

        <button
          onClick={saveChanges}
          disabled={saving}
          style={{
            ...buttonStyle,
            marginTop: '25px'
          }}
        >
          {saving
            ? 'Saving Changes...'
            : 'Save Changes'}
        </button>

        {message && (
          <p
            style={{
              marginTop: '15px',
              fontWeight: 'bold'
            }}
          >
            {message}
          </p>
        )}
      </section>
    </main>
  )
}

const mainStyle = {
  maxWidth: '1200px',
  margin: '0 auto',
  padding: '40px',
  fontFamily: 'Arial'
}

const topRow = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
}

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
  gap: '20px'
}

const inputStyle = {
  width: '100%',
  padding: '12px',
  marginTop: '8px',
  marginBottom: '12px',
  border: '1px solid #ccc',
  borderRadius: '6px',
  boxSizing: 'border-box' as const
}

const sectionStyle = {
  padding: '25px',
  border: '1px solid #ddd',
  borderRadius: '12px',
  marginTop: '25px',
  marginBottom: '25px'
}

const itemStyle = {
  padding: '25px',
  border: '2px solid #222',
  borderRadius: '12px',
  marginBottom: '25px'
}

const materialStyle = {
  padding: '18px',
  border: '1px solid #ddd',
  borderRadius: '10px',
  marginBottom: '15px'
}

const resultStyle = {
  background: '#f5f5f5',
  padding: '12px',
  borderRadius: '8px',
  marginTop: '10px'
}

const buttonStyle = {
  padding: '10px 15px',
  border: '1px solid #aaa',
  borderRadius: '6px',
  cursor: 'pointer',
  textDecoration: 'none',
  color: '#000',
  background: '#fff'
}

const summaryStyle = {
  padding: '25px',
  border: '2px solid #222',
  borderRadius: '12px',
  marginTop: '30px'
}

const summaryRow = {
  display: 'flex',
  justifyContent: 'space-between',
  marginBottom: '12px'
}

function Field({
  label,
  value,
  onChange,
  readOnly = false
}: {
  label: string
  value: string
  onChange?: (value: string) => void
  readOnly?: boolean
}) {
  return (
    <div>
      <label>
        {label}
      </label>

      <input
        value={value}
        readOnly={readOnly}
        onChange={(e) =>
          onChange?.(
            e.target.value
          )
        }
        style={{
          ...inputStyle,
          background:
            readOnly
              ? '#f5f5f5'
              : '#fff'
        }}
      />
    </div>
  )
}

function NumberField({
  label,
  value,
  onChange
}: {
  label: string
  value: string
  onChange: (
    value: string
  ) => void
}) {
  return (
    <div>
      <label>
        {label}
      </label>

      <input
        type="number"
        value={value}
        onChange={(e) =>
          onChange(
            e.target.value
          )
        }
        style={
          inputStyle
        }
      />
    </div>
  )
}

function Summary({
  label,
  value,
  bold = false
}: {
  label: string
  value: number
  bold?: boolean
}) {
  return (
    <div
      style={{
        ...summaryRow,
        fontWeight:
          bold
            ? 'bold'
            : 'normal'
      }}
    >
      <span>
        {label}
      </span>

      <span>
        RM
        {value.toLocaleString(
          'en-MY',
          {
            minimumFractionDigits:
              2,
            maximumFractionDigits:
              2
          }
        )}
      </span>
    </div>
  )
}