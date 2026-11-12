import {
  Bar, BarChart, CartesianGrid, Cell, LabelList, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import SlideFrame from '../../components/SlideFrame.jsx'
import { ChartCard, DD, SvgLabel, TipBox, axisCommon, fmt, gridProps } from '../../components/charts/kit.jsx'
import { wastewater as ww } from '../../lib/data.js'
import { color } from '../../theme/theme.js'
import s from './style.module.css'

// สไลด์ 03: แก้เฉพาะไฟล์ในโฟลเดอร์นี้ (ดู CLAUDE.md)
// ตัวเลขทุกตัวต้องตรงกับ ข้อมูลรวม_ตรวจแล้ว.md

const rows = ww.districts // เรียงจาก BOD ต่ำ (ดี) ไปสูง (แย่)
const dd = rows.find((d) => d.name === DD)
const exceed = rows.filter((d) => d.bod > ww.standard).length

// พญาไท: เขตข้างเคียงที่น้ำดีที่สุด ใช้เป็นคู่เทียบในหน้านี้
const PY = 'พญาไท'
const py = rows.find((d) => d.name === PY)
const barColor = (name) => (name === DD ? color.dindaeng : name === PY ? color.contrast : color.other)

const near = [DD, ...ww.neighbors]
  .map((n) => rows.find((d) => d.name === n))
  .sort((a, b) => b.bod - a.bod)

const bodTip = <TipBox render={(r) => ({ title: `${r.name} · อันดับ ${r.rank}`, rows: [['BOD เฉลี่ย', `${fmt.dec(r.bod)} มก./ล.`], ['จำนวนคลอง', `${r.canals}`]] })} />

export default function Wastewater() {
  return (
    <SlideFrame
      kicker="03 · น้ำเสีย"
      title="น้ำในคลองดินแดงแย่อันดับ 49 ทั้งที่มีโรงบำบัดใหญ่ที่สุดของกรุงเทพฯ"
      source="ที่มา: Bangkok Index 2025 – Rocket Media Lab (น้ำเสีย: ค่าเฉลี่ยคุณภาพคลองปี 2540–2567, สำนักการระบายน้ำ) · BOD ยิ่งสูงยิ่งเน่า · มาตรฐานคุณภาพน้ำในคลอง 15 มก./ล."
    >
      <div className={s.grid}>
        <ChartCard
          title="BOD เฉลี่ยของคลอง 50 เขต"
          note={`เรียงจากน้ำดีไปน้ำแย่ · ${exceed} เขตเกินมาตรฐาน`}
          legend={[
            { label: 'ดินแดง', color: color.dindaeng },
            { label: 'พญาไท (เขตข้างเคียง)', color: color.contrast },
            { label: 'เขตอื่น', color: color.other },
            { label: `มาตรฐาน ${ww.standard} มก./ล.`, color: color.reference, kind: 'dash' },
          ]}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows} margin={{ top: 40, right: 8, bottom: 8, left: 0 }} barCategoryGap={2}>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="name" tick={false} axisLine={{ stroke: color.border }} tickLine={false} />
              <YAxis {...axisCommon} domain={[0, 30]} ticks={[0, 10, 20, 30]} width={44} />
              <ReferenceLine y={ww.standard} stroke={color.reference} strokeDasharray="6 5" strokeWidth={2} />
              <Tooltip cursor={{ fill: color.grid }} content={bodTip} />
              <Bar dataKey="bod" radius={[4, 4, 0, 0]} maxBarSize={24} isAnimationActive={false}>
                {rows.map((d) => (
                  <Cell key={d.name} fill={barColor(d.name)} />
                ))}
                <LabelList
                  dataKey="name"
                  content={({ x, y, width, value }) =>
                    value === DD ? (
                      <SvgLabel x={x + width / 2} y={y - 12} anchor="end">ดินแดง {fmt.dec(dd.bod)}</SvgLabel>
                    ) : value === PY ? (
                      <SvgLabel x={x + width / 2} y={y - 12} anchor="middle">พญาไท {fmt.dec(py.bod)}</SvgLabel>
                    ) : null
                  }
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="เทียบเขตข้างเคียง" note="ดินแดงแย่ที่สุดในละแวก (ปทุมวันไม่ใช้เทียบเรื่องนี้ เพราะแย่พอกัน)">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={near} layout="vertical" margin={{ top: 8, right: 72, bottom: 8, left: 0 }} barCategoryGap="30%">
              <CartesianGrid {...gridProps} vertical horizontal={false} />
              <XAxis type="number" {...axisCommon} domain={[0, 30]} ticks={[0, 15, 30]} />
              <YAxis type="category" dataKey="name" {...axisCommon} axisLine={false} width={130} />
              <ReferenceLine x={ww.standard} stroke={color.reference} strokeDasharray="6 5" strokeWidth={2} />
              <Tooltip cursor={{ fill: color.grid }} content={bodTip} />
              <Bar dataKey="bod" radius={[0, 4, 4, 0]} maxBarSize={24} isAnimationActive={false}>
                {near.map((d) => (
                  <Cell key={d.name} fill={barColor(d.name)} />
                ))}
                <LabelList
                  dataKey="bod"
                  content={({ x, y, width, height, value, index: i }) => (
                    <SvgLabel x={x + width + 10} y={y + height / 2} dy="0.35em" anchor="start"
                      weight={near[i].name === DD || near[i].name === PY ? 700 : 500} fill={near[i].name === DD || near[i].name === PY ? color.text : color.textMuted}>
                      {fmt.dec(value)}
                    </SvgLabel>
                  )}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </SlideFrame>
  )
}
