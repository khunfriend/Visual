import s from './Placeholder.module.css'

/**
 * กล่องจองพื้นที่กราฟ ใช้ระหว่างที่ยังไม่ได้ทำกราฟจริง (ลบออกเมื่อทำกราฟเสร็จ)
 * - items: รายการ visual ที่จะวางในพื้นที่นี้
 * - status: ข้อความสถานะข้อมูล เช่น "ข้อมูลครบ" / "รอพิกัด"
 */
export default function Placeholder({ items = [], status, columns = 1 }) {
  return (
    <div className={s.wrap} style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
      {items.map((it) => (
        <div key={it} className={s.box}>
          <span className={s.label}>{it}</span>
        </div>
      ))}
      {status && <p className={s.status}>สถานะข้อมูล: {status}</p>}
    </div>
  )
}
