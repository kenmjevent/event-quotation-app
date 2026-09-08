'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../../lib/supabase'

type Material = {
  id: string
  name: string
  category: string | null
  unit: string
  cost_price: number
  wastage_percent: number
  is_active: boolean
  created_at?: string
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
  cost_price: '',
  wastage_percent: '0',
  is_active: true,
}

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)

  const [form, setForm] = useState<MaterialForm>(emptyForm)

  const [editingId, setEditingId] = useState<string | null>(null)

  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    loadMaterials()
  }, [])

  async function loadMaterials() {
    setLoading(true)
    setErrorMessage('')

    const { data, error } = await supabase
      .from('materials')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      setErrorMessage(error.message)
      setLoading(false)
      return
    }

    setMaterials(data || [])
    setLoading(false)
  }

  function updateForm(
    field: keyof MaterialForm,
    value: string | boolean
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  function resetForm() {
    setForm(emptyForm)
    setEditingId(null)
    setMessage('')
    setErrorMessage('')
  }

  function startEdit(material: Material) {
    setEditingId(material.id)

    setForm({
      name: material.name || '',
      category: material.category || '',
      unit: material.unit || 'pcs',
      cost_price: String(material.cost_price || ''),
      wastage_percent: String(material.wastage_percent || 0),
      is_active: material.is_active,
    })

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  async function saveMaterial() {
    setMessage('')
    setErrorMessage('')

    if (!form.name.trim()) {
      setErrorMessage('Please enter Material Name.')
      return
    }

    if (!form.unit.trim()) {
      setErrorMessage('Please select Unit.')
      return
    }

    if (Number(form.cost_price) < 0) {
      setErrorMessage('Cost Price cannot be negative.')
      return
    }

    setSaving(true)

    const payload = {
      name: form.name.trim(),
      category: form.category.trim() || null,
      unit: form.unit,
      cost_price: Number(form.cost_price) || 0,
      wastage_percent: Number(form.wastage_percent) || 0,
      is_active: form.is_active,
    }

    if (editingId) {
      const { error } = await supabase
        .from('materials')
        .update(payload)
        .eq('id', editingId)

      if (error) {
        setErrorMessage(`Update failed: ${error.message}`)
        setSaving(false)
        return
      }

      setMessage('Material updated successfully.')
    } else {
      const { error } = await supabase
        .from('materials')
        .insert(payload)

      if (error) {
        setErrorMessage(`Save failed: ${error.message}`)
        setSaving(false)
        return
      }

      setMessage('Material added successfully.')
    }

    setForm(emptyForm)
    setEditingId(null)

    await loadMaterials()

    setSaving(false)
  }

  async function deleteMaterial(material: Material) {
    const confirmed = window.confirm(
      `Delete material "${material.name}"?\n\nThis cannot be undone.`
    )

    if (!confirmed) return

    const { error } = await supabase
      .from('materials')
      .delete()
      .eq('id', material.id)

    if (error) {
      setErrorMessage(`Delete failed: ${error.message}`)
      return
    }

    setMessage(`Deleted ${material.name}.`)

    await loadMaterials()
  }

  async function toggleActive(material: Material) {
    const { error } = await supabase
      .from('materials')
      .update({
        is_active: !material.is_active,
      })
      .eq('id', material.id)

    if (error) {
      setErrorMessage(error.message)
      return
    }

    await loadMaterials()
  }

  function formatRM(value: number) {
    return `RM${Number(value || 0).toLocaleString('en-MY', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`
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
            Manage material costing database
          </div>
        </div>
      </header>

      <section className="formCard">
        <div className="cardHeader">
          <div>
            <h2>
              {editingId
                ? 'Edit Material'
                : 'Add Material'}
            </h2>

            <p>
              Maintain rates used by the Cost Calculator
            </p>
          </div>

          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="cancelButton"
            >
              Cancel Edit
            </button>
          )}
        </div>

        <div className="formGrid">
          <Field label="Material Name">
            <input
              value={form.name}
              onChange={(e) =>
                updateForm('name', e.target.value)
              }
              placeholder="e.g. 15mm Plywood 4x8"
              className="input"
            />
          </Field>

          <Field label="Category">
            <input
              value={form.category}
              onChange={(e) =>
                updateForm('category', e.target.value)
              }
              placeholder="e.g. Plywood"
              className="input"
            />
          </Field>

          <Field label="Unit">
            <select
              value={form.unit}
              onChange={(e) =>
                updateForm('unit', e.target.value)
              }
              className="input"
            >
              <option value="pcs">pcs</option>
              <option value="sheet">sheet</option>
              <option value="sqft">sqft</option>
              <option value="ft">ft</option>
              <option value="m">m</option>
              <option value="roll">roll</option>
              <option value="set">set</option>
              <option value="lot">lot</option>
            </select>
          </Field>

          <Field label="Cost Price (RM)">
            <input
              type="number"
              step="0.01"
              value={form.cost_price}
              onChange={(e) =>
                updateForm('cost_price', e.target.value)
              }
              placeholder="0.00"
              className="input"
            />
          </Field>

          <Field label="Wastage (%)">
            <input
              type="number"
              step="0.01"
              value={form.wastage_percent}
              onChange={(e) =>
                updateForm(
                  'wastage_percent',
                  e.target.value
                )
              }
              className="input"
            />
          </Field>

          <Field label="Status">
            <label className="toggleRow">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) =>
                  updateForm(
                    'is_active',
                    e.target.checked
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

        {errorMessage && (
          <div className="errorBox">
            {errorMessage}
          </div>
        )}

        {message && (
          <div className="successBox">
            {message}
          </div>
        )}

        <button
          type="button"
          onClick={saveMaterial}
          disabled={saving}
          className="saveButton"
        >
          {saving
            ? 'Saving...'
            : editingId
            ? 'Update Material'
            : 'Add Material'}
        </button>
      </section>

      <section className="listSection">
        <div className="listHeader">
          <div>
            <h2>Materials</h2>

            <p>
              {materials.length} material(s)
            </p>
          </div>

          <button
            type="button"
            onClick={loadMaterials}
            className="refreshButton"
          >
            Refresh
          </button>
        </div>

        {loading && (
          <div className="emptyCard">
            Loading materials...
          </div>
        )}

        {!loading && materials.length === 0 && (
          <div className="emptyCard">
            No materials found.
          </div>
        )}

        {!loading && materials.length > 0 && (
          <>
            <div className="desktopTableWrap">
              <table className="materialTable">
                <thead>
                  <tr>
                    <th>Material</th>
                    <th>Category</th>
                    <th>Unit</th>
                    <th>Cost</th>
                    <th>Wastage</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {materials.map((material) => (
                    <tr key={material.id}>
                      <td>
                        <strong>
                          {material.name}
                        </strong>
                      </td>

                      <td>
                        {material.category || '-'}
                      </td>

                      <td>
                        {material.unit}
                      </td>

                      <td>
                        {formatRM(material.cost_price)}
                      </td>

                      <td>
                        {Number(
                          material.wastage_percent || 0
                        ).toFixed(2)}
                        %
                      </td>

                      <td>
                        <StatusBadge
                          active={material.is_active}
                        />
                      </td>

                      <td>
                        <div className="actions">
                          <button
                            type="button"
                            onClick={() =>
                              startEdit(material)
                            }
                            className="actionButton"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              toggleActive(material)
                            }
                            className="actionButton"
                          >
                            {material.is_active
                              ? 'Disable'
                              : 'Enable'}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              deleteMaterial(material)
                            }
                            className="actionButton deleteButton"
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

            <div className="mobileCards">
              {materials.map((material) => (
                <div
                  key={material.id}
                  className="materialCard"
                >
                  <div className="materialTop">
                    <div>
                      <div className="materialName">
                        {material.name}
                      </div>

                      <div className="materialCategory">
                        {material.category || 'No category'}
                      </div>
                    </div>

                    <StatusBadge
                      active={material.is_active}
                    />
                  </div>

                  <div className="infoGrid">
                    <InfoItem
                      label="Unit"
                      value={material.unit}
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
                        material.wastage_percent || 0
                      ).toFixed(2)}%`}
                    />
                  </div>

                  <div className="mobileActions">
                    <button
                      type="button"
                      onClick={() =>
                        startEdit(material)
                      }
                      className="actionButton"
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        toggleActive(material)
                      }
                      className="actionButton"
                    >
                      {material.is_active
                        ? 'Disable'
                        : 'Enable'}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        deleteMaterial(material)
                      }
                      className="actionButton deleteButton"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

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
        />

        <BottomNavItem
          href="/materials"
          icon="📦"
          label="Material"
          active
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
          max-width: 1100px;
          margin: 0 auto;
          padding: 18px 14px 40px;
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
          border-radius: 12px;
          background: white;
          border: 1px solid #e5e7eb;
          display: flex;
          justify-content: center;
          align-items: center;
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

        .formCard,
        .materialCard,
        .emptyCard {
          background: white;
          border: 1px solid #e8ecf1;
          border-radius: 20px;
          box-shadow:
            0 5px 18px rgba(15, 23, 42, 0.05);
        }

        .formCard {
          padding: 18px;
        }

        .cardHeader,
        .listHeader {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }

        .cardHeader h2,
        .listHeader h2 {
          margin: 0;
          font-size: 21px;
          color: #111827;
        }

        .cardHeader p,
        .listHeader p {
          margin: 5px 0 0;
          font-size: 13px;
          color: #6b7280;
        }

        .formGrid {
          display: grid;
          grid-template-columns:
            repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .field {
          min-width: 0;
        }

        .label {
          display: block;
          margin-bottom: 6px;
          font-size: 13px;
          font-weight: 700;
          color: #374151;
        }

        .input {
          width: 100%;
          min-width: 0;
          padding: 12px 13px;
          border: 1px solid #d1d5db;
          border-radius: 10px;
          font-size: 15px;
          background: white;
        }

        .toggleRow {
          min-height: 44px;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 4px;
          font-weight: 600;
        }

        .toggleRow input {
          width: 18px;
          height: 18px;
        }

        .saveButton {
          margin-top: 16px;
          width: 100%;
          border: none;
          background: #0f766e;
          color: white;
          font-weight: 800;
          padding: 13px 16px;
          border-radius: 12px;
          cursor: pointer;
        }

        .saveButton:disabled {
          opacity: 0.6;
        }

        .cancelButton,
        .refreshButton {
          border: 1px solid #d1d5db;
          background: white;
          border-radius: 10px;
          padding: 9px 12px;
          font-weight: 700;
          cursor: pointer;
        }

        .errorBox,
        .successBox {
          margin-top: 14px;
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

        .listSection {
          margin-top: 24px;
        }

        .desktopTableWrap {
          overflow-x: auto;
          background: white;
          border: 1px solid #e8ecf1;
          border-radius: 18px;
        }

        .materialTable {
          width: 100%;
          border-collapse: collapse;
          min-width: 850px;
        }

        .materialTable th {
          background: #f8fafc;
          color: #374151;
          font-size: 13px;
          text-align: left;
          padding: 13px;
        }

        .materialTable td {
          padding: 13px;
          border-top: 1px solid #edf0f3;
          font-size: 13px;
          color: #111827;
        }

        .actions {
          display: flex;
          gap: 7px;
          flex-wrap: wrap;
        }

        .actionButton {
          border: 1px solid #d1d5db;
          background: white;
          border-radius: 8px;
          padding: 7px 9px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 700;
        }

        .deleteButton {
          color: #b91c1c;
          border-color: #fecaca;
        }

        .statusBadge {
          display: inline-flex;
          align-items: center;
          padding: 5px 9px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 800;
        }

        .statusActive {
          background: #dcfce7;
          color: #166534;
        }

        .statusInactive {
          background: #f3f4f6;
          color: #6b7280;
        }

        .mobileCards {
          display: none;
        }

        .materialCard {
          padding: 15px;
        }

        .materialTop {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: flex-start;
        }

        .materialName {
          font-size: 16px;
          font-weight: 800;
          color: #111827;
        }

        .materialCategory {
          margin-top: 4px;
          font-size: 12px;
          color: #6b7280;
        }

        .infoGrid {
          display: grid;
          grid-template-columns:
            repeat(3, minmax(0, 1fr));
          gap: 10px;
          margin-top: 15px;
        }

        .infoLabel {
          font-size: 11px;
          color: #9ca3af;
        }

        .infoValue {
          margin-top: 4px;
          font-size: 13px;
          font-weight: 700;
          color: #111827;
          word-break: break-word;
        }

        .mobileActions {
          display: grid;
          grid-template-columns:
            repeat(3, minmax(0, 1fr));
          gap: 8px;
          margin-top: 15px;
        }

        .emptyCard {
          padding: 20px;
          color: #6b7280;
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
            0 -4px 18px rgba(15, 23, 42, 0.06);
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

        @media (max-width: 700px) {
          .formGrid {
            grid-template-columns: 1fr;
          }

          .desktopTableWrap {
            display: none;
          }

          .mobileCards {
            display: grid;
            gap: 12px;
          }

          .cardHeader {
            align-items: flex-start;
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
      {active ? 'Active' : 'Inactive'}
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