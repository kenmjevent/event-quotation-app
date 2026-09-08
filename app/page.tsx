'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../lib/supabase'

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

export default function Home() {
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  const [quotationNo, setQuotationNo] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [projectName, setProjectName] = useState('')

  const [quotationDate, setQuotationDate] = useState(
    new Date().toISOString().split('T')[0]
  )

  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')

  const [items, setItems] = useState<QuoteItem[]>([
    {
      id: 1,
      description: 'Feature Wall',
      materials: [
        {
          id: 1,
          materialId: '',
          width: '6000',
          height: '3000',
          length: '1000',
          quantity: '1'
        }
      ]
    }
  ])

  const [labourCost, setLabourCost] = useState('2000')
  const [transportCost, setTransportCost] = useState('800')
  const [installationCost, setInstallationCost] = useState('1500')
  const [dismantlingCost, setDismantlingCost] = useState('500')
  const [targetMargin, setTargetMargin] = useState('40')

  useEffect(() => {
    loadMaterials()
    generateQuotationNo()
  }, [])

  async function loadMaterials() {
    const { data, error } = await supabase
      .from('materials')
      .select('*')
      .eq('is_active', true)
      .order('name')

    if (error) {
      setErrorMessage(error.message)
      setLoading(false)
      return
    }

    const materialList = data || []

    setMaterials(materialList)

    if (materialList.length > 0) {
      setItems((currentItems) =>
        currentItems.map((item) => ({
          ...item,
          materials: item.materials.map((row) => ({
            ...row,
            materialId:
              row.materialId || materialList[0].id
          }))
        }))
      )
    }

    setLoading(false)
  }

  async function generateQuotationNo() {
    const now = new Date()

    const year =
      String(now.getFullYear()).slice(-2)

    const month =
      String(now.getMonth() + 1).padStart(2, '0')

    const prefix = `Q${year}${month}`

    const { data, error } = await supabase
      .from('quotations')
      .select('quotation_no')
      .like('quotation_no', `${prefix}%`)
      .order('quotation_no', {
        ascending: false
      })
      .limit(1)

    if (error) {
      console.error('Quotation number error:', error)
      return
    }

    let nextNumber = 1

    if (
      data &&
      data.length > 0 &&
      data[0].quotation_no
    ) {
      const lastQuotationNo =
        data[0].quotation_no

      const lastRunningNo =
        lastQuotationNo.slice(-3)

      nextNumber =
        (Number(lastRunningNo) || 0) + 1
    }

    const runningNo =
      String(nextNumber).padStart(3, '0')

    setQuotationNo(
      `${prefix}${runningNo}`
    )
  }

  function addItem() {
    setItems((currentItems) => [
      ...currentItems,
      {
        id: Date.now(),
        description: '',
        materials: [
          {
            id: Date.now() + 1,
            materialId:
              materials[0]?.id || '',
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

    setItems((currentItems) =>
      currentItems.filter(
        (item) => item.id !== itemId
      )
    )
  }

  function updateItemDescription(
    itemId: number,
    value: string
  ) {
    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === itemId
          ? {
              ...item,
              description: value
            }
          : item
      )
    )
  }

  function addMaterial(itemId: number) {
    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === itemId
          ? {
              ...item,
              materials: [
                ...item.materials,
                {
                  id: Date.now(),
                  materialId:
                    materials[0]?.id || '',
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
    materialRowId: number
  ) {
    setItems((currentItems) =>
      currentItems.map((item) => {
        if (item.id !== itemId) {
          return item
        }

        if (item.materials.length === 1) {
          return item
        }

        return {
          ...item,
          materials: item.materials.filter(
            (row) =>
              row.id !== materialRowId
          )
        }
      })
    )
  }

  function updateMaterialRow(
    itemId: number,
    materialRowId: number,
    field: keyof ItemMaterial,
    value: string
  ) {
    setItems((currentItems) =>
      currentItems.map((item) => {
        if (item.id !== itemId) {
          return item
        }

        return {
          ...item,
          materials: item.materials.map(
            (row) =>
              row.id === materialRowId
                ? {
                    ...row,
                    [field]: value
                  }
                : row
          )
        }
      })
    )
  }

  function calculateMaterialRow(
    row: ItemMaterial
  ) {
    const material =
      materials.find(
        (m) =>
          m.id === row.materialId
      )

    if (!material) {
      return {
        material: null,
        unit: '',
        requiredQty: 0,
        materialCost: 0,
        areaSqft: 0
      }
    }

    const unit =
      material.unit
        ?.toLowerCase()
        .trim() || ''

    const qty =
      Number(row.quantity) || 0

    const costPrice =
      Number(material.cost_price) || 0

    const wastage =
      1 +
      (Number(
        material.wastage_percent
      ) || 0) /
        100

    let requiredQty = 0
    let materialCost = 0
    let areaSqft = 0

    if (
      unit === 'sheet' ||
      unit === 'sqft'
    ) {
      const widthFt =
        (Number(row.width) || 0) /
        304.8

      const heightFt =
        (Number(row.height) || 0) /
        304.8

      areaSqft =
        widthFt *
        heightFt *
        qty

      if (unit === 'sheet') {
        const areaWithWastage =
          areaSqft * wastage

        requiredQty =
          Math.ceil(
            areaWithWastage / 32
          )

        materialCost =
          requiredQty *
          costPrice
      }

      if (unit === 'sqft') {
        requiredQty =
          areaSqft *
          wastage

        materialCost =
          requiredQty *
          costPrice
      }
    } else if (unit === 'ft') {
      const lengthFt =
        (Number(row.length) || 0) /
        304.8

      requiredQty =
        lengthFt *
        qty *
        wastage

      materialCost =
        requiredQty *
        costPrice
    } else {
      requiredQty = qty

      materialCost =
        requiredQty *
        costPrice
    }

    return {
      material,
      unit,
      requiredQty,
      materialCost,
      areaSqft
    }
  }

  function calculateItemTotal(
    item: QuoteItem
  ) {
    return item.materials.reduce(
      (sum, row) =>
        sum +
        calculateMaterialRow(row)
          .materialCost,
      0
    )
  }

  const totals = useMemo(() => {
    const totalMaterialCost =
      items.reduce(
        (sum, item) =>
          sum +
          calculateItemTotal(item),
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
      totalMaterialCost +
      labour +
      transport +
      installation +
      dismantling

    const margin =
      Number(targetMargin) || 0

    let sellingPrice =
      totalCost

    let grossProfit = 0
    let grossMargin = 0

    if (
      margin > 0 &&
      margin < 100
    ) {
      sellingPrice =
        totalCost /
        (1 - margin / 100)

      grossProfit =
        sellingPrice -
        totalCost

      grossMargin =
        sellingPrice > 0
          ? (
              grossProfit /
              sellingPrice
            ) * 100
          : 0
    }

    return {
      totalMaterialCost,
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

  async function saveQuotation() {
    try {
      if (!quotationNo.trim()) {
        setSaveMessage(
          'Quotation No. is missing.'
        )
        return
      }

      if (!customerName.trim()) {
        setSaveMessage(
          'Please enter Customer Name.'
        )
        return
      }

      if (!projectName.trim()) {
        setSaveMessage(
          'Please enter Project Name.'
        )
        return
      }

      setSaving(true)
      setSaveMessage('')

      const {
        data: quotationData,
        error: quotationError
      } = await supabase
        .from('quotations')
        .insert({
          quotation_no:
            quotationNo.trim(),

          customer_name:
            customerName.trim(),

          project_name:
            projectName.trim(),

          quotation_date:
            quotationDate,

          status:
            'draft',

          target_margin:
            Number(targetMargin) || 0,

          material_cost:
            totals.totalMaterialCost,

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
            totals.grossMargin
        })
        .select()
        .single()

      if (quotationError) {
        throw quotationError
      }

      const materialRows =
        items.flatMap((item) =>
          item.materials.map(
            (row) => {
              const result =
                calculateMaterialRow(
                  row
                )

              return {
                quotation_id:
                  quotationData.id,

                item_description:
                  item.description,

                material_id:
                  row.materialId,

                width_mm:
                  Number(
                    row.width
                  ) || 0,

                height_mm:
                  Number(
                    row.height
                  ) || 0,

                length_mm:
                  Number(
                    row.length
                  ) || 0,

                quantity:
                  Number(
                    row.quantity
                  ) || 0,

                required_qty:
                  result.requiredQty,

                material_cost:
                  result.materialCost
              }
            }
          )
        )

      const {
        error: materialsError
      } = await supabase
        .from(
          'quotation_materials'
        )
        .insert(
          materialRows
        )

      if (materialsError) {
        throw materialsError
      }

      const savedNo =
        quotationNo

      const {
        error: logError
      } = await supabase
        .from(
          'quotation_logs'
        )
        .insert({
          quotation_id:
            quotationData.id,

          quotation_no:
            savedNo,

          action:
            'CREATE',

          details:
            `Created quotation for ${customerName.trim()} - ${projectName.trim()}`,

          performed_by:
            'Admin'
        })

      if (logError) {
        console.error(
          'Create log error:',
          logError
        )
      }

      setSaveMessage(
        `Quotation ${savedNo} saved successfully.`
      )

      await generateQuotationNo()

    } catch (error: any) {
      setSaveMessage(
        `Save failed: ${
          error?.message ||
          'Unknown error'
        }`
      )
    } finally {
      setSaving(false)
    }
  }

  let marginStatus =
    'HEALTHY MARGIN'

  if (
    totals.grossMargin < 35
  ) {
    marginStatus =
      'LOW MARGIN'
  } else if (
    totals.grossMargin < 40
  ) {
    marginStatus =
      'CAUTION'
  }

  return (
    <main style={mainStyle}>
      <div
        className="mobile-header"
        style={headerStyle}
      >
        <div>
          <h1 style={pageTitleStyle}>
            Event Quotation Calculator
          </h1>

          <p style={pageSubtitleStyle}>
            Multi-item / Multi-material Costing System
          </p>
        </div>

        <Link
          href="/quotations"
          style={navButtonStyle}
        >
          View Quotations
        </Link>
      </div>

      <div
        style={sectionStyle}
      >
        <h2>
          Quotation Information
        </h2>

        <div
          className="mobile-grid"
          style={gridStyle}
        >
          <div>
            <label>
              Quotation No.
            </label>

            <input
              value={
                quotationNo
              }
              readOnly
              style={{
                ...inputStyle,
                background:
                  '#f5f5f5'
              }}
            />
          </div>

          <div>
            <label>
              Date
            </label>

            <input
              type="date"
              value={
                quotationDate
              }
              onChange={(e) =>
                setQuotationDate(
                  e.target.value
                )
              }
              style={
                inputStyle
              }
            />
          </div>

          <div>
            <label>
              Customer Name
            </label>

            <input
              value={
                customerName
              }
              onChange={(e) =>
                setCustomerName(
                  e.target.value
                )
              }
              placeholder="e.g. Genting Malaysia"
              style={
                inputStyle
              }
            />
          </div>

          <div>
            <label>
              Project Name
            </label>

            <input
              value={
                projectName
              }
              onChange={(e) =>
                setProjectName(
                  e.target.value
                )
              }
              placeholder="e.g. Mid Autumn Decoration"
              style={
                inputStyle
              }
            />
          </div>
        </div>
      </div>

      {loading && (
        <p>
          Loading materials...
        </p>
      )}

      {errorMessage && (
        <p
          style={{
            color: 'red'
          }}
        >
          Error: {errorMessage}
        </p>
      )}

      {!loading &&
        !errorMessage && (
          <>
            <h2>
              Quotation Items
            </h2>

            {items.map(
              (
                item,
                itemIndex
              ) => (
                <div
                  key={
                    item.id
                  }
                  style={
                    itemStyle
                  }
                >
                  <div
                    className="mobile-header"
                    style={
                      topRowStyle
                    }
                  >
                    <h2>
                      Item{' '}
                      {itemIndex +
                        1}
                    </h2>

                    <button
                      onClick={() =>
                        removeItem(
                          item.id
                        )
                      }
                      disabled={
                        items.length ===
                        1
                      }
                      style={secondaryButtonStyle}
                    >
                      Remove Item
                    </button>
                  </div>

                  <label>
                    Description
                  </label>

                  <input
                    value={
                      item.description
                    }
                    onChange={(e) =>
                      updateItemDescription(
                        item.id,
                        e.target.value
                      )
                    }
                    style={
                      inputStyle
                    }
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
                        calculateMaterialRow(
                          row
                        )

                      const unit =
                        result.unit

                      const isArea =
                        unit ===
                          'sheet' ||
                        unit ===
                          'sqft'

                      const isLength =
                        unit ===
                        'ft'

                      return (
                        <div
                          key={
                            row.id
                          }
                          style={
                            materialBoxStyle
                          }
                        >
                          <div
                            className="mobile-header"
                            style={
                              topRowStyle
                            }
                          >
                            <strong>
                              Material{' '}
                              {materialIndex +
                                1}
                            </strong>

                            <button
                              onClick={() =>
                                removeMaterial(
                                  item.id,
                                  row.id
                                )
                              }
                              disabled={
                                item
                                  .materials
                                  .length ===
                                1
                              }
                              style={secondaryButtonStyle}
                            >
                              Remove
                            </button>
                          </div>

                          <label>
                            Material
                          </label>

                          <select
                            value={
                              row.materialId
                            }
                            onChange={(e) =>
                              updateMaterialRow(
                                item.id,
                                row.id,
                                'materialId',
                                e.target
                                  .value
                              )
                            }
                            style={
                              inputStyle
                            }
                          >
                            {materials.map(
                              (m) => (
                                <option
                                  key={
                                    m.id
                                  }
                                  value={
                                    m.id
                                  }
                                >
                                  {
                                    m.name
                                  }
                                  {' - '}
                                  RM
                                  {
                                    m.cost_price
                                  }
                                  /
                                  {
                                    m.unit
                                  }
                                </option>
                              )
                            )}
                          </select>

                          {isArea && (
                            <div
                              className="mobile-grid"
                              style={
                                gridStyle
                              }
                            >
                              <div>
                                <label>
                                  Width
                                  (mm)
                                </label>

                                <input
                                  type="number"
                                  value={
                                    row.width
                                  }
                                  onChange={(e) =>
                                    updateMaterialRow(
                                      item.id,
                                      row.id,
                                      'width',
                                      e
                                        .target
                                        .value
                                    )
                                  }
                                  style={
                                    inputStyle
                                  }
                                />
                              </div>

                              <div>
                                <label>
                                  Height
                                  (mm)
                                </label>

                                <input
                                  type="number"
                                  value={
                                    row.height
                                  }
                                  onChange={(e) =>
                                    updateMaterialRow(
                                      item.id,
                                      row.id,
                                      'height',
                                      e
                                        .target
                                        .value
                                    )
                                  }
                                  style={
                                    inputStyle
                                  }
                                />
                              </div>
                            </div>
                          )}

                          {isLength && (
                            <div>
                              <label>
                                Length
                                (mm)
                              </label>

                              <input
                                type="number"
                                value={
                                  row.length
                                }
                                onChange={(e) =>
                                  updateMaterialRow(
                                    item.id,
                                    row.id,
                                    'length',
                                    e
                                      .target
                                      .value
                                  )
                                }
                                style={
                                  inputStyle
                                }
                              />
                            </div>
                          )}

                          <div>
                            <label>
                              Quantity
                            </label>

                            <input
                              type="number"
                              value={
                                row.quantity
                              }
                              onChange={(e) =>
                                updateMaterialRow(
                                  item.id,
                                  row.id,
                                  'quantity',
                                  e
                                    .target
                                    .value
                                )
                              }
                              style={
                                inputStyle
                              }
                            />
                          </div>

                          <div
                            style={
                              resultBoxStyle
                            }
                          >
                            {isArea && (
                              <div>
                                Area:
                                {' '}
                                <strong>
                                  {result.areaSqft.toFixed(
                                    2
                                  )}
                                  {' '}
                                  sqft
                                </strong>
                              </div>
                            )}

                            <div>
                              Required:
                              {' '}
                              <strong>
                                {unit ===
                                'sheet'
                                  ? `${result.requiredQty} sheets`
                                  : `${result.requiredQty.toFixed(
                                      2
                                    )} ${unit}`}
                              </strong>
                            </div>

                            <div>
                              Cost:
                              {' '}
                              <strong>
                                RM
                                {result.materialCost.toFixed(
                                  2
                                )}
                              </strong>
                            </div>
                          </div>
                        </div>
                      )
                    }
                  )}

                  <button
                    onClick={() =>
                      addMaterial(
                        item.id
                      )
                    }
                    style={
                      buttonStyle
                    }
                  >
                    + Add Material
                  </button>

                  <div
                    style={{
                      marginTop:
                        '20px',
                      fontWeight:
                        'bold',
                      fontSize:
                        '18px'
                    }}
                  >
                    Item Material Total:
                    {' '}
                    RM
                    {calculateItemTotal(
                      item
                    ).toFixed(2)}
                  </div>
                </div>
              )
            )}

            <button
              onClick={
                addItem
              }
              style={
                buttonStyle
              }
            >
              + Add Item
            </button>

            <div
              style={
                sectionStyle
              }
            >
              <h2>
                Other Costs
              </h2>

              <div
                className="mobile-grid"
                style={
                  gridStyle
                }
              >
                <CostInput
                  label="Labour Cost"
                  value={
                    labourCost
                  }
                  setValue={
                    setLabourCost
                  }
                />

                <CostInput
                  label="Transport Cost"
                  value={
                    transportCost
                  }
                  setValue={
                    setTransportCost
                  }
                />

                <CostInput
                  label="Installation Cost"
                  value={
                    installationCost
                  }
                  setValue={
                    setInstallationCost
                  }
                />

                <CostInput
                  label="Dismantling Cost"
                  value={
                    dismantlingCost
                  }
                  setValue={
                    setDismantlingCost
                  }
                />
              </div>
            </div>

            <div
              style={
                sectionStyle
              }
            >
              <h2>
                Pricing
              </h2>

              <div
                style={{
                  maxWidth:
                    '320px'
                }}
              >
                <label>
                  Target Gross
                  Margin (%)
                </label>

                <input
                  type="number"
                  value={
                    targetMargin
                  }
                  onChange={(e) =>
                    setTargetMargin(
                      e.target
                        .value
                    )
                  }
                  style={
                    inputStyle
                  }
                />
              </div>
            </div>

            <div
              style={
                summaryStyle
              }
            >
              <h2>
                Quotation Summary
              </h2>

              <SummaryRow
                label="Total Material Cost"
                value={`RM${totals.totalMaterialCost.toFixed(
                  2
                )}`}
              />

              <SummaryRow
                label="Labour"
                value={`RM${Number(
                  labourCost || 0
                ).toFixed(2)}`}
              />

              <SummaryRow
                label="Transport"
                value={`RM${Number(
                  transportCost || 0
                ).toFixed(2)}`}
              />

              <SummaryRow
                label="Installation"
                value={`RM${Number(
                  installationCost ||
                    0
                ).toFixed(2)}`}
              />

              <SummaryRow
                label="Dismantling"
                value={`RM${Number(
                  dismantlingCost ||
                    0
                ).toFixed(2)}`}
              />

              <hr
                style={{
                  margin:
                    '20px 0'
                }}
              />

              <SummaryRow
                label="TOTAL COST"
                value={`RM${totals.totalCost.toFixed(
                  2
                )}`}
                bold
              />

              <SummaryRow
                label="Target Margin"
                value={`${Number(
                  targetMargin || 0
                ).toFixed(2)}%`}
              />

              <SummaryRow
                label="Suggested Selling Price"
                value={`RM${totals.sellingPrice.toFixed(
                  2
                )}`}
                bold
              />

              <SummaryRow
                label="Gross Profit"
                value={`RM${totals.grossProfit.toFixed(
                  2
                )}`}
              />

              <SummaryRow
                label="Gross Margin"
                value={`${totals.grossMargin.toFixed(
                  2
                )}%`}
              />

              <div
                style={
                  marginBoxStyle
                }
              >
                {marginStatus}
              </div>

              <button
                onClick={
                  saveQuotation
                }
                disabled={
                  saving
                }
                style={{
                  ...buttonStyle,
                  marginTop:
                    '25px',
                  fontSize:
                    '16px',
                  width: '100%'
                }}
              >
                {saving
                  ? 'Saving...'
                  : 'Save Quotation'}
              </button>

              {saveMessage && (
                <p
                  style={{
                    marginTop:
                      '15px',
                    fontWeight:
                      'bold',
                    wordBreak:
                      'break-word'
                  }}
                >
                  {
                    saveMessage
                  }
                </p>
              )}
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
          width: 100%;
          max-width: 100%;
          overflow-x: hidden;
        }

        @media (max-width: 767px) {
          main {
            width: 100% !important;
            max-width: 100% !important;
            padding: 18px 14px 40px !important;
          }

          .mobile-grid {
            grid-template-columns: 1fr !important;
            gap: 10px !important;
          }

          .mobile-header {
            flex-direction: column !important;
            align-items: stretch !important;
          }

          .mobile-header > * {
            width: 100% !important;
          }

          input,
          select,
          button,
          a {
            max-width: 100% !important;
          }

          h1 {
            font-size: 28px !important;
            line-height: 1.2 !important;
          }

          h2 {
            font-size: 22px !important;
          }

          h3 {
            font-size: 18px !important;
          }
        }
      `}</style>
    </main>
  )
}

const mainStyle = {
  padding: '40px 24px',
  maxWidth: '1200px',
  margin: '0 auto',
  fontFamily: 'Arial, sans-serif',
  width: '100%'
}

const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '16px',
  marginBottom: '30px'
}

const pageTitleStyle = {
  margin: 0,
  fontSize: '34px',
  lineHeight: 1.2
}

const pageSubtitleStyle = {
  color: '#666',
  marginTop: '8px',
  marginBottom: 0,
  lineHeight: 1.5
}

const inputStyle = {
  width: '100%',
  minWidth: 0,
  padding: '12px',
  marginTop: '8px',
  marginBottom: '12px',
  border: '1px solid #ccc',
  borderRadius: '8px',
  boxSizing:
    'border-box' as const,
  fontSize: '16px'
}

const gridStyle = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(2, minmax(0, 1fr))',
  gap: '20px',
  width: '100%'
}

const sectionStyle = {
  marginTop: '30px',
  marginBottom: '30px',
  padding: '24px',
  border: '1px solid #ddd',
  borderRadius: '14px',
  width: '100%',
  overflow: 'hidden'
}

const itemStyle = {
  border: '2px solid #222',
  borderRadius: '14px',
  padding: '24px',
  marginBottom: '30px',
  width: '100%',
  overflow: 'hidden'
}

const materialBoxStyle = {
  border: '1px solid #ddd',
  borderRadius: '10px',
  padding: '18px',
  marginBottom: '15px',
  width: '100%',
  overflow: 'hidden'
}

const resultBoxStyle = {
  marginTop: '15px',
  background: '#f5f5f5',
  padding: '12px',
  borderRadius: '8px',
  lineHeight: 1.7
}

const topRowStyle = {
  display: 'flex',
  justifyContent:
    'space-between',
  alignItems: 'center',
  gap: '12px'
}

const buttonStyle = {
  padding: '11px 16px',
  cursor: 'pointer',
  border: '1px solid #aaa',
  borderRadius: '8px',
  background: '#fff'
}

const secondaryButtonStyle = {
  padding: '9px 12px',
  cursor: 'pointer',
  border: '1px solid #ccc',
  borderRadius: '8px',
  background: '#fff'
}

const navButtonStyle = {
  padding: '12px 18px',
  border: '1px solid #222',
  borderRadius: '10px',
  color: '#000',
  textDecoration: 'none',
  background: '#fff',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '46px'
}

const summaryStyle = {
  marginTop: '35px',
  border: '2px solid #222',
  borderRadius: '12px',
  padding: '24px',
  width: '100%',
  overflow: 'hidden'
}

const marginBoxStyle = {
  marginTop: '20px',
  padding: '15px',
  border: '1px solid #aaa',
  borderRadius: '8px',
  textAlign:
    'center' as const,
  fontWeight: 'bold'
}

function CostInput({
  label,
  value,
  setValue
}: {
  label: string
  value: string
  setValue: (
    value: string
  ) => void
}) {
  return (
    <div>
      <label>
        {label} (RM)
      </label>

      <input
        type="number"
        value={value}
        onChange={(e) =>
          setValue(
            e.target.value
          )
        }
        style={inputStyle}
      />
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
        justifyContent:
          'space-between',
        gap: '16px',
        marginBottom:
          '12px',
        fontWeight:
          bold
            ? 'bold'
            : 'normal',
        flexWrap: 'wrap'
      }}
    >
      <span>
        {label}
      </span>

      <span>
        {value}
      </span>
    </div>
  )
}