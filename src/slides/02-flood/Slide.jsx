import {
  Bar, BarChart, CartesianGrid, Cell, LabelList, ReferenceLine, ResponsiveContainer, Scatter, ScatterChart,
  Tooltip, XAxis, YAxis,
} from 'recharts'
import SlideFrame from '../../components/SlideFrame.jsx'
import { ChartCard, DD, Stat, SvgLabel, TipBox, axisCommon, fmt, gridProps } from '../../components/charts/kit.jsx'
import MapBase from '../../components/charts/MapBase.jsx'
import Expandable from '../../components/charts/Expandable.jsx'
import { flood, map } from '../../lib/data.js'
import { color, size } from '../../theme/theme.js'
import s from './style.module.css'

// สไลด์ 02: แก้เฉพาะไฟล์ในโฟลเดอร์นี้ (ดู CLAUDE.md)
// ตัวเลขทุกตัวต้องตรงกับ ข้อมูลรวม_ตรวจแล้ว.md

const pts = flood.districts.map((d) => ({ ...d, m: d.drainBudget / 1e6 }))
const med = flood.medianDrainBudget / 1e6
const sortedFloods = pts.map((d) => d.floods).sort((a, b) => a - b)
const medFlood = (sortedFloods[24] + sortedFloods[25]) / 2 // มัธยฐานจำนวนครั้งน้ำท่วม 50 เขต
const medFloodLabel = fmt.dec(medFlood, Number.isInteger(medFlood) ? 0 : 1)
const dd = pts.find((d) => d.name === DD)
const fd = flood.dindaeng
const comparisons = [
  { label: 'น้ำท่วมขัง', value: fmt.int(dd.floods), median: medFloodLabel, unit: 'ครั้ง' },
  { label: 'งบระบายน้ำ', value: fmt.dec(dd.m), median: fmt.dec(med), unit: 'ล้านบาท' },
]

function Dot({ cx, cy, payload }) {
  const isDindaeng = payload.name === DD
  return (
    <g>
      <circle cx={cx} cy={cy} r={isDindaeng ? 12 : 7}
        fill={isDindaeng ? color.dindaeng : color.other} stroke={color.surface} strokeWidth={2} />
      {isDindaeng && (
        <SvgLabel x={cx - 14} y={cy + 30} anchor="end" weight={700} size={24}>ดินแดง</SvgLabel>
      )}
    </g>
  )
}

const short = (n) =>
  n.replace('ซอยอินทามระ', 'ซ.อินทามระ').replace('ซอยเปรมสมบัติ', 'ซ.เปรมสมบัติ').replace('ซอย ', 'ซ.')
    .replace('ถนนดินแดง', 'ถ.ดินแดง').replace('หน้าโรงเรียน', 'หน้า ร.ร.').replace('ซอยสุทธิพร', 'ซ.สุทธิพร')
    .replace(' (กรมทหารราบที่ 1)', '').replace(' (ไม่ระบุช่วง)', ' (ไม่ระบุ)')
const spots = fd.hotspots.map((h) => ({ ...h, label: short(h.spot), repeat: h.count >= 5 }))
const floodPts = map.flood.points.filter((p) => p.x != null)

