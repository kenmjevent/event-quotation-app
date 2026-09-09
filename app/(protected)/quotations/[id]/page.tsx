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
} from '../../../../lib/supabase'

import {
  getCurrentProfile,
  type UserProfile,
} from '../../../../lib/authRole'

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

  total_cost: number | null
  selling_price: number | null
  gross_profit: number | null
  gross_margin: number | null

  created_at: string | null
  updated_at: string | null
}

type ActivityLog = {
  id: string
  action: string | null
  details: string | null
  performed_by: string | null
  created_at: string
}

type GroupedMaterial = {
  description: string
  materials: QuotationMaterial[]
}

export default function QuotationViewPage() {
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
    materialRows,
    setMaterialRows,
  ] =
    useState<QuotationMaterial[]>(
      []
    )

  const [
    activityLogs,
    setActivityLogs,
  ] =
    useState<ActivityLog[]>(
      []
    )

  const [
    loading,
    setLoading,
  ] =
    useState(true)

  const [
    submitting,
    setSubmitting,
  ] =
    useState(false)

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState('')

  const [
    successMessage,
    setSuccessMessage,
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
        router.replace(
          '/login'
        )

        return
      }

      setProfile(
        currentProfile
      )

      const [
        quotationResult,
        materialsResult,
        logsResult,
      ] =
        await Promise.all([
          supabase
            .from(
              'quotations'
            )
            .select(`
              id,
              quotation_no,
              customer_name,
              project_name,
              quotation_date,
              status,
              rejection_reason,
              target_margin,
              material_cost,
              labour_cost,
              transport_cost,
              installation_cost,
              dismantling_cost,
              total_cost,
              selling_price,
              gross_profit,
              gross_margin,
              created_at,
              updated_at
            `)
            .eq(
              'id',
              quotationId
            )
            .single(),

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
                ascending:
                  true,
              }
            ),

          supabase
            .from(
              'quotation_logs'
            )
            .select(`
              id,
              action,
              details,
              performed_by,
              created_at
            `)
            .eq(
              'quotation_id',
              quotationId
            )
            .order(
              'created_at',
              {
                ascending:
                  false,
              }
            )
            .limit(50),
        ])

      if (
        quotationResult.error
      ) {
        throw quotationResult.error
      }

      if (
        materialsResult.error
      ) {
        throw materialsResult.error
      }

      setQuotation(
        quotationResult.data
      )

      setMaterialRows(
        materialsResult.data ||
          []
      )

      if (
        logsResult.error
      ) {
        console.error(
          'Quotation log error:',
          logsResult.error
        )
      } else {
        setActivityLogs(
          logsResult.data ||
            []
        )
      }
    } catch (
      error: any
    ) {
      console.error(
        'Quotation view error:',
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

  const groupedMaterials =
    useMemo(() => {
      const groups =
        new Map<
          string,
          QuotationMaterial[]
        >()

      materialRows.forEach(
        (row) => {
          const description =
            row.item_description
              ?.trim() ||
            'Costing Item'

          const existing =
            groups.get(
              description
            ) || []

          existing.push(
            row
          )

          groups.set(
            description,
            existing
          )
        }
      )

      return Array.from(
        groups.entries()
      ).map(
        (
          [
            description,
            materials,
          ]
        ): GroupedMaterial => ({
          description,
          materials,
        })
      )
    }, [
      materialRows,
    ])

  function currentStatus() {
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
      currentStatus()

    if (
      profile.role ===
      'admin'
    ) {
      return true
    }

    if (
      profile.role ===
      'estimator'
    ) {
      return (
        status ===
          'draft' ||
        status ===
          'rejected'
      )
    }

    return false
  }

  function canSubmit() {
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
      currentStatus()

    return (
      status === 'draft' ||
      status ===
        'rejected'
    )
  }

  async function submitForApproval() {
    if (
      !quotation ||
      !profile
    ) {
      return
    }

    if (
      !canSubmit()
    ) {
      return
    }

    const isRejected =
      currentStatus() ===
      'rejected'

    const confirmed =
      window.confirm(
        isRejected
          ? `Resubmit ${quotation.quotation_no} for approval?`
          : `Submit ${quotation.quotation_no} for approval?`
      )

    if (
      !confirmed
    ) {
      return
    }

    setSubmitting(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const {
        error:
          updateError,
      } =
        await supabase
          .from(
            'quotations'
          )
          .update({
            status:
              'pending',

            rejection_reason:
              null,

            updated_at:
              new Date()
                .toISOString(),
          })
          .eq(
            'id',
            quotation.id
          )

      if (
        updateError
      ) {
        throw updateError
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
              'SUBMIT',

            details:
              isRejected
                ? 'Rejected costing resubmitted for approval.'
                : 'Costing submitted for approval.',

            performed_by:
              profile.full_name ||
              profile.email ||
              'User',
          })

      if (
        logError
      ) {
        console.error(
          'Submit log error:',
          logError
        )
      }

      setSuccessMessage(
        isRejected
          ? 'Costing resubmitted for approval.'
          : 'Costing submitted for approval.'
      )

      await loadPage()
    } catch (
      error: any
    ) {
      console.error(
        'Submit error:',
        error
      )

      setErrorMessage(
        error?.message ||
          'Unable to submit costing.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  function formatRM(
    value:
      | number
      | null
      | undefined
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

  function formatNumber(
    value:
      | number
      | null
      | undefined
  ) {
    return Number(
      value || 0
    ).toLocaleString(
      'en-MY',
      {
        maximumFractionDigits:
          2,
      }
    )
  }

  function formatDate(
    value:
      | string
      | null
  ) {
    if (!value) {
      return '-'
    }

    return new Date(
      value
    ).toLocaleDateString(
      'en-MY',
      {
        day:
          '2-digit',
        month:
          'short',
        year:
          'numeric',
      }
    )
  }

  function formatDateTime(
    value: string
  ) {
    return new Date(
      value
    ).toLocaleString(
      'en-MY',
      {
        day:
          '2-digit',
        month:
          'short',
        year:
          'numeric',
        hour:
          '2-digit',
        minute:
          '2-digit',
      }
    )
  }

  function dimensionText(
    row: QuotationMaterial
  ) {
    const material =
      row.materials?.[0]

    const unit =
      String(
        material?.unit ||
          ''
      ).toLowerCase()

    if (
      unit ===
        'sheet' ||
      unit ===
        'sqft'
    ) {
      return `${formatNumber(
        row.width_mm
      )} × ${formatNumber(
        row.height_mm
      )} mm`
    }

    if (
      unit === 'ft'
    ) {
      return `${formatNumber(
        row.length_mm
      )} mm`
    }

    return '-'
  }

  if (
    loading
  ) {
    return (
      <main className="loadingPage">
        Loading costing...
      </main>
    )
  }

  if (
    !quotation
  ) {
    return (
      <main className="notFoundPage">
        <div className="notFoundCard">
          <h2>
            Costing Not Found
          </h2>

          <Link
            href="/cost-listings"
            className="backListingsButton"
          >
            Back to Cost Listings
          </Link>
        </div>
      </main>
    )
  }

  const status =
    currentStatus()

  return (
    <main className="page">
      <header className="topBar">
        <Link
          href="/cost-listings"
          className="backButton"
        >
          ←
        </Link>

        <div className="titleArea">
          <div className="topTitle">
            Costing Details
          </div>

          <div className="topSubtitle">
            {quotation.quotation_no}
          </div>
        </div>

        <StatusBadge
          status={status}
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
          <div className="heroNo">
            {
              quotation.quotation_no
            }
          </div>

          <h1>
            {quotation.project_name ||
              'Untitled Project'}
          </h1>

          <p>
            {quotation.customer_name ||
              'No Customer'}
          </p>
        </div>

        <div className="heroDate">
          <span>
            Costing Date
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
          <section className="rejectionBox">
            <div className="rejectionIcon">
              !
            </div>

            <div>
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
                  Edit the costing,
                  make the required
                  changes and resubmit
                  for approval.
                </div>
              )}
            </div>
          </section>
        )}

      <section className="infoSection">
        <h2>
          Project Information
        </h2>

        <div className="infoGrid">
          <InfoCard
            label="Costing No."
            value={
              quotation.quotation_no
            }
          />

          <InfoCard
            label="Date"
            value={formatDate(
              quotation.quotation_date
            )}
          />

          <InfoCard
            label="Customer"
            value={
              quotation.customer_name ||
              '-'
            }
          />

          <InfoCard
            label="Project"
            value={
              quotation.project_name ||
              '-'
            }
          />
        </div>
      </section>

      <section className="materialsSection">
        <div className="sectionHeading">
          <div>
            <h2>
              Costing Items
            </h2>

            <p>
              Material breakdown
            </p>
          </div>

          <div className="materialTotalBadge">
            {formatRM(
              quotation.material_cost
            )}
          </div>
        </div>

        {groupedMaterials.length ===
        0 ? (
          <div className="emptyMaterials">
            No material items.
          </div>
        ) : (
          <div className="itemList">
            {groupedMaterials.map(
              (
                group,
                index
              ) => (
                <div
                  key={`${group.description}-${index}`}
                  className="itemCard"
                >
                  <div className="itemHeader">
                    <div className="itemNumber">
                      Item{' '}
                      {index + 1}
                    </div>

                    <div className="itemDescription">
                      {
                        group.description
                      }
                    </div>
                  </div>

                  <div className="desktopMaterials">
                    <table>
                      <thead>
                        <tr>
                          <th>
                            Material
                          </th>

                          <th>
                            Dimension
                          </th>

                          <th>
                            Qty
                          </th>

                          <th>
                            Required
                          </th>

                          <th>
                            Cost
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {group.materials.map(
                          (row) => {
                            const material =
                              row.materials?.[0]

                            return (
                              <tr
                                key={
                                  row.id
                                }
                              >
                                <td>
                                  <strong className="materialName">
                                    {material?.name ||
                                      '-'}
                                  </strong>

                                  <div className="materialUnit">
                                    {material?.unit ||
                                      '-'}
                                  </div>
                                </td>

                                <td>
                                  {dimensionText(
                                    row
                                  )}
                                </td>

                                <td>
                                  {formatNumber(
                                    row.quantity
                                  )}
                                </td>

                                <td>
                                  {formatNumber(
                                    row.required_qty
                                  )}

                                  {' '}

                                  {material?.unit ||
                                    ''}
                                </td>

                                <td>
                                  <strong className="materialCost">
                                    {formatRM(
                                      row.material_cost
                                    )}
                                  </strong>
                                </td>
                              </tr>
                            )
                          }
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="mobileMaterials">
                    {group.materials.map(
                      (row) => {
                        const material =
                          row.materials?.[0]

                        return (
                          <div
                            key={
                              row.id
                            }
                            className="mobileMaterialCard"
                          >
                            <div className="mobileMaterialTop">
                              <strong>
                                {material?.name ||
                                  '-'}
                              </strong>

                              <span>
                                {formatRM(
                                  row.material_cost
                                )}
                              </span>
                            </div>

                            <div className="mobileMaterialGrid">
                              <MiniInfo
                                label="Unit"
                                value={
                                  material?.unit ||
                                  '-'
                                }
                              />

                              <MiniInfo
                                label="Dimension"
                                value={dimensionText(
                                  row
                                )}
                              />

                              <MiniInfo
                                label="Qty"
                                value={formatNumber(
                                  row.quantity
                                )}
                              />

                              <MiniInfo
                                label="Required"
                                value={`${formatNumber(
                                  row.required_qty
                                )} ${
                                  material?.unit ||
                                  ''
                                }`}
                              />
                            </div>
                          </div>
                        )
                      }
                    )}
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </section>

      <section className="costSection">
        <h2>
          Other Costs
        </h2>

        <div className="costGrid">
          <CostCard
            label="Material"
            value={formatRM(
              quotation.material_cost
            )}
          />

          <CostCard
            label="Labour"
            value={formatRM(
              quotation.labour_cost
            )}
          />

          <CostCard
            label="Transport"
            value={formatRM(
              quotation.transport_cost
            )}
          />

          <CostCard
            label="Installation"
            value={formatRM(
              quotation.installation_cost
            )}
          />

          <CostCard
            label="Dismantling"
            value={formatRM(
              quotation.dismantling_cost
            )}
          />
        </div>
      </section>

      <section className="summarySection">
        <h2>
          Costing Summary
        </h2>

        <SummaryLine
          label="Total Cost"
          value={formatRM(
            quotation.total_cost
          )}
        />

        <SummaryLine
          label="Target Margin"
          value={`${Number(
            quotation.target_margin ||
              0
          ).toFixed(2)}%`}
        />

        <div className="summaryDivider" />

        <SummaryLine
          label="SELLING PRICE"
          value={formatRM(
            quotation.selling_price
          )}
          highlight
        />

        <SummaryLine
          label="Gross Profit"
          value={formatRM(
            quotation.gross_profit
          )}
        />

        <SummaryLine
          label="Gross Margin"
          value={`${Number(
            quotation.gross_margin ||
              0
          ).toFixed(2)}%`}
        />
      </section>

      <section className="actionSection">
        {canEdit() && (
          <Link
            href={`/quotations/${quotation.id}/edit`}
            className="editCostingButton"
          >
            Edit Costing
          </Link>
        )}

        {canSubmit() && (
          <button
            type="button"
            disabled={
              submitting
            }
            onClick={
              submitForApproval
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

        {status ===
          'pending' && (
          <div className="pendingMessage">
            ⏳ This costing is
            waiting for approval.
          </div>
        )}

        {status ===
          'approved' && (
          <div className="approvedMessage">
            ✓ This costing has
            been approved.
          </div>
        )}
      </section>

      <section className="activitySection">
        <div className="sectionHeading">
          <div>
            <h2>
              Activity
            </h2>

            <p>
              Costing history
            </p>
          </div>
        </div>

        {activityLogs.length ===
        0 ? (
          <div className="emptyActivity">
            No activity recorded.
          </div>
        ) : (
          <div className="activityList">
            {activityLogs.map(
              (log) => (
                <div
                  key={
                    log.id
                  }
                  className="activityItem"
                >
                  <div className="activityBadgeArea">
                    <ActivityBadge
                      action={
                        log.action ||
                        ''
                      }
                    />
                  </div>

                  <div className="activityContent">
                    <div className="activityTop">
                      <strong>
                        {log.performed_by ||
                          '-'}
                      </strong>

                      <span>
                        {formatDateTime(
                          log.created_at
                        )}
                      </span>
                    </div>

                    <div className="activityDetails">
                      {log.details ||
                        '-'}
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </section>

      <Link
        href="/cost-listings"
        className="backToListings"
      >
        ← Back to Cost Listings
      </Link>

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
            1050px;

          margin:
            0 auto;

          padding:
            18px
            14px
            50px;
        }

        .loadingPage,
        .notFoundPage {
          min-height:
            100vh;

          display:
            flex;

          align-items:
            center;

          justify-content:
            center;

          padding:
            20px;

          background:
            var(--mj-background);

          color:
            var(--mj-primary);

          font-weight:
            700;
        }

        .notFoundCard {
          width:
            100%;

          max-width:
            420px;

          padding:
            24px;

          text-align:
            center;

          background:
            white;

          border:
            1px solid
            var(--mj-border);

          border-radius:
            20px;
        }

        .notFoundCard h2 {
          color:
            var(--mj-text);
        }

        .backListingsButton {
          display:
            block;

          margin-top:
            15px;

          padding:
            12px;

          border-radius:
            11px;

          background:
            var(--mj-primary);

          color:
            white;

          text-decoration:
            none;
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

        .titleArea {
          flex: 1;
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
            var(--mj-primary-deep);

          font-size:
            12px;

          font-weight:
            700;
        }

        .heroCard {
          display:
            flex;

          align-items:
            center;

          justify-content:
            space-between;

          gap:
            20px;

          padding:
            24px;

          margin-bottom:
            16px;

          border-radius:
            22px;

          background:
            linear-gradient(
              135deg,
              var(--mj-primary),
              var(--mj-primary-dark),
              var(--mj-primary-deep)
            );

          color:
            white;

          box-shadow:
            0
            14px
            32px
            rgba(
              7,
              89,
              133,
              0.16
            );
        }

        .heroNo {
          font-size:
            12px;

          font-weight:
            800;

          opacity:
            0.85;
        }

        .heroCard h1 {
          margin:
            7px 0 0;

          font-size:
            26px;

          line-height:
            1.2;
        }

        .heroCard p {
          margin:
            7px 0 0;

          opacity:
            0.9;

          font-size:
            14px;
        }

        .heroDate {
          flex:
            0 0 auto;

          padding:
            12px
            15px;

          border-radius:
            13px;

          text-align:
            right;

          background:
            rgba(
              255,
              255,
              255,
              0.15
            );

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              0.3
            );
        }

        .heroDate span {
          display:
            block;

          font-size:
            10px;

          opacity:
            0.8;
        }

        .heroDate strong {
          display:
            block;

          margin-top:
            4px;

          font-size:
            13px;
        }

        .infoSection,
        .materialsSection,
        .costSection,
        .summarySection,
        .activitySection {
          padding:
            18px;

          margin-bottom:
            16px;

          background:
            white;

          border:
            1px solid
            var(--mj-border);

          border-radius:
            20px;

          box-shadow:
            0
            8px
            24px
            rgba(
              7,
              89,
              133,
              0.045
            );
        }

        .infoSection h2,
        .materialsSection h2,
        .costSection h2,
        .summarySection h2,
        .activitySection h2 {
          margin: 0;

          color:
            var(--mj-text);

          font-size:
            19px;
        }

        .sectionHeading {
          display:
            flex;

          align-items:
            flex-start;

          justify-content:
            space-between;

          gap:
            12px;

          margin-bottom:
            15px;
        }

        .sectionHeading p {
          margin:
            4px 0 0;

          color:
            var(--mj-muted);

          font-size:
            11px;
        }

        .materialTotalBadge {
          padding:
            8px
            11px;

          border-radius:
            10px;

          background:
            var(--mj-light);

          color:
            var(--mj-primary-deep);

          font-size:
            12px;

          font-weight:
            800;
        }

        .infoGrid {
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
            10px;

          margin-top:
            14px;
        }

        .infoCard {
          padding:
            13px;

          border-radius:
            13px;

          background:
            linear-gradient(
              145deg,
              #ffffff,
              #f4fbff
            );

          border:
            1px solid
            var(--mj-border);
        }

        .infoLabel {
          color:
            var(--mj-muted);

          font-size:
            10px;
        }

        .infoValue {
          margin-top:
            5px;

          color:
            var(--mj-primary-deep);

          font-size:
            13px;

          font-weight:
            800;

          word-break:
            break-word;
        }

        .rejectionBox {
          display:
            flex;

          gap:
            12px;

          padding:
            15px;

          margin-bottom:
            16px;

          border-radius:
            15px;

          background:
            #fff1f2;

          border:
            1px solid
            #fecdd3;
        }

        .rejectionIcon {
          flex:
            0 0
            34px;

          width:
            34px;

          height:
            34px;

          display:
            flex;

          align-items:
            center;

          justify-content:
            center;

          border-radius:
            50%;

          background:
            #dc2626;

          color:
            white;

          font-size:
            18px;

          font-weight:
            900;
        }

        .rejectionTitle {
          color:
            #9f1239;

          font-size:
            13px;

          font-weight:
            800;
        }

        .rejectionText {
          margin-top:
            5px;

          color:
            #881337;

          font-size:
            13px;

          line-height:
            1.5;

          white-space:
            pre-wrap;
        }

        .rejectionHint {
          margin-top:
            8px;

          color:
            #9f1239;

          font-size:
            11px;

          font-weight:
            700;
        }

        .itemList {
          display:
            grid;

          gap:
            13px;
        }

        .itemCard {
          border:
            1px solid
            var(--mj-border);

          border-radius:
            15px;

          overflow:
            hidden;
        }

        .itemHeader {
          padding:
            12px
            14px;

          background:
            var(--mj-light);

          border-bottom:
            1px solid
            var(--mj-border);
        }

        .itemNumber {
          color:
            var(--mj-primary);

          font-size:
            10px;

          font-weight:
            800;
        }

        .itemDescription {
          margin-top:
            4px;

          color:
            var(--mj-text);

          font-size:
            14px;

          font-weight:
            800;
        }

        .desktopMaterials {
          overflow-x:
            auto;
        }

        .desktopMaterials table {
          width:
            100%;

          min-width:
            700px;

          border-collapse:
            collapse;
        }

        .desktopMaterials th {
          padding:
            10px
            12px;

          text-align:
            left;

          background:
            #f8fcff;

          color:
            var(--mj-primary-deep);

          font-size:
            10px;
        }

        .desktopMaterials td {
          padding:
            11px
            12px;

          border-top:
            1px solid
            #edf4f8;

          color:
            #475569;

          font-size:
            11px;
        }

        .materialName {
          color:
            var(--mj-text);
        }

        .materialUnit {
          margin-top:
            3px;

          color:
            #94a3b8;

          font-size:
            9px;
        }

        .materialCost {
          color:
            var(--mj-primary-deep);
        }

        .mobileMaterials {
          display:
            none;
        }

        .costGrid {
          display:
            grid;

          grid-template-columns:
            repeat(
              5,
              minmax(
                0,
                1fr
              )
            );

          gap:
            9px;

          margin-top:
            14px;
        }

        .costCard {
          padding:
            13px;

          border-radius:
            13px;

          background:
            var(--mj-light);

          border:
            1px solid
            var(--mj-border);
        }

        .costLabel {
          color:
            var(--mj-muted);

          font-size:
            9px;
        }

        .costValue {
          margin-top:
            5px;

          color:
            var(--mj-primary-deep);

          font-size:
            12px;

          font-weight:
            800;

          word-break:
            break-word;
        }

        .summaryLine {
          display:
            flex;

          align-items:
            center;

          justify-content:
            space-between;

          gap:
            14px;

          padding:
            8px 0;

          color:
            #475569;

          font-size:
            13px;
        }

        .summaryLine strong {
          color:
            var(--mj-text);
        }

        .summaryDivider {
          height:
            1px;

          margin:
            8px 0;

          background:
            var(--mj-border);
        }

        .summaryHighlight {
          margin:
            8px
            -5px;

          padding:
            14px;

          border-radius:
            12px;

          background:
            linear-gradient(
              135deg,
              #e4f6fd,
              #f2fbff
            );

          border:
            1px solid
            var(--mj-border);

          color:
            var(--mj-primary-deep);

          font-size:
            17px;

          font-weight:
            800;
        }

        .summaryHighlight strong {
          color:
            var(--mj-primary-deep);
        }

        .actionSection {
          display:
            grid;

          gap:
            10px;

          margin-bottom:
            16px;
        }

        .editCostingButton,
        .submitButton {
          width:
            100%;

          min-height:
            46px;

          display:
            flex;

          align-items:
            center;

          justify-content:
            center;

          border-radius:
            12px;

          font-size:
            13px;

          font-weight:
            800;

          text-decoration:
            none;

          cursor:
            pointer;
        }

        .editCostingButton {
          background:
            var(--mj-light);

          border:
            1px solid
            var(--mj-primary);

          color:
            var(--mj-primary-deep);
        }

        .submitButton {
          border:
            none;

          background:
            linear-gradient(
              135deg,
              var(--mj-primary),
              var(--mj-primary-dark)
            );

          color:
            white;

          box-shadow:
            0
            9px
            22px
            rgba(
              7,
              152,
              212,
              0.18
            );
        }

        .submitButton:disabled {
          opacity:
            0.55;

          cursor:
            not-allowed;
        }

        .pendingMessage,
        .approvedMessage {
          padding:
            13px;

          border-radius:
            11px;

          text-align:
            center;

          font-size:
            12px;

          font-weight:
            800;
        }

        .pendingMessage {
          background:
            #fef3c7;

          color:
            #92400e;

          border:
            1px solid
            #fde68a;
        }

        .approvedMessage {
          background:
            #dcfce7;

          color:
            #166534;

          border:
            1px solid
            #bbf7d0;
        }

        .activityList {
          border:
            1px solid
            var(--mj-border);

          border-radius:
            14px;

          overflow:
            hidden;
        }

        .activityItem {
          display:
            flex;

          gap:
            12px;

          padding:
            12px;

          border-bottom:
            1px solid
            #edf4f8;
        }

        .activityItem:last-child {
          border-bottom:
            none;
        }

        .activityBadgeArea {
          flex:
            0 0 auto;
        }

        .activityContent {
          flex: 1;

          min-width:
            0;
        }

        .activityTop {
          display:
            flex;

          align-items:
            center;

          justify-content:
            space-between;

          gap:
            10px;
        }

        .activityTop strong {
          color:
            var(--mj-primary-deep);

          font-size:
            11px;
        }

        .activityTop span {
          color:
            #94a3b8;

          font-size:
            9px;
        }

        .activityDetails {
          margin-top:
            5px;

          color:
            #64748b;

          font-size:
            11px;

          line-height:
            1.5;
        }

        .activityBadge {
          display:
            inline-flex;

          padding:
            5px
            8px;

          border-radius:
            999px;

          font-size:
            9px;

          font-weight:
            800;
        }

        .activityBlue {
          background:
            var(--mj-light);

          color:
            var(--mj-primary-deep);
        }

        .activityGreen {
          background:
            #dcfce7;

          color:
            #166534;
        }

        .activityRed {
          background:
            #fee2e2;

          color:
            #991b1b;
        }

        .activityGrey {
          background:
            #f1f5f9;

          color:
            #475569;
        }

        .emptyMaterials,
        .emptyActivity {
          padding:
            16px;

          border-radius:
            12px;

          background:
            #f8fcff;

          color:
            var(--mj-muted);

          font-size:
            12px;
        }

        .backToListings {
          display:
            block;

          padding:
            12px;

          text-align:
            center;

          border-radius:
            11px;

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
            12px;

          font-weight:
            800;
        }

        .statusBadge {
          display:
            inline-flex;

          padding:
            6px
            10px;

          border-radius:
            999px;

          font-size:
            10px;

          font-weight:
            800;

          text-transform:
            capitalize;
        }

        .statusDraft {
          background:
            var(--status-draft-bg);

          color:
            var(--status-draft-text);
        }

        .statusPending {
          background:
            var(--status-pending-bg);

          color:
            var(--status-pending-text);
        }

        .statusApproved {
          background:
            var(--status-approved-bg);

          color:
            var(--status-approved-text);
        }

        .statusRejected {
          background:
            var(--status-rejected-bg);

          color:
            var(--status-rejected-text);
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

        @media (
          max-width:
            750px
        ) {
          .costGrid {
            grid-template-columns:
              repeat(
                2,
                minmax(
                  0,
                  1fr
                )
              );
          }

          .desktopMaterials {
            display:
              none;
          }

          .mobileMaterials {
            display:
              grid;

            gap:
              9px;

            padding:
              11px;
          }

          .mobileMaterialCard {
            padding:
              11px;

            background:
              #f8fcff;

            border:
              1px solid
              var(--mj-border);

            border-radius:
              11px;
          }

          .mobileMaterialTop {
            display:
              flex;

            justify-content:
              space-between;

            gap:
              10px;
          }

          .mobileMaterialTop strong {
            color:
              var(--mj-text);

            font-size:
              12px;
          }

          .mobileMaterialTop span {
            color:
              var(--mj-primary-deep);

            font-size:
              11px;

            font-weight:
              800;
          }

          .mobileMaterialGrid {
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
              8px;

            margin-top:
              10px;
          }

          .miniLabel {
            color:
              #94a3b8;

            font-size:
              8px;
          }

          .miniValue {
            margin-top:
              3px;

            color:
              #475569;

            font-size:
              10px;

            font-weight:
              700;

            word-break:
              break-word;
          }
        }

        @media (
          max-width:
            600px
        ) {
          .heroCard {
            align-items:
              flex-start;

            flex-direction:
              column;
          }

          .heroDate {
            width:
              100%;

            text-align:
              left;
          }

          .infoGrid {
            grid-template-columns:
              1fr;
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

          .heroCard {
            padding:
              19px;
          }

          .heroCard h1 {
            font-size:
              22px;
          }

          .costGrid {
            grid-template-columns:
              1fr;
          }

          .activityTop {
            align-items:
              flex-start;

            flex-direction:
              column;
          }
        }
      `}</style>
    </main>
  )
}

function InfoCard({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="infoCard">
      <div className="infoLabel">
        {label}
      </div>

      <div className="infoValue">
        {value}
      </div>
    </div>
  )
}

function MiniInfo({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div>
      <div className="miniLabel">
        {label}
      </div>

      <div className="miniValue">
        {value}
      </div>
    </div>
  )
}

function CostCard({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="costCard">
      <div className="costLabel">
        {label}
      </div>

      <div className="costValue">
        {value}
      </div>
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

function ActivityBadge({
  action,
}: {
  action: string
}) {
  const value =
    action
      .trim()
      .toLowerCase()

  let className =
    'activityBadge activityGrey'

  if (
    value === 'create' ||
    value === 'edit' ||
    value === 'submit'
  ) {
    className =
      'activityBadge activityBlue'
  }

  if (
    value === 'approve'
  ) {
    className =
      'activityBadge activityGreen'
  }

  if (
    value === 'reject' ||
    value === 'delete'
  ) {
    className =
      'activityBadge activityRed'
  }

  return (
    <span className={className}>
      {action || 'ACTION'}
    </span>
  )
}