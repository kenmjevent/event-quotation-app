'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../../lib/supabase'
import {
  getCurrentProfile,
  type UserProfile,
  canCreateCosting,
  canManageMaterials,
  canApproveCosting,
  canViewActivity,
} from '../../lib/authRole'

type ActivityLog = {
  id: string
  quotation_no: string | null
  action: string
  details: string | null
  performed_by: string | null
  created_at: string
}

type ApprovalItem = {
  id: string
  quotation_no: string
  customer_name: string | null
  project_name: string | null
  status: string | null
  created_at: string
}

const allQuickMenus = [
  {
    key: 'calculator',
    title: 'Cost Calculator',
    subtitle: 'Create costing',
    icon: '🧮',
    href: '/calculator',
    bg: '#E8F7EE',
    iconBg: '#22C55E',
  },
  {
    key: 'materials',
    title: 'Material Setup',
    subtitle: 'Manage materials',
    icon: '📦',
    href: '/materials',
    bg: '#EEF4FF',
    iconBg: '#3B82F6',
  },
  {
    key: 'cost-listings',
    title: 'Cost Listings',
    subtitle: 'View saved costings',
    icon: '📋',
    href: '/cost-listings',
    bg: '#FFF4E8',
    iconBg: '#F97316',
  },
  {
    key: 'approvals',
    title: 'Approval Status',
    subtitle: 'Pending / Approved',
    icon: '✅',
    href: '/approvals',
    bg: '#F3E8FF',
    iconBg: '#A855F7',
  },
  {
    key: 'activity',
    title: 'Activity Log',
    subtitle: 'Recent system actions',
    icon: '🕘',
    href: '/activity',
    bg: '#FFF1F2',
    iconBg: '#E11D48',
  },
  {
    key: 'profile',
    title: 'User Profile',
    subtitle: 'Account information',
    icon: '👤',
    href: '/profile',
    bg: '#ECFEFF',
    iconBg: '#0891B2',
  },
]

