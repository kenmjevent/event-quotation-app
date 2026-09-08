import Link from "next/link";

const quickMenus = [
  {
    title: "Cost Calculator",
    subtitle: "Create costing",
    icon: "🧮",
    href: "/calculator",
    bg: "#E8F7EE",
    iconBg: "#22C55E",
  },
  {
    title: "Material Setup",
    subtitle: "Manage materials",
    icon: "📦",
    href: "/materials",
    bg: "#EEF4FF",
    iconBg: "#3B82F6",
  },
  {
    title: "Cost Listings",
    subtitle: "View cost items",
    icon: "📋",
    href: "/cost-listings",
    bg: "#FFF4E8",
    iconBg: "#F97316",
  },
  {
    title: "Approval Status",
    subtitle: "Pending / Approved",
    icon: "✅",
    href: "/approvals",
    bg: "#F3E8FF",
    iconBg: "#A855F7",
  },
  {
    title: "Activity Log",
    subtitle: "Recent system actions",
    icon: "🕘",
    href: "/activity",
    bg: "#FFF1F2",
    iconBg: "#E11D48",
  },
  {
    title: "User Profile",
    subtitle: "Account settings",
    icon: "👤",
    href: "/profile",
    bg: "#ECFEFF",
    iconBg: "#0891B2",
  },
];

const recentActivities = [
  {
    action: "Created costing",
    reference: "EST2609002",
    detail: "Genting - Baccarat 2026",
    time: "Today, 10:51 PM",
    type: "create",
  },
  {
    action: "Deleted costing",
    reference: "EST2609001",
    detail: "PNMY - One U",
    time: "Today, 10:49 PM",
    type: "delete",
  },
  {
    action: "Approval pending",
    reference: "EST2609003",
    detail: "TRX Event Build",
    time: "Today, 9:30 PM",
    type: "pending",
  },
];

