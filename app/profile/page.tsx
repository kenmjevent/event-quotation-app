'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function ProfilePage() {
  const [name, setName] = useState('Admin User')
  const [email, setEmail] = useState('admin@mjevent.com')
  const [role, setRole] = useState('Admin')
  const [department, setDepartment] = useState('Management')

  const [message, setMessage] = useState('')

  function saveProfile() {
    setMessage('Profile saved.')
  }

  function handleSignOut() {
    alert(
      'Login system has not been connected yet. We will add Supabase Auth next.'
    )
  }

  return (
    <main className="page">
      <header className="topBar">
        <Link href="/" className="backButton">
          ←
        </Link>

        <div>
          <div className="topTitle">
            User Profile
          </div>

          <div className="topSubtitle">
            Account & system information
          </div>
        </div>
      </header>

      <section className="profileHero">
        <div className="avatar">
          👤
        </div>

        <div>
          <div className="profileName">
            {name}
          </div>

          <div className="profileRole">
            {role}
          </div>
        </div>
      </section>

      <section className="card">
        <h2>Profile Information</h2>

        <div className="formGrid">
          <Field label="Name">
            <input
              value={name}
              onChange={(e) =>
                setName(e.target.value)
              }
              className="input"
            />
          </Field>

          <Field label="Email">
            <input
              type="email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              className="input"
            />
          </Field>

          <Field label="Role">
            <select
              value={role}
              onChange={(e) =>
                setRole(e.target.value)
              }
              className="input"
            >
              <option value="Admin">
                Admin
              </option>

              <option value="Estimator">
                Estimator
              </option>

              <option value="Manager">
                Manager
              </option>

              <option value="Viewer">
                Viewer
              </option>
            </select>
          </Field>

          <Field label="Department">
            <input
              value={department}
              onChange={(e) =>
                setDepartment(e.target.value)
              }
              className="input"
            />
          </Field>
        </div>

        {message && (
          <div className="successBox">
            {message}
          </div>
        )}

        <button
          type="button"
          onClick={saveProfile}
          className="saveButton"
        >
          Save Profile
        </button>
      </section>

      <section className="card">
        <h2>Account Status</h2>

        <div className="statusRow">
          <div>
            <div className="statusTitle">
              Account
            </div>

            <div className="statusSub">
              Current system access
            </div>
          </div>

          <span className="activeBadge">
            Active
          </span>
        </div>

        <div className="statusRow">
          <div>
            <div className="statusTitle">
              Role
            </div>

            <div className="statusSub">
              System permission level
            </div>
          </div>

          <strong>
            {role}
          </strong>
        </div>
      </section>

      <section className="card">
        <h2>System</h2>

        <InfoRow
          label="Application"
          value="Event Costing"
        />

        <InfoRow
          label="Platform"
          value="Internal Web App"
        />

        <InfoRow
          label="Version"
          value="1.0.0"
        />

        <InfoRow
          label="Database"
          value="Supabase"
        />
      </section>

      <button
        type="button"
        onClick={handleSignOut}
        className="signOutButton"
      >
        Sign Out
      </button>

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
          active
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
          background: #f4f6fa;
          font-family: Arial, sans-serif;
        }

        body {
          padding-bottom: 90px;
        }

        .page {
          min-height: 100vh;
          max-width: 900px;
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
          align-items: center;
          justify-content: center;
          text-decoration: none;
          color: #0f766e;
          font-size: 24px;
          font-weight: 800;
        }

        .topTitle {
          font-size: 24px;
          font-weight: 800;
          color: #111827;
        }

        .topSubtitle {
          margin-top: 3px;
          color: #6b7280;
          font-size: 13px;
        }

        .profileHero {
          background: linear-gradient(
            135deg,
            #0f766e,
            #0d9488
          );
          color: white;
          border-radius: 20px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 15px;
          margin-bottom: 18px;
        }

        .avatar {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background:
            rgba(255,255,255,0.2);
          border:
            1px solid rgba(
              255,
              255,
              255,
              0.3
            );
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 30px;
        }

        .profileName {
          font-size: 21px;
          font-weight: 800;
        }

        .profileRole {
          margin-top: 4px;
          opacity: 0.85;
          font-size: 13px;
        }

        .card {
          background: white;
          border: 1px solid #e8ecf1;
          border-radius: 18px;
          padding: 17px;
          margin-bottom: 16px;
          box-shadow:
            0 5px 18px
            rgba(15,23,42,0.04);
        }

        .card h2 {
          margin: 0 0 16px;
          font-size: 19px;
          color: #111827;
        }

        .formGrid {
          display: grid;
          grid-template-columns:
            repeat(2, minmax(0,1fr));
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
          padding: 12px;
          border: 1px solid #d1d5db;
          border-radius: 10px;
          font-size: 14px;
          background: white;
        }

        .saveButton {
          width: 100%;
          margin-top: 15px;
          border: none;
          background: #0f766e;
          color: white;
          padding: 13px;
          border-radius: 11px;
          font-weight: 800;
          cursor: pointer;
        }

        .successBox {
          margin-top: 14px;
          padding: 11px;
          background: #dcfce7;
          color: #166534;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 700;
        }

        .statusRow,
        .infoRow {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          padding: 12px 0;
          border-bottom:
            1px solid #edf0f3;
        }

        .statusRow:last-child,
        .infoRow:last-child {
          border-bottom: none;
        }

        .statusTitle,
        .infoLabel {
          color: #111827;
          font-size: 14px;
          font-weight: 700;
        }

        .statusSub {
          margin-top: 3px;
          color: #9ca3af;
          font-size: 11px;
        }

        .infoValue {
          color: #6b7280;
          font-size: 13px;
          text-align: right;
        }

        .activeBadge {
          background: #dcfce7;
          color: #166534;
          padding: 5px 9px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 800;
        }

        .signOutButton {
          width: 100%;
          border: 1px solid #fecaca;
          background: white;
          color: #b91c1c;
          padding: 13px;
          border-radius: 12px;
          font-weight: 800;
          cursor: pointer;
          margin-bottom: 10px;
        }

        .bottomNav {
          position: fixed;
          left: 0;
          right: 0;
          bottom: 0;
          height: 72px;
          background:
            rgba(255,255,255,0.97);
          border-top: 1px solid #e5e7eb;
          display: grid;
          grid-template-columns:
            repeat(5,1fr);
          z-index: 999;
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
        }

        @media (max-width: 650px) {
          .formGrid {
            grid-template-columns: 1fr;
          }

          .profileHero {
            padding: 17px;
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

function InfoRow({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="infoRow">
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