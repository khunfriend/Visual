// ของใช้ร่วมของกราฟทุกหน้า (แก้ที่นี่มีผลทุกสไลด์)
// หลักจาก dataviz: เส้นกริดบาง สีเรียบ ตัวอักษรใช้สีข้อความ ไม่ใช้สีของ series
import { color, size } from '../../theme/theme.js'
import s from './kit.module.css'

export const DD = 'ดินแดง'
export const PT = 'ปทุมวัน'

/** สีตามเขต: ดินแดงส้ม ปทุมวันฟ้า เขตอื่นเทา (สีผูกกับเขต ไม่ผูกกับอันดับ) */
export function districtColor(name, { highlight = [] } = {}) {
  if (name === DD) return color.dindaeng
  if (name === PT) return color.pathumwan
  if (highlight.includes(name)) return color.textFaint
  return color.other
}

/** ค่าที่ใช้ซ้ำกับแกน Recharts */
export const axisTick = { fill: color.textMuted, fontSize: size.label }
export const axisCommon = {
  tick: axisTick,
  tickLine: false,
  axisLine: { stroke: color.border },
}
export const gridProps = { stroke: color.grid, strokeDasharray: undefined, vertical: false }

export const fmt = {
  int: (v) => Math.round(v).toLocaleString('th-TH'),
  dec: (v, n = 2) => Number(v).toLocaleString('th-TH', { minimumFractionDigits: n, maximumFractionDigits: n }),
  mb: (baht, n = 1) => (baht / 1e6).toLocaleString('th-TH', { minimumFractionDigits: n, maximumFractionDigits: n }),
}

/** กล่องกราฟ: หัวข้อย่อย + legend + กราฟ */
export function ChartCard({ title, note, legend, children, className = '', style }) {
  return (
    <div className={`${s.card} ${className}`} style={style}>
      {(title || legend) && (
        <div className={s.cardHead}>
          {title && <h2 className={s.cardTitle}>{title}</h2>}
          {note && <p className={s.cardNote}>{note}</p>}
          {legend && <Legend items={legend} />}
        </div>
      )}
      <div className={s.cardBody}>{children}</div>
    </div>
  )
}

/** legend: items = [{ label, color, kind: 'dot' | 'line' | 'dash' }] */
export function Legend({ items }) {
  return (
    <ul className={s.legend}>
      {items.map((it) => (
        <li key={it.label} className={s.legendItem}>
          <span
            className={`${s.key} ${s[`key_${it.kind || 'dot'}`]}`}
            style={{ '--k': it.color }}
          />
          {it.label}
        </li>
      ))}
    </ul>
  )
}

/** tooltip ของ Recharts: render(row) คืน { title, rows: [[label, value]] } */
export function TipBox({ active, payload, render }) {
  if (!active || !payload?.length) return null
  const row = payload[0].payload
  const { title, rows = [] } = render(row)
  return (
    <div className={s.tip}>
      <p className={s.tipTitle}>{title}</p>
      {rows.map(([k, v]) => (
        <p key={k} className={s.tipRow}>
          <span>{k}</span>
          <b className="num">{v}</b>
        </p>
      ))}
    </div>
  )
}

/** ตัวเลขเด่น (stat tile) */
export function Stat({ label, value, unit, sub, tone }) {
  return (
    <div className={s.stat}>
      <p className={s.statLabel}>
        {tone && <span className={s.statKey} style={{ background: tone }} />}
        {label}
      </p>
      <p className={`${s.statValue} num`}>
        {value}
        {unit && <span className={s.statUnit}> {unit}</span>}
      </p>
      {sub && <p className={s.statSub}>{sub}</p>}
    </div>
  )
}

/** ป้ายกำกับบนกราฟ (SVG) มีขอบสีพื้นเพื่อให้อ่านได้แม้ทับเส้น */
export function SvgLabel({ x, y, children, anchor = 'middle', weight = 600, fill = color.text, size: fs = size.label, dy = 0 }) {
  return (
    <text
      x={x}
      y={y}
      dy={dy}
      textAnchor={anchor}
      fontSize={fs}
      fontWeight={weight}
      fill={fill}
      stroke={color.surface}
      strokeWidth={5}
      paintOrder="stroke"
      style={{ fontFamily: 'var(--font)' }}
    >
      {children}
    </text>
  )
}
