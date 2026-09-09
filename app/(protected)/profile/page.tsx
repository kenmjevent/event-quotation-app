'use client'

import {
  useEffect,
  useState,
} from 'react'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

import {
  supabase,
} from '../../../lib/supabase'

import {
  getCurrentProfile,
  type UserProfile,
} from '../../../lib/authRole'

export default function ProfilePage() {
  const router =
    useRouter()

  const [
    profile,
    setProfile,
  ] =
    useState<UserProfile | null>(
      null
    )

  const [
    loading,
    setLoading,
  ] =
    useState(true)

  const [
    signingOut,
    setSigningOut,
  ] =
    useState(false)

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState('')

  useEffect(() => {
    loadProfile()
  }, [])

  async function loadProfile() {
    setLoading(true)
    setErrorMessage('')

    try {
      const currentProfile =
        await getCurrentProfile()

      if (!currentProfile) {
        setErrorMessage(
          'Unable to load user profile.'
        )
        return
      }

      setProfile(
        currentProfile
      )
    } catch (
      error: any
    ) {
      console.error(
        'Profile load error:',
        error
      )

      setErrorMessage(
        error?.message ||
          'Unable to load profile.'
      )
    } finally {
      setLoading(false)
    }
  }

  async function signOut() {
    const confirmed =
      window.confirm(
        'Sign out from Event Costing?'
      )

    if (!confirmed) {
      return
    }

    setSigningOut(true)
    setErrorMessage('')

    try {
      const {
        error,
      } =
        await supabase.auth.signOut()

      if (error) {
        throw error
      }

      router.replace(
        '/login'
      )

      router.refresh()
    } catch (
      error: any
    ) {
      console.error(
        'Sign out error:',
        error
      )

      setErrorMessage(
        error?.message ||
          'Unable to sign out.'
      )

      setSigningOut(false)
    }
  }

  function getInitials() {
    const name =
      profile?.full_name?.trim()

    if (!name) {
      return 'U'
    }

    const parts =
      name
        .split(/\s+/)
        .filter(Boolean)

    if (
      parts.length === 1
    ) {
      return parts[0]
        .slice(0, 2)
        .toUpperCase()
    }

    return (
      parts[0][0] +
      parts[
        parts.length - 1
      ][0]
    ).toUpperCase()
  }

  if (loading) {
    return (
      <main className="loadingPage">
        Loading profile...
      </main>
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
            User Profile
          </div>

          <div className="topSubtitle">
            Account information
          </div>
        </div>
      </header>

      {errorMessage && (
        <div className="errorBox">
          {errorMessage}
        </div>
      )}

      {profile && (
        <>
          <section className="profileHero">
            <div className="avatar">
              {getInitials()}
            </div>

            <div className="profileName">
              {profile.full_name ||
                'User'}
            </div>

            <div className="profileEmail">
              {profile.email ||
                '-'}
            </div>

            <div className="badges">
              <span className="roleBadge">
                {profile.role ===
                'admin'
                  ? 'Admin'
                  : 'Estimator'}
              </span>

              <span className="activeBadge">
                Active
              </span>
            </div>
          </section>

          <section className="infoSection">
            <div className="sectionHeader">
              <div>
                <h2>
                  Account Details
                </h2>

                <p>
                  Your internal user
                  information
                </p>
              </div>
            </div>

            <div className="infoGrid">
              <InfoCard
                icon="👤"
                label="Full Name"
                value={
                  profile.full_name ||
                  '-'
                }
              />

              <InfoCard
                icon="✉️"
                label="Email"
                value={
                  profile.email ||
                  '-'
                }
              />

              <InfoCard
                icon="🛡️"
                label="Role"
                value={
                  profile.role ===
                  'admin'
                    ? 'Admin'
                    : 'Estimator'
                }
              />

              <InfoCard
                icon="🏢"
                label="Department"
                value={
                  profile.department ||
                  '-'
                }
              />
            </div>
          </section>

          <section className="permissionSection">
            <h2>
              Access Level
            </h2>

            {profile.role ===
            'admin' ? (
              <div className="permissionBox">
                <div className="permissionIcon">
                  ✓
                </div>

                <div>
                  <strong>
                    Full Access
                  </strong>

                  <p>
                    Calculator,
                    Materials,
                    Cost Listings,
                    Approval,
                    Activity and
                    Profile.
                  </p>
                </div>
              </div>
            ) : (
              <div className="permissionBox">
                <div className="permissionIcon">
                  ✓
                </div>

                <div>
                  <strong>
                    Estimator Access
                  </strong>

                  <p>
                    Calculator,
                    Cost Listings and
                    Profile. Draft and
                    rejected costings
                    can be edited and
                    resubmitted.
                  </p>
                </div>
              </div>
            )}
          </section>

          <button
            type="button"
            onClick={
              signOut
            }
            disabled={
              signingOut
            }
            className="signOutButton"
          >
            {signingOut
              ? 'Signing Out...'
              : 'Sign Out'}
          </button>
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

        .loadingPage {
          min-height:
            100vh;

          display:
            flex;

          align-items:
            center;

          justify-content:
            center;

          background:
            var(--mj-background);

          color:
            var(--mj-primary);

          font-weight:
            700;
        }

        .page {
          min-height:
            100vh;

          max-width:
            800px;

          margin:
            0 auto;

          padding:
            18px
            14px
            50px;
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

        .profileHero {
          padding:
            30px
            20px;

          border-radius:
            24px;

          text-align:
            center;

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
              0.18
            );
        }

        .avatar {
          width:
            92px;

          height:
            92px;

          margin:
            0 auto;

          display:
            flex;

          align-items:
            center;

          justify-content:
            center;

          border-radius:
            50%;

          background:
            rgba(
              255,
              255,
              255,
              0.18
            );

          border:
            2px solid
            rgba(
              255,
              255,
              255,
              0.55
            );

          color:
            white;

          font-size:
            30px;

          font-weight:
            800;

          box-shadow:
            0
            8px
            20px
            rgba(
              0,
              0,
              0,
              0.08
            );
        }

        .profileName {
          margin-top:
            17px;

          font-size:
            24px;

          font-weight:
            800;
        }

        .profileEmail {
          margin-top:
            6px;

          font-size:
            13px;

          opacity:
            0.9;

          word-break:
            break-word;
        }

        .badges {
          display:
            flex;

          justify-content:
            center;

          align-items:
            center;

          flex-wrap:
            wrap;

          gap:
            8px;

          margin-top:
            16px;
        }

        .roleBadge {
          display:
            inline-flex;

          padding:
            7px
            13px;

          border-radius:
            999px;

          background:
            rgba(
              255,
              255,
              255,
              0.18
            );

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              0.4
            );

          color:
            white;

          font-size:
            11px;

          font-weight:
            800;
        }

        .activeBadge {
          display:
            inline-flex;

          padding:
            7px
            13px;

          border-radius:
            999px;

          background:
            #dcfce7;

          color:
            #166534;

          font-size:
            11px;

          font-weight:
            800;
        }

        .infoSection,
        .permissionSection {
          margin-top:
            18px;

          padding:
            18px;

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

        .sectionHeader {
          display:
            flex;

          justify-content:
            space-between;

          gap:
            12px;

          margin-bottom:
            15px;
        }

        .infoSection h2,
        .permissionSection h2 {
          margin: 0;

          color:
            var(--mj-text);

          font-size:
            19px;
        }

        .sectionHeader p {
          margin:
            4px 0 0;

          color:
            var(--mj-muted);

          font-size:
            11px;
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
        }

        .infoCard {
          min-width:
            0;

          padding:
            14px;

          border:
            1px solid
            var(--mj-border);

          border-radius:
            14px;

          background:
            linear-gradient(
              145deg,
              #ffffff,
              #f3fbff
            );
        }

        .infoIcon {
          width:
            38px;

          height:
            38px;

          display:
            flex;

          align-items:
            center;

          justify-content:
            center;

          border-radius:
            11px;

          background:
            var(--mj-light);

          font-size:
            18px;
        }

        .infoLabel {
          margin-top:
            11px;

          color:
            var(--mj-muted);

          font-size:
            10px;
        }

        .infoValue {
          margin-top:
            4px;

          color:
            var(--mj-primary-deep);

          font-size:
            13px;

          font-weight:
            800;

          word-break:
            break-word;
        }

        .permissionBox {
          display:
            flex;

          align-items:
            flex-start;

          gap:
            12px;

          margin-top:
            14px;

          padding:
            14px;

          border-radius:
            14px;

          background:
            var(--mj-light);

          border:
            1px solid
            var(--mj-border);
        }

        .permissionIcon {
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
            var(--mj-primary);

          color:
            white;

          font-size:
            16px;

          font-weight:
            800;
        }

        .permissionBox strong {
          color:
            var(--mj-primary-deep);

          font-size:
            13px;
        }

        .permissionBox p {
          margin:
            5px 0 0;

          color:
            #52606d;

          font-size:
            12px;

          line-height:
            1.5;
        }

        .signOutButton {
          width:
            100%;

          margin-top:
            18px;

          padding:
            14px;

          border-radius:
            13px;

          border:
            1px solid
            #fecaca;

          background:
            #fff1f2;

          color:
            #991b1b;

          font-size:
            14px;

          font-weight:
            800;

          cursor:
            pointer;
        }

        .signOutButton:hover {
          background:
            #fee2e2;
        }

        .signOutButton:disabled {
          opacity:
            0.55;

          cursor:
            not-allowed;
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

        @media (
          max-width:
            600px
        ) {
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

          .profileHero {
            padding:
              26px
              16px;
          }

          .avatar {
            width:
              82px;

            height:
              82px;

            font-size:
              27px;
          }

          .profileName {
            font-size:
              21px;
          }
        }
      `}</style>
    </main>
  )
}

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: string
  label: string
  value: string
}) {
  return (
    <div className="infoCard">
      <div className="infoIcon">
        {icon}
      </div>

      <div className="infoLabel">
        {label}
      </div>

      <div className="infoValue">
        {value}
      </div>
    </div>
  )
}