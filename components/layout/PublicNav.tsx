'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

export default function PublicNav() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(8,8,8,.96)',
        backdropFilter: 'blur(16px)',
        borderBottom: '0.5px solid #111',
        padding: '0 20px',
        height: 56,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>

        {/* Logo */}
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, background: '#BEFF00', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: 12, fontWeight: 900, color: '#003E31', fontFamily: "'Arial Black',Arial" }}>LA</span>
          </div>
          <div>
            <div style={{ fontFamily: "'Arial Black',Arial", fontSize: 13, fontWeight: 900, letterSpacing: 2, color: '#fff', lineHeight: 1.1 }}>LUME</div>
            <div style={{ fontFamily: "'Arial Black',Arial", fontSize: 13, fontWeight: 900, letterSpacing: 2, color: '#BEFF00', lineHeight: 1.1 }}>ARENA</div>
          </div>
        </Link>

        {/* Hamburger */}
        <button onClick={() => setOpen(!open)}
          style={{ background: 'none', border: '0.5px solid #1A1A1A', borderRadius: 8, padding: '9px 11px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 5 }}>
          <span style={{ display: 'block', width: 20, height: 1.5, background: '#fff', borderRadius: 2, transition: 'all .2s', transform: open ? 'translateY(6.5px) rotate(45deg)' : 'none' }}/>
          <span style={{ display: 'block', width: 20, height: 1.5, background: '#fff', borderRadius: 2, transition: 'opacity .2s', opacity: open ? 0 : 1 }}/>
          <span style={{ display: 'block', width: 20, height: 1.5, background: '#fff', borderRadius: 2, transition: 'all .2s', transform: open ? 'translateY(-6.5px) rotate(-45deg)' : 'none' }}/>
        </button>
      </nav>

      {/* Dropdown menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            style={{ position: 'fixed', top: 56, left: 0, right: 0, background: '#0C0C0C', borderBottom: '0.5px solid #111', zIndex: 49, overflow: 'hidden' }}>
            <div style={{ padding: '8px 0 20px' }}>
              <Link href="/batches" onClick={() => setOpen(false)}
                style={{ display: 'block', padding: '16px 24px', fontSize: 16, fontWeight: 700, color: '#fff', textDecoration: 'none', borderBottom: '0.5px solid #111' }}>
                Batches
              </Link>
              <Link href="/leaderboard" onClick={() => setOpen(false)}
                style={{ display: 'block', padding: '16px 24px', fontSize: 16, fontWeight: 700, color: '#fff', textDecoration: 'none', borderBottom: '0.5px solid #111' }}>
                Leaderboard
              </Link>
              <div style={{ padding: '16px 24px 0' }}>
                <Link href="/login" onClick={() => setOpen(false)}>
                  <button style={{ width: '100%', minHeight: 50, background: '#BEFF00', color: '#080808', border: 'none', borderRadius: 11, fontSize: 15, fontWeight: 900, fontFamily: "'Arial Black',Arial", cursor: 'pointer', letterSpacing: 1 }}>
                    SIGN IN / SIGN UP →
                  </button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
