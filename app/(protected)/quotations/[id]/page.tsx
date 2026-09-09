'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'

import { supabase } from '../../../../lib/supabase'

import {
  getCurrentProfile,
  type UserProfile,
} from '../../../../lib/authRole'

type Quotation = {
  id: string
  quotation_no: string
  customer_name: string | null
  project_name: string | null
  quotation_date: string | null
  status: string | null
  rejection_reason: string | null

  target_margin: number | null

  material_cost: number | null
  labour_cost: number | null
  transport_cost: number | null
  installation_cost: number | null
  dismantling_cost: number | null
  logistics_cost: number | null

  total_cost: number | null
  selling_price: number | null
  gross_profit: number | null
  gross_margin: number | null

  created_at: string
  updated_at: string | null
}

type MaterialRelation = {
  name: string | null
  unit: string | null
}

type QuotationMaterial = {
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

export default function QuotationViewPage() {
  const params = useParams()
  const router = useRouter()

  const quotationId = String(params.id)

  const [profile, setProfile] =
    useState<UserProfile | null>(null)

  const [quotation, setQuotation] =
    useState<Quotation | null>(null)

  const [
    quotationMaterials,
    setQuotationMaterials,
  ] = useState<QuotationMaterial[]>([])

  const [loading, setLoading] =
    useState(true)

  const [
    submitting,
    setSubmitting,
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
      ] = await Promise.all([
        supabase
          .from('quotations')
          .select('*')
          .eq('id', quotationId)
          .single(),

        supabase
          .from('quotation_materials')
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
            'created_at',
            {
              ascending: true,
            }
          ),
      ])

      if (quotationResult.error) {
        throw quotationResult.error
      }

      if (materialsResult.error) {
        throw materialsResult.error
      }

      setQuotation(
        quotationResult.data as Quotation
      )

      setQuotationMaterials(
        (materialsResult.data ||
          []) as QuotationMaterial[]
      )
    } catch (error: any) {
      console.error(
        'Quotation view load error:',
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

  function getStatus() {
    return String(
      quotation?.status ||
        'draft'
    ).toLowerCase()
  }

  function canEdit() {
    if (
      !profile ||
      !quotation
    ) {
      return false
    }

    const status =
      getStatus()

    if (
      profile.role === 'admin'
    ) {
      return true
    }

    if (
      profile.role ===
      'estimator'
    ) {
      return (
        status === 'draft' ||
        status === 'rejected'
      )
    }

    return false
  }

  function canSubmitForApproval() {
    if (
      !profile ||
      !quotation
    ) {
      return false
    }

    if (
      profile.role !==
        'admin' &&
      profile.role !==
        'estimator'
    ) {
      return false
    }

    const status =
      getStatus()

    return (
      status === 'draft' ||
      status === 'rejected'
    )
  }

  async function submitForApproval() {
    if (
      !profile ||
      !quotation
    ) {
      return
    }

    if (
      profile.role !==
        'admin' &&
      profile.role !==
        'estimator'
    ) {
      alert(
        'You are not allowed to submit this costing.'
      )

      return
    }

    const currentStatus =
      getStatus()

    if (
      currentStatus !==
        'draft' &&
      currentStatus !==
        'rejected'
    ) {
      alert(
        'This costing cannot be submitted.'
      )

      return
    }

    const confirmed =
      window.confirm(
        `Submit ${quotation.quotation_no} for approval?\n\nAfter submitting, the costing status will change to Pending.`
      )

    if (!confirmed) {
      return
    }

    setSubmitting(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const {
        error: updateError,
      } = await supabase
        .from('quotations')
        .update({
          status: 'pending',
          rejection_reason: null,
          updated_at:
            new Date().toISOString(),
        })
        .eq(
          'id',
          quotation.id
        )

      if (updateError) {
        throw updateError
      }

      const {
        error: logError,
      } = await supabase
        .from('quotation_logs')
        .insert({
          quotation_id:
            quotation.id,

          quotation_no:
            quotation.quotation_no,

          action: 'SUBMIT',

          details:
            `Submitted for approval - ${
              quotation.customer_name ||
              ''
            } ${
              quotation.project_name ||
              ''
            }`.trim(),

          performed_by:
            profile.full_name ||
            profile.email ||
            'User',
        })

      if (logError) {
        console.error(
          'Submit log error:',
          logError
        )
      }

      setSuccessMessage(
        `${quotation.quotation_no} submitted for approval.`
      )

      await loadPage()
    } catch (error: any) {
      console.error(
        'Submit approval error:',
        error
      )

      setErrorMessage(
        error?.message ||
          'Unable to submit for approval.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  function formatRM(
    value: number | null
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

  function formatDate(
    value: string | null
  ) {
    if (!value) {
      return '-'
    }

    return new Date(
      value
    ).toLocaleDateString(
      'en-MY',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }
    )
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

  const status =
    getStatus()

  return (
    <main className="page">
      <header className="topBar">
        <Link
          href="/cost-listings"
          className="backButton"
        >
          ←
        </Link>

        <div className="titleBlock">
          <div className="topTitle">
            {
              quotation.quotation_no
            }
          </div>

          <div className="topSubtitle">
            Costing Details
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

      {successMessage && (
        <div className="successBox">
          {successMessage}
        </div>
      )}

      <section className="heroCard">
        <div>
          <div className="heroLabel">
            Project
          </div>

          <div className="heroTitle">
            {quotation.project_name ||
              'Untitled Project'}
          </div>

          <div className="heroCustomer">
            {quotation.customer_name ||
              'No Customer'}
          </div>
        </div>

        <div className="heroDate">
          <span>
            Date
          </span>

          <strong>
            {formatDate(
              quotation.quotation_date
            )}
          </strong>
        </div>
      </section>

      {status ===
        'rejected' &&
        quotation.rejection_reason && (
          <section className="rejectionSection">
            <div className="rejectionTitle">
              Rejection Reason
            </div>

            <div className="rejectionText">
              {
                quotation.rejection_reason
              }
            </div>

            {profile?.role ===
              'estimator' && (
                <div className="rejectionHint">
                  Please revise the
                  costing and
                  resubmit for
                  approval.
                </div>
              )}
          </section>
        )}

      <section className="section">
        <h2>
          Cost Summary
        </h2>

        <div className="summaryGrid">
          <SummaryCard
            label="Material"
            value={formatRM(
              quotation.material_cost
            )}
          />

          <SummaryCard
            label="Labour"
            value={formatRM(
              quotation.labour_cost
            )}
          />

          <SummaryCard
            label="Transport"
            value={formatRM(
              quotation.transport_cost
            )}
          />

          <SummaryCard
            label="Installation"
            value={formatRM(
              quotation.installation_cost
            )}
          />

          <SummaryCard
            label="Dismantling"
            value={formatRM(
              quotation.dismantling_cost
            )}
          />

          <SummaryCard
            label="Total Cost"
            value={formatRM(
              quotation.total_cost
            )}
            strong
          />
        </div>
      </section>

      <section className="section">
        <h2>
          Selling Summary
        </h2>

        <div className="priceBox">
          <PriceLine
            label="Target Margin"
            value={`${Number(
              quotation.target_margin ||
                0
            ).toFixed(
              2
            )}%`}
          />

          <PriceLine
            label="Selling Price"
            value={formatRM(
              quotation.selling_price
            )}
            strong
          />

          <PriceLine
            label="Gross Profit"
            value={formatRM(
              quotation.gross_profit
            )}
          />

          <PriceLine
            label="Gross Margin"
            value={`${Number(
              quotation.gross_margin ||
                0
            ).toFixed(
              2
            )}%`}
          />
        </div>
      </section>

      <section className="section">
        <div className="sectionHeader">
          <div>
            <h2>
              Materials
            </h2>

            <p>
              Detailed material
              costing
            </p>
          </div>
        </div>

        {quotationMaterials.length ===
        0 ? (
          <div className="emptyBox">
            No materials recorded.
          </div>
        ) : (
          <div className="materialList">
            {quotationMaterials.map(
              (
                item,
                index
              ) => {
                const material =
                  item.materials?.[0]

                return (
                  <div
                    key={
                      item.id
                    }
                    className="materialCard"
                  >
                    <div className="materialTop">
                      <div>
                        <div className="materialNumber">
                          Material{' '}
                          {index + 1}
                        </div>

                        <div className="materialName">
                          {material?.name ||
                            'Unknown Material'}
                        </div>

                        <div className="itemDescription">
                          {item.item_description ||
                            '-'}
                        </div>
                      </div>

                      <strong className="materialCost">
                        {formatRM(
                          item.material_cost
                        )}
                      </strong>
                    </div>

                    <div className="detailGrid">
                      <DetailItem
                        label="Qty"
                        value={String(
                          item.quantity ||
                            0
                        )}
                      />

                      <DetailItem
                        label="Required"
                        value={`${Number(
                          item.required_qty ||
                            0
                        ).toFixed(
                          2
                        )} ${
                          material?.unit ||
                          ''
                        }`}
                      />

                      <DetailItem
                        label="Width"
                        value={`${Number(
                          item.width_mm ||
                            0
                        )} mm`}
                      />

                      <DetailItem
                        label="Height"
                        value={`${Number(
                          item.height_mm ||
                            0
                        )} mm`}
                      />

                      <DetailItem
                        label="Length"
                        value={`${Number(
                          item.length_mm ||
                            0
                        )} mm`}
                      />
                    </div>
                  </div>
                )
              }
            )}
          </div>
        )}
      </section>

      <div className="actions">
        {canEdit() && (
          <Link
            href={`/quotations/${quotation.id}/edit`}
            className="editButton"
          >
            Edit Costing
          </Link>
        )}

        {canSubmitForApproval() && (
          <button
            type="button"
            onClick={
              submitForApproval
            }
            disabled={
              submitting
            }
            className="submitButton"
          >
            {submitting
              ? 'Submitting...'
              : status ===
                  'rejected'
              ? 'Resubmit for Approval'
              : 'Submit for Approval'}
          </button>
        )}
      </div>

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
          max-width: 950px;
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

        .titleBlock {
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
          border: 1px solid #e5e7eb;
          text-decoration: none;
          color: #0f766e;
          font-size: 24px;
          font-weight: 700;
        }

        .topTitle {
          font-size: 23px;
          font-weight: 800;
          color: #111827;
        }

        .topSubtitle {
          margin-top: 3px;
          color: #6b7280;
          font-size: 12px;
        }

        .heroCard {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          background: linear-gradient(
            135deg,
            #0f766e,
            #115e59
          );
          color: white;
          padding: 20px;
          border-radius: 20px;
          margin-bottom: 18px;
        }

        .heroLabel {
          font-size: 11px;
          opacity: 0.75;
        }

        .heroTitle {
          margin-top: 5px;
          font-size: 22px;
          font-weight: 800;
        }

        .heroCustomer {
          margin-top: 5px;
          font-size: 13px;
          opacity: 0.9;
        }

        .heroDate {
          display: flex;
          flex-direction: column;
          text-align: right;
          font-size: 12px;
        }

        .heroDate span {
          opacity: 0.75;
          margin-bottom: 5px;
        }

        .rejectionSection {
          background: #fff1f2;
          border: 1px solid #fecdd3;
          border-radius: 16px;
          padding: 15px;
          margin-bottom: 16px;
        }

        .rejectionTitle {
          color: #9f1239;
          font-size: 13px;
          font-weight: 800;
        }

        .rejectionText {
          margin-top: 6px;
          color: #881337;
          font-size: 14px;
          line-height: 1.5;
          white-space: pre-wrap;
        }

        .rejectionHint {
          margin-top: 9px;
          padding-top: 9px;
          border-top: 1px solid #fecdd3;
          color: #9f1239;
          font-size: 12px;
        }

        .section {
          background: white;
          border: 1px solid #e8ecf1;
          border-radius: 18px;
          padding: 17px;
          margin-bottom: 16px;
        }

        .section h2 {
          margin: 0 0 14px;
          font-size: 19px;
          color: #111827;
        }

        .sectionHeader p {
          margin: -8px 0 14px;
          color: #6b7280;
          font-size: 12px;
        }

        .summaryGrid {
          display: grid;
          grid-template-columns:
            repeat(
              3,
              minmax(0, 1fr)
            );
          gap: 10px;
        }

        .summaryCard {
          padding: 13px;
          border-radius: 12px;
          background: #f8fafc;
        }

        .summaryLabel {
          font-size: 11px;
          color: #6b7280;
        }

        .summaryValue {
          margin-top: 5px;
          font-size: 14px;
          font-weight: 700;
          color: #111827;
        }

        .summaryValueStrong {
          color: #0f766e;
          font-size: 16px;
        }

        .priceBox {
          background: #f8fafc;
          border-radius: 14px;
          padding: 12px 14px;
        }

        .priceLine {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          padding: 7px 0;
          color: #374151;
          font-size: 14px;
        }

        .priceLineStrong {
          font-size: 17px;
          color: #0f766e;
        }

        .materialList {
          display: grid;
          gap: 10px;
        }

        .materialCard {
          border: 1px solid #e5e7eb;
          border-radius: 14px;
          padding: 13px;
          background: #fafbfc;
        }

        .materialTop {
          display: flex;
          justify-content: space-between;
          gap: 12px;
        }

        .materialNumber {
          font-size: 10px;
          color: #9ca3af;
        }

        .materialName {
          margin-top: 3px;
          font-weight: 800;
          color: #111827;
        }

        .itemDescription {
          margin-top: 3px;
          color: #6b7280;
          font-size: 12px;
        }

        .materialCost {
          color: #0f766e;
        }

        .detailGrid {
          display: grid;
          grid-template-columns:
            repeat(
              5,
              minmax(0, 1fr)
            );
          gap: 8px;
          margin-top: 12px;
        }

        .detailItem {
          background: white;
          border-radius: 9px;
          padding: 8px;
        }

        .detailLabel {
          font-size: 9px;
          color: #9ca3af;
        }

        .detailValue {
          margin-top: 3px;
          font-size: 11px;
          font-weight: 700;
          color: #374151;
          word-break: break-word;
        }

        .actions {
          display: grid;
          grid-template-columns:
            repeat(
              2,
              minmax(0, 1fr)
            );
          gap: 10px;
        }

        .editButton,
        .submitButton {
          min-height: 48px;
          border-radius: 13px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 800;
          text-decoration: none;
          cursor: pointer;
        }

        .editButton {
          border: 1px solid #0f766e;
          background: white;
          color: #0f766e;
        }

        .submitButton {
          border: none;
          background: #0f766e;
          color: white;
        }

        .submitButton:disabled {
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
          background: #f3f4f6;
          color: #4b5563;
        }

        .statusPending {
          background: #fef3c7;
          color: #92400e;
        }

        .statusApproved {
          background: #dcfce7;
          color: #166534;
        }

        .statusRejected {
          background: #fee2e2;
          color: #991b1b;
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

        .emptyBox {
          color: #6b7280;
          font-size: 13px;
        }

        @media (
          max-width: 650px
        ) {
          .heroCard {
            flex-direction: column;
          }

          .heroDate {
            text-align: left;
          }

          .summaryGrid {
            grid-template-columns:
              repeat(
                2,
                minmax(0, 1fr)
              );
          }

          .detailGrid {
            grid-template-columns:
              repeat(
                2,
                minmax(0, 1fr)
              );
          }

          .actions {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
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

function SummaryCard({
  label,
  value,
  strong = false,
}: {
  label: string
  value: string
  strong?: boolean
}) {
  return (
    <div className="summaryCard">
      <div className="summaryLabel">
        {label}
      </div>

      <div
        className={
          strong
            ? 'summaryValue summaryValueStrong'
            : 'summaryValue'
        }
      >
        {value}
      </div>
    </div>
  )
}

function PriceLine({
  label,
  value,
  strong = false,
}: {
  label: string
  value: string
  strong?: boolean
}) {
  return (
    <div
      className={
        strong
          ? 'priceLine priceLineStrong'
          : 'priceLine'
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

function DetailItem({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="detailItem">
      <div className="detailLabel">
        {label}
      </div>

      <div className="detailValue">
        {value}
      </div>
    </div>
  )
}