'use client'

import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import Link from 'next/link'

import {
  useParams,
  useRouter,
} from 'next/navigation'

import {
  supabase,
} from '../../../../../lib/supabase'

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
  dbId?: string
  materialId: string
  width: string
  height: string
  length: string
  quantity: string
}

type CostingItem = {
  id: string
  description: string
  materials: MaterialRow[]
}

type MaterialRelation = {
  name: string | null
  unit: string | null
}

type ExistingQuotationMaterial = {
  id: string
  item_description: string | null
  material_id: string | null
  width_mm: number | null
  height_mm: number | null
  length_mm: number | null
  quantity: number | null
  required_qty: number | null
  material_cost: number | null
  materials: MaterialRelation[] | null
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
  const params =
    useParams()

  const router =
    useRouter()

  const rawId =
    params.id

  const quotationId =
    Array.isArray(rawId)
      ? rawId[0]
      : rawId

  const [
    profile,
    setProfile,
  ] =
    useState<UserProfile | null>(
      null
    )

  const [
    quotation,
    setQuotation,
  ] =
    useState<Quotation | null>(
      null
    )

  const [
    materials,
    setMaterials,
  ] =
    useState<Material[]>([])

  const [
    items,
    setItems,
  ] =
    useState<CostingItem[]>([])

  const [
    customerName,
    setCustomerName,
  ] =
    useState('')

  const [
    projectName,
    setProjectName,
  ] =
    useState('')

  const [
    quotationDate,
    setQuotationDate,
  ] =
    useState('')

  const [
    labourCost,
    setLabourCost,
  ] =
    useState('0')

  const [
    transportCost,
    setTransportCost,
  ] =
    useState('0')

  const [
    installationCost,
    setInstallationCost,
  ] =
    useState('0')

  const [
    dismantlingCost,
    setDismantlingCost,
  ] =
    useState('0')

  const [
    targetMargin,
    setTargetMargin,
  ] =
    useState('40')

  const [
    loading,
    setLoading,
  ] =
    useState(true)

  const [
    saving,
    setSaving,
  ] =
    useState(false)

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState('')

  useEffect(() => {
    if (!quotationId) {
      return
    }

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

      setProfile(
        currentProfile
      )

      const [
        quotationResult,
        materialListResult,
        existingMaterialsResult,
      ] =
        await Promise.all([
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
            .eq(
              'id',
              quotationId
            )
            .single(),

          supabase
            .from('materials')
            .select(`
              id,
              name,
              category,
              unit,
              cost_price,
              wastage_percent,
              is_active
            `)
            .order(
              'name',
              {
                ascending: true,
              }
            ),

          supabase
            .from(
              'quotation_materials'
            )
            .select(`
              id,
              item_description,
              material_id,
              width_mm,
              height_mm,
              length_mm,
              quantity,
              required_qty,
              material_cost,
              materials (
                name,
                unit
              )
            `)
            .eq(
              'quotation_id',
              quotationId
            )
            .order(
              'id',
              {
                ascending: true,
              }
            ),
        ])

      if (
        quotationResult.error
      ) {
        throw quotationResult.error
      }

      if (
        materialListResult.error
      ) {
        throw materialListResult.error
      }

      if (
        existingMaterialsResult.error
      ) {
        throw existingMaterialsResult.error
      }

      const loadedQuotation =
        quotationResult.data

      const status =
        String(
          loadedQuotation.status ||
            'draft'
        ).toLowerCase()

      if (
        currentProfile.role ===
          'estimator' &&
        status !== 'draft' &&
        status !== 'rejected'
      ) {
        router.replace(
          '/cost-listings'
        )

        return
      }

      setQuotation(
        loadedQuotation
      )

      setCustomerName(
        loadedQuotation.customer_name ||
          ''
      )

      setProjectName(
        loadedQuotation.project_name ||
          ''
      )

      setQuotationDate(
        loadedQuotation.quotation_date ||
          ''
      )

      setLabourCost(
        String(
          loadedQuotation.labour_cost ||
            0
        )
      )

      setTransportCost(
        String(
          loadedQuotation.transport_cost ||
            0
        )
      )

      setInstallationCost(
        String(
          loadedQuotation.installation_cost ||
            0
        )
      )

      setDismantlingCost(
        String(
          loadedQuotation.dismantling_cost ||
            0
        )
      )

      setTargetMargin(
        String(
          loadedQuotation.target_margin ||
            0
        )
      )

      const loadedMaterials =
        materialListResult.data ||
        []

      setMaterials(
        loadedMaterials
      )

      const existingRows =
        (
          existingMaterialsResult.data ||
          []
        ) as ExistingQuotationMaterial[]

      const grouped =
        new Map<
          string,
          ExistingQuotationMaterial[]
        >()

      existingRows.forEach(
        (row) => {
          const description =
            row.item_description
              ?.trim() ||
            'Costing Item'

          const current =
            grouped.get(
              description
            ) || []

          current.push(
            row
          )

          grouped.set(
            description,
            current
          )
        }
      )

      const mappedItems =
        Array.from(
          grouped.entries()
        ).map(
          ([
            description,
            rows,
          ]) => ({
            id:
              crypto.randomUUID(),

            description,

            materials:
              rows.map(
                (row) => ({
                  id:
                    crypto.randomUUID(),

                  dbId:
                    row.id,

                  materialId:
                    row.material_id ||
                    '',

                  width:
                    String(
                      row.width_mm ||
                        0
                    ),

                  height:
                    String(
                      row.height_mm ||
                        0
                    ),

                  length:
                    String(
                      row.length_mm ||
                        0
                    ),

                  quantity:
                    String(
                      row.quantity ||
                        0
                    ),
                })
              ),
          })
        )

      if (
        mappedItems.length ===
        0
      ) {
        setItems([
          {
            id:
              crypto.randomUUID(),

            description: '',

            materials: [
              {
                id:
                  crypto.randomUUID(),

                materialId:
                  loadedMaterials[0]
                    ?.id ||
                  '',

                width:
                  '1000',

                height:
                  '1000',

                length:
                  '1000',

                quantity:
                  '1',
              },
            ],
          },
        ])
      } else {
        setItems(
          mappedItems
        )
      }
    } catch (
      error: any
    ) {
      console.error(
        'Edit costing load error:',
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
    setItems(
      (current) => [
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
                materials[0]?.id ||
                '',

              width:
                '1000',

              height:
                '1000',

              length:
                '1000',

              quantity:
                '1',
            },
          ],
        },
      ]
    )
  }

  function removeItem(
    itemId: string
  ) {
    if (
      items.length <= 1
    ) {
      return
    }

    setItems(
      (current) =>
        current.filter(
          (item) =>
            item.id !==
            itemId
        )
    )
  }

  function updateItemDescription(
    itemId: string,
    value: string
  ) {
    setItems(
      (current) =>
        current.map(
          (item) =>
            item.id ===
            itemId
              ? {
                  ...item,
                  description:
                    value,
                }
              : item
        )
    )
  }

  function addMaterial(
    itemId: string
  ) {
    setItems(
      (current) =>
        current.map(
          (item) =>
            item.id ===
            itemId
              ? {
                  ...item,

                  materials: [
                    ...item.materials,

                    {
                      id:
                        crypto.randomUUID(),

                      materialId:
                        materials[0]
                          ?.id ||
                        '',

                      width:
                        '1000',

                      height:
                        '1000',

                      length:
                        '1000',

                      quantity:
                        '1',
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
    setItems(
      (current) =>
        current.map(
          (item) => {
            if (
              item.id !==
              itemId
            ) {
              return item
            }

            if (
              item.materials
                .length <= 1
            ) {
              return item
            }

            return {
              ...item,

              materials:
                item.materials.filter(
                  (row) =>
                    row.id !==
                    rowId
                ),
            }
          }
        )
    )
  }

  function updateMaterialRow(
    itemId: string,
    rowId: string,
    field:
      keyof MaterialRow,
    value: string
  ) {
    setItems(
      (current) =>
        current.map(
          (item) => {
            if (
              item.id !==
              itemId
            ) {
              return item
            }

            return {
              ...item,

              materials:
                item.materials.map(
                  (row) =>
                    row.id ===
                    rowId
                      ? {
                          ...row,
                          [field]:
                            value,
                        }
                      : row
                ),
            }
          }
        )
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
        material.unit ||
          ''
      )
        .trim()
        .toLowerCase()

    const quantity =
      Number(
        row.quantity
      ) || 0

    const costPrice =
      Number(
        material.cost_price
      ) || 0

    const wastage =
      Number(
        material.wastage_percent
      ) || 0

    const wastageMultiplier =
      1 +
      wastage / 100

    let areaSqft = 0
    let requiredQty = 0
    let materialCost = 0

    if (
      unit === 'sheet' ||
      unit === 'sqft'
    ) {
      const widthMm =
        Number(
          row.width
        ) || 0

      const heightMm =
        Number(
          row.height
        ) || 0

      const widthFt =
        widthMm /
        304.8

      const heightFt =
        heightMm /
        304.8

      areaSqft =
        widthFt *
        heightFt *
        quantity

      if (
        unit === 'sheet'
      ) {
        requiredQty =
          Math.ceil(
            (
              areaSqft *
              wastageMultiplier
            ) /
              32
          )

        materialCost =
          requiredQty *
          costPrice
      } else {
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
      const lengthMm =
        Number(
          row.length
        ) || 0

      const lengthFt =
        lengthMm /
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
    item: CostingItem
  ) {
    return item.materials.reduce(
      (
        total,
        row
      ) =>
        total +
        calculateMaterialRow(
          row
        ).materialCost,
      0
    )
  }

  const totals =
    useMemo(() => {
      const materialCost =
        items.reduce(
          (
            total,
            item
          ) =>
            total +
            calculateItemTotal(
              item
            ),
          0
        )

      const labour =
        Number(
          labourCost
        ) || 0

      const transport =
        Number(
          transportCost
        ) || 0

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
        Number(
          targetMargin
        ) || 0

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
          (
            1 -
            margin / 100
          )

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
        labour,
        transport,
        installation,
        dismantling,
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
    if (
      !quotation ||
      !profile
    ) {
      return
    }

    if (
      !customerName.trim()
    ) {
      setErrorMessage(
        'Please enter Customer Name.'
      )
      return
    }

    if (
      !projectName.trim()
    ) {
      setErrorMessage(
        'Please enter Project Name.'
      )
      return
    }

    const emptyItem =
      items.some(
        (item) =>
          !item.description.trim()
      )

    if (emptyItem) {
      setErrorMessage(
        'Please enter description for every costing item.'
      )
      return
    }

    const invalidMaterial =
      items.some(
        (item) =>
          item.materials.some(
            (row) =>
              !row.materialId
          )
      )

    if (invalidMaterial) {
      setErrorMessage(
        'Please select material for every row.'
      )
      return
    }

    const confirmed =
      window.confirm(
        `Save changes to ${quotation.quotation_no}?`
      )

    if (!confirmed) {
      return
    }

    setSaving(true)
    setErrorMessage('')

    try {
      const {
        error:
          quotationError,
      } =
        await supabase
          .from(
            'quotations'
          )
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
              totals.labour,

            transport_cost:
              totals.transport,

            installation_cost:
              totals.installation,

            dismantling_cost:
              totals.dismantling,

            logistics_cost:
              totals.transport +
              totals.installation +
              totals.dismantling,

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
            quotation.id
          )

      if (
        quotationError
      ) {
        throw quotationError
      }

      const {
        error:
          deleteError,
      } =
        await supabase
          .from(
            'quotation_materials'
          )
          .delete()
          .eq(
            'quotation_id',
            quotation.id
          )

      if (deleteError) {
        throw deleteError
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
                    quotation.id,

                  item_description:
                    item.description
                      .trim(),

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
            insertError,
        } =
          await supabase
            .from(
              'quotation_materials'
            )
            .insert(
              materialRows
            )

        if (
          insertError
        ) {
          throw insertError
        }
      }

      const {
        error:
          logError,
      } =
        await supabase
          .from(
            'quotation_logs'
          )
          .insert({
            quotation_id:
              quotation.id,

            quotation_no:
              quotation.quotation_no,

            action:
              'EDIT',

            details:
              `Edited costing - ${customerName.trim()} ${projectName.trim()}`,

            performed_by:
              profile.full_name ||
              profile.email ||
              'User',
          })

      if (logError) {
        console.error(
          'Edit log error:',
          logError
        )
      }

      router.push(
        `/quotations/${quotation.id}`
      )

      router.refresh()
    } catch (
      error: any
    ) {
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
        minimumFractionDigits:
          2,
        maximumFractionDigits:
          2,
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

  if (!quotation) {
    return (
      <main className="loadingPage">
        Costing not found.
      </main>
    )
  }

  return (
    <main className="page">
      <header className="topBar">
        <Link
          href={`/quotations/${quotation.id}`}
          className="backButton"
        >
          ←
        </Link>

        <div className="titleArea">
          <div className="topTitle">
            Edit Costing
          </div>

          <div className="topSubtitle">
            {quotation.quotation_no}
          </div>
        </div>

        <StatusBadge
          status={
            quotation.status ||
            'draft'
          }
        />
      </header>

      {errorMessage && (
        <div className="errorBox">
          {errorMessage}
        </div>
      )}

      <section className="section">
        <h2>
          Project Information
        </h2>

        <div className="formGrid">
          <Field label="Costing No.">
            <input
              value={
                quotation.quotation_no
              }
              readOnly
              className="input readonly"
            />
          </Field>

          <Field label="Date">
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
              className="input"
            />
          </Field>

          <Field label="Customer Name">
            <input
              value={
                customerName
              }
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
              value={
                projectName
              }
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

      <div className="sectionTitle">
        <h2>
          Costing Items
        </h2>

        <p>
          Edit materials and dimensions
        </p>
      </div>

      {items.map(
        (
          item,
          itemIndex
        ) => (
          <section
            key={
              item.id
            }
            className="itemCard"
          >
            <div className="itemHeader">
              <div className="itemNumber">
                Item{' '}
                {itemIndex +
                  1}
              </div>

              <button
                type="button"
                disabled={
                  items.length ===
                  1
                }
                onClick={() =>
                  removeItem(
                    item.id
                  )
                }
                className="removeButton"
              >
                Remove Item
              </button>
            </div>

            <Field label="Item Description">
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

            <div className="materialsTitle">
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

                const showWidthHeight =
                  unit ===
                    'sheet' ||
                  unit ===
                    'sqft'

                const showLength =
                  unit ===
                  'ft'

                return (
                  <div
                    key={
                      row.id
                    }
                    className="materialCard"
                  >
                    <div className="materialHeader">
                      <strong>
                        Material{' '}
                        {materialIndex +
                          1}
                      </strong>

                      <button
                        type="button"
                        disabled={
                          item.materials
                            .length ===
                          1
                        }
                        onClick={() =>
                          removeMaterial(
                            item.id,
                            row.id
                          )
                        }
                        className="smallRemoveButton"
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
                            e.target.value
                          )
                        }
                        className="input"
                      >
                        <option value="">
                          Select Material
                        </option>

                        {materials.map(
                          (material) => (
                            <option
                              key={
                                material.id
                              }
                              value={
                                material.id
                              }
                            >
                              {
                                material.name
                              }
                              {' — '}
                              RM
                              {Number(
                                material.cost_price
                              ).toFixed(
                                2
                              )}
                              /
                              {
                                material.unit
                              }
                            </option>
                          )
                        )}
                      </select>
                    </Field>

                    {showWidthHeight && (
                      <div className="formGrid">
                        <Field label="Width (mm)">
                          <input
                            type="number"
                            min="0"
                            value={
                              row.width
                            }
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
                            min="0"
                            value={
                              row.height
                            }
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
                          min="0"
                          value={
                            row.length
                          }
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
                        min="0"
                        step="0.01"
                        value={
                          row.quantity
                        }
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

                    <div className="calculationBox">
                      {showWidthHeight && (
                        <CalcLine
                          label="Area"
                          value={`${result.areaSqft.toFixed(
                            2
                          )} sqft`}
                        />
                      )}

                      <CalcLine
                        label="Wastage"
                        value={`${Number(
                          result.material
                            ?.wastage_percent ||
                            0
                        ).toFixed(
                          1
                        )}%`}
                      />

                      <CalcLine
                        label="Required"
                        value={
                          unit ===
                          'sheet'
                            ? `${result.requiredQty.toFixed(
                                0
                              )} sheet(s)`
                            : `${result.requiredQty.toFixed(
                                2
                              )} ${
                                unit ||
                                'unit'
                              }`
                        }
                      />

                      <CalcLine
                        label="Cost"
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
                Item Material Cost
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
        className="addItemButton"
      >
        + Add Item
      </button>

      <section className="section">
        <h2>
          Other Costs
        </h2>

        <div className="formGrid">
          <MoneyField
            label="Labour"
            value={
              labourCost
            }
            setValue={
              setLabourCost
            }
          />

          <MoneyField
            label="Transport"
            value={
              transportCost
            }
            setValue={
              setTransportCost
            }
          />

          <MoneyField
            label="Installation"
            value={
              installationCost
            }
            setValue={
              setInstallationCost
            }
          />

          <MoneyField
            label="Dismantling"
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
          Selling Price
        </h2>

        <Field label="Target Gross Margin (%)">
          <input
            type="number"
            min="0"
            max="99"
            value={
              targetMargin
            }
            onChange={(e) =>
              setTargetMargin(
                e.target.value
              )
            }
            className="input"
          />
        </Field>
      </section>

      <section className="summarySection">
        <h2>
          Updated Summary
        </h2>

        <SummaryLine
          label="Material Cost"
          value={formatRM(
            totals.materialCost
          )}
        />

        <SummaryLine
          label="Labour"
          value={formatRM(
            totals.labour
          )}
        />

        <SummaryLine
          label="Transport"
          value={formatRM(
            totals.transport
          )}
        />

        <SummaryLine
          label="Installation"
          value={formatRM(
            totals.installation
          )}
        />

        <SummaryLine
          label="Dismantling"
          value={formatRM(
            totals.dismantling
          )}
        />

        <div className="summaryDivider" />

        <SummaryLine
          label="TOTAL COST"
          value={formatRM(
            totals.totalCost
          )}
        />

        <SummaryLine
          label="SELLING PRICE"
          value={formatRM(
            totals.sellingPrice
          )}
          highlight
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
      </section>

      <div className="bottomActions">
        <Link
          href={`/quotations/${quotation.id}`}
          className="cancelEditButton"
        >
          Cancel
        </Link>

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
      </div>

      <style jsx global>{`
        * {
          box-sizing: border-box;
        }

        html,
        body {
          margin: 0;
          padding: 0;
          background: var(--mj-background);
          color: var(--mj-text);
          font-family: Arial, Helvetica, sans-serif;
        }

        .page {
          min-height: 100vh;
          max-width: 1000px;
          margin: 0 auto;
          padding: 18px 14px 50px;
        }

        .loadingPage {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--mj-background);
          color: var(--mj-primary);
          font-weight: 700;
        }

        .topBar {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 18px;
        }

        .titleArea {
          flex: 1;
        }

        .backButton {
          width: 42px;
          height: 42px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          background: white;
          border: 1px solid var(--mj-border);
          color: var(--mj-primary);
          text-decoration: none;
          font-size: 24px;
          font-weight: 800;
        }

        .topTitle {
          font-size: 24px;
          font-weight: 800;
        }

        .topSubtitle {
          margin-top: 3px;
          color: var(--mj-primary-deep);
          font-size: 12px;
          font-weight: 700;
        }

        .section,
        .itemCard,
        .summarySection {
          background: white;
          border: 1px solid var(--mj-border);
          border-radius: 18px;
          padding: 17px;
          margin-bottom: 16px;
          box-shadow:
            0 8px 24px
            rgba(7, 89, 133, 0.045);
        }

        .section h2,
        .summarySection h2 {
          margin: 0 0 16px;
          font-size: 19px;
        }

        .sectionTitle {
          margin: 22px 0 12px;
        }

        .sectionTitle h2 {
          margin: 0;
          font-size: 20px;
        }

        .sectionTitle p {
          margin: 4px 0 0;
          color: var(--mj-muted);
          font-size: 12px;
        }

        .formGrid {
          display: grid;
          grid-template-columns:
            repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .field {
          margin-bottom: 12px;
        }

        .label {
          display: block;
          margin-bottom: 6px;
          color: #334155;
          font-size: 12px;
          font-weight: 700;
        }

        .input {
          width: 100%;
          padding: 12px 13px;
          border: 1px solid var(--mj-border);
          border-radius: 10px;
          background: white;
          color: var(--mj-text);
          font-size: 14px;
          outline: none;
        }

        .input:focus {
          border-color: var(--mj-primary);
          box-shadow:
            0 0 0 3px
            rgba(7, 152, 212, 0.1);
        }

        .readonly {
          background: #f2f8fc;
          color: var(--mj-primary-deep);
          font-weight: 700;
        }

        .itemHeader,
        .materialHeader {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          margin-bottom: 12px;
        }

        .itemNumber {
          color: var(--mj-primary);
          font-size: 18px;
          font-weight: 800;
        }

        .removeButton,
        .smallRemoveButton {
          border: none;
          background: transparent;
          color: #b91c1c;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }

        .removeButton:disabled,
        .smallRemoveButton:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .materialsTitle {
          margin: 15px 0 9px;
          color: var(--mj-primary-deep);
          font-weight: 800;
          font-size: 14px;
        }

        .materialCard {
          padding: 14px;
          margin-bottom: 12px;
          border-radius: 14px;
          background:
            linear-gradient(
              145deg,
              #f7fcff,
              #eef9fe
            );
          border: 1px solid var(--mj-border);
        }

        .calculationBox {
          margin-top: 8px;
          padding: 10px;
          background: white;
          border: 1px solid var(--mj-border);
          border-radius: 11px;
        }

        .calcLine {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          padding: 4px 0;
          color: var(--mj-muted);
          font-size: 12px;
        }

        .calcLine strong {
          color: var(--mj-primary-deep);
        }

        .outlineButton,
        .addItemButton {
          width: 100%;
          padding: 12px;
          border-radius: 11px;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
        }

        .outlineButton {
          border: 1px solid var(--mj-primary);
          background: white;
          color: var(--mj-primary);
        }

        .addItemButton {
          margin-bottom: 16px;
          border: none;
          color: white;
          background:
            linear-gradient(
              135deg,
              var(--mj-primary),
              var(--mj-primary-dark)
            );
        }

        .itemTotal {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          margin-top: 14px;
          padding-top: 12px;
          border-top: 1px solid var(--mj-border);
        }

        .itemTotal strong {
          color: var(--mj-primary);
        }

        .summaryLine {
          display: flex;
          justify-content: space-between;
          gap: 14px;
          padding: 7px 0;
          color: #475569;
          font-size: 14px;
        }

        .summaryDivider {
          height: 1px;
          margin: 8px 0;
          background: var(--mj-border);
        }

        .summaryHighlight {
          margin: 8px -5px;
          padding: 13px;
          border-radius: 11px;
          background:
            linear-gradient(
              135deg,
              #e4f6fd,
              #f1fbff
            );
          color: var(--mj-primary-deep);
          border: 1px solid var(--mj-border);
          font-size: 18px;
          font-weight: 800;
        }

        .summaryHighlight strong {
          color: var(--mj-primary-deep);
        }

        .bottomActions {
          display: grid;
          grid-template-columns: 1fr 2fr;
          gap: 10px;
        }

        .cancelEditButton,
        .saveButton {
          min-height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 800;
        }

        .cancelEditButton {
          background: white;
          border: 1px solid var(--mj-border);
          color: var(--mj-primary-deep);
          text-decoration: none;
        }

        .saveButton {
          border: none;
          background:
            linear-gradient(
              135deg,
              var(--mj-primary),
              var(--mj-primary-dark)
            );
          color: white;
          cursor: pointer;
          box-shadow:
            0 9px 22px
            rgba(7, 152, 212, 0.18);
        }

        .saveButton:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .statusBadge {
          display: inline-flex;
          padding: 6px 10px;
          border-radius: 999px;
          font-size: 10px;
          font-weight: 800;
          text-transform: capitalize;
        }

        .statusDraft {
          background: var(--status-draft-bg);
          color: var(--status-draft-text);
        }

        .statusPending {
          background: var(--status-pending-bg);
          color: var(--status-pending-text);
        }

        .statusApproved {
          background: var(--status-approved-bg);
          color: var(--status-approved-text);
        }

        .statusRejected {
          background: var(--status-rejected-bg);
          color: var(--status-rejected-text);
        }

        .errorBox {
          margin-bottom: 14px;
          padding: 12px;
          border-radius: 10px;
          background: #fee2e2;
          color: #991b1b;
          font-size: 13px;
        }

        @media (max-width: 650px) {
          .formGrid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 420px) {
          .page {
            padding: 14px 12px 40px;
          }

          .bottomActions {
            grid-template-columns: 1fr;
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

function MoneyField({
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
    <Field
      label={`${label} Cost (RM)`}
    >
      <input
        type="number"
        min="0"
        step="0.01"
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
      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>
    </div>
  )
}

function SummaryLine({
  label,
  value,
  highlight = false,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div
      className={
        highlight
          ? 'summaryLine summaryHighlight'
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

function StatusBadge({
  status,
}: {
  status: string
}) {
  const value =
    status.toLowerCase()

  let className =
    'statusBadge statusDraft'

  if (
    value === 'pending'
  ) {
    className =
      'statusBadge statusPending'
  }

  if (
    value === 'approved'
  ) {
    className =
      'statusBadge statusApproved'
  }

  if (
    value === 'rejected'
  ) {
    className =
      'statusBadge statusRejected'
  }

  return (
    <span className={className}>
      {status}
    </span>
  )
}