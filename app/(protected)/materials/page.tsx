'use client'

import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import Link from 'next/link'
import { supabase } from '../../../lib/supabase'

type Material = {
  id: string
  name: string
  category: string | null
  unit: string
  cost_price: number
  wastage_percent: number
  is_active: boolean
  created_at: string
}

type MaterialForm = {
  name: string
  category: string
  unit: string
  cost_price: string
  wastage_percent: string
  is_active: boolean
}

const emptyForm: MaterialForm = {
  name: '',
  category: '',
  unit: 'pcs',
  cost_price: '0',
  wastage_percent: '0',
  is_active: true,
}

export default function MaterialsPage() {
  const [
    materials,
    setMaterials,
  ] = useState<Material[]>([])

  const [
    form,
    setForm,
  ] = useState<MaterialForm>(
    emptyForm
  )

  const [
    editingId,
    setEditingId,
  ] = useState<
    string | null
  >(null)

  const [
    search,
    setSearch,
  ] = useState('')

  const [
    loading,
    setLoading,
  ] = useState(true)

  const [
    saving,
    setSaving,
  ] = useState(false)

  const [
    errorMessage,
    setErrorMessage,
  ] = useState('')

  const [
    successMessage,
    setSuccessMessage,
  ] = useState('')

  useEffect(() => {
    loadMaterials()
  }, [])

  async function loadMaterials() {
    setLoading(true)
    setErrorMessage('')

    const {
      data,
      error,
    } = await supabase
      .from('materials')
      .select(`
        id,
        name,
        category,
        unit,
        cost_price,
        wastage_percent,
        is_active,
        created_at
      `)
      .order('name', {
        ascending: true,
      })

    if (error) {
      setErrorMessage(
        error.message
      )

      setLoading(false)
      return
    }

    setMaterials(
      data || []
    )

    setLoading(false)
  }

  const filteredMaterials =
    useMemo(() => {
      const keyword =
        search
          .trim()
          .toLowerCase()

      if (!keyword) {
        return materials
      }

      return materials.filter(
        (material) =>
          String(
            material.name ||
              ''
          )
            .toLowerCase()
            .includes(
              keyword
            ) ||
          String(
            material.category ||
              ''
          )
            .toLowerCase()
            .includes(
              keyword
            ) ||
          String(
            material.unit ||
              ''
          )
            .toLowerCase()
            .includes(
              keyword
            )
      )
    }, [
      materials,
      search,
    ])

  function updateForm<
    K extends keyof MaterialForm
  >(
    field: K,
    value: MaterialForm[K]
  ) {
    setForm(
      (current) => ({
        ...current,
        [field]:
          value,
      })
    )
  }

  function startEdit(
    material: Material
  ) {
    setEditingId(
      material.id
    )

    setForm({
      name:
        material.name ||
        '',

      category:
        material.category ||
        '',

      unit:
        material.unit ||
        'pcs',

      cost_price:
        String(
          material.cost_price ||
            0
        ),

      wastage_percent:
        String(
          material.wastage_percent ||
            0
        ),

      is_active:
        material.is_active !==
        false,
    })

    setSuccessMessage('')
    setErrorMessage('')

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  function cancelEdit() {
    setEditingId(null)
    setForm(emptyForm)
    setErrorMessage('')
    setSuccessMessage('')
  }

  async function saveMaterial() {
    setErrorMessage('')
    setSuccessMessage('')

    if (
      !form.name.trim()
    ) {
      setErrorMessage(
        'Please enter Material Name.'
      )

      return
    }

    if (
      !form.unit.trim()
    ) {
      setErrorMessage(
        'Please select Unit.'
      )

      return
    }

    const costPrice =
      Number(
        form.cost_price
      )

    const wastage =
      Number(
        form.wastage_percent
      )

    if (
      Number.isNaN(
        costPrice
      ) ||
      costPrice < 0
    ) {
      setErrorMessage(
        'Cost Price is invalid.'
      )

      return
    }

    if (
      Number.isNaN(
        wastage
      ) ||
      wastage < 0
    ) {
      setErrorMessage(
        'Wastage % is invalid.'
      )

      return
    }

    setSaving(true)

    try {
      const payload = {
        name:
          form.name.trim(),

        category:
          form.category.trim() ||
          null,

        unit:
          form.unit.trim(),

        cost_price:
          costPrice,

        wastage_percent:
          wastage,

        is_active:
          form.is_active,
      }

      if (
        editingId
      ) {
        const {
          error,
        } = await supabase
          .from('materials')
          .update(
            payload
          )
          .eq(
            'id',
            editingId
          )

        if (error) {
          throw error
        }

        setSuccessMessage(
          'Material updated successfully.'
        )
      } else {
        const {
          error,
        } = await supabase
          .from('materials')
          .insert(
            payload
          )

        if (error) {
          throw error
        }

        setSuccessMessage(
          'Material added successfully.'
        )
      }

      setEditingId(null)
      setForm(emptyForm)

      await loadMaterials()
    } catch (
      error: any
    ) {
      console.error(
        'Save material error:',
        error
      )

      setErrorMessage(
        error?.message ||
          'Unable to save material.'
      )
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(
    material: Material
  ) {
    setErrorMessage('')
    setSuccessMessage('')

    const newStatus =
      !material.is_active

    const {
      error,
    } = await supabase
      .from('materials')
      .update({
        is_active:
          newStatus,
      })
      .eq(
        'id',
        material.id
      )

    if (error) {
      setErrorMessage(
        error.message
      )
      return
    }

    setSuccessMessage(
      `${material.name} ${
        newStatus
          ? 'activated'
          : 'deactivated'
      }.`
    )

    await loadMaterials()
  }

  async function deleteMaterial(
    material: Material
  ) {
    const confirmed =
      window.confirm(
        `Delete material?\n\n${material.name}\n\nThis cannot be undone.`
      )

    if (
      !confirmed
    ) {
      return
    }

    setErrorMessage('')
    setSuccessMessage('')

    const {
      error,
    } = await supabase
      .from('materials')
      .delete()
      .eq(
        'id',
        material.id
      )

    if (error) {
      setErrorMessage(
        error.message
      )

      return
    }

    if (
      editingId ===
      material.id
    ) {
      cancelEdit()
    }

    setSuccessMessage(
      `${material.name} deleted successfully.`
    )

    await loadMaterials()
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
            Material Setup
          </div>

          <div className="topSubtitle">
            Manage material pricing
            and wastage
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

      <section className="formCard">

        <div className="formHeader">
          <div>
            <h2>
              {editingId
                ? 'Edit Material'
                : 'Add Material'}
            </h2>

            <p>
              {editingId
                ? 'Update material information'
                : 'Create a new material item'}
            </p>
          </div>

          {editingId && (
            <button
              type="button"
              onClick={
                cancelEdit
              }
              className="cancelButton"
            >
              Cancel Edit
            </button>
          )}
        </div>

        <div className="formGrid">

          <Field label="Material Name">
            <input
              value={
                form.name
              }
              onChange={(
                e
              ) =>
                updateForm(
                  'name',
                  e.target
                    .value
                )
              }
              placeholder="Example: 15mm Plywood"
              className="input"
            />
          </Field>

          <Field label="Category">
            <input
              value={
                form.category
              }
              onChange={(
                e
              ) =>
                updateForm(
                  'category',
                  e.target
                    .value
                )
              }
              placeholder="Example: Board / Lighting"
              className="input"
            />
          </Field>

          <Field label="Unit">
            <select
              value={
                form.unit
              }
              onChange={(
                e
              ) =>
                updateForm(
                  'unit',
                  e.target
                    .value
                )
              }
              className="input"
            >
              <option value="sheet">
                sheet
              </option>

              <option value="sqft">
                sqft
              </option>

              <option value="ft">
                ft
              </option>

              <option value="pcs">
                pcs
              </option>

              <option value="unit">
                unit
              </option>

              <option value="set">
                set
              </option>

              <option value="roll">
                roll
              </option>
            </select>
          </Field>

          <Field label="Cost Price (RM)">
            <input
              type="number"
              min="0"
              step="0.01"
              value={
                form.cost_price
              }
              onChange={(
                e
              ) =>
                updateForm(
                  'cost_price',
                  e.target
                    .value
                )
              }
              className="input"
            />
          </Field>

          <Field label="Wastage (%)">
            <input
              type="number"
              min="0"
              step="0.1"
              value={
                form.wastage_percent
              }
              onChange={(
                e
              ) =>
                updateForm(
                  'wastage_percent',
                  e.target
                    .value
                )
              }
              className="input"
            />
          </Field>

          <Field label="Status">
            <label className="statusToggle">
              <input
                type="checkbox"
                checked={
                  form.is_active
                }
                onChange={(
                  e
                ) =>
                  updateForm(
                    'is_active',
                    e.target
                      .checked
                  )
                }
              />

              <span>
                {form.is_active
                  ? 'Active'
                  : 'Inactive'}
              </span>
            </label>
          </Field>

        </div>

        <button
          type="button"
          onClick={
            saveMaterial
          }
          disabled={
            saving
          }
          className="saveButton"
        >
          {saving
            ? 'Saving...'
            : editingId
            ? 'Update Material'
            : '+ Add Material'}
        </button>

      </section>

      <section className="listSection">

        <div className="listHeader">
          <div>
            <h2>
              Material List
            </h2>

            <p>
              {
                materials.length
              } material(s)
            </p>
          </div>

          <button
            type="button"
            onClick={
              loadMaterials
            }
            className="refreshButton"
          >
            Refresh
          </button>
        </div>

        <div className="searchBox">
          <span>
            🔎
          </span>

          <input
            value={
              search
            }
            onChange={(
              e
            ) =>
              setSearch(
                e.target
                  .value
              )
            }
            placeholder="Search material, category or unit..."
          />
        </div>

        {loading && (
          <div className="emptyCard">
            Loading materials...
          </div>
        )}

        {!loading &&
          filteredMaterials.length ===
            0 && (
            <div className="emptyCard">
              No materials found.
            </div>
          )}

        {!loading &&
          filteredMaterials.length >
            0 && (
            <>
              <div className="desktopTable">

                <table>
                  <thead>
                    <tr>
                      <th>
                        Material
                      </th>

                      <th>
                        Category
                      </th>

                      <th>
                        Unit
                      </th>

                      <th>
                        Cost Price
                      </th>

                      <th>
                        Wastage
                      </th>

                      <th>
                        Status
                      </th>

                      <th>
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredMaterials.map(
                      (
                        material
                      ) => (
                        <tr
                          key={
                            material.id
                          }
                        >
                          <td>
                            <strong className="materialName">
                              {
                                material.name
                              }
                            </strong>
                          </td>

                          <td>
                            {material.category ||
                              '-'}
                          </td>

                          <td>
                            <span className="unitBadge">
                              {
                                material.unit
                              }
                            </span>
                          </td>

                          <td>
                            <strong className="priceText">
                              {formatRM(
                                material.cost_price
                              )}
                            </strong>
                          </td>

                          <td>
                            {Number(
                              material.wastage_percent ||
                                0
                            ).toFixed(
                              1
                            )}
                            %
                          </td>

                          <td>
                            <StatusBadge
                              active={
                                material.is_active
                              }
                            />
                          </td>

                          <td>
                            <div className="actions">

                              <button
                                type="button"
                                onClick={() =>
                                  startEdit(
                                    material
                                  )
                                }
                                className="editButton"
                              >
                                Edit
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  toggleActive(
                                    material
                                  )
                                }
                                className="statusButton"
                              >
                                {material.is_active
                                  ? 'Disable'
                                  : 'Enable'}
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  deleteMaterial(
                                    material
                                  )
                                }
                                className="deleteButton"
                              >
                                Delete
                              </button>

                            </div>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>

              </div>

              <div className="mobileCards">

                {filteredMaterials.map(
                  (
                    material
                  ) => (
                    <div
                      key={
                        material.id
                      }
                      className="materialCard"
                    >

                      <div className="cardTop">
                        <div>
                          <div className="cardMaterialName">
                            {
                              material.name
                            }
                          </div>

                          <div className="cardCategory">
                            {material.category ||
                              'No category'}
                          </div>
                        </div>

                        <StatusBadge
                          active={
                            material.is_active
                          }
                        />
                      </div>

                      <div className="cardInfoGrid">

                        <InfoItem
                          label="Unit"
                          value={
                            material.unit
                          }
                        />

                        <InfoItem
                          label="Cost"
                          value={formatRM(
                            material.cost_price
                          )}
                        />

                        <InfoItem
                          label="Wastage"
                          value={`${Number(
                            material.wastage_percent ||
                              0
                          ).toFixed(
                            1
                          )}%`}
                        />

                      </div>

                      <div className="mobileActions">

                        <button
                          type="button"
                          onClick={() =>
                            startEdit(
                              material
                            )
                          }
                          className="mobileEditButton"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            toggleActive(
                              material
                            )
                          }
                          className="mobileStatusButton"
                        >
                          {material.is_active
                            ? 'Disable'
                            : 'Enable'}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            deleteMaterial(
                              material
                            )
                          }
                          className="mobileDeleteButton"
                        >
                          Delete
                        </button>

                      </div>

                    </div>
                  )
                )}

              </div>
            </>
          )}

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
            var(--mj-background);
          color:
            var(--mj-text);
          font-family:
            Arial,
            Helvetica,
            sans-serif;
        }

        .page {
          min-height:
            100vh;
          max-width:
            1100px;
          margin:
            0 auto;
          padding:
            18px
            14px
            50px;
        }

        .topBar {
          display:
            flex;
          align-items:
            center;
          gap:
            12px;
          margin-bottom:
            18px;
        }

        .backButton {
          width:
            42px;
          height:
            42px;
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
            var(--mj-border);
          color:
            var(--mj-primary);
          text-decoration:
            none;
          font-size:
            24px;
          font-weight:
            800;
          box-shadow:
            0
            5px
            15px
            rgba(
              7,
              89,
              133,
              0.06
            );
        }

        .topTitle {
          font-size:
            24px;
          font-weight:
            800;
          color:
            var(--mj-text);
        }

        .topSubtitle {
          margin-top:
            3px;
          color:
            var(--mj-muted);
          font-size:
            12px;
        }

        .formCard,
        .listSection {
          background:
            white;
          border:
            1px solid
            var(--mj-border);
          border-radius:
            20px;
          padding:
            18px;
          margin-bottom:
            18px;
          box-shadow:
            0
            8px
            24px
            rgba(
              7,
              89,
              133,
              0.05
            );
        }

        .formHeader,
        .listHeader {
          display:
            flex;
          justify-content:
            space-between;
          align-items:
            flex-start;
          gap:
            12px;
          margin-bottom:
            16px;
        }

        .formHeader h2,
        .listHeader h2 {
          margin:
            0;
          font-size:
            20px;
          color:
            var(--mj-text);
        }

        .formHeader p,
        .listHeader p {
          margin:
            4px 0 0;
          color:
            var(--mj-muted);
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
          min-width:
            0;
          margin-bottom:
            10px;
        }

        .label {
          display:
            block;
          margin-bottom:
            6px;
          color:
            #334155;
          font-size:
            12px;
          font-weight:
            700;
        }

        .input {
          width:
            100%;
          padding:
            12px
            13px;
          border:
            1px solid
            var(--mj-border);
          border-radius:
            10px;
          background:
            white;
          color:
            var(--mj-text);
          font-size:
            14px;
          outline:
            none;
        }

        .input:focus {
          border-color:
            var(--mj-primary);
          box-shadow:
            0
            0
            0
            3px
            rgba(
              7,
              152,
              212,
              0.1
            );
        }

        .statusToggle {
          min-height:
            45px;
          display:
            flex;
          align-items:
            center;
          gap:
            10px;
          padding:
            10px
            12px;
          background:
            var(--mj-light);
          border:
            1px solid
            var(--mj-border);
          border-radius:
            10px;
          color:
            var(--mj-primary-deep);
          font-size:
            13px;
          font-weight:
            700;
        }

        .statusToggle input {
          width:
            18px;
          height:
            18px;
          accent-color:
            var(--mj-primary);
        }

        .saveButton {
          width:
            100%;
          border:
            none;
          border-radius:
            12px;
          padding:
            14px;
          margin-top:
            6px;
          background:
            linear-gradient(
              135deg,
              var(--mj-primary),
              var(--mj-primary-dark)
            );
          color:
            white;
          font-size:
            14px;
          font-weight:
            800;
          cursor:
            pointer;
          box-shadow:
            0
            9px
            22px
            rgba(
              7,
              152,
              212,
              0.2
            );
        }

        .saveButton:disabled {
          opacity:
            0.55;
          cursor:
            not-allowed;
        }

        .cancelButton {
          border:
            1px solid
            var(--mj-border);
          background:
            white;
          color:
            var(--mj-primary);
          border-radius:
            9px;
          padding:
            8px
            11px;
          font-size:
            12px;
          font-weight:
            800;
          cursor:
            pointer;
        }

        .refreshButton {
          border:
            1px solid
            var(--mj-primary);
          background:
            var(--mj-light);
          color:
            var(--mj-primary-deep);
          border-radius:
            9px;
          padding:
            8px
            11px;
          font-size:
            12px;
          font-weight:
            800;
          cursor:
            pointer;
        }

        .searchBox {
          display:
            flex;
          align-items:
            center;
          gap:
            8px;
          margin-bottom:
            16px;
          padding:
            0
            12px;
          background:
            #f8fcff;
          border:
            1px solid
            var(--mj-border);
          border-radius:
            11px;
        }

        .searchBox input {
          width:
            100%;
          border:
            none;
          outline:
            none;
          background:
            transparent;
          padding:
            12px
            0;
          color:
            var(--mj-text);
          font-size:
            13px;
        }

        .desktopTable {
          overflow-x:
            auto;
          border:
            1px solid
            var(--mj-border);
          border-radius:
            15px;
        }

        table {
          width:
            100%;
          min-width:
            900px;
          border-collapse:
            collapse;
        }

        th {
          text-align:
            left;
          background:
            var(--mj-light);
          color:
            var(--mj-primary-deep);
          padding:
            12px;
          font-size:
            11px;
          font-weight:
            800;
        }

        td {
          padding:
            12px;
          border-top:
            1px solid
            #eaf2f7;
          color:
            #334155;
          font-size:
            12px;
          vertical-align:
            middle;
        }

        tbody tr:hover {
          background:
            #fbfdff;
        }

        .materialName {
          color:
            var(--mj-text);
        }

        .priceText {
          color:
            var(--mj-primary-deep);
        }

        .unitBadge {
          display:
            inline-flex;
          padding:
            4px
            8px;
          border-radius:
            999px;
          background:
            var(--mj-light);
          color:
            var(--mj-primary-deep);
          font-size:
            10px;
          font-weight:
            800;
        }

        .statusBadge {
          display:
            inline-flex;
          padding:
            5px
            9px;
          border-radius:
            999px;
          font-size:
            10px;
          font-weight:
            800;
        }

        .statusActive {
          background:
            #dcfce7;
          color:
            #166534;
        }

        .statusInactive {
          background:
            #f3f4f6;
          color:
            #6b7280;
        }

        .actions {
          display:
            flex;
          flex-wrap:
            wrap;
          gap:
            6px;
        }

        .editButton,
        .statusButton,
        .deleteButton {
          border-radius:
            8px;
          padding:
            7px
            9px;
          font-size:
            11px;
          font-weight:
            800;
          cursor:
            pointer;
        }

        .editButton {
          border:
            1px solid
            var(--mj-primary);
          background:
            var(--mj-light);
          color:
            var(--mj-primary-deep);
        }

        .statusButton {
          border:
            1px solid
            #cbd5e1;
          background:
            white;
          color:
            #475569;
        }

        .deleteButton {
          border:
            1px solid
            #fecaca;
          background:
            #fee2e2;
          color:
            #991b1b;
        }

        .mobileCards {
          display:
            none;
        }

        .materialCard {
          background:
            linear-gradient(
              145deg,
              #ffffff,
              #f5fbff
            );
          border:
            1px solid
            var(--mj-border);
          border-radius:
            16px;
          padding:
            14px;
          box-shadow:
            0
            6px
            18px
            rgba(
              7,
              89,
              133,
              0.04
            );
        }

        .cardTop {
          display:
            flex;
          justify-content:
            space-between;
          gap:
            12px;
        }

        .cardMaterialName {
          color:
            var(--mj-text);
          font-size:
            16px;
          font-weight:
            800;
        }

        .cardCategory {
          margin-top:
            4px;
          color:
            var(--mj-muted);
          font-size:
            11px;
        }

        .cardInfoGrid {
          display:
            grid;
          grid-template-columns:
            repeat(
              3,
              minmax(
                0,
                1fr
              )
            );
          gap:
            8px;
          margin-top:
            14px;
          padding:
            10px;
          background:
            var(--mj-light);
          border-radius:
            11px;
        }

        .infoLabel {
          color:
            #7c8a99;
          font-size:
            9px;
        }

        .infoValue {
          margin-top:
            3px;
          color:
            var(--mj-primary-deep);
          font-size:
            11px;
          font-weight:
            800;
          word-break:
            break-word;
        }

        .mobileActions {
          display:
            grid;
          grid-template-columns:
            repeat(
              3,
              1fr
            );
          gap:
            7px;
          margin-top:
            12px;
        }

        .mobileEditButton,
        .mobileStatusButton,
        .mobileDeleteButton {
          min-height:
            38px;
          border-radius:
            9px;
          font-size:
            11px;
          font-weight:
            800;
          cursor:
            pointer;
        }

        .mobileEditButton {
          border:
            1px solid
            var(--mj-primary);
          background:
            var(--mj-light);
          color:
            var(--mj-primary-deep);
        }

        .mobileStatusButton {
          border:
            1px solid
            #cbd5e1;
          background:
            white;
          color:
            #475569;
        }

        .mobileDeleteButton {
          border:
            1px solid
            #fecaca;
          background:
            #fee2e2;
          color:
            #991b1b;
        }

        .errorBox,
        .successBox {
          margin-bottom:
            14px;
          padding:
            12px;
          border-radius:
            10px;
          font-size:
            13px;
        }

        .errorBox {
          background:
            #fee2e2;
          color:
            #991b1b;
        }

        .successBox {
          background:
            #dcfce7;
          color:
            #166534;
          font-weight:
            700;
        }

        .emptyCard {
          padding:
            20px;
          background:
            #f8fcff;
          border:
            1px solid
            var(--mj-border);
          border-radius:
            13px;
          color:
            var(--mj-muted);
        }

        @media (
          max-width:
            700px
        ) {
          .formGrid {
            grid-template-columns:
              1fr;
          }

          .desktopTable {
            display:
              none;
          }

          .mobileCards {
            display:
              grid;
            gap:
              11px;
          }
        }

        @media (
          max-width:
            420px
        ) {
          .page {
            padding:
              14px
              12px
              40px;
          }

          .mobileActions {
            grid-template-columns:
              1fr;
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

function StatusBadge({
  active,
}: {
  active: boolean
}) {
  return (
    <span
      className={
        active
          ? 'statusBadge statusActive'
          : 'statusBadge statusInactive'
      }
    >
      {active
        ? 'Active'
        : 'Inactive'}
    </span>
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