export default function HomePage() {
  return (
    <main className="page">
      <section className="hero">
        <div className="heroInner">
          <div className="heroTop">
            <div>
              <div className="welcome">Welcome back</div>

              <h1>Event Costing Dashboard</h1>

              <p className="heroText">
                Manage costing, materials, approvals and internal activity
                in one place
              </p>
            </div>

            <Link href="/profile" className="profileButton">
              <span className="profileIcon">👤</span>
              <span>Admin</span>
            </Link>
          </div>
        </div>
      </section>

      <section className="summarySection">
        <div className="summaryGrid">
          <SummaryCard
            title="Total Costings"
            value="128"
            sub="This month"
          />

          <SummaryCard
            title="Pending Approval"
            value="7"
            sub="Need review"
          />

          <SummaryCard
            title="Materials"
            value="86"
            sub="Active items"
          />

          <SummaryCard
            title="Draft Costings"
            value="12"
            sub="In progress"
          />
        </div>
      </section>

      <section className="contentSection">
        <div className="sectionHeader">
          <h2>Quick Access</h2>
          <p>Tap a module to continue</p>
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

      <section className="mainGridSection">
        <div className="mainGrid">
          <div className="card">
            <div className="sectionHeader">
              <h2>Recent Activity</h2>
              <p>Latest costing actions</p>
            </div>

            <div className="activityList">
              {recentActivities.map((item, index) => (
                <div
                  key={index}
                  className="activityRow"
                >
                  <div className="activityMain">
                    <div className="activityTop">
                      <span
                        className={`badge badge-${item.type}`}
                      >
                        {item.action}
                      </span>

                      <strong>
                        {item.reference}
                      </strong>
                    </div>

                    <div className="activityDetail">
                      {item.detail}
                    </div>
                  </div>

                  <div className="activityTime">
                    {item.time}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="sideColumn">
            <div className="card">
              <div className="sectionHeader">
                <h2>Pending Approval</h2>
                <p>Items waiting for action</p>
              </div>

              <div className="statusList">
                <MiniStatusCard
                  code="EST2609003"
                  project="TRX Event Build"
                  status="Pending"
                  color="#F59E0B"
                />

                <MiniStatusCard
                  code="EST2609004"
                  project="Mooncake Booth"
                  status="Approved"
                  color="#10B981"
                />

                <MiniStatusCard
                  code="EST2609005"
                  project="Retail Kiosk"
                  status="Draft"
                  color="#6B7280"
                />
              </div>
            </div>

            <div className="card">
              <div className="sectionHeader">
                <h2>Quick Actions</h2>
                <p>Common shortcuts</p>
              </div>

              <div className="shortcutList">
                <QuickActionButton
                  href="/calculator"
                  label="Create New Costing"
                />

                <QuickActionButton
                  href="/materials"
                  label="Manage Materials"
                />

                <QuickActionButton
                  href="/approvals"
                  label="Check Approvals"
                />

                <QuickActionButton
                  href="/activity"
                  label="View Activity Log"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

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
          background: #f5f7fb;
          font-family: Arial, sans-serif;
        }

        a {
          -webkit-tap-highlight-color: transparent;
        }

        .page {
          min-height: 100vh;
          background: #f5f7fb;
          padding-bottom: 50px;
        }

        .hero {
          background: linear-gradient(
            135deg,
            #0f766e,
            #14b8a6
          );
          color: white;
          padding: 30px 20px 95px;
          border-bottom-left-radius: 30px;
          border-bottom-right-radius: 30px;
        }

        .heroInner {
          max-width: 1200px;
          margin: 0 auto;
        }

        .heroTop {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 18px;
        }

        .welcome {
          font-size: 14px;
          opacity: 0.9;
          margin-bottom: 6px;
        }

        .hero h1 {
          margin: 0;
          font-size: 32px;
          line-height: 1.2;
        }

        .heroText {
          margin: 9px 0 0;
          font-size: 15px;
          line-height: 1.5;
          opacity: 0.95;
          max-width: 650px;
        }

        .profileButton {
          text-decoration: none;
          color: white;
          background: rgba(255, 255, 255, 0.18);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 16px;
          padding: 12px 16px;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }

        .profileIcon {
          font-size: 20px;
        }

        .summarySection {
          max-width: 1200px;
          margin: -58px auto 0;
          padding: 0 16px;
        }

        .summaryGrid {
          display: grid;
          grid-template-columns:
            repeat(4, minmax(0, 1fr));
          gap: 14px;
        }

        .summaryCard {
          background: white;
          border: 1px solid #eef2f7;
          border-radius: 20px;
          padding: 18px;
          box-shadow:
            0 8px 24px rgba(15, 23, 42, 0.08);
        }

        .summaryTitle {
          color: #6b7280;
          font-size: 14px;
          margin-bottom: 8px;
        }

        .summaryValue {
          color: #111827;
          font-size: 28px;
          font-weight: 800;
          line-height: 1.1;
        }

        .summarySub {
          color: #9ca3af;
          font-size: 13px;
          margin-top: 6px;
        }

        .contentSection,
        .mainGridSection {
          max-width: 1200px;
          margin: 24px auto 0;
          padding: 0 16px;
        }

        .sectionHeader {
          margin-bottom: 16px;
        }

        .sectionHeader h2 {
          margin: 0;
          color: #111827;
          font-size: 22px;
        }

        .sectionHeader p {
          margin: 6px 0 0;
          color: #6b7280;
          font-size: 14px;
        }

        .quickGrid {
          display: grid;
          grid-template-columns:
            repeat(3, minmax(0, 1fr));
          gap: 16px;
        }

        .quickCard {
          text-decoration: none;
          color: #111827;
          border-radius: 22px;
          padding: 18px;
          min-height: 155px;
          border: 1px solid rgba(0, 0, 0, 0.04);
          box-shadow:
            0 6px 18px rgba(15, 23, 42, 0.06);
          display: block;
          transition:
            transform 0.15s ease,
            box-shadow 0.15s ease;
        }

        .quickCard:active {
          transform: scale(0.98);
        }

        .quickIcon {
          width: 52px;
          height: 52px;
          border-radius: 17px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 25px;
          color: white;
          margin-bottom: 14px;
        }

        .quickTitle {
          font-size: 17px;
          font-weight: 700;
          margin-bottom: 6px;
        }

        .quickSubtitle {
          color: #4b5563;
          font-size: 14px;
          line-height: 1.4;
        }

        .mainGrid {
          display: grid;
          grid-template-columns:
            minmax(0, 2fr) minmax(280px, 1fr);
          gap: 20px;
          align-items: start;
        }

        .card {
          background: white;
          border: 1px solid #eef2f7;
          border-radius: 22px;
          padding: 20px;
          box-shadow:
            0 8px 24px rgba(15, 23, 42, 0.06);
        }

        .sideColumn {
          display: grid;
          gap: 20px;
        }

        .activityList {
          display: grid;
        }

        .activityRow {
          display: flex;
          justify-content: space-between;
          gap: 14px;
          padding: 15px 0;
          border-bottom: 1px solid #e5e7eb;
        }

        .activityRow:last-child {
          border-bottom: none;
        }

        .activityMain {
          min-width: 0;
        }

        .activityTop {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 6px;
        }

        .activityDetail {
          color: #4b5563;
          font-size: 14px;
          word-break: break-word;
        }

        .activityTime {
          color: #6b7280;
          font-size: 13px;
          white-space: nowrap;
        }

        .badge {
          display: inline-block;
          padding: 6px 10px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
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

        .statusList,
        .shortcutList {
          display: grid;
          gap: 12px;
        }

        .miniStatus {
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          padding: 14px;
        }

        .miniCode {
          font-weight: 700;
          margin-bottom: 4px;
        }

        .miniProject {
          color: #4b5563;
          font-size: 14px;
          margin-bottom: 10px;
        }

        .miniBadge {
          display: inline-block;
          padding: 6px 10px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
        }

        .shortcutButton {
          text-decoration: none;
          color: #111827;
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          padding: 14px 16px;
          border-radius: 14px;
          font-weight: 600;
          display: block;
        }

        @media (max-width: 900px) {
          .summaryGrid {
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
          }

          .quickGrid {
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
          }

          .mainGrid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 600px) {
          .hero {
            padding:
              24px 16px 86px;
          }

          .heroTop {
            flex-direction: column;
            align-items: stretch;
          }

          .hero h1 {
            font-size: 28px;
          }

          .profileButton {
            width: 100%;
            justify-content: center;
          }

          .summarySection {
            margin-top: -48px;
          }

          .summaryGrid {
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
            gap: 10px;
          }

          .summaryCard {
            padding: 15px;
            border-radius: 17px;
          }

          .summaryValue {
            font-size: 24px;
          }

          .contentSection,
          .mainGridSection {
            padding: 0 14px;
          }

          .quickGrid {
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
            gap: 12px;
          }

          .quickCard {
            padding: 15px;
            min-height: 145px;
            border-radius: 18px;
          }

          .quickIcon {
            width: 48px;
            height: 48px;
            border-radius: 15px;
            font-size: 23px;
          }

          .quickTitle {
            font-size: 16px;
          }

          .quickSubtitle {
            font-size: 13px;
          }

          .card {
            padding: 17px;
            border-radius: 18px;
          }

          .activityRow {
            flex-direction: column;
          }

          .activityTime {
            white-space: normal;
          }
        }
      `}</style>
    </main>
  );
}

function SummaryCard({
  title,
  value,
  sub,
}: {
  title: string;
  value: string;
  sub: string;
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
  );
}

function MiniStatusCard({
  code,
  project,
  status,
  color,
}: {
  code: string;
  project: string;
  status: string;
  color: string;
}) {
  return (
    <div className="miniStatus">
      <div className="miniCode">
        {code}
      </div>

      <div className="miniProject">
        {project}
      </div>

      <span
        className="miniBadge"
        style={{
          background: `${color}22`,
          color,
        }}
      >
        {status}
      </span>
    </div>
  );
}

function QuickActionButton({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="shortcutButton"
    >
      {label}
    </Link>
  );
}