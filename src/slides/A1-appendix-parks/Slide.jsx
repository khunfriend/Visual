import { Bar, BarChart, CartesianGrid, Cell, LabelList, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import SlideFrame from '../../components/SlideFrame.jsx'
import { ChartCard, DD, PT, Stat, SvgLabel, TipBox, axisCommon, districtColor, fmt, gridProps } from '../../components/charts/kit.jsx'
import { parks } from '../../lib/data.js'
import { color } from '../../theme/theme.js'
import s from './style.module.css'

// สไลด์ A1 (ภาคผนวก): แก้เฉพาะไฟล์ในโฟลเดอร์นี้ (ดู CLAUDE.md)
// ตัวเลขทุกตัวต้องตรงกับ ข้อมูลรวม_ตรวจแล้ว.md

const rows = [...parks.districts].sort((a, b) => b.greenPerCapita - a.greenPerCapita)
const dd = rows.find((d) => d.name === DD)
const rank = rows.indexOf(dd) + 1
const gap = parks.dindaengGap
const scoreRank = [...parks.districts].sort((a, b) => b.score - a.score).findIndex((d) => d.name === DD) + 1

export default function AppendixParks() {
  return (
    <SlideFrame
      kicker="ภาคผนวก · สวนสาธารณะ"
      title={`ถ้าจะไล่ให้ถึงค่ากลาง ต้องทำ Pocket Park ราว ${fmt.int(gap.pocketParks300m2)} แห่ง`}
      subtitle={`พื้นที่สีเขียว ${fmt.int(dd.greenM2)} ตร.ม. (${fmt.dec(dd.greenPerCapita)} ตร.ม./คน อันดับ ${rank}) ต้องเพิ่ม ${fmt.dec(gap.greenTimes)} เท่า · คะแนนสวนอันดับ ${scoreRank} · เขตหนาแน่นหาที่ดินยาก จึงไม่ใช้เป็นข้อเสนอหลัก`}
      source="ที่มา: Bangkok Index 2025 – Rocket Media Lab (สวนสาธารณะ 2568, เฉพาะสวนที่สำนักงานสวนสาธารณะดูแล) · Pocket Park คิดแห่งละ 300 ตร.ม."
    >
      <div className={s.grid}>
        <ChartCard
          title="พื้นที่สีเขียวต่อคน (ตร.ม.) 50 เขต"
          note="เรียงจากมากไปน้อย"
          legend={[
            { label: 'ดินแดง', color: color.dindaeng },
            { label: 'ปทุมวัน', color: color.pathumwan },
            { label: 'เขตอื่น', color: color.other },
            { label: `มัธยฐาน ${fmt.dec(parks.medianGreenPerCapita)}`, color: color.reference, kind: 'dash' },
          ]}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows} margin={{ top: 40, right: 8, bottom: 8, left: 0 }} barCategoryGap={2}>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="name" tick={false} axisLine={{ stroke: color.border }} tickLine={false} />
              <YAxis {...axisCommon} domain={[0, 50]} ticks={[0, 10, 20, 30, 40, 50]} width={44} />
              <ReferenceLine y={parks.medianGreenPerCapita} stroke={color.reference} strokeDasharray="6 5" strokeWidth={2} />
              <Tooltip cursor={{ fill: color.grid }}
                content={<TipBox render={(r) => ({ title: r.name, rows: [['พื้นที่สีเขียวต่อคน', `${fmt.dec(r.greenPerCapita)} ตร.ม.`], ['สวนที่เข้าถึงได้ต่อคน', `${fmt.dec(r.accessiblePerCapita)} ตร.ม.`], ['คะแนนสวน', fmt.dec(r.score)]] })} />} />
              <Bar dataKey="greenPerCapita" radius={[4, 4, 0, 0]} maxBarSize={24} isAnimationActive={false}>
                {rows.map((d) => (
                  <Cell key={d.name} fill={districtColor(d.name)} />
                ))}
                <LabelList dataKey="name" content={({ x, y, width, value }) =>
                  value === DD ? <SvgLabel x={x + width / 2} y={y - 12} anchor="end">ดินแดง {fmt.dec(dd.greenPerCapita)}</SvgLabel>
                    : value === PT ? <SvgLabel x={x + width / 2} y={y - 12} anchor="middle" weight={500} fill={color.textMuted}>ปทุมวัน</SvgLabel> : null} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <div className={s.side}>
          <Stat label="พื้นที่สีเขียวต้องเพิ่ม" value={`${fmt.dec(gap.greenTimes)}×`} sub={`จาก ${fmt.dec(dd.greenPerCapita)} เป็น ${fmt.dec(parks.medianGreenPerCapita)} ตร.ม./คน`} />
          <Stat label="สวนที่เข้าถึงได้ต้องเพิ่ม" value={fmt.int(gap.accessibleM2)} unit="ตร.ม." sub={`จาก ${fmt.dec(dd.accessiblePerCapita)} เป็น ${fmt.dec(parks.medianAccessiblePerCapita)} ตร.ม./คน`} />
          <Stat label="เท่ากับ Pocket Park" value={fmt.int(gap.pocketParks300m2)} unit="แห่ง" sub="แห่งละ 300 ตร.ม." />
          <p className={s.note}>ข้อเสนอหลักจึงใช้สวนหย่อมเพื่อลดจุดเสี่ยง (สไลด์ 9) แทนการไล่คะแนนสวน</p>
        </div>
      </div>
    </SlideFrame>
  )
}