export default function Flood() {
  return (
    <SlideFrame
      kicker="02 · น้ำท่วม"
      title="ดินแดงท่วมบ่อยกว่ามัธยฐาน แต่งบระบายน้ำต่ำกว่า"
      source="ที่มา: Bangkok Index 2025 – Rocket Media Lab (น้ำท่วมขังบนถนนสายหลัก ปี 2568) · ข้อบัญญัติงบประมาณ กทม. 2568 · ρ = Spearman · พิกัดจุดท่วมอ้างอิงชื่อถนน/ซอย (เส้นประ = ความมั่นใจปานกลาง, 1 จุดไม่ระบุตำแหน่ง) · แผนที่ฐาน © OpenStreetMap contributors"
    >
      <div className={s.grid}>
        <div className={s.overview}>
          <div className={s.comparisons}>
            {comparisons.map(({ label, value, median, unit }) => (
              <div className={s.comparison} key={label}>
                <p>{label}</p>
                <p className={s.comparisonValue}><strong className="num">{value}</strong> {unit}</p>
                <p className={s.comparisonMedian}>มัธยฐาน 50 เขต <b className="num">{median} {unit}</b></p>
              </div>
            ))}
          </div>
          <ChartCard
            className={s.scatter}
            title="น้ำท่วมขังกับงบระบายน้ำ 50 เขต (2568)"
            note={`ท่วมบ่อยไม่ได้งบมากขึ้น: ความสัมพันธ์แทบเป็นศูนย์ (ρ = ${fmt.dec(flood.spearman, 3)})`}
            legend={[
              { label: 'ดินแดง', color: color.dindaeng },
              { label: 'เขตอื่น', color: color.other },
              { label: 'มัธยฐาน 50 เขต', color: color.reference, kind: 'dash' },
            ]}
          >
            <div className={s.plot}>
              <p className={s.axisTitle}>งบระบายน้ำ (ล้านบาท · สเกลลอการิทึม)</p>
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 34, right: 144, bottom: 35, left: 0 }}>
                  <CartesianGrid {...gridProps} />
                  <XAxis
                    type="number" dataKey="floods" {...axisCommon} domain={[0, 50]} ticks={[0, 10, 20, 30, 40, 50]}
                    label={{ value: 'จำนวนครั้งน้ำท่วมขัง', position: 'bottom', offset: 8, fill: color.textMuted, fontSize: size.label }}
                  />
                  <YAxis
                    type="number" dataKey="m" scale="log" domain={[1, 200]} ticks={[1, 5, 10, 20, 50, 100, 200]}
                    allowDataOverflow {...axisCommon} width={48} interval={0}
                  />
                  <ReferenceLine
                    y={med} stroke={color.reference} strokeDasharray="7 5" strokeWidth={2}
                    label={({ viewBox }) => (
                      <SvgLabel x={viewBox.x + viewBox.width + 10} y={viewBox.y} dy="0.35em" anchor="start" fill={color.reference} size={22}>
                        {fmt.dec(med)} ล้านบาท
                      </SvgLabel>
                    )}
                  />
                  <ReferenceLine
                    x={medFlood} stroke={color.reference} strokeDasharray="7 5" strokeWidth={2}
                    label={({ viewBox }) => (
                      <SvgLabel x={viewBox.x} y={viewBox.y - 10} fill={color.reference} size={22}>
                        {medFloodLabel} ครั้ง
                      </SvgLabel>
                    )}
                  />
                  <Tooltip
                    cursor={false}
                    content={
                      <TipBox
                        render={(r) => ({
                          title: r.name,
                          rows: [['ท่วม', `${r.floods} ครั้ง (อันดับ ${r.floodRank})`], ['งบระบายน้ำ', `${fmt.dec(r.m)} ล้าน (อันดับ ${r.budgetRank})`]],
                        })}
                      />
                    }
                  />
                  <Scatter data={pts} shape={Dot} isAnimationActive={false} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>

        <ChartCard title="ตำแหน่งจุดท่วม" className={s.mapCard}>
          <Expandable
            title="ตำแหน่งจุดท่วมซ้ำซากในดินแดง ปี 2568"
            note="ขนาดวง = จำนวนครั้ง · ตำแหน่งโดยประมาณจากชื่อถนน/ซอยใน OSM · เส้นประ = ความมั่นใจปานกลาง"
            aside={
              <ol className={s.asideList}>
                {map.flood.points.map((p) => (
                  <li key={p.spot}>
                    <b className="num">{p.count}</b>
                    <span>
                      {p.spot}
                      <small>{p.x == null ? 'ไม่ระบุตำแหน่ง (ไม่วางบนแผนที่)' : `ความมั่นใจของตำแหน่ง: ${p.confidence} · น้ำสูงสุด ${p.levelMax} ซม. · แห้งเฉลี่ย ${p.dryAvg} นาที`}</small>
                    </span>
                  </li>
                ))}
              </ol>
            }
          >
            {({ expanded }) => (
              <MapBase labelSize={expanded ? 18 : 24} overlay={(
                  <g>
                    {floodPts.map((p) => {
                      const r = 10 + 8 * Math.sqrt(p.count)
                      return (
                        <g key={p.spot}>
                          <title>{`${p.spot}: ${p.count} ครั้ง (ความมั่นใจของตำแหน่ง: ${p.confidence})`}</title>
                          <circle cx={p.x} cy={p.y} r={r} fill={color.dindaeng} fillOpacity={p.count >= 5 ? 0.85 : 0.45}
                            stroke={color.surface} strokeWidth={3} strokeDasharray={p.confidence === 'สูง' ? undefined : '6 4'} />
                          {(p.count >= 5 || expanded) && (
                            <text x={p.x} y={p.y} dy="0.36em" textAnchor="middle" fontSize={expanded ? 18 : 24} fontWeight={700}
                              fill={p.count >= 5 ? '#fff' : color.text} style={{ fontFamily: 'var(--font)' }}>
                              {p.count}
                            </text>
                          )}
                        </g>
                      )
                    })}
                  </g>
                )} />
            )}
          </Expandable>
        </ChartCard>

        <div className={s.side}>
          <ChartCard title="จุดท่วมซ้ำซากในดินแดง" className={s.spots}
            note={`ปี 2568 · ${fd.hotspots.reduce((a, h) => a + h.count, 0)} ครั้ง ใน ${fd.hotspots.length} จุด เกิดใน ${fd.days.length} วัน`}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={spots} layout="vertical" margin={{ top: 0, right: 44, bottom: 0, left: 0 }} barCategoryGap="22%">
                <XAxis type="number" hide domain={[0, 10]} />
                <YAxis type="category" dataKey="label" {...axisCommon} axisLine={false} width={330} interval={0} />
                <Tooltip
                  cursor={{ fill: color.grid }}
                  content={
                    <TipBox
                      render={(r) => ({
                        title: r.spot,
                        rows: [['ท่วม', `${r.count} ครั้ง`], ['ระดับน้ำสูงสุด', `${r.levelMax} ซม.`], ['แห้งเฉลี่ย', `${r.dryAvg} นาที`]],
                      })}
                    />
                  }
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={20} isAnimationActive={false}>
                  {spots.map((h) => (
                    <Cell key={h.spot} fill={h.repeat ? color.dindaeng : color.other} />
                  ))}
                  <LabelList
                    dataKey="count"
                    content={({ x, y, width, height, value }) => (
                      <SvgLabel x={x + width + 8} y={y + height / 2} dy="0.35em" anchor="start" weight={500} fill={color.textMuted}>
                        {value}
                      </SvgLabel>
                    )}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <div className={s.stats}>
            <Stat label={`ฝนเฉลี่ยวันที่ท่วม (${fd.days.length} วัน)`} value={fmt.dec(fd.rainPerDayAvg, 1)} unit="มม." sub={`ยังไม่ถึงขีดจำกัดระบบ ${flood.systemCapacityMm} มม.`} />
            <Stat label="น้ำแห้งเฉลี่ย" value={fmt.int(fd.dryAvgMin)} unit="นาที" sub={`ท่วมรวมราว ${fmt.int(fd.totalHours)} ชม. ทั้งปี`} />
          </div>
        </div>
      </div>
    </SlideFrame>
  )
}
