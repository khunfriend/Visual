import s from './SlideFrame.module.css'

/**
 * โครงมาตรฐานของทุกสไลด์ (PRD 5.3)
 * - title:    หัวเรื่องที่เป็นข้อสรุป
 * - subtitle: บรรทัดรองที่มีตัวเลขสำคัญ
 * - kicker:   ชื่อหัวข้อสั้น ๆ เหนือหัวเรื่อง (เช่น "02 · น้ำท่วม")
 * - source:   ที่มาและหมายเหตุ (string หรือ JSX)
 * - children: เนื้อหา/กราฟ
 */
export default function SlideFrame({ kicker, title, subtitle, source, children }) {
  return (
    <section className={s.frame}>
      <header className={s.header}>
        {kicker && <p className={s.kicker}>{kicker}</p>}
        <h1 className={s.title}>{title}</h1>
        {subtitle && <p className={s.subtitle}>{subtitle}</p>}
      </header>
      <div className={s.body}>{children}</div>
      {source && <footer className={s.source}>{source}</footer>}
    </section>
  )
}
