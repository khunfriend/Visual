// แผนที่ฐานเขตดินแดง (SVG) ใช้ร่วมหลายสไลด์: ขอบเขต + ถนน + ชื่อถนน แล้ววางชั้นข้อมูลทับผ่าน children
// children เป็น render function ได้: (map) => <g>…</g> เพื่อใช้ map.pxPerM ฯลฯ
import { useId } from 'react'
import { map } from '../../lib/data.js'
import { color } from '../../theme/theme.js'

const ROAD_STYLE = {
  motorway: { stroke: color.textFaint, width: 4 },
  trunk: { stroke: '#CED4DA', width: 5 },
  primary: { stroke: '#CED4DA', width: 5 },
  secondary: { stroke: '#DEE2E6', width: 4 },
  tertiary: { stroke: '#E3E6E8', width: 3 },
}

export function heatColor(v) {
  // ไล่สี 4 จุดของ color.heat ตามค่า 0–1
  const stops = color.heat.map((h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)))
  const t = Math.min(0.999, Math.max(0, v)) * (stops.length - 1)
  const i = Math.floor(t)
  const f = t - i
  const c = stops[i].map((a, k) => Math.round(a + (stops[i + 1][k] - a) * f))
  return `rgb(${c.join(',')})`
}

// children: ชั้นที่ถูกตัดตามขอบเขตเขต (เช่น heatmap)
// overlay:  ชั้นบนสุดที่ไม่ถูกตัด (หมุด วงกลม ป้าย) เพื่อไม่ให้จุดริมขอบเขตขาด
export default function MapBase({ children, overlay, labels = true, labelSize = 17, className, style, crop }) {
  const clip = useId().replace(/:/g, '')
  const [, , w, h] = map.viewBox
  const PAD = 30 // ขยาย viewBox ให้หมุดริมกรอบไม่ล้น
  const vb = crop || [-PAD, -PAD, w + 2 * PAD, h + 2 * PAD]
  return (
    <svg viewBox={vb.join(' ')} className={className} style={{ width: '100%', height: '100%', ...style }} preserveAspectRatio="xMidYMid meet">
      <defs>
        <clipPath id={clip}>
          <path d={map.boundary} />
        </clipPath>
      </defs>
      <path d={map.boundary} fill={color.surfaceAlt} />
      <g clipPath={`url(#${clip})`}>
        {map.roads.map((r, i) => {
          const st = ROAD_STYLE[r.kind] || ROAD_STYLE.tertiary
          return <path key={i} d={r.d} fill="none" stroke={st.stroke} strokeWidth={st.width} strokeLinecap="round" strokeLinejoin="round" />
        })}
        {typeof children === 'function' ? children({ ...map, w, h, clip }) : children}
      </g>
      <path d={map.boundary} fill="none" stroke={color.textMuted} strokeWidth={2} />
      {labels &&
        map.roadLabels.map((l) => (
          <text key={l.name} x={l.x} y={l.y} transform={`rotate(${l.angle} ${l.x} ${l.y})`} textAnchor="middle" dy="-0.5em"
            fontSize={labelSize} fill={color.textFaint} stroke={color.surface} strokeWidth={4} paintOrder="stroke" style={{ fontFamily: 'var(--font)' }}>
            {l.name}
          </text>
        ))}
      {overlay && (typeof overlay === 'function' ? overlay({ ...map, w, h }) : overlay)}
    </svg>
  )
}
