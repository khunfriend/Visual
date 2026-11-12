import {
  Bar, BarChart, CartesianGrid, Cell, LabelList, ReferenceLine, ResponsiveContainer, Scatter, ScatterChart,
  Tooltip, XAxis, YAxis,
} from 'recharts'
import SlideFrame from '../../components/SlideFrame.jsx'
import { ChartCard, DD, PT, Stat, SvgLabel, TipBox, axisCommon, districtColor, fmt, gridProps } from '../../components/charts/kit.jsx'
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
const dd = pts.find((d) => d.name === DD)
const { zero, top } = flood.groups
const fd = flood.dindaeng

// เขตที่ท่วมน้อยแต่ได้งบมาก: ท่วมไม่เกิน 5 ครั้ง และได้งบระบายน้ำเกิน 30 ล้าน (เกือบ 3 เท่าของค่ากลาง)
const LOW_FLOOD_MAX = 5
const HIGH_BUDGET_M = 30
const isLowHigh = (d) => d.floods <= LOW_FLOOD_MAX && d.m > HIGH_BUDGET_M
const lowHigh = pts.filter(isLowHigh)

function Dot({ cx, cy, payload }) {
  const special = isLowHigh(payload)
  const c = special ? color.contrast : districtColor(payload.name)
  const big = payload.name === DD || payload.name === PT || special
  return (
    <g>
      <circle cx={cx} cy={cy} r={big ? 10 : 7} fill={c} stroke={color.surface} strokeWidth={2} />
      {payload.name === DD && (
        <SvgLabel x={cx} y={cy + 34} anchor="end" weight={700}>
          {`ดินแดง · ${dd.floods} ครั้ง / ${fmt.dec(dd.m, 1)} ล.`}
        </SvgLabel>
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
      title="ท่วมบ่อยไม่ได้แปลว่าได้งบมาก"
      subtitle={`ดินแดงท่วม ${dd.floods} ครั้ง (อันดับ ${dd.floodRank}) แต่ได้งบระบายน้ำ ${fmt.dec(dd.m, 1)} ล้าน (อันดับ ${dd.budgetRank}) · ${top.count} เขตที่ท่วมบ่อยที่สุดได้ ${fmt.mb(top.drainBudget)} ล้าน ส่วน ${zero.count} เขตที่ไม่ท่วมเลยได้ ${fmt.mb(zero.drainBudget)} ล้าน`}
      source="ที่มา: Bangkok Index 2025 – Rocket Media Lab (อุทกภัย: น้ำท่วมขังบนถนนสายหลัก 2568); ข้อบัญญัติงบประมาณ กทม. 2568 · ρ = Spearman correlation · ตำแหน่งจุดท่วมหาจากชื่อถนน/ซอยใน OSM (เส้นประ = ความมั่นใจปานกลาง, ไม่ได้วาง 1 จุดที่ไม่ระบุตำแหน่ง) · แผนที่ฐาน © OpenStreetMap contributors"
    >
      <div className={s.grid}>
        <ChartCard
          title="จำนวนครั้งที่ท่วม กับงบระบายน้ำของเขต (50 เขต)"
          legend={[
            { label: 'ดินแดง', color: color.dindaeng },
            { label: 'ปทุมวัน', color: color.pathumwan },
            { label: `ท่วมไม่เกิน ${LOW_FLOOD_MAX} ครั้ง แต่ได้งบเกิน ${HIGH_BUDGET_M} ล้าน (${lowHigh.length} เขต)`, color: color.contrast },
            { label: 'เขตอื่น', color: color.other },
            { label: `มัธยฐานงบ ${fmt.dec(med, 1)} ล้าน · มัธยฐานน้ำท่วม ${Number.isInteger(medFlood) ? medFlood : fmt.dec(medFlood, 1)} ครั้ง`, color: color.reference, kind: 'dash' },
          ]}
        >
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 24, right: 32, bottom: 36, left: 8 }}>
              <CartesianGrid {...gridProps} vertical />
              <XAxis
                type="number" dataKey="floods" {...axisCommon} domain={[0, 46]} ticks={[0, 10, 20, 30, 40]}
                label={{ value: 'จำนวนครั้งน้ำท่วมขัง ปี 2568', position: 'bottom', offset: 12, fill: color.textMuted, fontSize: size.label }}
              />
              <YAxis
                type="number" dataKey="m" scale="log" domain={[1, 250]} ticks={[1, 2, 5, 10, 20, 50, 100, 200]}
                allowDataOverflow {...axisCommon} width={56}
              />
              <ReferenceLine y={med} stroke={color.reference} strokeDasharray="6 5" strokeWidth={2} />
              <ReferenceLine x={medFlood} stroke={color.reference} strokeDasharray="6 5" strokeWidth={2} />
              <Tooltip
                cursor={false}
                content={
                  <TipBox
                    render={(r) => ({
                      title: r.name,
                      rows: [['ท่วม', `${r.floods} ครั้ง (อันดับ ${r.floodRank})`], ['งบระบายน้ำ', `${fmt.dec(r.m, 1)} ล้าน (อันดับ ${r.budgetRank})`]],
                    })}
                  />
                }
              />
              <Scatter data={pts} shape={Dot} isAnimationActive={false} />
            </ScatterChart>
          </ResponsiveContainer>
        </ChartCard>

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
          <ChartCard title="จุดท่วมซ้ำซากในดินแดง" className={s.spots}>
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
            <Stat label="ฝนเฉลี่ยวันที่ท่วม" value={fmt.dec(fd.rainPerDayAvg, 1)} unit="มม." sub={`ยังไม่ถึงขีดจำกัดระบบ ${flood.systemCapacityMm} มม.`} />
            <Stat label="น้ำแห้งเฉลี่ย" value={fmt.int(fd.dryAvgMin)} unit="นาที" sub={`ท่วมรวมราว ${fmt.int(fd.totalHours)} ชม. ทั้งปี`} />
          </div>
        </div>
      </div>
    </SlideFrame>
  )
}
