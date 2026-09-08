'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

export default function LoginPage() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()

    setLoading(true)
    setErrorMessage('')

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (error) {
      setErrorMessage(error.message)
      setLoading(false)
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <main className="page">
      <section className="loginCard">
        <div className="logoBox">
          🧮
        </div>

        <h1>Event Costing</h1>

        <p className="subtitle">
          Internal costing & approval system
        </p>

        <form onSubmit={handleLogin}>
          <div className="field">
            <label>Email</label>

            <input
              type="email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              placeholder="name@company.com"
              required
            />
          </div>

          <div className="field">
            <label>Password</label>

            <input
              type="password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              placeholder="Password"
              required
            />
          </div>

          {errorMessage && (
            <div className="errorBox">
              {errorMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
          >
            {loading
              ? 'Signing in...'
              : 'Sign In'}
          </button>
        </form>

        <div className="footerText">
          M&J Event Solutions
        </div>
      </section>

      <style jsx>{`
        .page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background:
            linear-gradient(
              135deg,
              #0f766e,
              #0d9488
            );
          font-family: Arial, sans-serif;
        }

        .loginCard {
          width: 100%;
          max-width: 390px;
          background: white;
          border-radius: 24px;
          padding: 30px 24px;
          box-shadow:
            0 20px 50px
            rgba(0,0,0,0.18);
        }

        .logoBox {
          width: 64px;
          height: 64px;
          margin: 0 auto 16px;
          border-radius: 18px;
          background: #ecfdf5;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 30px;
        }

        h1 {
          text-align: center;
          margin: 0;
          color: #111827;
          font-size: 28px;
        }

        .subtitle {
          text-align: center;
          margin: 7px 0 25px;
          color: #6b7280;
          font-size: 13px;
        }

        .field {
          margin-bottom: 15px;
        }

        label {
          display: block;
          margin-bottom: 6px;
          font-size: 13px;
          font-weight: 700;
          color: #374151;
        }

        input {
          width: 100%;
          box-sizing: border-box;
          padding: 13px;
          border: 1px solid #d1d5db;
          border-radius: 11px;
          font-size: 15px;
          outline: none;
        }

        input:focus {
          border-color: #0d9488;
        }

        button {
          width: 100%;
          margin-top: 5px;
          padding: 13px;
          border: none;
          border-radius: 11px;
          background: #0f766e;
          color: white;
          font-size: 15px;
          font-weight: 800;
          cursor: pointer;
        }

        button:disabled {
          opacity: 0.6;
        }

        .errorBox {
          margin-bottom: 12px;
          padding: 11px;
          border-radius: 10px;
          background: #fee2e2;
          color: #991b1b;
          font-size: 13px;
        }

        .footerText {
          margin-top: 20px;
          text-align: center;
          font-size: 11px;
          color: #9ca3af;
        }
      `}</style>
    </main>
  )
}