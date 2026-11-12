// ห่อกราฟ/แผนที่ให้ "กดเพื่อขยาย" ได้: มีปุ่มขยายมุมขวาบน และกดที่ตัวกราฟก็ขยายได้
// หน้าต่างขยายเต็มพื้นที่สไลด์ ปิดด้วยปุ่ม ✕, คลิกพื้นหลัง หรือกด Esc
//
// ใช้:  <Expandable title="ตำแหน่งจุดท่วม" toolbar={…}>{({ expanded }) => <MapBase>…</MapBase>}</Expandable>
//   - children เป็น node หรือ function ({ expanded }) เพื่อแสดงรายละเอียดเพิ่มตอนขยาย (เช่น ป้ายชื่อ)
//   - toolbar: ปุ่มควบคุมที่อยากให้มีในหน้าต่างขยายด้วย (เช่น ปุ่มสลับโหมด)
//   - aside: เนื้อหาด้านข้างในหน้าต่างขยาย (เช่น legend หรือรายการ)
//   - ในตัวกราฟ ถ้าองค์ประกอบไหนมี onClick ของตัวเอง ให้เรียก e.stopPropagation() เพื่อไม่ให้เปิดหน้าต่างขยาย
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import s from './Expandable.module.css'

export default function Expandable({ title, note, toolbar, aside, children, className = '' }) {
  const [open, setOpen] = useState(false)
  const render = (expanded) => (typeof children === 'function' ? children({ expanded }) : children)

  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        setOpen(false)
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [open])

  const target = typeof document !== 'undefined' ? document.getElementById('stage-overlay') : null

  return (
    <div className={`${s.wrap} ${className}`}>
      <div
        className={s.inline}
        onClick={() => setOpen(true)}
        role="button"
        tabIndex={0}
        aria-label={`ขยาย ${title || 'กราฟ'}`}
        onKeyDown={(e) => e.key === 'Enter' && setOpen(true)}
      >
        {render(false)}
      </div>
      <button
        type="button"
        className={s.expandBtn}
        onClick={(e) => {
          e.stopPropagation()
          setOpen(true)
        }}
        aria-label="ขยาย"
        title="ขยาย"
      >
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
          <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        ขยาย
      </button>

      {open &&
        target &&
        createPortal(
          <div className={s.backdrop} onClick={() => setOpen(false)}>
            <div className={s.panel} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={title}>
              <header className={s.head}>
                <div>
                  {title && <h2 className={s.title}>{title}</h2>}
                  {note && <p className={s.note}>{note}</p>}
                </div>
                <div className={s.headRight}>
                  {toolbar}
                  <button type="button" className={s.closeBtn} onClick={() => setOpen(false)}>
                    ✕ ปิด <kbd>Esc</kbd>
                  </button>
                </div>
              </header>
              <div className={s.body}>
                <div className={s.big}>{render(true)}</div>
                {aside && <aside className={s.aside}>{aside}</aside>}
              </div>
            </div>
          </div>,
          target,
        )}
    </div>
  )
}
