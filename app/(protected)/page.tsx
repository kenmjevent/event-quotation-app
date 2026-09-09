'use client'

import { useEffect, useState } from 'react'
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

type DashboardStats = {
  totalCostings: number
  pending: number
  materials: number
  drafts: number
}

type ActivityLog = {
  id: string
  quotation_id: string | null
  quotation_no: string | null
  action: string | null
  details: string | null
  performed_by: string | null
  created_at: string
}

export default function DashboardPage() {
  const [profile, setProfile] =
    useState<UserProfile | null>(null)

  const [stats, setStats] =
    useState<DashboardStats>({
      totalCostings: 0,
      pending: 0,
      materials: 0,
      drafts: 0,
    })

  const [recentActivity, setRecentActivity] =
    useState<ActivityLog[]>([])

  const [loading, setLoading] =
    useState(true)

  const [errorMessage, setErrorMessage] =
    useState('')

  useEffect(() => {
    loadDashboard()
  }, [])

  async function loadDashboard() {
    setLoading(true)
    setErrorMessage('')

    try {
      const currentProfile =
        await getCurrentProfile()

      setProfile(currentProfile)

      if (!currentProfile) {
        setErrorMessage(
          'Unable to load user profile.'
        )
        return
      }

      const [
        quotationResult,
        materialResult,
        activityResult,
      ] = await Promise.all([
        supabase
          .from('quotations')
          .select('status'),

        supabase
          .from('materials')
          .select('id, is_active'),

        supabase
          .from('quotation_logs')
          .select(`
            id,
            quotation_id,
            quotation_no,
            action,
            details,
            performed_by,
            created_at
          `)
          .order('created_at', {
            ascending: false,
          })
          .limit(5),
      ])

      if (quotationResult.error) {
        throw quotationResult.error
      }

      if (materialResult.error) {
        throw materialResult.error
      }

      if (activityResult.error) {
        console.error(
          'Activity load error:',
          activityResult.error
        )
      }

      const quotations =
        quotationResult.data || []

      const materials =
        materialResult.data || []

      const totalCostings =
        quotations.length

      const pending =
        quotations.filter(
          (item) =>
            String(
              item.status || ''
            ).toLowerCase() ===
            'pending'
        ).length

      const drafts =
        quotations.filter(
          (item) =>
            String(
              item.status || 'draft'
            ).toLowerCase() ===
            'draft'
        ).length

      const activeMaterials =
        materials.filter(
          (item) =>
            item.is_active !== false
        ).length

      setStats({
        totalCostings,
        pending,
        materials: activeMaterials,
        drafts,
      })

      setRecentActivity(
        activityResult.data || []
      )
    } catch (error: any) {
      console.error(
        'Dashboard error:',
        error
      )

      setErrorMessage(
        error?.message ||
          'Unable to load dashboard.'
      )
    } finally {
      setLoading(false)
    }
  }

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
        hour: '2-digit',
        minute: '2-digit',
      }
    )
  }

  if (loading) {
    return (
      <main className="loadingPage">
        Loading dashboard...
      </main>
    )
  }

  return (
    <main className="dashboardPage">
      <section className="heroSection">
        <div className="heroContent">
          <div className="welcomeText">
            Welcome back,
            {' '}
            {profile?.full_name ||
              'User'}
          </div>

          <h1>
            Event Costing
          </h1>

          <p>
            Internal costing & approval system
          </p>

          {profile && (
            <div className="roleBadge">
              {profile.role === 'admin'
                ? 'Admin'
                : 'Estimator'}
            </div>
          )}
        </div>

        <div className="profileCircle">
          <span>
            👤
          </span>
        </div>
      </section>

      <section className="statsGrid">
        <StatCard
          title="Costings"
          value={stats.totalCostings}
          subtitle="Total records"
        />

        <StatCard
          title="Pending"
          value={stats.pending}
          subtitle="Need approval"
        />

        <StatCard
          title="Materials"
          value={stats.materials}
          subtitle="Active"
        />

        <StatCard
          title="Drafts"
          value={stats.drafts}
          subtitle="In progress"
        />
      </section>

      {errorMessage && (
        <div className="errorBox">
          {errorMessage}
        </div>
      )}

      <section className="quickSection">
        <h2>
          Quick Access
        </h2>

        <p>
          Available modules for your role
        </p>

        <div className="quickGrid">
          {profile &&
            canCreateCosting(
              profile.role
            ) && (
              <QuickCard
                href="/calculator"
                icon="🧮"
                title="Cost Calculator"
                subtitle="Create costing"
                tone="blue"
              />
            )}

          {profile &&
            canManageMaterials(
              profile.role
            ) && (
              <QuickCard
                href="/materials"
                icon="📦"
                title="Material Setup"
                subtitle="Manage material pricing"
                tone="lightBlue"
              />
            )}

          <QuickCard
            href="/cost-listings"
            icon="📋"
            title="Cost Listings"
            subtitle="View saved costings"
            tone="sky"
          />

          {profile &&
            canApproveCosting(
              profile.role
            ) && (
              <QuickCard
                href="/approvals"
                icon="✅"
                title="Approval"
                subtitle="Review pending costings"
                tone="indigo"
              />
            )}

          {profile &&
            canViewActivity(
              profile.role
            ) && (
              <QuickCard
                href="/activity"
                icon="🕘"
                title="Activity Log"
                subtitle="View costing history"
                tone="softBlue"
              />
            )}

          <QuickCard
            href="/profile"
            icon="👤"
            title="User Profile"
            subtitle="Account information"
            tone="paleBlue"
          />
        </div>
      </section>

      {profile &&
        canViewActivity(
          profile.role
        ) && (
          <section className="activitySection">
            <div className="sectionHeader">
              <div>
                <h2>
                  Recent Activity
                </h2>

                <p>
                  Latest costing actions
                </p>
              </div>

              <Link
                href="/activity"
                className="viewAllLink"
              >
                View All
              </Link>
            </div>

            {recentActivity.length ===
            0 ? (
              <div className="emptyActivity">
                No activity yet.
              </div>
            ) : (
              <div className="activityList">
                {recentActivity.map(
                  (item) => (
                    <div
                      key={item.id}
                      className="activityItem"
                    >
                      <div className="activityIcon">
                        <ActivityIcon
                          action={
                            item.action ||
                            ''
                          }
                        />
                      </div>

                      <div className="activityContent">
                        <div className="activityTop">
                          <strong>
                            {item.quotation_no ||
                              '-'}
                          </strong>

                          <span>
                            {formatDateTime(
                              item.created_at
                            )}
                          </span>
                        </div>

                        <div className="activityAction">
                          {item.action ||
                            'ACTION'}
                        </div>

                        <div className="activityDetails">
                          {item.details ||
                            '-'}
                        </div>

                        <div className="activityUser">
                          By:
                          {' '}
                          {item.performed_by ||
                            '-'}
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
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
          canCreateCosting(
            profile.role
          ) && (
            <BottomNavItem
              href="/calculator"
              icon="🧮"
              label="Costing"
            />
          )}

        {profile &&
          canManageMaterials(
            profile.role
          ) ? (
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
          canApproveCosting(
            profile.role
          ) ? (
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
          background: var(--mj-background);
          color: var(--mj-text);
          font-family: Arial, Helvetica, sans-serif;
        }

        body {
          padding-bottom: 85px;
        }

        .loadingPage {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--mj-background);
          color: var(--mj-primary);
          font-size: 15px;
          font-weight: 700;
        }

        .dashboardPage {
          min-height: 100vh;
          background: var(--mj-background);
        }

        .heroSection {
          position: relative;
          min-height: 360px;
          padding:
            48px
            32px
            100px;

          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 20px;

          background:
            linear-gradient(
              135deg,
              var(--mj-primary) 0%,
              var(--mj-primary-dark) 55%,
              var(--mj-primary-deep) 100%
            );

          color: white;

          border-bottom-left-radius:
            46px;

          border-bottom-right-radius:
            46px;
        }

        .heroContent {
          max-width: 620px;
        }

        .welcomeText {
          font-size: 17px;
          font-weight: 500;
          opacity: 0.92;
          margin-bottom: 8px;
        }

        .heroSection h1 {
          margin: 0;
          font-size: 42px;
          line-height: 1.08;
          font-weight: 500;
          letter-spacing: -1px;
        }

        .heroSection p {
          margin:
            17px 0 0;

          font-size: 18px;
          line-height: 1.45;
          max-width: 470px;
          opacity: 0.92;
        }

        .roleBadge {
          display: inline-flex;
          margin-top: 18px;

          padding:
            10px
            18px;

          border-radius:
            999px;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              0.42
            );

          background:
            rgba(
              255,
              255,
              255,
              0.13
            );

          color: white;

          font-size:
            14px;

          font-weight:
            800;
        }

        .profileCircle {
          flex:
            0 0
            72px;

          width:
            72px;

          height:
            72px;

          margin-top:
            74px;

          border-radius:
            50%;

          display:
            flex;

          align-items:
            center;

          justify-content:
            center;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              0.45
            );

          background:
            rgba(
              255,
              255,
              255,
              0.16
            );

          box-shadow:
            0
            8px
            22px
            rgba(
              0,
              68,
              120,
              0.18
            );
        }

        .profileCircle span {
          font-size:
            38px;
        }

        .statsGrid {
          position: relative;

          margin:
            -72px
            auto
            0;

          z-index:
            10;

          max-width:
            1100px;

          padding:
            0
            28px;

          display:
            grid;

          grid-template-columns:
            repeat(
              4,
              minmax(
                0,
                1fr
              )
            );

          gap:
            16px;
        }

        .statCard {
          min-height:
            150px;

          padding:
            20px;

          border-radius:
            24px;

          background:
            white;

          border:
            1px solid
            var(--mj-border);

          box-shadow:
            0
            14px
            30px
            rgba(
              7,
              89,
              133,
              0.08
            );
        }

        .statTitle {
          color:
            var(--mj-muted);

          font-size:
            15px;

          margin-bottom:
            14px;
        }

        .statValue {
          color:
            var(--mj-text);

          font-size:
            34px;

          font-weight:
            800;

          line-height:
            1;
        }

        .statSubtitle {
          margin-top:
            18px;

          color:
            #9ca3af;

          font-size:
            14px;
        }

        .quickSection,
        .activitySection {
          max-width:
            1100px;

          margin:
            34px
            auto
            0;

          padding:
            0
            28px;
        }

        .quickSection h2,
        .activitySection h2 {
          margin:
            0;

          color:
            var(--mj-text);

          font-size:
            28px;

          font-weight:
            500;
        }

        .quickSection > p {
          margin:
            10px
            0
            22px;

          color:
            var(--mj-muted);

          font-size:
            15px;
        }

        .quickGrid {
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
            16px;
        }

        .quickCard {
          min-height:
            160px;

          border-radius:
            24px;

          padding:
            20px;

          text-decoration:
            none;

          border:
            1px solid
            var(--mj-border);

          display:
            flex;

          flex-direction:
            column;

          justify-content:
            space-between;

          transition:
            transform
            0.18s ease,
            box-shadow
            0.18s ease;

          box-shadow:
            0
            10px
            26px
            rgba(
              7,
              89,
              133,
              0.05
            );
        }

        .quickCard:hover {
          transform:
            translateY(
              -2px
            );

          box-shadow:
            0
            16px
            32px
            rgba(
              7,
              89,
              133,
              0.1
            );
        }

        .toneBlue {
          background:
            linear-gradient(
              145deg,
              #dff4fd,
              #eefaff
            );
        }

        .toneLightBlue {
          background:
            linear-gradient(
              145deg,
              #e9f5ff,
              #f6fbff
            );
        }

        .toneSky {
          background:
            linear-gradient(
              145deg,
              #e8f7ff,
              #f7fcff
            );
        }

        .toneIndigo {
          background:
            linear-gradient(
              145deg,
              #edf3ff,
              #f8faff
            );
        }

        .toneSoftBlue {
          background:
            linear-gradient(
              145deg,
              #eaf7fd,
              #ffffff
            );
        }

        .tonePaleBlue {
          background:
            linear-gradient(
              145deg,
              #f0f9ff,
              #ffffff
            );
        }

        .quickIcon {
          width:
            54px;

          height:
            54px;

          border-radius:
            16px;

          display:
            flex;

          align-items:
            center;

          justify-content:
            center;

          background:
            var(--mj-primary);

          box-shadow:
            0
            9px
            20px
            rgba(
              7,
              152,
              212,
              0.22
            );

          font-size:
            28px;
        }

        .quickTitle {
          margin-top:
            20px;

          color:
            var(--mj-text);

          font-size:
            17px;

          font-weight:
            800;
        }

        .quickSubtitle {
          margin-top:
            4px;

          color:
            var(--mj-muted);

          font-size:
            12px;

          line-height:
            1.4;
        }

        .activitySection {
          margin-bottom:
            30px;
        }

        .sectionHeader {
          display:
            flex;

          align-items:
            flex-end;

          justify-content:
            space-between;

          gap:
            14px;

          margin-bottom:
            16px;
        }

        .sectionHeader p {
          margin:
            5px 0 0;

          color:
            var(--mj-muted);

          font-size:
            13px;
        }

        .viewAllLink {
          text-decoration:
            none;

          color:
            var(--mj-primary);

          font-size:
            13px;

          font-weight:
            800;
        }

        .activityList {
          background:
            white;

          border:
            1px solid
            var(--mj-border);

          border-radius:
            22px;

          overflow:
            hidden;

          box-shadow:
            0
            10px
            26px
            rgba(
              7,
              89,
              133,
              0.05
            );
        }

        .activityItem {
          display:
            flex;

          gap:
            12px;

          padding:
            15px;

          border-bottom:
            1px solid
            #edf4f8;
        }

        .activityItem:last-child {
          border-bottom:
            none;
        }

        .activityIcon {
          flex:
            0 0
            42px;

          width:
            42px;

          height:
            42px;

          border-radius:
            13px;

          display:
            flex;

          align-items:
            center;

          justify-content:
            center;

          background:
            var(--mj-light);

          font-size:
            21px;
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
            13px;
        }

        .activityTop span {
          color:
            #9ca3af;

          font-size:
            10px;

          white-space:
            nowrap;
        }

        .activityAction {
          margin-top:
            4px;

          color:
            var(--mj-text);

          font-size:
            12px;

          font-weight:
            800;
        }

        .activityDetails {
          margin-top:
            3px;

          color:
            var(--mj-muted);

          font-size:
            11px;

          line-height:
            1.4;

          word-break:
            break-word;
        }

        .activityUser {
          margin-top:
            5px;

          color:
            #9ca3af;

          font-size:
            10px;
        }

        .emptyActivity {
          padding:
            20px;

          background:
            white;

          border:
            1px solid
            var(--mj-border);

          border-radius:
            18px;

          color:
            var(--mj-muted);
        }

        .errorBox {
          max-width:
            1044px;

          margin:
            20px
            auto
            0;

          padding:
            12px
            16px;

          border-radius:
            12px;

          background:
            #fee2e2;

          color:
            #991b1b;

          font-size:
            13px;
        }

        .bottomNav {
          position:
            fixed;

          left: 0;
          right: 0;
          bottom: 0;

          z-index:
            999;

          min-height:
            74px;

          display:
            grid;

          grid-template-columns:
            repeat(
              5,
              1fr
            );

          background:
            rgba(
              255,
              255,
              255,
              0.97
            );

          border-top:
            1px solid
            var(--mj-border);

          box-shadow:
            0
            -5px
            20px
            rgba(
              7,
              89,
              133,
              0.06
            );
        }

        .navItem {
          min-width:
            0;

          text-decoration:
            none;

          color:
            #7b8491;

          display:
            flex;

          flex-direction:
            column;

          align-items:
            center;

          justify-content:
            center;

          gap:
            3px;

          padding:
            8px
            2px;

          font-size:
            10px;

          font-weight:
            700;
        }

        .navItemActive {
          color:
            var(--mj-primary);
        }

        .navIcon {
          font-size:
            22px;

          line-height:
            1;
        }

        @media (
          max-width:
            900px
        ) {
          .statsGrid {
            grid-template-columns:
              repeat(
                2,
                minmax(
                  0,
                  1fr
                )
              );
          }

          .quickGrid {
            grid-template-columns:
              repeat(
                2,
                minmax(
                  0,
                  1fr
                )
              );
          }
        }

        @media (
          max-width:
            650px
        ) {
          .heroSection {
            min-height:
              360px;

            padding:
              46px
              30px
              105px;
          }

          .welcomeText {
            font-size:
              16px;
          }

          .heroSection h1 {
            font-size:
              38px;
          }

          .heroSection p {
            font-size:
              17px;

            max-width:
              300px;
          }

          .profileCircle {
            width:
              62px;

            height:
              62px;

            flex-basis:
              62px;

            margin-top:
              72px;
          }

          .profileCircle span {
            font-size:
              32px;
          }

          .statsGrid {
            margin-top:
              -74px;

            padding:
              0
              30px;

            gap:
              14px;
          }

          .statCard {
            min-height:
              150px;

            padding:
              18px;
          }

          .statTitle {
            font-size:
              15px;
          }

          .statValue {
            font-size:
              34px;
          }

          .quickSection,
          .activitySection {
            padding:
              0
              30px;
          }

          .quickSection {
            margin-top:
              32px;
          }

          .quickSection h2,
          .activitySection h2 {
            font-size:
              27px;
          }

          .quickGrid {
            gap:
              14px;
          }

          .quickCard {
            min-height:
              155px;

            padding:
              17px;

            border-radius:
              22px;
          }

          .quickIcon {
            width:
              50px;

            height:
              50px;

            font-size:
              25px;
          }

          .quickTitle {
            font-size:
              15px;
          }
        }

        @media (
          max-width:
            420px
        ) {
          .heroSection {
            padding-left:
              22px;

            padding-right:
              22px;
          }

          .statsGrid,
          .quickSection,
          .activitySection {
            padding-left:
              20px;

            padding-right:
              20px;
          }

          .statCard {
            min-height:
              138px;

            padding:
              16px;
          }

          .statValue {
            font-size:
              30px;
          }

          .quickGrid {
            grid-template-columns:
              repeat(
                2,
                minmax(
                  0,
                  1fr
                )
              );
          }
        }
      `}</style>
    </main>
  )
}

function StatCard({
  title,
  value,
  subtitle,
}: {
  title: string
  value: number
  subtitle: string
}) {
  return (
    <div className="statCard">
      <div className="statTitle">
        {title}
      </div>

      <div className="statValue">
        {value}
      </div>

      <div className="statSubtitle">
        {subtitle}
      </div>
    </div>
  )
}

function QuickCard({
  href,
  icon,
  title,
  subtitle,
  tone,
}: {
  href: string
  icon: string
  title: string
  subtitle: string
  tone:
    | 'blue'
    | 'lightBlue'
    | 'sky'
    | 'indigo'
    | 'softBlue'
    | 'paleBlue'
}) {
  const toneClass =
    tone === 'blue'
      ? 'toneBlue'
      : tone === 'lightBlue'
      ? 'toneLightBlue'
      : tone === 'sky'
      ? 'toneSky'
      : tone === 'indigo'
      ? 'toneIndigo'
      : tone === 'softBlue'
      ? 'toneSoftBlue'
      : 'tonePaleBlue'

  return (
    <Link
      href={href}
      className={`quickCard ${toneClass}`}
    >
      <div className="quickIcon">
        {icon}
      </div>

      <div>
        <div className="quickTitle">
          {title}
        </div>

        <div className="quickSubtitle">
          {subtitle}
        </div>
      </div>
    </Link>
  )
}

function ActivityIcon({
  action,
}: {
  action: string
}) {
  const value =
    action.toLowerCase()

  if (
    value === 'create'
  ) {
    return <>＋</>
  }

  if (
    value === 'edit'
  ) {
    return <>✏️</>
  }

  if (
    value === 'submit'
  ) {
    return <>📤</>
  }

  if (
    value === 'approve'
  ) {
    return <>✅</>
  }

  if (
    value === 'reject'
  ) {
    return <>❌</>
  }

  if (
    value === 'delete'
  ) {
    return <>🗑️</>
  }

  return <>🕘</>
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