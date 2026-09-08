'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../../lib/supabase'

type Material = {
  id: string
  name: string
  category: string
  unit: string
  cost_price: number
  wastage_percent: number
  is_active: boolean
}

type MaterialRow = {
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
  materials: MaterialRow[]
}

export default function CalculatorPage() {
  const [materials, setMaterials] = useState<Material[]>([])
  const [loadingMaterials, setLoadingMaterials] = useState(true)

  const [quotationNo, setQuotationNo] = useState('')
  const [quotationDate, setQuotationDate] = useState(
    new Date().toISOString().split('T')[0]
  )

  const [customerName, setCustomerName] = useState('')
  const [projectName, setProjectName] = useState('')

  const [items, setItems] = useState<QuoteItem[]>([
    {
      id: 1,
      description: '',
      materials: [
        {
          id: 1,
          materialId: '',
          width: '1000',
          height: '1000',
          length: '1000',
          quantity: '1',
        },
      ],
    },
  ])

  const [labourCost, setLabourCost] = useState('0')
  const [transportCost, setTransportCost] = useState('0')
  const [installationCost, setInstallationCost] = useState('0')
  const [dismantlingCost, setDismantlingCost] = useState('0')
  const [targetMargin, setTargetMargin] = useState('40')

  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    loadMaterials()
    generateQuotationNo()
  }, [])

  async function loadMaterials() {
    setLoadingMaterials(true)

    const { data, error } = await supabase
      .from('materials')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (error) {
      setErrorMessage(`Materials load failed: ${error.message}`)
      setLoadingMaterials(false)
      return
    }

    const list = data || []

    setMaterials(list)

    if (list.length > 0) {
      setItems((current) =>
        current.map((item) => ({
          ...item,
          materials: item.materials.map((row) => ({
            ...row,
            materialId: row.materialId || list[0].id,
          })),
        }))
      )
    }

    setLoadingMaterials(false)
  }

  async function generateQuotationNo() {
    const now = new Date()

    const yy = String(now.getFullYear()).slice(-2)
    const mm = String(now.getMonth() + 1).padStart(2, '0')

    const prefix = `Q${yy}${mm}`

    const { data, error } = await supabase
      .from('quotations')
      .select('quotation_no')
      .like('quotation_no', `${prefix}%`)
      .order('quotation_no', { ascending: false })
      .limit(1)

    if (error) {
      console.error('Quotation no error:', error)
      return
    }

    let next = 1

    if (data && data.length > 0 && data[0].quotation_no) {
      const lastNo = data[0].quotation_no
      const lastRunning = Number(lastNo.slice(-3)) || 0
      next = lastRunning + 1
    }

    setQuotationNo(`${prefix}${String(next).padStart(3, '0')}`)
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
            quantity: '1',
          },
        ],
      },
    ])
  }

  function removeItem(itemId: number) {
    if (items.length === 1) return

    setItems((current) =>
      current.filter((item) => item.id !== itemId)
    )
  }

  function updateItemDescription(itemId: number, value: string) {
    setItems((current) =>
      current.map((item) =>
        item.id === itemId
          ? {
              ...item,
              description: value,
            }
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
                  quantity: '1',
                },
              ],
            }
          : item
      )
    )
  }

  function removeMaterial(itemId: number, rowId: number) {
    setItems((current) =>
      current.map((item) => {
        if (item.id !== itemId) return item
        if (item.materials.length === 1) return item

        return {
          ...item,
          materials: item.materials.filter((row) => row.id !== rowId),
        }
      })
    )
  }

  function updateMaterialRow(
    itemId: number,
    rowId: number,
    field: keyof MaterialRow,
    value: string
  ) {
    setItems((current) =>
      current.map((item) => {
        if (item.id !== itemId) return item

        return {
          ...item,
          materials: item.materials.map((row) =>
            row.id === rowId
              ? {
                  ...row,
                  [field]: value,
                }
              : row
          ),
        }
      })
    )
  }

  function calculateMaterialRow(row: MaterialRow) {
    const material = materials.find(
      (m) => m.id === row.materialId
    )

    if (!material) {
      return {
        material: null,
        unit: '',
        areaSqft: 0,
        requiredQty: 0,
        materialCost: 0,
      }
    }

    const unit = String(material.unit || '')
      .trim()
      .toLowerCase()

    const quantity = Number(row.quantity) || 0
    const costPrice = Number(material.cost_price) || 0

    const wastageMultiplier =
      1 + (Number(material.wastage_percent) || 0) / 100

    let areaSqft = 0
    let requiredQty = 0
    let materialCost = 0

    if (unit === 'sheet' || unit === 'sqft') {
      const widthFt = (Number(row.width) || 0) / 304.8
      const heightFt = (Number(row.height) || 0) / 304.8

      areaSqft = widthFt * heightFt * quantity

      if (unit === 'sheet') {
        const areaWithWastage = areaSqft * wastageMultiplier

        requiredQty = Math.ceil(areaWithWastage / 32)

        materialCost = requiredQty * costPrice
      }

      if (unit === 'sqft') {
        requiredQty = areaSqft * wastageMultiplier
        materialCost = requiredQty * costPrice
      }
    } else if (unit === 'ft') {
      const lengthFt = (Number(row.length) || 0) / 304.8

      requiredQty = lengthFt * quantity * wastageMultiplier
      materialCost = requiredQty * costPrice
    } else {
      requiredQty = quantity
      materialCost = requiredQty * costPrice
    }

    return {
      material,
      unit,
      areaSqft,
      requiredQty,
      materialCost,
    }
  }

  function calculateItemTotal(item: QuoteItem) {
    return item.materials.reduce(
      (sum, row) => sum + calculateMaterialRow(row).materialCost,
      0
    )
  }

  const totals = useMemo(() => {
    const materialCost = items.reduce(
      (sum, item) => sum + calculateItemTotal(item),
      0
    )

    const labour = Number(labourCost) || 0
    const transport = Number(transportCost) || 0
    const installation = Number(installationCost) || 0
    const dismantling = Number(dismantlingCost) || 0

    const totalCost =
      materialCost +
      labour +
      transport +
      installation +
      dismantling

    const margin = Number(targetMargin) || 0

    let sellingPrice = totalCost
    let grossProfit = 0
    let grossMargin = 0

    if (margin > 0 && margin < 100) {
      sellingPrice = totalCost / (1 - margin / 100)
      grossProfit = sellingPrice - totalCost

      grossMargin =
        sellingPrice > 0
          ? (grossProfit / sellingPrice) * 100
          : 0
    }

    return {
      materialCost,
      totalCost,
      sellingPrice,
      grossProfit,
      grossMargin,
    }
  }, [
    items,
    materials,
    labourCost,
    transportCost,
    installationCost,
    dismantlingCost,
    targetMargin,
  ])

  async function saveQuotation() {
    setSaveMessage('')
    setErrorMessage('')

    if (!customerName.trim()) {
      setErrorMessage('Please enter Customer Name.')
      return
    }

    if (!projectName.trim()) {
      setErrorMessage('Please enter Project Name.')
      return
    }

    if (!quotationNo.trim()) {
      setErrorMessage('Quotation No. is missing.')
      return
    }

    setSaving(true)

    try {
      const {
        data: quotationData,
        error: quotationError,
      } = await supabase
        .from('quotations')
        .insert({
          quotation_no: quotationNo.trim(),
          customer_name: customerName.trim(),
          project_name: projectName.trim(),
          quotation_date: quotationDate,
          status: 'draft',

          target_margin: Number(targetMargin) || 0,

          material_cost: totals.materialCost,
          labour_cost: Number(labourCost) || 0,
          transport_cost: Number(transportCost) || 0,
          installation_cost: Number(installationCost) || 0,
          dismantling_cost: Number(dismantlingCost) || 0,

          logistics_cost:
            (Number(transportCost) || 0) +
            (Number(installationCost) || 0) +
            (Number(dismantlingCost) || 0),

          total_cost: totals.totalCost,
          selling_price: totals.sellingPrice,
          gross_profit: totals.grossProfit,
          gross_margin: totals.grossMargin,
        })
        .select()
        .single()

      if (quotationError) {
        throw quotationError
      }

      const rows = items.flatMap((item) =>
        item.materials.map((row) => {
          const result = calculateMaterialRow(row)

          return {
            quotation_id: quotationData.id,
            item_description: item.description,
            material_id: row.materialId,

            width_mm: Number(row.width) || 0,
            height_mm: Number(row.height) || 0,
            length_mm: Number(row.length) || 0,

            quantity: Number(row.quantity) || 0,
            required_qty: result.requiredQty,
            material_cost: result.materialCost,
          }
        })
      )

      if (rows.length > 0) {
        const { error: materialError } = await supabase
          .from('quotation_materials')
          .insert(rows)

        if (materialError) {
          throw materialError
        }
      }

      const { error: logError } = await supabase
        .from('quotation_logs')
        .insert({
          quotation_id: quotationData.id,
          quotation_no: quotationNo,
          action: 'CREATE',
          details: `Created costing for ${customerName.trim()} - ${projectName.trim()}`,
          performed_by: 'Admin',
        })

      if (logError) {
        console.error('Log error:', logError)
      }

      const savedNo = quotationNo

      setSaveMessage(
        `Costing ${savedNo} saved successfully.`
      )

      setCustomerName('')
      setProjectName('')

      await generateQuotationNo()
    } catch (error: any) {
      setErrorMessage(
        `Save failed: ${error?.message || 'Unknown error'}`
      )
    } finally {
      setSaving(false)
    }
  }

  function formatRM(value: number) {
    return `RM${Number(value || 0).toLocaleString('en-MY', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`
  }

  let marginStatus = 'HEALTHY MARGIN'

  if (totals.grossMargin < 35) {
    marginStatus = 'LOW MARGIN'
  } else if (totals.grossMargin < 40) {
    marginStatus = 'CAUTION'
  }

  return (
    <main className="page">
      <header className="topBar">
        <Link href="/" className="backButton">
          ←
        </Link>

        <div>
          <div className="topTitle">
            Cost Calculator
          </div>

          <div className="topSubtitle">
            Create internal costing
          </div>
        </div>
      </header>

      <section className="section">
        <h2>Costing Information</h2>

        <div className="formGrid">
          <Field label="Costing No.">
            <input
              value={quotationNo}
              readOnly
              className="input readonly"
            />
          </Field>

          <Field label="Date">
            <input
              type="date"
              value={quotationDate}
              onChange={(e) =>
                setQuotationDate(e.target.value)
              }
              className="input"
            />
          </Field>

          <Field label="Customer Name">
            <input
              value={customerName}
              onChange={(e) =>
                setCustomerName(e.target.value)
              }
              placeholder="e.g. Genting Malaysia"
              className="input"
            />
          </Field>

          <Field label="Project Name">
            <input
              value={projectName}
              onChange={(e) =>
                setProjectName(e.target.value)
              }
              placeholder="e.g. Baccarat 2026"
              className="input"
            />
          </Field>
        </div>
      </section>

      {loadingMaterials && (
        <section className="section">
          Loading materials...
        </section>
      )}

      {!loadingMaterials && (
        <>
          <section className="itemsHeader">
            <div>
              <h2>Costing Items</h2>
              <p>
                Add items and materials
              </p>
            </div>
          </section>

          {items.map((item, itemIndex) => (
            <section
              key={item.id}
              className="itemCard"
            >
              <div className="rowBetween">
                <div className="itemTitle">
                  Item {itemIndex + 1}
                </div>

                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  disabled={items.length === 1}
                  className="textButton danger"
                >
                  Remove Item
                </button>
              </div>

              <Field label="Description">
                <input
                  value={item.description}
                  onChange={(e) =>
                    updateItemDescription(
                      item.id,
                      e.target.value
                    )
                  }
                  placeholder="e.g. Feature Wall"
                  className="input"
                />
              </Field>

              <div className="subHeading">
                Materials
              </div>

              {item.materials.map(
                (row, materialIndex) => {
                  const result =
                    calculateMaterialRow(row)

                  const unit = result.unit

                  const showArea =
                    unit === 'sheet' ||
                    unit === 'sqft'

                  const showLength =
                    unit === 'ft'

                  return (
                    <div
                      key={row.id}
                      className="materialCard"
                    >
                      <div className="rowBetween">
                        <strong>
                          Material {materialIndex + 1}
                        </strong>

                        <button
                          type="button"
                          onClick={() =>
                            removeMaterial(
                              item.id,
                              row.id
                            )
                          }
                          disabled={
                            item.materials.length === 1
                          }
                          className="textButton danger"
                        >
                          Remove
                        </button>
                      </div>

                      <Field label="Material">
                        <select
                          value={row.materialId}
                          onChange={(e) =>
                            updateMaterialRow(
                              item.id,
                              row.id,
                              'materialId',
                              e.target.value
                            )
                          }
                          className="input"
                        >
                          {materials.map((m) => (
                            <option
                              key={m.id}
                              value={m.id}
                            >
                              {m.name} - RM
                              {m.cost_price}/{m.unit}
                            </option>
                          ))}
                        </select>
                      </Field>

                      {showArea && (
                        <div className="formGrid">
                          <Field label="Width (mm)">
                            <input
                              type="number"
                              value={row.width}
                              onChange={(e) =>
                                updateMaterialRow(
                                  item.id,
                                  row.id,
                                  'width',
                                  e.target.value
                                )
                              }
                              className="input"
                            />
                          </Field>

                          <Field label="Height (mm)">
                            <input
                              type="number"
                              value={row.height}
                              onChange={(e) =>
                                updateMaterialRow(
                                  item.id,
                                  row.id,
                                  'height',
                                  e.target.value
                                )
                              }
                              className="input"
                            />
                          </Field>
                        </div>
                      )}

                      {showLength && (
                        <Field label="Length (mm)">
                          <input
                            type="number"
                            value={row.length}
                            onChange={(e) =>
                              updateMaterialRow(
                                item.id,
                                row.id,
                                'length',
                                e.target.value
                              )
                            }
                            className="input"
                          />
                        </Field>
                      )}

                      <Field label="Quantity">
                        <input
                          type="number"
                          value={row.quantity}
                          onChange={(e) =>
                            updateMaterialRow(
                              item.id,
                              row.id,
                              'quantity',
                              e.target.value
                            )
                          }
                          className="input"
                        />
                      </Field>

                      <div className="calcBox">
                        {showArea && (
                          <CalcLine
                            label="Area"
                            value={`${result.areaSqft.toFixed(
                              2
                            )} sqft`}
                          />
                        )}

                        <CalcLine
                          label="Required"
                          value={
                            unit === 'sheet'
                              ? `${result.requiredQty} sheet(s)`
                              : `${result.requiredQty.toFixed(
                                  2
                                )} ${unit}`
                          }
                        />

                        <CalcLine
                          label="Material Cost"
                          value={formatRM(
                            result.materialCost
                          )}
                        />
                      </div>
                    </div>
                  )
                }
              )}

              <button
                type="button"
                onClick={() => addMaterial(item.id)}
                className="outlineButton"
              >
                + Add Material
              </button>

              <div className="itemTotal">
                <span>Item Material Total</span>
                <strong>
                  {formatRM(
                    calculateItemTotal(item)
                  )}
                </strong>
              </div>
            </section>
          ))}

          <button
            type="button"
            onClick={addItem}
            className="primaryButton"
          >
            + Add Item
          </button>

          <section className="section">
            <h2>Other Costs</h2>

            <div className="formGrid">
              <MoneyInput
                label="Labour Cost"
                value={labourCost}
                setValue={setLabourCost}
              />

              <MoneyInput
                label="Transport Cost"
                value={transportCost}
                setValue={setTransportCost}
              />

              <MoneyInput
                label="Installation Cost"
                value={installationCost}
                setValue={setInstallationCost}
              />

              <MoneyInput
                label="Dismantling Cost"
                value={dismantlingCost}
                setValue={setDismantlingCost}
              />
            </div>
          </section>

          <section className="section">
            <h2>Pricing</h2>

            <Field label="Target Gross Margin (%)">
              <input
                type="number"
                value={targetMargin}
                onChange={(e) =>
                  setTargetMargin(e.target.value)
                }
                className="input"
              />
            </Field>
          </section>

          <section className="summaryCard">
            <h2>Costing Summary</h2>

            <SummaryLine
              label="Material Cost"
              value={formatRM(
                totals.materialCost
              )}
            />

            <SummaryLine
              label="Labour"
              value={formatRM(
                Number(labourCost) || 0
              )}
            />

            <SummaryLine
              label="Transport"
              value={formatRM(
                Number(transportCost) || 0
              )}
            />

            <SummaryLine
              label="Installation"
              value={formatRM(
                Number(installationCost) || 0
              )}
            />

            <SummaryLine
              label="Dismantling"
              value={formatRM(
                Number(dismantlingCost) || 0
              )}
            />

            <div className="divider" />

            <SummaryLine
              label="TOTAL COST"
              value={formatRM(
                totals.totalCost
              )}
              bold
            />

            <SummaryLine
              label="Target Margin"
              value={`${Number(
                targetMargin
              ).toFixed(2)}%`}
            />

            <SummaryLine
              label="Suggested Selling Price"
              value={formatRM(
                totals.sellingPrice
              )}
              bold
            />

            <SummaryLine
              label="Gross Profit"
              value={formatRM(
                totals.grossProfit
              )}
            />

            <SummaryLine
              label="Gross Margin"
              value={`${totals.grossMargin.toFixed(
                2
              )}%`}
            />

            <div className="marginBox">
              {marginStatus}
            </div>

            {errorMessage && (
              <div className="errorBox">
                {errorMessage}
              </div>
            )}

            {saveMessage && (
              <div className="successBox">
                {saveMessage}
              </div>
            )}

            <button
              type="button"
              onClick={saveQuotation}
              disabled={saving}
              className="saveButton"
            >
              {saving
                ? 'Saving...'
                : 'Save Costing'}
            </button>
          </section>
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
          active
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
          width: 100%;
          max-width: 100%;
          overflow-x: hidden;
          font-family: Arial, sans-serif;
          background: #f4f6fa;
        }

        body {
          padding-bottom: 88px;
        }

        .page {
          min-height: 100vh;
          padding: 18px 14px 36px;
          max-width: 1000px;
          margin: 0 auto;
          background: #f4f6fa;
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
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          background: white;
          border: 1px solid #e5e7eb;
          text-decoration: none;
          color: #0f766e;
          font-size: 24px;
          font-weight: 700;
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

        .section,
        .itemCard,
        .summaryCard {
          background: white;
          border: 1px solid #e8ecf1;
          border-radius: 20px;
          padding: 18px;
          margin-bottom: 18px;
          box-shadow:
            0 5px 18px
            rgba(15, 23, 42, 0.05);
        }

        .section h2,
        .summaryCard h2 {
          margin: 0 0 16px;
          font-size: 20px;
          color: #111827;
        }

        .itemsHeader {
          margin: 24px 0 14px;
        }

        .itemsHeader h2 {
          margin: 0;
          font-size: 21px;
        }

        .itemsHeader p {
          margin: 5px 0 0;
          color: #6b7280;
          font-size: 13px;
        }

        .itemTitle {
          font-size: 19px;
          font-weight: 800;
        }

        .subHeading {
          margin: 18px 0 10px;
          font-size: 15px;
          font-weight: 700;
        }

        .materialCard {
          border: 1px solid #e5e7eb;
          background: #fafbfc;
          border-radius: 16px;
          padding: 14px;
          margin-bottom: 12px;
        }

        .rowBetween {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          margin-bottom: 10px;
        }

        .formGrid {
          display: grid;
          grid-template-columns:
            repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .field {
          margin-bottom: 10px;
          min-width: 0;
        }

        .label {
          display: block;
          margin-bottom: 6px;
          font-size: 13px;
          font-weight: 600;
          color: #374151;
        }

        .input {
          width: 100%;
          min-width: 0;
          padding: 12px 13px;
          border: 1px solid #d1d5db;
          border-radius: 10px;
          background: white;
          color: #111827;
          font-size: 15px;
          outline: none;
        }

        .input:focus {
          border-color: #0d9488;
        }

        .readonly {
          background: #f3f4f6;
          font-weight: 700;
        }

        .calcBox {
          margin-top: 10px;
          background: white;
          border-radius: 12px;
          padding: 12px;
          border: 1px solid #edf0f3;
        }

        .calcLine,
        .summaryLine {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          padding: 5px 0;
        }

        .calcLine span:first-child,
        .summaryLine span:first-child {
          color: #6b7280;
        }

        .calcLine strong,
        .summaryLine strong {
          color: #111827;
        }

        .outlineButton,
        .primaryButton,
        .saveButton {
          width: 100%;
          border: none;
          border-radius: 12px;
          padding: 13px 16px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
        }

        .outlineButton {
          border: 1px solid #d1d5db;
          background: white;
          color: #111827;
        }

        .primaryButton {
          background: #0f766e;
          color: white;
          margin-bottom: 18px;
        }

        .saveButton {
          margin-top: 16px;
          background: #0f766e;
          color: white;
        }

        .saveButton:disabled {
          opacity: 0.6;
        }

        .textButton {
          border: none;
          background: transparent;
          cursor: pointer;
          font-size: 13px;
          font-weight: 700;
        }

        .danger {
          color: #b91c1c;
        }

        .itemTotal {
          margin-top: 14px;
          display: flex;
          justify-content: space-between;
          gap: 12px;
          font-size: 15px;
        }

        .divider {
          height: 1px;
          background: #e5e7eb;
          margin: 14px 0;
        }

        .summaryLine {
          font-size: 14px;
        }

        .summaryLine.bold {
          font-weight: 800;
          font-size: 15px;
        }

        .marginBox {
          margin-top: 15px;
          padding: 12px;
          border-radius: 12px;
          text-align: center;
          font-weight: 800;
          background: #ecfdf5;
          color: #047857;
        }

        .errorBox {
          margin-top: 14px;
          padding: 12px;
          border-radius: 10px;
          background: #fee2e2;
          color: #991b1b;
          font-size: 13px;
        }

        .successBox {
          margin-top: 14px;
          padding: 12px;
          border-radius: 10px;
          background: #dcfce7;
          color: #166534;
          font-size: 13px;
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
          box-shadow:
            0 -4px 18px
            rgba(15, 23, 42, 0.06);
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
          line-height: 1;
        }

        @media (max-width: 650px) {
          .page {
            padding: 14px 12px 34px;
          }

          .formGrid {
            grid-template-columns: 1fr;
            gap: 4px;
          }

          .section,
          .itemCard,
          .summaryCard {
            padding: 15px;
            border-radius: 17px;
          }

          .topTitle {
            font-size: 22px;
          }
        }
      `}</style>
    </main>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="field">
      <label className="label">
        {label}
      </label>

      {children}
    </div>
  )
}

function MoneyInput({
  label,
  value,
  setValue,
}: {
  label: string
  value: string
  setValue: (value: string) => void
}) {
  return (
    <Field label={`${label} (RM)`}>
      <input
        type="number"
        value={value}
        onChange={(e) =>
          setValue(e.target.value)
        }
        className="input"
      />
    </Field>
  )
}

function CalcLine({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="calcLine">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function SummaryLine({
  label,
  value,
  bold = false,
}: {
  label: string
  value: string
  bold?: boolean
}) {
  return (
    <div
      className={
        bold
          ? 'summaryLine bold'
          : 'summaryLine'
      }
    >
      <span>{label}</span>

      <strong>
        {value}
      </strong>
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