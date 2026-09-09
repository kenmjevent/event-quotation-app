'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import {
  getCurrentProfile,
  type UserProfile,
} from '../../../lib/authRole'

export default function ProfilePage() {
  const router = useRouter()

  const [profile, setProfile] =
    useState<UserProfile | null>(null)

  const [loading, setLoading] = useState(true)
  const [signingOut, setSigningOut] = useState(false)

  useEffect(() => {
    loadProfile()
  }, [])

  async function loadProfile() {
    setLoading(true)

    const data = await getCurrentProfile()

    setProfile(data)
    setLoading(false)
  }

  async function handleSignOut() {
    setSigningOut(true)

    const { error } = await supabase.auth.signOut()

    if (error) {
      alert(`Sign out failed: ${error.message}`)
      setSigningOut(false)
      return
    }

    router.replace('/login')
    router.refresh()
  }

  function roleLabel(role?: string) {
    if (!role) return '-'

    if (role === 'admin') return 'Admin'
    if (role === 'estimator') return 'Estimator'
    if (role === 'manager') return 'Manager'
    if (role === 'viewer') return 'Viewer'

    return role
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

      {loading ? (
        <div className="card">
          Loading profile...
        </div>
      ) : !profile ? (
        <div className="errorBox">
          Unable to load user profile.
        </div>
      ) : (
        <>
          <section className="profileHero">
            <div className="avatar">
              👤
            </div>

            <div>
              <div className="profileName">
                {profile.full_name || 'User'}
              </div>

              <div className="profileRole">
                {roleLabel(profile.role)}
              </div>
            </div>
          </section>

          <section className="card">
            <h2>Profile Information</h2>

            <InfoRow
              label="Full Name"
              value={profile.full_name || '-'}
            />

            <InfoRow
              label="Email"
              value={profile.email || '-'}
            />

            <InfoRow
              label="Role"
              value={roleLabel(profile.role)}
            />

            <InfoRow
              label="Department"
              value={profile.department || '-'}
            />
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

              <span
                className={
                  profile.is_active
                    ? 'activeBadge'
                    : 'inactiveBadge'
                }
              >
                {profile.is_active
                  ? 'Active'
                  : 'Inactive'}
              </span>
            </div>

            <div className="statusRow">
              <div>
                <div className="statusTitle">
                  Permission Level
                </div>

                <div className="statusSub">
                  Based on assigned role
                </div>
              </div>

              <strong>
                {roleLabel(profile.role)}
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
              label="Version"
              value="1.0.0"
            />

            <InfoRow
              label="Database"
              value="Supabase"
            />

            <InfoRow
              label="Authentication"
              value="Supabase Auth"
            />
          </section>
        </>
      )}

      <button
        type="button"
        onClick={handleSignOut}
        disabled={signingOut}
        className="signOutButton"
      >
        {signingOut
          ? 'Signing Out...'
          : 'Sign Out'}
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
          background: rgba(255,255,255,0.2);
          border: 1px solid rgba(255,255,255,0.3);
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

        .infoRow,
        .statusRow {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          padding: 12px 0;
          border-bottom: 1px solid #edf0f3;
        }

        .infoRow:last-child,
        .statusRow:last-child {
          border-bottom: none;
        }

        .infoLabel,
        .statusTitle {
          color: #111827;
          font-size: 14px;
          font-weight: 700;
        }

        .infoValue {
          color: #6b7280;
          font-size: 13px;
          text-align: right;
          word-break: break-word;
        }

        .statusSub {
          margin-top: 3px;
          color: #9ca3af;
          font-size: 11px;
        }

        .activeBadge,
        .inactiveBadge {
          padding: 5px 9px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 800;
        }

        .activeBadge {
          background: #dcfce7;
          color: #166534;
        }

        .inactiveBadge {
          background: #fee2e2;
          color: #991b1b;
        }

        .errorBox {
          margin-bottom: 16px;
          background: #fee2e2;
          color: #991b1b;
          border-radius: 12px;
          padding: 14px;
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

        .signOutButton:disabled {
          opacity: 0.6;
        }

        .bottomNav {
          position: fixed;
          left: 0;
          right: 0;
          bottom: 0;
          height: 72px;
          background: rgba(255,255,255,0.97);
          border-top: 1px solid #e5e7eb;
          display: grid;
          grid-template-columns: repeat(5, 1fr);
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
      `}</style>
    </main>
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