export default function HomePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)

  const [totalCostings, setTotalCostings] = useState(0)
  const [pendingCount, setPendingCount] = useState(0)
  const [materialsCount, setMaterialsCount] = useState(0)
  const [draftCount, setDraftCount] = useState(0)

  const [activities, setActivities] = useState<ActivityLog[]>([])
  const [approvals, setApprovals] = useState<ApprovalItem[]>([])

  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    loadPage()
  }, [])

  async function loadPage() {
    setLoading(true)
    setErrorMessage('')

    try {
      const userProfile = await getCurrentProfile()

      if (!userProfile) {
        throw new Error('Unable to load user profile.')
      }

      setProfile(userProfile)

      const [
        totalResult,
        pendingResult,
        materialsResult,
        draftResult,
        activityResult,
        approvalResult,
      ] = await Promise.all([
        supabase
          .from('quotations')
          .select('*', {
            count: 'exact',
            head: true,
          }),

        supabase
          .from('quotations')
          .select('*', {
            count: 'exact',
            head: true,
          })
          .eq('status', 'pending'),

        supabase
          .from('materials')
          .select('*', {
            count: 'exact',
            head: true,
          })
          .eq('is_active', true),

        supabase
          .from('quotations')
          .select('*', {
            count: 'exact',
            head: true,
          })
          .eq('status', 'draft'),

        supabase
          .from('quotation_logs')
          .select(`
            id,
            quotation_no,
            action,
            details,
            performed_by,
            created_at
          `)
          .order('created_at', {
            ascending: false,
          })
          .limit(3),

        supabase
          .from('quotations')
          .select(`
            id,
            quotation_no,
            customer_name,
            project_name,
            status,
            created_at
          `)
          .in('status', ['pending', 'approved'])
          .order('created_at', {
            ascending: false,
          })
          .limit(2),
      ])

      if (totalResult.error) throw totalResult.error
      if (pendingResult.error) throw pendingResult.error
      if (materialsResult.error) throw materialsResult.error
      if (draftResult.error) throw draftResult.error
      if (activityResult.error) throw activityResult.error
      if (approvalResult.error) throw approvalResult.error

      setTotalCostings(totalResult.count || 0)
      setPendingCount(pendingResult.count || 0)
      setMaterialsCount(materialsResult.count || 0)
      setDraftCount(draftResult.count || 0)

      setActivities(activityResult.data || [])
      setApprovals(approvalResult.data || [])
    } catch (error: any) {
      console.error('Dashboard load error:', error)

      setErrorMessage(
        error?.message ||
          'Unable to load dashboard data.'
      )
    } finally {
      setLoading(false)
    }
  }

  const quickMenus = useMemo(() => {
    if (!profile) return []

    return allQuickMenus.filter((item) => {
      if (item.key === 'calculator') {
        return canCreateCosting(profile.role)
      }

      if (item.key === 'materials') {
        return canManageMaterials(profile.role)
      }

      if (item.key === 'approvals') {
        return canApproveCosting(profile.role)
      }

      if (item.key === 'activity') {
        return canViewActivity(profile.role)
      }

      if (item.key === 'cost-listings') {
        return true
      }

      if (item.key === 'profile') {
        return true
      }

      return false
    })
  }, [profile])

  function formatTime(value: string) {
    return new Date(value).toLocaleTimeString('en-MY', {
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  function getActivityType(action: string) {
    const value = String(action || '').toLowerCase()

    if (value === 'delete') return 'delete'

    if (
      value === 'edit' ||
      value === 'update'
    ) {
      return 'edit'
    }

    if (
      value === 'approve' ||
      value === 'approved'
    ) {
      return 'approved'
    }

    if (value === 'pending') return 'pending'
    if (value === 'rejected') return 'rejected'

    return 'create'
  }

  function getActivityLabel(action: string) {
    const value = String(action || '').toUpperCase()

    if (value === 'CREATE') return 'Created'
    if (value === 'DELETE') return 'Deleted'
    if (value === 'EDIT') return 'Edited'
    if (value === 'UPDATE') return 'Updated'
    if (value === 'APPROVED') return 'Approved'
    if (value === 'PENDING') return 'Pending'
    if (value === 'REJECTED') return 'Rejected'

    return value || 'Action'
  }

  function roleLabel(role?: string) {
    if (!role) return ''

    if (role === 'admin') return 'Admin'
    if (role === 'estimator') return 'Estimator'
    if (role === 'manager') return 'Manager'
    if (role === 'viewer') return 'Viewer'

    return role
  }

  return (
    <main className="page">
      <section className="hero">
        <div className="heroInner">
          <div>
            <div className="welcome">
              Welcome back
              {profile?.full_name
                ? `, ${profile.full_name}`
                : ''}
            </div>

            <h1>
              Event Costing
            </h1>

            <p className="heroText">
              Internal costing & approval system
            </p>

            {profile && (
              <div className="roleBadge">
                {roleLabel(profile.role)}
              </div>
            )}
          </div>

          <Link
            href="/profile"
            className="avatarButton"
          >
            👤
          </Link>
        </div>
      </section>

      <section className="summarySection">
        <div className="summaryGrid">
          <SummaryCard
            title="Costings"
            value={
              loading
                ? '...'
                : String(totalCostings)
            }
            sub="Total records"
          />

          <SummaryCard
            title="Pending"
            value={
              loading
                ? '...'
                : String(pendingCount)
            }
            sub="Need approval"
          />

          <SummaryCard
            title="Materials"
            value={
              loading
                ? '...'
                : String(materialsCount)
            }
            sub="Active"
          />

          <SummaryCard
            title="Drafts"
            value={
              loading
                ? '...'
                : String(draftCount)
            }
            sub="In progress"
          />
        </div>
      </section>

      {errorMessage && (
        <section className="section">
          <div className="errorBox">
            <span>
              {errorMessage}
            </span>

            <button
              type="button"
              onClick={loadPage}
              className="retryButton"
            >
              Retry
            </button>
          </div>
        </section>
      )}

      <section className="section">
        <div className="sectionHeader">
          <div>
            <h2>
              Quick Access
            </h2>

            <p>
              Available modules for your role
            </p>
          </div>
        </div>

        <div className="quickGrid">
          {quickMenus.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className="quickCard"
              style={{
                background: item.bg,
              }}
            >
              <div
                className="quickIcon"
                style={{
                  background: item.iconBg,
                }}
              >
                {item.icon}
              </div>

              <div className="quickTitle">
                {item.title}
              </div>

              <div className="quickSubtitle">
                {item.subtitle}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {profile &&
        canViewActivity(profile.role) && (
          <section className="section">
            <div className="card">
              <div className="sectionHeader rowHeader">
                <div>
                  <h2>
                    Recent Activity
                  </h2>

                  <p>
                    Latest system actions
                  </p>
                </div>

                <Link
                  href="/activity"
                  className="viewAll"
                >
                  View all
                </Link>
              </div>

              {loading && (
                <div className="emptyState">
                  Loading activity...
                </div>
              )}

              {!loading &&
                activities.length === 0 && (
                  <div className="emptyState">
                    No recent activity.
                  </div>
                )}

              {!loading &&
                activities.length > 0 && (
                  <div className="activityList">
                    {activities.map((item) => {
                      const type =
                        getActivityType(
                          item.action
                        )

                      return (
                        <div
                          key={item.id}
                          className="activityRow"
                        >
                          <div className="activityLeft">
                            <span
                              className={`badge badge-${type}`}
                            >
                              {getActivityLabel(
                                item.action
                              )}
                            </span>

                            <div className="activityContent">
                              <strong>
                                {item.quotation_no ||
                                  '-'}
                              </strong>

                              <span>
                                {item.details ||
                                  '-'}
                              </span>
                            </div>
                          </div>

                          <div className="activityTime">
                            {formatTime(
                              item.created_at
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
            </div>
          </section>
        )}

      {profile &&
        canApproveCosting(profile.role) && (
          <section className="section bottomSection">
            <div className="card">
              <div className="sectionHeader rowHeader">
                <div>
                  <h2>
                    Approval Status
                  </h2>

                  <p>
                    Latest approval progress
                  </p>
                </div>

                <Link
                  href="/approvals"
                  className="viewAll"
                >
                  View all
                </Link>
              </div>

              {loading && (
                <div className="emptyState">
                  Loading approvals...
                </div>
              )}

              {!loading &&
                approvals.length === 0 && (
                  <div className="emptyState">
                    No pending or approved costings yet.
                  </div>
                )}

              {!loading &&
                approvals.length > 0 && (
                  <div className="approvalList">
                    {approvals.map((item) => {
                      const status =
                        String(
                          item.status ||
                            'pending'
                        ).toLowerCase()

                      const approved =
                        status ===
                        'approved'

                      const color =
                        approved
                          ? '#10B981'
                          : '#F59E0B'

                      return (
                        <div
                          key={item.id}
                          className="approvalRow"
                        >
                          <div className="approvalInfo">
                            <div className="approvalCode">
                              {item.quotation_no}
                            </div>

                            <div className="approvalProject">
                              {item.customer_name
                                ? `${item.customer_name} · `
                                : ''}

                              {item.project_name ||
                                '-'}
                            </div>
                          </div>

                          <span
                            className="approvalBadge"
                            style={{
                              background:
                                `${color}22`,
                              color,
                            }}
                          >
                            {approved
                              ? 'Approved'
                              : 'Pending'}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}
            </div>
          </section>
        )}

      <nav className="bottomNav">
        <BottomNavItem
          href="/"
          icon="🏠"
          label="Home"
          active
        />

        {profile &&
          canCreateCosting(profile.role) ? (
            <BottomNavItem
              href="/calculator"
              icon="🧮"
              label="Costing"
            />
          ) : (
            <BottomNavItem
              href="/cost-listings"
              icon="📋"
              label="Costings"
            />
          )}

        {profile &&
        canManageMaterials(profile.role) ? (
          <BottomNavItem
            href="/materials"
            icon="📦"
            label="Material"
          />
        ) : (
          <BottomNavItem
            href="/cost-listings"
            icon="📋"
            label="Listings"
          />
        )}

        {profile &&
        canApproveCosting(profile.role) ? (
          <BottomNavItem
            href="/approvals"
            icon="✅"
            label="Approval"
          />
        ) : (
          <BottomNavItem
            href="/cost-listings"
            icon="📄"
            label="Records"
          />
        )}

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
          background: #f4f6fa;
          font-family: Arial, sans-serif;
        }

        body {
          padding-bottom: 88px;
        }

        a {
          -webkit-tap-highlight-color: transparent;
        }

        .page {
          min-height: 100vh;
          background: #f4f6fa;
          padding-bottom: 30px;
        }

        .hero {
          background:
            linear-gradient(
              135deg,
              #0f766e,
              #0d9488
            );
          color: white;
          padding: 26px 18px 78px;
          border-bottom-left-radius: 30px;
          border-bottom-right-radius: 30px;
        }

        .heroInner {
          max-width: 1100px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
        }

        .welcome {
          font-size: 13px;
          opacity: 0.85;
          margin-bottom: 5px;
        }

        .hero h1 {
          margin: 0;
          font-size: 30px;
          line-height: 1.15;
        }

        .heroText {
          margin: 8px 0 0;
          font-size: 14px;
          opacity: 0.9;
        }

        .roleBadge {
          display: inline-flex;
          margin-top: 11px;
          padding: 5px 10px;
          border-radius: 999px;
          background:
            rgba(255, 255, 255, 0.18);
          border:
            1px solid
            rgba(255, 255, 255, 0.25);
          font-size: 11px;
          font-weight: 700;
        }

        .avatarButton {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background:
            rgba(255, 255, 255, 0.2);
          border:
            1px solid
            rgba(255, 255, 255, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          font-size: 22px;
          flex-shrink: 0;
        }

        .summarySection {
          max-width: 1100px;
          margin: -48px auto 0;
          padding: 0 14px;
        }

        .summaryGrid {
          display: grid;
          grid-template-columns:
            repeat(4, minmax(0, 1fr));
          gap: 10px;
        }

        .summaryCard {
          background: white;
          border-radius: 17px;
          padding: 14px;
          border: 1px solid #edf0f5;
          box-shadow:
            0 5px 18px
            rgba(15, 23, 42, 0.07);
        }

        .summaryTitle {
          color: #6b7280;
          font-size: 12px;
        }

        .summaryValue {
          margin-top: 5px;
          font-size: 23px;
          font-weight: 800;
          color: #111827;
        }

        .summarySub {
          margin-top: 4px;
          color: #9ca3af;
          font-size: 11px;
        }

        .section {
          max-width: 1100px;
          margin: 22px auto 0;
          padding: 0 14px;
        }

        .bottomSection {
          padding-bottom: 12px;
        }

        .sectionHeader {
          margin-bottom: 14px;
        }

        .sectionHeader h2 {
          margin: 0;
          font-size: 21px;
          color: #111827;
        }

        .sectionHeader p {
          margin: 5px 0 0;
          font-size: 13px;
          color: #6b7280;
        }

        .rowHeader {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
        }

        .viewAll {
          color: #0f766e;
          text-decoration: none;
          font-size: 13px;
          font-weight: 700;
          white-space: nowrap;
        }

        .quickGrid {
          display: grid;
          grid-template-columns:
            repeat(3, minmax(0, 1fr));
          gap: 12px;
        }

        .quickCard {
          text-decoration: none;
          color: #111827;
          border-radius: 20px;
          padding: 16px;
          min-height: 145px;
          border:
            1px solid rgba(0, 0, 0, 0.04);
          box-shadow:
            0 5px 16px
            rgba(15, 23, 42, 0.05);
        }

        .quickIcon {
          width: 48px;
          height: 48px;
          border-radius: 15px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 23px;
          margin-bottom: 13px;
        }

        .quickTitle {
          font-weight: 700;
          font-size: 16px;
          line-height: 1.25;
        }

        .quickSubtitle {
          margin-top: 6px;
          font-size: 13px;
          color: #4b5563;
          line-height: 1.35;
        }

        .card {
          background: white;
          border-radius: 20px;
          padding: 18px;
          border: 1px solid #edf0f5;
          box-shadow:
            0 6px 20px
            rgba(15, 23, 42, 0.05);
        }

        .activityList {
          display: grid;
        }

        .activityRow {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          padding: 14px 0;
          border-bottom:
            1px solid #edf0f3;
        }

        .activityRow:last-child {
          border-bottom: none;
        }

        .activityLeft {
          display: flex;
          gap: 12px;
          align-items: center;
          min-width: 0;
          flex: 1;
        }

        .activityContent {
          display: flex;
          flex-direction: column;
          gap: 3px;
          min-width: 0;
        }

        .activityContent strong {
          font-size: 14px;
          color: #111827;
        }

        .activityContent span {
          font-size: 12px;
          color: #6b7280;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 360px;
        }

        .activityTime {
          font-size: 11px;
          color: #9ca3af;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .badge {
          padding: 6px 9px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 700;
          white-space: nowrap;
        }

        .badge-create {
          background: #dcfce7;
          color: #166534;
        }

        .badge-delete {
          background: #fee2e2;
          color: #991b1b;
        }

        .badge-edit {
          background: #dbeafe;
          color: #1d4ed8;
        }

        .badge-pending {
          background: #fef3c7;
          color: #92400e;
        }

        .badge-approved {
          background: #d1fae5;
          color: #047857;
        }

        .badge-rejected {
          background: #fee2e2;
          color: #b91c1c;
        }

        .approvalList {
          display: grid;
          gap: 10px;
        }

        .approvalRow {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          border:
            1px solid #edf0f3;
          border-radius: 14px;
          padding: 13px;
        }

        .approvalInfo {
          min-width: 0;
        }

        .approvalCode {
          font-weight: 700;
          font-size: 14px;
          color: #111827;
        }

        .approvalProject {
          margin-top: 4px;
          font-size: 12px;
          color: #6b7280;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .approvalBadge {
          padding: 6px 10px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 700;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .emptyState {
          color: #9ca3af;
          font-size: 13px;
          padding: 10px 0 4px;
        }

        .errorBox {
          background: #fee2e2;
          color: #991b1b;
          border-radius: 14px;
          padding: 14px;
          font-size: 13px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
        }

        .retryButton {
          border: none;
          background: white;
          color: #991b1b;
          padding: 7px 12px;
          border-radius: 8px;
          font-weight: 700;
          cursor: pointer;
        }

        .bottomNav {
          position: fixed;
          left: 0;
          right: 0;
          bottom: 0;
          height: 72px;
          background:
            rgba(255, 255, 255, 0.97);
          border-top:
            1px solid #e5e7eb;
          display: grid;
          grid-template-columns:
            repeat(5, 1fr);
          z-index: 999;
          padding-bottom:
            env(safe-area-inset-bottom);
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
          min-width: 0;
        }

        .navItemActive {
          color: #0f766e;
        }

        .navIcon {
          font-size: 21px;
          line-height: 1;
        }

        @media (max-width: 800px) {
          .summaryGrid {
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
          }

          .quickGrid {
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 600px) {
          .hero {
            padding:
              22px 16px 72px;
          }

          .hero h1 {
            font-size: 27px;
          }

          .summarySection {
            margin-top: -43px;
          }

          .summaryCard {
            padding: 13px;
          }

          .summaryValue {
            font-size: 22px;
          }

          .quickGrid {
            gap: 10px;
          }

          .quickCard {
            min-height: 138px;
            padding: 14px;
          }

          .quickIcon {
            width: 45px;
            height: 45px;
            font-size: 21px;
          }

          .quickTitle {
            font-size: 15px;
          }

          .quickSubtitle {
            font-size: 12px;
          }

          .activityRow {
            align-items:
              flex-start;
            flex-wrap: wrap;
          }

          .activityLeft {
            align-items:
              flex-start;
            width: 100%;
          }

          .activityContent {
            flex: 1;
          }

          .activityContent span {
            max-width: 180px;
          }

          .activityTime {
            width: 100%;
            text-align: right;
            font-size: 10px;
          }

          .badge {
            font-size: 10px;
            padding: 5px 7px;
          }
        }
      `}</style>
    </main>
  )
}

function SummaryCard({
  title,
  value,
  sub,
}: {
  title: string
  value: string
  sub: string
}) {
  return (
    <div className="summaryCard">
      <div className="summaryTitle">
        {title}
      </div>

      <div className="summaryValue">
        {value}
      </div>

      <div className="summarySub">
        {sub}
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