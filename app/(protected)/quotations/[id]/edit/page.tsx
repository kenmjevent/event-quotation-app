'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '../../../../../lib/supabase'
import {
  getCurrentProfile,
  type UserProfile,
} from '../../../../../lib/authRole'

type Material = {
  id: string
  name: string
  category: string | null
  unit: string
  cost_price: number
  wastage_percent: number
  is_active: boolean
}

type MaterialRow = {
  id: string
  materialId: string
  width: string
  height: string
  length: string
  quantity: string
}

type QuoteItem = {
  id: string
  description: string
  materials: MaterialRow[]
}

type Quotation = {
  id: string
  quotation_no: string
  customer_name: string | null
  project_name: string | null
  quotation_date: string | null
  status: string | null
  target_margin: number | null
  labour_cost: number | null
  transport_cost: number | null
  installation_cost: number | null
  dismantling_cost: number | null
}

export default function EditQuotationPage() {
  const params = useParams()
  const router = useRouter()

  const quotationId = String(params.id)

  const [profile, setProfile] =
    useState<UserProfile | null>(null)

  const [quotation, setQuotation] =
    useState<Quotation | null>(null)

  const [materials, setMaterials] =
    useState<Material[]>([])

  const [items, setItems] =
    useState<QuoteItem[]>([])

  const [quotationNo, setQuotationNo] =
    useState('')

  const [quotationDate, setQuotationDate] =
    useState('')

  const [customerName, setCustomerName] =
    useState('')

  const [projectName, setProjectName] =
    useState('')

  const [labourCost, setLabourCost] =
    useState('0')

  const [transportCost, setTransportCost] =
    useState('0')

  const [installationCost, setInstallationCost] =
    useState('0')

  const [dismantlingCost, setDismantlingCost] =
    useState('0')

  const [targetMargin, setTargetMargin] =
    useState('40')

  const [loading, setLoading] =
    useState(true)

  const [saving, setSaving] =
    useState(false)

  const [errorMessage, setErrorMessage] =
    useState('')

  const [successMessage, setSuccessMessage] =
    useState('')

  useEffect(() => {
    loadPage()
  }, [quotationId])

  async function loadPage() {
    setLoading(true)
    setErrorMessage('')

    try {
      const currentProfile =
        await getCurrentProfile()

      if (!currentProfile) {
        router.replace('/login')
        return
      }

      setProfile(currentProfile)

      const [
        quotationResult,
        materialsResult,
        quoteMaterialsResult,
      ] = await Promise.all([
        supabase
          .from('quotations')
          .select(`
            id,
            quotation_no,
            customer_name,
            project_name,
            quotation_date,
            status,
            target_margin,
            labour_cost,
            transport_cost,
            installation_cost,
            dismantling_cost
          `)
          .eq('id', quotationId)
          .single(),

        supabase
          .from('materials')
          .select('*')
          .order('name', {
            ascending: true,
          }),

        supabase
          .from('quotation_materials')
          .select(`
            id,
            quotation_id,
            item_description,
            material_id,
            width_mm,
            height_mm,
            length_mm,
            quantity
          `)
          .eq('quotation_id', quotationId)
          .order('created_at', {
            ascending: true,
          }),
      ])

      if (quotationResult.error) {
        throw quotationResult.error
      }

      if (materialsResult.error) {
        throw materialsResult.error
      }

      if (quoteMaterialsResult.error) {
        throw quoteMaterialsResult.error
      }

      const q =
        quotationResult.data as Quotation

      const status =
        String(
          q.status || 'draft'
        ).toLowerCase()

      const allowed =
        currentProfile.role === 'admin' ||
        (
          currentProfile.role === 'estimator' &&
          (
            status === 'draft' ||
            status === 'rejected'
          )
        )

      if (!allowed) {
        router.replace('/cost-listings')
        return
      }

      setQuotation(q)
      setMaterials(materialsResult.data || [])

      setQuotationNo(q.quotation_no || '')
      setQuotationDate(
        q.quotation_date ||
          new Date()
            .toISOString()
            .split('T')[0]
      )

      setCustomerName(
        q.customer_name || ''
      )

      setProjectName(
        q.project_name || ''
      )

      setLabourCost(
        String(q.labour_cost || 0)
      )

      setTransportCost(
        String(q.transport_cost || 0)
      )

      setInstallationCost(
        String(q.installation_cost || 0)
      )

      setDismantlingCost(
        String(q.dismantling_cost || 0)
      )

      setTargetMargin(
        String(q.target_margin || 40)
      )

      const rows =
        quoteMaterialsResult.data || []

      const grouped = new Map<
        string,
        QuoteItem
      >()

      rows.forEach((row: any) => {
        const description =
          row.item_description ||
          'Item'

        if (!grouped.has(description)) {
          grouped.set(description, {
            id:
              crypto.randomUUID(),
            description,
            materials: [],
          })
        }

        grouped
          .get(description)!
          .materials.push({
            id:
              row.id ||
              crypto.randomUUID(),
            materialId:
              row.material_id ||
              '',
            width:
              String(row.width_mm || 0),
            height:
              String(row.height_mm || 0),
            length:
              String(row.length_mm || 0),
            quantity:
              String(row.quantity || 1),
          })
      })

      let loadedItems =
        Array.from(grouped.values())

      if (
        loadedItems.length === 0
      ) {
        loadedItems = [
          {
            id:
              crypto.randomUUID(),
            description: '',
            materials: [
              {
                id:
                  crypto.randomUUID(),
                materialId:
                  materialsResult.data?.[0]
                    ?.id || '',
                width: '1000',
                height: '1000',
                length: '1000',
                quantity: '1',
              },
            ],
          },
        ]
      }

      setItems(loadedItems)
    } catch (error: any) {
      console.error(
        'Edit page load error:',
        error
      )

      setErrorMessage(
        error?.message ||
          'Unable to load costing.'
      )
    } finally {
      setLoading(false)
    }
  }

  function addItem() {
    setItems((current) => [
      ...current,
      {
        id:
          crypto.randomUUID(),
        description: '',
        materials: [
          {
            id:
              crypto.randomUUID(),
            materialId:
              materials[0]?.id || '',
            width: '1000',
            height: '1000',
            length: '1000',
            quantity: '1',
          },
        ],
      },
    ])
  }

  function removeItem(
    itemId: string
  ) {
    if (items.length === 1) {
      return
    }

    setItems((current) =>
      current.filter(
        (item) =>
          item.id !== itemId
      )
    )
  }

  function updateItemDescription(
    itemId: string,
    value: string
  ) {
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

  function addMaterial(
    itemId: string
  ) {
    setItems((current) =>
      current.map((item) =>
        item.id === itemId
          ? {
              ...item,
              materials: [
                ...item.materials,
                {
                  id:
                    crypto.randomUUID(),
                  materialId:
                    materials[0]
                      ?.id || '',
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

  function removeMaterial(
    itemId: string,
    rowId: string
  ) {
    setItems((current) =>
      current.map((item) => {
        if (
          item.id !== itemId
        ) {
          return item
        }

        if (
          item.materials.length === 1
        ) {
          return item
        }

        return {
          ...item,
          materials:
            item.materials.filter(
              (row) =>
                row.id !== rowId
            ),
        }
      })
    )
  }

  function updateMaterialRow(
    itemId: string,
    rowId: string,
    field: keyof MaterialRow,
    value: string
  ) {
    setItems((current) =>
      current.map((item) => {
        if (
          item.id !== itemId
        ) {
          return item
        }

        return {
          ...item,
          materials:
            item.materials.map(
              (row) =>
                row.id === rowId
                  ? {
                      ...row,
                      [field]:
                        value,
                    }
                  : row
            ),
        }
      })
    )
  }

  function calculateMaterialRow(
    row: MaterialRow
  ) {
    const material =
      materials.find(
        (m) =>
          m.id ===
          row.materialId
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

    const unit =
      String(
        material.unit || ''
      )
        .trim()
        .toLowerCase()

    const quantity =
      Number(row.quantity) || 0

    const costPrice =
      Number(
        material.cost_price
      ) || 0

    const wastageMultiplier =
      1 +
      (
        Number(
          material.wastage_percent
        ) || 0
      ) /
        100

    let areaSqft = 0
    let requiredQty = 0
    let materialCost = 0

    if (
      unit === 'sheet' ||
      unit === 'sqft'
    ) {
      const widthFt =
        (Number(row.width) ||
          0) /
        304.8

      const heightFt =
        (Number(row.height) ||
          0) /
        304.8

      areaSqft =
        widthFt *
        heightFt *
        quantity

      if (
        unit === 'sheet'
      ) {
        const areaWithWastage =
          areaSqft *
          wastageMultiplier

        requiredQty =
          Math.ceil(
            areaWithWastage /
              32
          )

        materialCost =
          requiredQty *
          costPrice
      }

      if (
        unit === 'sqft'
      ) {
        requiredQty =
          areaSqft *
          wastageMultiplier

        materialCost =
          requiredQty *
          costPrice
      }
    } else if (
      unit === 'ft'
    ) {
      const lengthFt =
        (Number(row.length) ||
          0) /
        304.8

      requiredQty =
        lengthFt *
        quantity *
        wastageMultiplier

      materialCost =
        requiredQty *
        costPrice
    } else {
      requiredQty =
        quantity

      materialCost =
        requiredQty *
        costPrice
    }

    return {
      material,
      unit,
      areaSqft,
      requiredQty,
      materialCost,
    }
  }

  function calculateItemTotal(
    item: QuoteItem
  ) {
    return item.materials.reduce(
      (sum, row) =>
        sum +
        calculateMaterialRow(
          row
        ).materialCost,
      0
    )
  }

  const totals = useMemo(() => {
    const materialCost =
      items.reduce(
        (sum, item) =>
          sum +
          calculateItemTotal(
            item
          ),
        0
      )

    const labour =
      Number(labourCost) ||
      0

    const transport =
      Number(transportCost) ||
      0

    const installation =
      Number(
        installationCost
      ) || 0

    const dismantling =
      Number(
        dismantlingCost
      ) || 0

    const totalCost =
      materialCost +
      labour +
      transport +
      installation +
      dismantling

    const margin =
      Number(targetMargin) ||
      0

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
            ) *
            100
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

  async function saveChanges() {
    if (!quotation) {
      return
    }

    if (!customerName.trim()) {
      setErrorMessage(
        'Please enter Customer Name.'
      )
      return
    }

    if (!projectName.trim()) {
      setErrorMessage(
        'Please enter Project Name.'
      )
      return
    }

    setSaving(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const {
        error:
          quotationError,
      } = await supabase
        .from('quotations')
        .update({
          customer_name:
            customerName.trim(),

          project_name:
            projectName.trim(),

          quotation_date:
            quotationDate,

          target_margin:
            Number(
              targetMargin
            ) || 0,

          material_cost:
            totals.materialCost,

          labour_cost:
            Number(
              labourCost
            ) || 0,

          transport_cost:
            Number(
              transportCost
            ) || 0,

          installation_cost:
            Number(
              installationCost
            ) || 0,

          dismantling_cost:
            Number(
              dismantlingCost
            ) || 0,

          logistics_cost:
            (
              Number(
                transportCost
              ) || 0
            ) +
            (
              Number(
                installationCost
              ) || 0
            ) +
            (
              Number(
                dismantlingCost
              ) || 0
            ),

          total_cost:
            totals.totalCost,

          selling_price:
            totals.sellingPrice,

          gross_profit:
            totals.grossProfit,

          gross_margin:
            totals.grossMargin,

          updated_at:
            new Date()
              .toISOString(),
        })
        .eq(
          'id',
          quotationId
        )

      if (
        quotationError
      ) {
        throw quotationError
      }

      const {
        error:
          deleteMaterialError,
      } = await supabase
        .from(
          'quotation_materials'
        )
        .delete()
        .eq(
          'quotation_id',
          quotationId
        )

      if (
        deleteMaterialError
      ) {
        throw deleteMaterialError
      }

      const materialRows =
        items.flatMap(
          (item) =>
            item.materials.map(
              (row) => {
                const result =
                  calculateMaterialRow(
                    row
                  )

                return {
                  quotation_id:
                    quotationId,

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
                    result.materialCost,
                }
              }
            )
        )

      if (
        materialRows.length >
        0
      ) {
        const {
          error:
            materialInsertError,
        } = await supabase
          .from(
            'quotation_materials'
          )
          .insert(
            materialRows
          )

        if (
          materialInsertError
        ) {
          throw materialInsertError
        }
      }

      const {
        error: logError,
      } = await supabase
        .from(
          'quotation_logs'
        )
        .insert({
          quotation_id:
            quotationId,

          quotation_no:
            quotationNo,

          action: 'EDIT',

          details:
            `Edited costing - ${customerName.trim()} ${projectName.trim()}`,

          performed_by:
            profile?.full_name ||
            profile?.email ||
            'User',
        })

      if (logError) {
        console.error(
          'Edit log error:',
          logError
        )
      }

      setSuccessMessage(
        `${quotationNo} updated successfully.`
      )

      await loadPage()
    } catch (error: any) {
      console.error(
        'Save edit error:',
        error
      )

      setErrorMessage(
        error?.message ||
          'Unable to save changes.'
      )
    } finally {
      setSaving(false)
    }
  }

  function formatRM(
    value: number
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

  if (loading) {
    return (
      <main className="loadingPage">
        Loading costing...
      </main>
    )
  }

  return (
    <main className="page">
      <header className="topBar">
        <Link
          href="/cost-listings"
          className="backButton"
        >
          ←
        </Link>

        <div>
          <div className="topTitle">
            Edit Costing
          </div>

          <div className="topSubtitle">
            {quotationNo}
          </div>
        </div>
      </header>

      {errorMessage && (
        <div className="errorBox">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="successBox">
          {successMessage}
        </div>
      )}

      <section className="section">
        <h2>
          Costing Information
        </h2>

        <div className="formGrid">
          <Field label="Costing No.">
            <input
              value={quotationNo}
              readOnly
              className="input readonly"
            />
          </Field>

          <Field label="Status">
            <input
              value={
                quotation?.status ||
                'draft'
              }
              readOnly
              className="input readonly"
            />
          </Field>

          <Field label="Date">
            <input
              type="date"
              value={quotationDate}
              onChange={(e) =>
                setQuotationDate(
                  e.target.value
                )
              }
              className="input"
            />
          </Field>

          <Field label="Customer Name">
            <input
              value={customerName}
              onChange={(e) =>
                setCustomerName(
                  e.target.value
                )
              }
              className="input"
            />
          </Field>

          <Field label="Project Name">
            <input
              value={projectName}
              onChange={(e) =>
                setProjectName(
                  e.target.value
                )
              }
              className="input"
            />
          </Field>
        </div>
      </section>

      <div className="itemsHeader">
        <div>
          <h2>
            Costing Items
          </h2>

          <p>
            Edit items and materials
          </p>
        </div>
      </div>

      {items.map(
        (
          item,
          itemIndex
        ) => (
          <section
            key={item.id}
            className="itemCard"
          >
            <div className="rowBetween">
              <div className="itemTitle">
                Item{' '}
                {itemIndex + 1}
              </div>

              <button
                type="button"
                onClick={() =>
                  removeItem(
                    item.id
                  )
                }
                disabled={
                  items.length ===
                  1
                }
                className="textButton danger"
              >
                Remove Item
              </button>
            </div>

            <Field label="Description">
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
                className="input"
              />
            </Field>

            <div className="subHeading">
              Materials
            </div>

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

                const showArea =
                  unit ===
                    'sheet' ||
                  unit ===
                    'sqft'

                const showLength =
                  unit === 'ft'

                return (
                  <div
                    key={
                      row.id
                    }
                    className="materialCard"
                  >
                    <div className="rowBetween">
                      <strong>
                        Material{' '}
                        {materialIndex +
                          1}
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
                          item
                            .materials
                            .length ===
                          1
                        }
                        className="textButton danger"
                      >
                        Remove
                      </button>
                    </div>

                    <Field label="Material">
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
                        className="input"
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
                              }{' '}
                              - RM
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
                    </Field>

                    {showArea && (
                      <div className="formGrid">
                        <Field label="Width (mm)">
                          <input
                            type="number"
                            value={
                              row.width
                            }
                            onChange={(
                              e
                            ) =>
                              updateMaterialRow(
                                item.id,
                                row.id,
                                'width',
                                e
                                  .target
                                  .value
                              )
                            }
                            className="input"
                          />
                        </Field>

                        <Field label="Height (mm)">
                          <input
                            type="number"
                            value={
                              row.height
                            }
                            onChange={(
                              e
                            ) =>
                              updateMaterialRow(
                                item.id,
                                row.id,
                                'height',
                                e
                                  .target
                                  .value
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
                          value={
                            row.length
                          }
                          onChange={(
                            e
                          ) =>
                            updateMaterialRow(
                              item.id,
                              row.id,
                              'length',
                              e
                                .target
                                .value
                            )
                          }
                          className="input"
                        />
                      </Field>
                    )}

                    <Field label="Quantity">
                      <input
                        type="number"
                        value={
                          row.quantity
                        }
                        onChange={(
                          e
                        ) =>
                          updateMaterialRow(
                            item.id,
                            row.id,
                            'quantity',
                            e.target
                              .value
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
                          unit ===
                          'sheet'
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
              onClick={() =>
                addMaterial(
                  item.id
                )
              }
              className="outlineButton"
            >
              + Add Material
            </button>

            <div className="itemTotal">
              <span>
                Item Material Total
              </span>

              <strong>
                {formatRM(
                  calculateItemTotal(
                    item
                  )
                )}
              </strong>
            </div>
          </section>
        )
      )}

      <button
        type="button"
        onClick={addItem}
        className="primaryButton"
      >
        + Add Item
      </button>

      <section className="section">
        <h2>
          Other Costs
        </h2>

        <div className="formGrid">
          <MoneyInput
            label="Labour Cost"
            value={labourCost}
            setValue={
              setLabourCost
            }
          />

          <MoneyInput
            label="Transport Cost"
            value={
              transportCost
            }
            setValue={
              setTransportCost
            }
          />

          <MoneyInput
            label="Installation Cost"
            value={
              installationCost
            }
            setValue={
              setInstallationCost
            }
          />

          <MoneyInput
            label="Dismantling Cost"
            value={
              dismantlingCost
            }
            setValue={
              setDismantlingCost
            }
          />
        </div>
      </section>

      <section className="section">
        <h2>
          Pricing
        </h2>

        <Field label="Target Gross Margin (%)">
          <input
            type="number"
            value={targetMargin}
            onChange={(e) =>
              setTargetMargin(
                e.target.value
              )
            }
            className="input"
          />
        </Field>
      </section>

      <section className="summaryCard">
        <h2>
          Costing Summary
        </h2>

        <SummaryLine
          label="Material Cost"
          value={formatRM(
            totals.materialCost
          )}
        />

        <SummaryLine
          label="TOTAL COST"
          value={formatRM(
            totals.totalCost
          )}
          bold
        />

        <SummaryLine
          label="Selling Price"
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

        <button
          type="button"
          onClick={
            saveChanges
          }
          disabled={
            saving
          }
          className="saveButton"
        >
          {saving
            ? 'Saving...'
            : 'Save Changes'}
        </button>
      </section>

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

        .loadingPage {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f4f6fa;
          font-family: Arial, sans-serif;
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
        }

        .section h2,
        .summaryCard h2 {
          margin: 0 0 16px;
          font-size: 20px;
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
          padding: 12px 13px;
          border: 1px solid #d1d5db;
          border-radius: 10px;
          background: white;
          color: #111827;
          font-size: 15px;
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

        .primaryButton,
        .saveButton {
          background: #0f766e;
          color: white;
          margin-bottom: 18px;
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
        }

        .summaryLine.bold {
          font-weight: 800;
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

        @media (max-width: 650px) {
          .formGrid {
            grid-template-columns: 1fr;
          }

          .page {
            padding: 14px 12px 34px;
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
  setValue: (
    value: string
  ) => void
}) {
  return (
    <Field label={`${label} (RM)`}>
      <input
        type="number"
        value={value}
        onChange={(e) =>
          setValue(
            e.target.value
          )
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
      <strong>
        {value}
      </strong>
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
      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>
    </div>
  )
}