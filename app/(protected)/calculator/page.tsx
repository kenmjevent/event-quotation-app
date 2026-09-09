'use client'

import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { supabase } from '../../../lib/supabase'

import {
  getCurrentProfile,
  type UserProfile,
} from '../../../lib/authRole'

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

type CostingItem = {
  id: string
  description: string
  materials: MaterialRow[]
}

export default function CalculatorPage() {
  const router = useRouter()

  const [profile, setProfile] =
    useState<UserProfile | null>(null)

  const [materials, setMaterials] =
    useState<Material[]>([])

  const [items, setItems] =
    useState<CostingItem[]>([])

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

  const [
    installationCost,
    setInstallationCost,
  ] = useState('0')

  const [
    dismantlingCost,
    setDismantlingCost,
  ] = useState('0')

  const [targetMargin, setTargetMargin] =
    useState('40')

  const [loading, setLoading] =
    useState(true)

  const [saving, setSaving] =
    useState(false)

  const [
    errorMessage,
    setErrorMessage,
  ] = useState('')

  useEffect(() => {
    loadPage()
  }, [])

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

      const today =
        new Date()
          .toISOString()
          .split('T')[0]

      setQuotationDate(today)

      const {
        data: materialData,
        error: materialError,
      } = await supabase
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
        .eq('is_active', true)
        .order('name', {
          ascending: true,
        })

      if (materialError) {
        throw materialError
      }

      const loadedMaterials =
        materialData || []

      setMaterials(
        loadedMaterials
      )

      setItems([
        {
          id: crypto.randomUUID(),
          description: '',
          materials: [
            {
              id: crypto.randomUUID(),
              materialId:
                loadedMaterials[0]?.id ||
                '',
              width: '1000',
              height: '1000',
              length: '1000',
              quantity: '1',
            },
          ],
        },
      ])

      const nextNo =
        await generateNextQuotationNo()

      setQuotationNo(nextNo)
    } catch (error: any) {
      console.error(
        'Calculator load error:',
        error
      )

      setErrorMessage(
        error?.message ||
          'Unable to load calculator.'
      )
    } finally {
      setLoading(false)
    }
  }

  async function generateNextQuotationNo() {
    const now = new Date()

    const yy =
      String(
        now.getFullYear()
      ).slice(-2)

    const mm =
      String(
        now.getMonth() + 1
      ).padStart(2, '0')

    const prefix =
      `Q${yy}${mm}`

    const {
      data,
      error,
    } = await supabase
      .from('quotations')
      .select('quotation_no')
      .like(
        'quotation_no',
        `${prefix}%`
      )
      .order(
        'quotation_no',
        {
          ascending: false,
        }
      )
      .limit(1)

    if (error) {
      throw error
    }

    let nextSequence = 1

    if (
      data &&
      data.length > 0
    ) {
      const latest =
        data[0].quotation_no

      const sequenceText =
        latest.slice(
          prefix.length
        )

      const sequence =
        Number(
          sequenceText
        )

      if (
        !Number.isNaN(
          sequence
        )
      ) {
        nextSequence =
          sequence + 1
      }
    }

    return (
      prefix +
      String(
        nextSequence
      ).padStart(3, '0')
    )
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

              width: '1000',
              height: '1000',
              length: '1000',
              quantity: '1',
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
      items.length === 1
    ) {
      return
    }

    setItems(
      (current) =>
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
    setItems(
      (current) =>
        current.map(
          (item) =>
            item.id === itemId
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
                .length === 1
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
        /*
          Standard sheet:
          4ft x 8ft
          = 32 sqft
        */

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
    }

    else if (
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
    }

    else {
      /*
        pcs / unit / set /
        transformer / light /
        LED unit etc.

        No dimension needed.
      */

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

  async function saveCosting() {
    if (
      !profile
    ) {
      setErrorMessage(
        'User profile not found.'
      )

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

    const emptyDescription =
      items.some(
        (item) =>
          !item.description.trim()
      )

    if (
      emptyDescription
    ) {
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

    if (
      invalidMaterial
    ) {
      setErrorMessage(
        'Please select material for every material row.'
      )

      return
    }

    if (
      totals.totalCost <= 0
    ) {
      const confirmed =
        window.confirm(
          'Total Cost is RM0.00. Save anyway?'
        )

      if (
        !confirmed
      ) {
        return
      }
    }

    setSaving(true)
    setErrorMessage('')

    try {
      /*
        Generate number again
        immediately before saving.

        This reduces the chance
        of duplicate numbers.
      */

      const finalQuotationNo =
        await generateNextQuotationNo()

      const {
        data:
          quotationData,
        error:
          quotationError,
      } = await supabase
        .from(
          'quotations'
        )
        .insert({
          quotation_no:
            finalQuotationNo,

          customer_name:
            customerName.trim(),

          project_name:
            projectName.trim(),

          quotation_date:
            quotationDate,

          status:
            'draft',

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

          created_by:
            profile.id,

          updated_at:
            new Date()
              .toISOString(),
        })
        .select('id')
        .single()

      if (
        quotationError
      ) {
        throw quotationError
      }

      const quotationId =
        quotationData.id

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

      /*
        IMPORTANT:
        Real logged-in user
        is recorded here.
      */

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
            finalQuotationNo,

          action:
            'CREATE',

          details:
            `Created costing - ${customerName.trim()} ${projectName.trim()}`,

          performed_by:
            profile.full_name ||
            profile.email ||
            'User',
        })

      if (
        logError
      ) {
        console.error(
          'Create log error:',
          logError
        )
      }

      router.push(
        `/quotations/${quotationId}`
      )
    } catch (
      error: any
    ) {
      console.error(
        'Save costing error:',
        error
      )

      setErrorMessage(
        error?.message ||
          'Unable to save costing.'
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

  if (
    loading
  ) {
    return (
      <main className="loadingPage">
        Loading calculator...
      </main>
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

        <div className="titleBlock">
          <div className="topTitle">
            Cost Calculator
          </div>

          <div className="topSubtitle">
            Event fabrication costing
          </div>
        </div>

        {profile && (
          <div className="roleBadge">
            {profile.role}
          </div>
        )}
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
                quotationNo
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
              onChange={(
                e
              ) =>
                setQuotationDate(
                  e.target
                    .value
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
              onChange={(
                e
              ) =>
                setCustomerName(
                  e.target
                    .value
                )
              }
              placeholder="Customer / Company"
              className="input"
            />
          </Field>

          <Field label="Project Name">
            <input
              value={
                projectName
              }
              onChange={(
                e
              ) =>
                setProjectName(
                  e.target
                    .value
                )
              }
              placeholder="Event / Project name"
              className="input"
            />
          </Field>

        </div>
      </section>

      <div className="sectionTitleRow">
        <div>
          <h2>
            Costing Items
          </h2>

          <p>
            Add fabrication items and materials
          </p>
        </div>
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
                onClick={() =>
                  removeItem(
                    item.id
                  )
                }
                disabled={
                  items.length ===
                  1
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
                onChange={(
                  e
                ) =>
                  updateItemDescription(
                    item.id,
                    e.target
                      .value
                  )
                }
                placeholder="Example: Entrance Arch"
                className="input"
              />
            </Field>

            <div className="materialsHeading">
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
                        onChange={(
                          e
                        ) =>
                          updateMaterialRow(
                            item.id,
                            row.id,
                            'materialId',
                            e
                              .target
                              .value
                          )
                        }
                        className="input"
                      >
                        <option value="">
                          Select Material
                        </option>

                        {materials.map(
                          (
                            material
                          ) => (
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
                            min="0"
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
                          min="0"
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
                        min="0"
                        step="0.01"
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
                          result
                            .material
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
        onClick={
          addItem
        }
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
            step="1"
            value={
              targetMargin
            }
            onChange={(
              e
            ) =>
              setTargetMargin(
                e.target
                  .value
              )
            }
            className="input"
          />
        </Field>
      </section>

      <section className="summarySection">

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
          strong
        />

        <SummaryLine
          label="Target Margin"
          value={`${Number(
            targetMargin ||
              0
          ).toFixed(
            2
          )}%`}
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

        <button
          type="button"
          onClick={
            saveCosting
          }
          disabled={
            saving
          }
          className="saveButton"
        >
          {saving
            ? 'Saving...'
            : 'Save Costing'}
        </button>

      </section>

      <style jsx global>{`
        * {
          box-sizing:
            border-box;
        }

        html,
        body {
          margin: 0;
          padding: 0;
          background:
            #f4f6fa;
          font-family:
            Arial,
            sans-serif;
        }

        .page {
          min-height:
            100vh;
          max-width:
            1000px;
          margin:
            0 auto;
          padding:
            18px
            14px
            50px;
        }

        .loadingPage {
          min-height:
            100vh;
          display:
            flex;
          align-items:
            center;
          justify-content:
            center;
          background:
            #f4f6fa;
          font-family:
            Arial,
            sans-serif;
        }

        .topBar {
          display:
            flex;
          align-items:
            center;
          gap: 12px;
          margin-bottom:
            18px;
        }

        .titleBlock {
          flex: 1;
        }

        .backButton {
          width: 42px;
          height: 42px;
          display:
            flex;
          align-items:
            center;
          justify-content:
            center;
          border-radius:
            12px;
          background:
            white;
          border:
            1px solid
            #e5e7eb;
          text-decoration:
            none;
          color:
            #0f766e;
          font-size:
            24px;
          font-weight:
            800;
        }

        .topTitle {
          font-size:
            24px;
          font-weight:
            800;
          color:
            #111827;
        }

        .topSubtitle {
          margin-top:
            3px;
          color:
            #6b7280;
          font-size:
            12px;
        }

        .roleBadge {
          padding:
            6px 10px;
          border-radius:
            999px;
          background:
            #ccfbf1;
          color:
            #0f766e;
          font-size:
            10px;
          font-weight:
            800;
          text-transform:
            uppercase;
        }

        .section,
        .itemCard,
        .summarySection {
          background:
            white;
          border:
            1px solid
            #e8ecf1;
          border-radius:
            18px;
          padding:
            17px;
          margin-bottom:
            16px;
        }

        .section h2,
        .summarySection h2 {
          margin:
            0 0 16px;
          font-size:
            19px;
          color:
            #111827;
        }

        .sectionTitleRow {
          margin:
            22px 0
            12px;
        }

        .sectionTitleRow h2 {
          margin: 0;
          color:
            #111827;
          font-size:
            20px;
        }

        .sectionTitleRow p {
          margin:
            4px 0 0;
          color:
            #6b7280;
          font-size:
            12px;
        }

        .formGrid {
          display:
            grid;
          grid-template-columns:
            repeat(
              2,
              minmax(
                0,
                1fr
              )
            );
          gap:
            12px;
        }

        .field {
          margin-bottom:
            12px;
          min-width:
            0;
        }

        .label {
          display:
            block;
          margin-bottom:
            6px;
          font-size:
            12px;
          font-weight:
            700;
          color:
            #374151;
        }

        .input {
          width:
            100%;
          min-width:
            0;
          padding:
            12px 13px;
          border:
            1px solid
            #d1d5db;
          border-radius:
            10px;
          background:
            white;
          color:
            #111827;
          font-size:
            14px;
        }

        .readonly {
          background:
            #f3f4f6;
          font-weight:
            700;
        }

        .itemHeader,
        .materialHeader {
          display:
            flex;
          align-items:
            center;
          justify-content:
            space-between;
          gap:
            10px;
          margin-bottom:
            12px;
        }

        .itemNumber {
          color:
            #0f766e;
          font-size:
            18px;
          font-weight:
            800;
        }

        .removeButton,
        .smallRemoveButton {
          border:
            none;
          background:
            transparent;
          color:
            #b91c1c;
          cursor:
            pointer;
          font-size:
            12px;
          font-weight:
            700;
        }

        .removeButton:disabled,
        .smallRemoveButton:disabled {
          opacity:
            0.3;
          cursor:
            not-allowed;
        }

        .materialsHeading {
          margin:
            15px 0
            9px;
          color:
            #374151;
          font-size:
            14px;
          font-weight:
            800;
        }

        .materialCard {
          background:
            #f8fafc;
          border:
            1px solid
            #e5e7eb;
          border-radius:
            14px;
          padding:
            14px;
          margin-bottom:
            12px;
        }

        .calculationBox {
          background:
            white;
          border:
            1px solid
            #edf0f3;
          border-radius:
            11px;
          padding:
            10px;
          margin-top:
            8px;
        }

        .calcLine {
          display:
            flex;
          justify-content:
            space-between;
          gap:
            12px;
          padding:
            4px 0;
          color:
            #4b5563;
          font-size:
            12px;
        }

        .calcLine strong {
          color:
            #111827;
        }

        .outlineButton,
        .addItemButton {
          width:
            100%;
          border-radius:
            11px;
          padding:
            12px;
          font-size:
            13px;
          font-weight:
            800;
          cursor:
            pointer;
        }

        .outlineButton {
          background:
            white;
          border:
            1px solid
            #d1d5db;
          color:
            #374151;
        }

        .addItemButton {
          background:
            #0f766e;
          color:
            white;
          border:
            none;
          margin-bottom:
            16px;
        }

        .itemTotal {
          display:
            flex;
          justify-content:
            space-between;
          gap:
            12px;
          margin-top:
            14px;
          padding-top:
            12px;
          border-top:
            1px solid
            #e5e7eb;
          color:
            #374151;
        }

        .itemTotal strong {
          color:
            #0f766e;
        }

        .summaryLine {
          display:
            flex;
          justify-content:
            space-between;
          gap:
            16px;
          padding:
            7px 0;
          color:
            #4b5563;
          font-size:
            14px;
        }

        .summaryStrong {
          font-size:
            17px;
          color:
            #111827;
          font-weight:
            800;
        }

        .summaryHighlight {
          margin:
            8px -5px;
          padding:
            13px;
          border-radius:
            11px;
          background:
            #ccfbf1;
          color:
            #0f766e;
          font-size:
            18px;
          font-weight:
            800;
        }

        .summaryDivider {
          height:
            1px;
          background:
            #e5e7eb;
          margin:
            8px 0;
        }

        .saveButton {
          width:
            100%;
          border:
            none;
          border-radius:
            13px;
          background:
            #0f766e;
          color:
            white;
          padding:
            15px;
          margin-top:
            14px;
          font-size:
            15px;
          font-weight:
            800;
          cursor:
            pointer;
        }

        .saveButton:disabled {
          opacity:
            0.55;
          cursor:
            not-allowed;
        }

        .errorBox {
          margin-bottom:
            14px;
          padding:
            12px;
          border-radius:
            10px;
          background:
            #fee2e2;
          color:
            #991b1b;
          font-size:
            13px;
        }

        @media (
          max-width:
            650px
        ) {
          .formGrid {
            grid-template-columns:
              1fr;
          }

          .page {
            padding:
              14px
              12px
              40px;
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
  children:
    React.ReactNode
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
  setValue:
    (
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
        value={
          value
        }
        onChange={(
          e
        ) =>
          setValue(
            e.target
              .value
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
  strong = false,
  highlight = false,
}: {
  label: string
  value: string
  strong?: boolean
  highlight?: boolean
}) {
  let className =
    'summaryLine'

  if (
    strong
  ) {
    className +=
      ' summaryStrong'
  }

  if (
    highlight
  ) {
    className +=
      ' summaryHighlight'
  }

  return (
    <div
      className={
        className
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