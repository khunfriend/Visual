import {
  Bar, BarChart, CartesianGrid, Cell, LabelList, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import SlideFrame from '../../components/SlideFrame.jsx'
import { ChartCard, DD, PT, Stat, SvgLabel, TipBox, axisCommon, districtColor, fmt, gridProps } from '../../components/charts/kit.jsx'
import { budget, index } from '../../lib/data.js'
import { color } from '../../theme/theme.js'
import s from './style.module.css'

// สไลด์ 01: แก้เฉพาะไฟล์ในโฟลเดอร์นี้ (ดู CLAUDE.md)
// ตัวเลขทุกตัวต้องตรงกับ ข้อมูลรวม_ตรวจแล้ว.md

const overall = index.districts // เรียงตามอันดับแล้ว
const dd = overall.find((d) => d.name === DD)
const pt = overall.find((d) => d.name === PT)

const dims = index.dims.map((dm) => ({
  label: dm.label,
  dd: dd.dims[dm.key].score,
  ddRank: dd.dims[dm.key].rank,
  median: index.medians.dims[dm.key],
  pt: pt.dims[dm.key].score,
}))

// โครงสร้างงบดินแดง: หมวดใหญ่ 3 หมวด + ระบายน้ำ + รวมที่เหลือ
const cats = [...budget.categories].sort((a, b) => b[`${DD}_pct`] - a[`${DD}_pct`])
const isDrain = (c) => c.name.startsWith('ระบายน้ำ')
const shortName = {
  'เงินเดือนและค่าจ้างบุคลากร': 'ค่าจ้างบุคลากร',
  'โรงเรียนและฝ่ายการศึกษา': 'โรงเรียน',
  'ซ่อมบำรุง (ถนน ทางเท้า)': 'ซ่อมถนน',
  'ระบายน้ำและแก้น้ำท่วม': 'ระบายน้ำ',
}
const top3 = cats.filter((c) => !isDrain(c)).slice(0, 3)
const drain = cats.find(isDrain)
const restPct = 100 - [...top3, drain].reduce((a, c) => a + c[`${DD}_pct`], 0)
const budgetRows = [
  ...top3.map((c) => ({ name: shortName[c.name] || c.name, pct: c[`${DD}_pct`], drain: false })),
  { name: 'หมวดอื่นรวม', pct: restPct, drain: false },
  { name: shortName[drain.name], pct: drain[`${DD}_pct`], drain: true },
]

const dDD = budget.districts[DD]
const dPT = budget.districts[PT]

export default function WhyDindaeng() {
  return (
    <SlideFrame
      kicker="01 · ทำไมต้องเป็นเขตดินแดง"
      title="ดินแดงอยู่อันดับ 50 จาก 50 เขต ไม่ใช่เพราะแย่ด้านเดียว แต่ต่ำกว่าค่ากลางทุกด้าน"
      source="ที่มา: Bangkok Index 2025 – Rocket Media Lab; ข้อบัญญัติงบประมาณ กทม. 2568 · คะแนน 1–50 ยิ่งมากยิ่งดี"
    >
      <div className={s.grid}>
        {/* ---- คะแนนรวม 50 เขต ---- */}
        <ChartCard
          title="คะแนนรวม 50 เขต"
          legend={[
            { label: 'ดินแดง', color: color.dindaeng },
            { label: 'ปทุมวัน (อันดับ 1)', color: color.pathumwan },
            { label: 'เขตอื่น', color: color.other },
          ]}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={overall} margin={{ top: 40, right: 8, bottom: 8, left: 0 }} barCategoryGap={2}>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="name" tick={false} axisLine={{ stroke: color.border }} tickLine={false} />
              <YAxis {...axisCommon} domain={[0, 35]} ticks={[0, 10, 20, 30]} width={44} />
              <ReferenceLine y={index.medians.overall} stroke={color.reference} strokeDasharray="6 5" strokeWidth={2} />
              <Tooltip
                cursor={{ fill: color.grid }}
                content={<TipBox render={(r) => ({ title: `${r.name} · อันดับ ${r.rank}`, rows: [['คะแนนรวม', fmt.dec(r.overall)]] })} />}
              />
              <Bar dataKey="overall" radius={[4, 4, 0, 0]} maxBarSize={24} isAnimationActive={false}>
                {overall.map((d) => (
                  <Cell key={d.name} fill={districtColor(d.name)} />
                ))}
                <LabelList
                  dataKey="name"
                  content={({ x, y, width, value }) =>
                    value === DD || value === PT ? (
                      <SvgLabel x={x + width / 2} y={y - 12} anchor={value === DD ? 'end' : 'start'}>
                        {value} {fmt.dec(value === DD ? dd.overall : pt.overall)}
                      </SvgLabel>
                    ) : null
                  }
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className={s.medianTag}>เส้นประ = มัธยฐาน {fmt.dec(index.medians.overall)}</p>
        </ChartCard>

        {/* ---- 4 ด้าน ---- */}
        <ChartCard
          title="คะแนนราย 4 ด้าน"
          legend={[
            { label: 'ดินแดง', color: color.dindaeng },
            { label: 'มัธยฐาน 50 เขต', color: color.other },
            { label: 'ปทุมวัน', color: color.pathumwan },
          ]}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dims} layout="vertical" margin={{ top: 0, right: 72, bottom: 0, left: 0 }} barGap={4} barCategoryGap="22%">
              <CartesianGrid {...gridProps} vertical horizontal={false} />
              <XAxis type="number" {...axisCommon} domain={[0, 50]} ticks={[0, 25, 50]} />
              <YAxis type="category" dataKey="label" {...axisCommon} axisLine={false} width={150} />
              <Tooltip
                cursor={{ fill: color.grid }}
                content={
                  <TipBox
                    render={(r) => ({
                      title: `ด้าน${r.label}`,
                      rows: [['ดินแดง', `${fmt.dec(r.dd)} (#${r.ddRank})`], ['มัธยฐาน', fmt.dec(r.median)], ['ปทุมวัน', fmt.dec(r.pt)]],
                    })}
                  />
                }
              />
              <Bar dataKey="dd" fill={color.dindaeng} radius={[0, 4, 4, 0]} maxBarSize={22} isAnimationActive={false}>
                <LabelList
                  dataKey="ddRank"
                  content={({ x, y, width, height, value }) => (
                    <SvgLabel x={x + width + 10} y={y + height / 2} dy="0.35em" anchor="start">
                      #{value}
                    </SvgLabel>
                  )}
                />
              </Bar>
              <Bar dataKey="median" fill={color.other} radius={[0, 4, 4, 0]} maxBarSize={22} isAnimationActive={false} />
              <Bar dataKey="pt" fill={color.pathumwan} radius={[0, 4, 4, 0]} maxBarSize={22} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* ---- งบประมาณ ---- */}
        <ChartCard title="งบเขต 2568">
          <div className={s.budget}>
            <div className={s.stats}>
              <Stat label="งบต่อหัว ดินแดง" tone={color.dindaeng} value={fmt.int(dDD.perCapita)} unit="บาท" />
              <Stat label="งบต่อหัว ปทุมวัน" tone={color.pathumwan} value={fmt.int(dPT.perCapita)} unit="บาท" />
            </div>
            <p className={s.ratio}>
              ปทุมวันได้มากกว่า <b className="num">{fmt.dec(Math.floor((dPT.perCapita / dDD.perCapita) * 10) / 10, 1)} เท่า</b>
            </p>
            <p className={s.miniTitle}>สัดส่วนงบดินแดง {fmt.mb(dDD.total)} ล้านบาท</p>
            <div className={s.miniChart}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={budgetRows} layout="vertical" margin={{ top: 0, right: 80, bottom: 0, left: 0 }} barCategoryGap="28%">
                  <XAxis type="number" hide domain={[0, 60]} />
                  <YAxis type="category" dataKey="name" {...axisCommon} axisLine={false} width={140} />
                  <Bar dataKey="pct" radius={[0, 4, 4, 0]} maxBarSize={22} isAnimationActive={false}>
                    {budgetRows.map((r) => (
                      <Cell key={r.name} fill={r.drain ? color.dindaeng : color.other} />
                    ))}
                    <LabelList
                      dataKey="pct"
                      content={({ x, y, width, height, value, index: i }) => (
                        <SvgLabel
                          x={x + width + 10}
                          y={y + height / 2}
                          dy="0.35em"
                          anchor="start"
                          weight={budgetRows[i].drain ? 700 : 500}
                          fill={budgetRows[i].drain ? color.text : color.textMuted}
                        >
                          {fmt.dec(value, 1)}%
                        </SvgLabel>
                      )}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </ChartCard>
      </div>
    </SlideFrame>
  )
}
