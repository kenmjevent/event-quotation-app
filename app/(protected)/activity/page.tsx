'use client'

import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import Link from 'next/link'

import {
  supabase,
} from '../../../lib/supabase'

type ActivityLog = {
  id: string
  quotation_id: string | null
  quotation_no: string | null
  action: string | null
  details: string | null
  performed_by: string | null
  created_at: string
}

export default function ActivityPage() {
  const [
    logs,
    setLogs,
  ] = useState<ActivityLog[]>([])

  const [
    loading,
    setLoading,
  ] = useState(true)

  const [
    search,
    setSearch,
  ] = useState('')

  const [
    actionFilter,
    setActionFilter,
  ] = useState('all')

  const [
    errorMessage,
    setErrorMessage,
  ] = useState('')

  useEffect(() => {
    loadLogs()
  }, [])

  async function loadLogs() {
    setLoading(true)
    setErrorMessage('')

    try {
      const {
        data,
        error,
      } = await supabase
        .from(
          'quotation_logs'
        )
        .select(`
          id,
          quotation_id,
          quotation_no,
          action,
          details,
          performed_by,
          created_at
        `)
        .order(
          'created_at',
          {
            ascending:
              false,
          }
        )
        .limit(200)

      if (error) {
        throw error
      }

      setLogs(
        data || []
      )
    } catch (
      error: any
    ) {
      console.error(
        'Activity load error:',
        error
      )

      setErrorMessage(
        error?.message ||
          'Unable to load activity log.'
      )
    } finally {
      setLoading(false)
    }
  }

  const filteredLogs =
    useMemo(() => {
      const keyword =
        search
          .trim()
          .toLowerCase()

      return logs.filter(
        (item) => {
          const action =
            String(
              item.action ||
                ''
            ).toLowerCase()

          const matchesAction =
            actionFilter ===
              'all' ||
            action ===
              actionFilter.toLowerCase()

          const matchesSearch =
            !keyword ||
            String(
              item.quotation_no ||
                ''
            )
              .toLowerCase()
              .includes(
                keyword
              ) ||
            String(
              item.details ||
                ''
            )
              .toLowerCase()
              .includes(
                keyword
              ) ||
            String(
              item.performed_by ||
                ''
            )
              .toLowerCase()
              .includes(
                keyword
              )

          return (
            matchesAction &&
            matchesSearch
          )
        }
      )
    }, [
      logs,
      search,
      actionFilter,
    ])

  function formatDateTime(
    value: string
  ) {
    return new Date(
      value
    ).toLocaleString(
      'en-MY',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }
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

        <div>
          <div className="topTitle">
            Activity Log
          </div>

          <div className="topSubtitle">
            Costing activity history
          </div>
        </div>
      </header>

      <section className="summaryRow">
        <div className="summaryCard">
          <div className="summaryLabel">
            Total Records
          </div>

          <div className="summaryValue">
            {logs.length}
          </div>
        </div>

        <div className="summaryCard">
          <div className="summaryLabel">
            Showing
          </div>

          <div className="summaryValue">
            {
              filteredLogs.length
            }
          </div>
        </div>
      </section>

      <section className="filterCard">
        <input
          value={search}
          onChange={(e) =>
            setSearch(
              e.target.value
            )
          }
          placeholder="Search costing no., user or details..."
          className="searchInput"
        />

        <select
          value={
            actionFilter
          }
          onChange={(e) =>
            setActionFilter(
              e.target.value
            )
          }
          className="actionSelect"
        >
          <option value="all">
            All Actions
          </option>

          <option value="create">
            CREATE
          </option>

          <option value="edit">
            EDIT
          </option>

          <option value="submit">
            SUBMIT
          </option>

          <option value="approve">
            APPROVE
          </option>

          <option value="reject">
            REJECT
          </option>

          <option value="delete">
            DELETE
          </option>
        </select>

        <button
          type="button"
          onClick={
            loadLogs
          }
          className="refreshButton"
        >
          Refresh
        </button>
      </section>

      {errorMessage && (
        <div className="errorBox">
          {errorMessage}
        </div>
      )}

      {loading && (
        <div className="emptyCard">
          Loading activity...
        </div>
      )}

      {!loading &&
        filteredLogs.length ===
          0 && (
          <div className="emptyCard">
            No activity found.
          </div>
        )}

      {!loading &&
        filteredLogs.length >
          0 && (
          <>
            <div className="desktopTable">
              <table>
                <thead>
                  <tr>
                    <th>
                      Date / Time
                    </th>

                    <th>
                      Costing No.
                    </th>

                    <th>
                      Action
                    </th>

                    <th>
                      Details
                    </th>

                    <th>
                      Performed By
                    </th>

                    <th>
                      View
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredLogs.map(
                    (item) => (
                      <tr
                        key={
                          item.id
                        }
                      >
                        <td className="dateCell">
                          {formatDateTime(
                            item.created_at
                          )}
                        </td>

                        <td>
                          <strong className="quotationNo">
                            {
                              item.quotation_no ||
                              '-'
                            }
                          </strong>
                        </td>

                        <td>
                          <ActionBadge
                            action={
                              item.action ||
                              ''
                            }
                          />
                        </td>

                        <td className="detailsCell">
                          {
                            item.details ||
                            '-'
                          }
                        </td>

                        <td>
                          <span className="userName">
                            {
                              item.performed_by ||
                              '-'
                            }
                          </span>
                        </td>

                        <td>
                          {item.quotation_id ? (
                            <Link
                              href={`/quotations/${item.quotation_id}`}
                              className="viewButton"
                            >
                              View
                            </Link>
                          ) : (
                            <span className="deletedText">
                              Deleted
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>

            <div className="mobileCards">
              {filteredLogs.map(
                (item) => (
                  <section
                    key={
                      item.id
                    }
                    className="activityCard"
                  >
                    <div className="cardTop">
                      <div>
                        <div className="quotationNoMobile">
                          {
                            item.quotation_no ||
                            '-'
                          }
                        </div>

                        <div className="dateText">
                          {formatDateTime(
                            item.created_at
                          )}
                        </div>
                      </div>

                      <ActionBadge
                        action={
                          item.action ||
                          ''
                        }
                      />
                    </div>

                    <div className="detailsBox">
                      <div className="detailsLabel">
                        Details
                      </div>

                      <div className="detailsText">
                        {
                          item.details ||
                          '-'
                        }
                      </div>
                    </div>

                    <div className="performedRow">
                      <span>
                        Performed By
                      </span>

                      <strong>
                        {
                          item.performed_by ||
                          '-'
                        }
                      </strong>
                    </div>

                    {item.quotation_id ? (
                      <Link
                        href={`/quotations/${item.quotation_id}`}
                        className="mobileViewButton"
                      >
                        View Costing
                      </Link>
                    ) : (
                      <div className="deletedBox">
                        This costing was deleted
                      </div>
                    )}
                  </section>
                )
              )}
            </div>
          </>
        )}

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
            1200px;
          margin:
            0 auto;
          padding:
            18px
            14px
            40px;
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
            13px;
        }

        .summaryRow {
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
          margin-bottom:
            14px;
        }

        .summaryCard {
          background:
            white;
          border:
            1px solid
            var(--mj-border);
          border-radius:
            16px;
          padding:
            14px;
          box-shadow:
            0
            8px
            22px
            rgba(
              7,
              89,
              133,
              0.045
            );
        }

        .summaryLabel {
          color:
            var(--mj-muted);
          font-size:
            12px;
        }

        .summaryValue {
          margin-top:
            5px;
          color:
            var(--mj-primary-deep);
          font-size:
            25px;
          font-weight:
            800;
        }

        .filterCard {
          display:
            grid;
          grid-template-columns:
            minmax(
              0,
              1fr
            )
            180px
            auto;
          gap:
            10px;
          padding:
            14px;
          margin-bottom:
            16px;
          background:
            white;
          border:
            1px solid
            var(--mj-border);
          border-radius:
            16px;
          box-shadow:
            0
            8px
            22px
            rgba(
              7,
              89,
              133,
              0.04
            );
        }

        .searchInput,
        .actionSelect {
          width:
            100%;
          min-width:
            0;
          padding:
            11px
            12px;
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

        .searchInput:focus,
        .actionSelect:focus {
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

        .refreshButton {
          border:
            none;
          border-radius:
            10px;
          padding:
            0
            14px;
          background:
            linear-gradient(
              135deg,
              var(--mj-primary),
              var(--mj-primary-dark)
            );
          color:
            white;
          font-weight:
            700;
          cursor:
            pointer;
        }

        .desktopTable {
          overflow-x:
            auto;
          background:
            white;
          border:
            1px solid
            var(--mj-border);
          border-radius:
            18px;
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

        table {
          width:
            100%;
          min-width:
            1000px;
          border-collapse:
            collapse;
        }

        th {
          padding:
            13px;
          text-align:
            left;
          background:
            var(--mj-light);
          color:
            var(--mj-primary-deep);
          font-size:
            12px;
          font-weight:
            800;
        }

        td {
          padding:
            13px;
          border-top:
            1px solid
            #eaf2f7;
          color:
            #334155;
          font-size:
            12px;
          vertical-align:
            top;
        }

        tbody tr:hover {
          background:
            #fbfdff;
        }

        .dateCell {
          white-space:
            nowrap;
          color:
            #64748b;
        }

        .quotationNo {
          color:
            var(--mj-primary-deep);
        }

        .detailsCell {
          min-width:
            260px;
          max-width:
            420px;
          line-height:
            1.5;
          word-break:
            break-word;
        }

        .userName {
          font-weight:
            700;
          color:
            var(--mj-text);
        }

        .viewButton {
          display:
            inline-flex;
          align-items:
            center;
          justify-content:
            center;
          min-width:
            62px;
          padding:
            7px
            10px;
          border-radius:
            8px;
          background:
            var(--mj-primary);
          border:
            1px solid
            var(--mj-primary);
          color:
            white;
          font-size:
            11px;
          font-weight:
            800;
          text-decoration:
            none;
        }

        .deletedText {
          color:
            #991b1b;
          font-size:
            11px;
          font-weight:
            700;
        }

        .actionBadge {
          display:
            inline-flex;
          align-items:
            center;
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

        .actionCreate {
          background:
            #e0f4fd;
          color:
            #0369a1;
        }

        .actionEdit {
          background:
            #eaf7fd;
          color:
            var(--mj-primary-deep);
        }

        .actionSubmit {
          background:
            #dff5ff;
          color:
            #075985;
        }

        .actionApprove {
          background:
            #dcfce7;
          color:
            #166534;
        }

        .actionReject {
          background:
            #fee2e2;
          color:
            #991b1b;
        }

        .actionDelete {
          background:
            #fee2e2;
          color:
            #7f1d1d;
        }

        .actionDefault {
          background:
            #f1f5f9;
          color:
            #475569;
        }

        .mobileCards {
          display:
            none;
        }

        .activityCard {
          background:
            linear-gradient(
              145deg,
              #ffffff,
              #f6fbff
            );
          border:
            1px solid
            var(--mj-border);
          border-radius:
            18px;
          padding:
            15px;
          box-shadow:
            0
            7px
            20px
            rgba(
              7,
              89,
              133,
              0.045
            );
        }

        .cardTop {
          display:
            flex;
          align-items:
            flex-start;
          justify-content:
            space-between;
          gap:
            10px;
        }

        .quotationNoMobile {
          color:
            var(--mj-primary-deep);
          font-size:
            16px;
          font-weight:
            800;
        }

        .dateText {
          margin-top:
            4px;
          color:
            #94a3b8;
          font-size:
            10px;
        }

        .detailsBox {
          margin-top:
            14px;
          padding:
            11px;
          background:
            var(--mj-light);
          border:
            1px solid
            var(--mj-border);
          border-radius:
            11px;
        }

        .detailsLabel {
          color:
            #7c8a99;
          font-size:
            9px;
          font-weight:
            700;
        }

        .detailsText {
          margin-top:
            5px;
          color:
            var(--mj-text);
          font-size:
            12px;
          line-height:
            1.5;
          word-break:
            break-word;
        }

        .performedRow {
          display:
            flex;
          justify-content:
            space-between;
          gap:
            12px;
          margin-top:
            12px;
          font-size:
            11px;
        }

        .performedRow span {
          color:
            var(--mj-muted);
        }

        .performedRow strong {
          color:
            var(--mj-primary-deep);
        }

        .mobileViewButton {
          display:
            block;
          margin-top:
            13px;
          padding:
            11px;
          border-radius:
            10px;
          text-align:
            center;
          background:
            linear-gradient(
              135deg,
              var(--mj-primary),
              var(--mj-primary-dark)
            );
          color:
            white;
          font-size:
            12px;
          font-weight:
            800;
          text-decoration:
            none;
        }

        .deletedBox {
          margin-top:
            13px;
          padding:
            10px;
          border-radius:
            10px;
          background:
            #fff1f2;
          border:
            1px solid
            #fecdd3;
          color:
            #9f1239;
          text-align:
            center;
          font-size:
            11px;
          font-weight:
            700;
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

        .emptyCard {
          padding:
            20px;
          background:
            white;
          border:
            1px solid
            var(--mj-border);
          border-radius:
            16px;
          color:
            var(--mj-muted);
        }

        @media (
          max-width:
            700px
        ) {
          .filterCard {
            grid-template-columns:
              1fr;
          }

          .refreshButton {
            padding:
              11px;
          }

          .desktopTable {
            display:
              none;
          }

          .mobileCards {
            display:
              grid;
            gap:
              12px;
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
        }
      `}</style>
    </main>
  )
}

function ActionBadge({
  action,
}: {
  action: string
}) {
  const value =
    action
      .trim()
      .toLowerCase()

  let className =
    'actionBadge actionDefault'

  if (value === 'create') {
    className =
      'actionBadge actionCreate'
  }

  if (value === 'edit') {
    className =
      'actionBadge actionEdit'
  }

  if (value === 'submit') {
    className =
      'actionBadge actionSubmit'
  }

  if (value === 'approve') {
    className =
      'actionBadge actionApprove'
  }

  if (value === 'reject') {
    className =
      'actionBadge actionReject'
  }

  if (value === 'delete') {
    className =
      'actionBadge actionDelete'
  }

  return (
    <span className={className}>
      {action || 'ACTION'}
    </span>
  )
}