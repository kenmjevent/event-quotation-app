'use client'

import Link from 'next/link'

const quickMenus = [
  {
    title: 'Cost Calculator',
    subtitle: 'Create costing',
    icon: '🧮',
    href: '/calculator',
    bg: '#E8F7EE',
    iconBg: '#22C55E',
  },
  {
    title: 'Material Setup',
    subtitle: 'Manage materials',
    icon: '📦',
    href: '/materials',
    bg: '#EEF4FF',
    iconBg: '#3B82F6',
  },
  {
    title: 'Cost Listings',
    subtitle: 'View cost items',
    icon: '📋',
    href: '/cost-listings',
    bg: '#FFF4E8',
    iconBg: '#F97316',
  },
  {
    title: 'Approval Status',
    subtitle: 'Pending / Approved',
    icon: '✅',
    href: '/approvals',
    bg: '#F3E8FF',
    iconBg: '#A855F7',
  },
  {
    title: 'Activity Log',
    subtitle: 'Recent system actions',
    icon: '🕘',
    href: '/activity',
    bg: '#FFF1F2',
    iconBg: '#E11D48',
  },
  {
    title: 'User Profile',
    subtitle: 'Account settings',
    icon: '👤',
    href: '/profile',
    bg: '#ECFEFF',
    iconBg: '#0891B2',
  },
]

const recentActivities = [
  {
    action: 'Created costing',
    reference: 'EST2609002',
    detail: 'Genting - Baccarat 2026',
    time: '10:51 PM',
    type: 'create',
  },
  {
    action: 'Deleted costing',
    reference: 'EST2609001',
    detail: 'PNMY - One U',
    time: '10:49 PM',
    type: 'delete',
  },
  {
    action: 'Approval pending',
    reference: 'EST2609003',
    detail: 'TRX Event Build',
    time: '9:30 PM',
    type: 'pending',
  },
]

const approvals = [
  {
    code: 'EST2609003',
    project: 'TRX Event Build',
    status: 'Pending',
    color: '#F59E0B',
  },
  {
    code: 'EST2609004',
    project: 'Mooncake Booth',
    status: 'Approved',
    color: '#10B981',
  },
]

export default function HomePage() {
  return (
    <main className="page">
      <section className="hero">
        <div className="heroInner">
          <div>
            <div className="welcome">Welcome back</div>

            <h1>Event Costing</h1>

            <p className="heroText">
              Internal costing & approval system
            </p>
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
            value="128"
            sub="This month"
          />

          <SummaryCard
            title="Pending"
            value="7"
            sub="Need approval"
          />

          <SummaryCard
            title="Materials"
            value="86"
            sub="Active"
          />

          <SummaryCard
            title="Drafts"
            value="12"
            sub="In progress"
          />
        </div>
      </section>

      <section className="section">
        <div className="sectionHeader">
          <div>
            <h2>Quick Access</h2>
            <p>Tap a module to continue</p>
          </div>
        </div>

        <div className="quickGrid">
          {quickMenus.map((item) => (
            <Link
              key={item.title}
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

      <section className="section">
        <div className="card">
          <div className="sectionHeader rowHeader">
            <div>
              <h2>Recent Activity</h2>
              <p>Latest costing actions</p>
            </div>

            <Link
              href="/activity"
              className="viewAll"
            >
              View all
            </Link>
          </div>

          <div className="activityList">
            {recentActivities.map((item) => (
              <div
                key={item.reference}
                className="activityRow"
              >
                <div className="activityLeft">
                  <span
                    className={`badge badge-${item.type}`}
                  >
                    {item.action}
                  </span>

                  <div className="activityContent">
                    <strong>
                      {item.reference}
                    </strong>

                    <span>
                      {item.detail}
                    </span>
                  </div>
                </div>

                <div className="activityTime">
                  {item.time}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section bottomSection">
        <div className="card">
          <div className="sectionHeader rowHeader">
            <div>
              <h2>Approval Status</h2>
              <p>Latest approval progress</p>
            </div>

            <Link
              href="/approvals"
              className="viewAll"
            >
              View all
            </Link>
          </div>

          <div className="approvalList">
            {approvals.map((item) => (
              <div
                key={item.code}
                className="approvalRow"
              >
                <div>
                  <div className="approvalCode">
                    {item.code}
                  </div>

                  <div className="approvalProject">
                    {item.project}
                  </div>
                </div>

                <span
                  className="approvalBadge"
                  style={{
                    background: `${item.color}22`,
                    color: item.color,
                  }}
                >
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <nav className="bottomNav">
        <BottomNavItem
          href="/"
          icon="🏠"
          label="Home"
          active
        />

        <BottomNavItem
          href="/calculator"
          icon="🧮"
          label="Calculator"
        />

        <BottomNavItem
          href="/materials"
          icon="📦"
          label="Materials"
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
          background: linear-gradient(
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

        .avatarButton {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.3);
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
            0 5px 18px rgba(15, 23, 42, 0.07);
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
          border: 1px solid rgba(0, 0, 0, 0.04);
          box-shadow:
            0 5px 16px rgba(15, 23, 42, 0.05);
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
            0 6px 20px rgba(15, 23, 42, 0.05);
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
          border-bottom: 1px solid #edf0f3;
        }

        .activityRow:last-child {
          border-bottom: none;
        }

        .activityLeft {
          display: flex;
          gap: 12px;
          align-items: center;
          min-width: 0;
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

        .badge-pending {
          background: #fef3c7;
          color: #92400e;
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
          border: 1px solid #edf0f3;
          border-radius: 14px;
          padding: 13px;
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
        }

        .approvalBadge {
          padding: 6px 10px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 700;
          white-space: nowrap;
        }

        .bottomNav {
          position: fixed;
          left: 0;
          right: 0;
          bottom: 0;
          height: 72px;
          background: rgba(255, 255, 255, 0.97);
          border-top: 1px solid #e5e7eb;
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          z-index: 999;
          padding-bottom: env(safe-area-inset-bottom);
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
            padding: 22px 16px 72px;
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
            align-items: flex-start;
          }

          .activityLeft {
            align-items: flex-start;
          }

          .activityContent span {
            max-width: 155px;
          }

          .badge {
            font-size: 10px;
            padding: 5px 7px;
          }

          .activityTime {
            font-size: 10px;
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