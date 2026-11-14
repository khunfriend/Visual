import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import slides from '../slides.js'
import { toCssVars } from '../theme/theme.js'
import Stage from './Stage.jsx'
import ErrorBoundary from './ErrorBoundary.jsx'
import s from './Deck.module.css'

// ป้ายหน้า: สไลด์หลักเป็น 1, 2, 3 … ภาคผนวกเป็น A1, A2 … (PRD F5)
const labelled = (() => {
  let main = 0
  let app = 0
  return slides.map((sl) => ({ ...sl, label: sl.appendix ? `A${++app}` : String(++main) }))
})()
const mainCount = labelled.filter((sl) => !sl.appendix).length

const indexOfLabel = (label) =>
  labelled.findIndex((sl) => sl.label.toLowerCase() === String(label).toLowerCase())

const readHash = () => {
  const m = window.location.hash.match(/^#\/(.+)$/)
  const i = m ? indexOfLabel(decodeURIComponent(m[1])) : -1
  return i >= 0 ? i : 0
}

export default function Deck() {
  const cssVars = useMemo(() => toCssVars(), [])
  const params = new URLSearchParams(window.location.search)
  const only = params.get('only')

  // โหมดพิมพ์/ทำ PDF ?print : ทุกสไลด์เรียงต่อกัน 1 สไลด์ = 1 หน้า 1920×1080 แล้วกด Cmd/Ctrl + P → Save as PDF
  if (params.has('print')) return <PrintDeck cssVars={cssVars} />

  // โหมดดูหน้าเดียว ?only=3 หรือ ?only=A1 (PRD F6)
  if (only !== null) {
    const i = indexOfLabel(only)
    const sl = labelled[i]
    return (
      <div style={cssVars} className={s.root}>
        <Stage>
          {sl ? (
            <ErrorBoundary label={sl.label}>
              <sl.Component />
            </ErrorBoundary>
          ) : (
            <div className={s.error}>
              <p className={s.errorTitle}>ไม่พบสไลด์ "{only}"</p>
              <p className={s.errorHint}>
                มีสไลด์: {labelled.map((x) => x.label).join(', ')}
              </p>
            </div>
          )}
        </Stage>
        {sl && <div className={s.onlyBadge}>โหมดดูหน้าเดียว · สไลด์ {sl.label}</div>}
      </div>
    )
  }

  return <Presenter cssVars={cssVars} />
}

function PrintDeck({ cssVars }) {
  // ปลดล็อกการเลื่อนหน้า (โหมดปกติล็อกไว้ให้พอดีจอ)
  useEffect(() => {
    document.documentElement.classList.add('print-mode')
    // ตอนพิมพ์ ล็อกความสูงทั้งเอกสาร = จำนวนหน้า × 1080 px กันหน้าว่างท้ายไฟล์
    const st = document.createElement('style')
    const h = `${labelled.length * 1080}px`
    st.textContent = `@media print { html, body, #root { height: ${h} !important; max-height: ${h} !important; overflow: hidden !important; } }`
    document.head.appendChild(st)
    return () => {
      document.documentElement.classList.remove('print-mode')
      st.remove()
    }
  }, [])
  return (
    <div style={{ ...cssVars, '--print-h': `${labelled.length * 1080}px` }} className={s.printRoot}>
      <p className={s.printHint}>โหมดทำ PDF · กด Cmd/Ctrl + P แล้วเลือก "บันทึกเป็น PDF" (ขนาดกระดาษตั้งให้อัตโนมัติ)</p>
      {labelled.map((sl) => {
        const progress = sl.appendix ? 1 : Number(sl.label) / mainCount
        return (
          <div key={sl.id} className={s.printPage}>
            <ErrorBoundary label={sl.label}>
              <sl.Component />
            </ErrorBoundary>
            <div className={s.progress} style={{ transform: `scaleX(${progress})` }} />
            <div className={s.pageNo}>{sl.appendix ? `ภาคผนวก ${sl.label}` : `${sl.label} / ${mainCount}`}</div>
          </div>
        )
      })}
      <div id="stage-overlay" />
    </div>
  )
}

function Presenter({ cssVars }) {
  const [index, setIndex] = useState(readHash)
  const [jump, setJump] = useState('') // ตัวเลขที่กำลังพิมพ์เพื่อกระโดดไปหน้า (PRD F3)
  const jumpTimer = useRef(null)
  const [fs, setFs] = useState(false) // โหมดนำเสนอ = เต็มจอของเบราว์เซอร์ (ซ่อนแถบ URL และแท็บ)
  const [idle, setIdle] = useState(false) // เมาส์นิ่ง → ซ่อนเคอร์เซอร์และปุ่ม
  const idleTimer = useRef(null)

  const toggleFs = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen()
    else document.documentElement.requestFullscreen?.().catch(() => {})
  }, [])

  useEffect(() => {
    const onFs = () => setFs(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onFs)
    return () => document.removeEventListener('fullscreenchange', onFs)
  }, [])

  // ขยับเมาส์หรือกดแป้น = โชว์ปุ่ม · นิ่ง 2.5 วิ = ซ่อน (แบบ Canva)
  useEffect(() => {
    const wake = () => {
      setIdle(false)
      clearTimeout(idleTimer.current)
      idleTimer.current = setTimeout(() => setIdle(true), 2500)
    }
    wake()
    window.addEventListener('mousemove', wake)
    window.addEventListener('keydown', wake)
    return () => {
      window.removeEventListener('mousemove', wake)
      window.removeEventListener('keydown', wake)
      clearTimeout(idleTimer.current)
    }
  }, [])

  const go = useCallback((i) => {
    const next = Math.max(0, Math.min(labelled.length - 1, i))
    setIndex(next)
    const hash = `#/${labelled[next].label}`
    if (window.location.hash !== hash) window.history.replaceState(null, '', hash)
  }, [])

  // ซิงก์กับปุ่ม back/forward หรือการแก้ URL เอง (PRD F2)
  useEffect(() => {
    const onHash = () => setIndex(readHash())
    window.addEventListener('hashchange', onHash)
    if (!window.location.hash) go(0)
    return () => window.removeEventListener('hashchange', onHash)
  }, [go])

  useEffect(() => {
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const k = e.key

      // พิมพ์เลขหน้าแล้วกด Enter
      if (/^[0-9aA]$/.test(k)) {
        setJump((j) => (j + k).toUpperCase().slice(-3))
        clearTimeout(jumpTimer.current)
        jumpTimer.current = setTimeout(() => setJump(''), 2500)
        return
      }
      if (k === 'Enter' && jump) {
        const i = indexOfLabel(jump)
        if (i >= 0) go(i)
        setJump('')
        return
      }
      if (k === 'Escape') return setJump('')

      if (['ArrowRight', 'PageDown', ' '].includes(k)) {
        e.preventDefault()
        go(index + 1)
      } else if (['ArrowLeft', 'PageUp'].includes(k)) {
        e.preventDefault()
        go(index - 1)
      } else if (k === 'Home') go(0)
      else if (k === 'End') go(labelled.length - 1)
      else if (k === 'f' || k === 'F' || k === 'p' || k === 'P') toggleFs() // เต็มจอ / นำเสนอ (PRD F7)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [index, jump, go, toggleFs])

  const sl = labelled[index]
  const progress = sl.appendix ? 1 : Number(sl.label) / mainCount

  return (
    <div style={cssVars} className={`${s.root} ${idle ? s.idle : ''}`}>
      <Stage>
        <ErrorBoundary key={sl.label} label={sl.label}>
          <sl.Component />
        </ErrorBoundary>
        <div className={s.progress} style={{ transform: `scaleX(${progress})` }} />
        <div className={s.pageNo}>
          {sl.appendix ? `ภาคผนวก ${sl.label}` : `${sl.label} / ${mainCount}`}
        </div>
      </Stage>

      {jump && <div className={s.jump}>ไปหน้า {jump} · กด Enter</div>}

      {/* ปุ่มนำเสนอ: เต็มจอ ไม่เห็นแถบ URL (กด Esc เพื่อออก) */}
      {!fs && (
        <button className={s.presentBtn} onClick={(e) => (toggleFs(), e.currentTarget.blur())} title="เต็มจอ ซ่อนแถบ URL (กด F หรือ P)">
          ▶ นำเสนอ
        </button>
      )}

      {/* ปุ่มสำหรับเมาส์/จอสัมผัส */}
      <button
        className={`${s.nav} ${s.navPrev}`}
        onClick={(e) => (go(index - 1), e.currentTarget.blur())}
        disabled={index === 0}
        aria-label="หน้าก่อน"
      >
        ‹
      </button>
      <button
        className={`${s.nav} ${s.navNext}`}
        onClick={(e) => (go(index + 1), e.currentTarget.blur())}
        disabled={index === labelled.length - 1}
        aria-label="หน้าถัดไป"
      >
        ›
      </button>
    </div>
  )
}
