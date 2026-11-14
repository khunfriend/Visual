import {
  Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { useState } from 'react'
import SlideFrame from '../../components/SlideFrame.jsx'
import { ChartCard, DD, PT, Stat, SvgLabel, TipBox, axisCommon, fmt, gridProps } from '../../components/charts/kit.jsx'
import { budget, index, map } from '../../lib/data.js'
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

// ---- แผนที่คะแนนรวม: เขตอื่นไล่เฉดเทา (อ่อน = คะแนนต่ำ, เข้ม = สูง) · ดินแดงส้ม ปทุมวันฟ้า ----
const byName = Object.fromEntries(overall.map((d) => [d.name, d]))
const sMin = Math.min(...overall.map((d) => d.overall))
const sMax = Math.max(...overall.map((d) => d.overall))
const hex = (h) => [1, 3, 5].map((k) => parseInt(h.slice(k, k + 2), 16))
const [lo, hi] = [hex(color.grid), hex(color.reference)]
const shade = (v) => {
  const t = (v - sMin) / (sMax - sMin)
  return `rgb(${lo.map((c, k) => Math.round(c + (hi[k] - c) * t)).join(',')})`
}
const fillOf = (name) => (name === DD ? color.dindaeng : name === PT ? color.pathumwan : shade(byName[name].overall))
const bkk = map.bangkok

function BangkokMap() {
  const [hover, setHover] = useState(null)
  const [, , W, H] = bkk.viewBox
  const label = (name, dx, anchor, dy = 0) => {
    const d = bkk.districts.find((x) => x.name === name)
    return (
      <text x={d.cx + dx} y={d.cy + dy} dy="0.35em" textAnchor={anchor} fontSize={24} fontWeight={700} fill={color.text}
        stroke={color.surface} strokeWidth={5} paintOrder="stroke" pointerEvents="none" style={{ fontFamily: 'var(--font)' }}>
        {name} {fmt.dec(byName[name].overall)}
      </text>
    )
  }
  return (
    <div className={s.mapWrap}>
      <svg viewBox={`0 0 ${W} ${H}`} className={s.mapSvg} role="img" aria-label="แผนที่คะแนนรวม 50 เขต">
        {bkk.districts.map((d) => (
          <path key={d.name} d={d.d} fill={fillOf(d.name)} stroke={hover?.name === d.name ? color.text : color.surface}
            strokeWidth={hover?.name === d.name ? 2.5 : 1} fillRule="evenodd"
            onMouseEnter={() => setHover(d)} onMouseLeave={() => setHover(null)} />
        ))}
        {label(DD, 22, 'start', -18)}
        {label(PT, 22, 'start', 20)}
      </svg>
      <div className={s.mapKey}>
        <span>คะแนนต่ำ {fmt.dec(sMin)}</span>
        <i style={{ background: `linear-gradient(90deg, ${color.grid}, ${color.reference})` }} />
        <span>สูง {fmt.dec(sMax)}</span>
      </div>
      {hover && (
        <div className={s.mapTip} style={{ left: `${(hover.cx / W) * 100}%`, top: `${(hover.cy / H) * 100}%` }}>
          <TipBox active payload={[{ payload: byName[hover.name] }]}
            render={(r) => ({ title: `${r.name} · อันดับ ${r.rank}`, rows: [['คะแนนรวม', fmt.dec(r.overall)]] })} />
        </div>
      )}
    </div>
  )
}

// ---- 5 เรื่องที่จะเล่า (ลำดับตามสไลด์) · หัวข้อที่ดินแดงอยู่ท้ายตาราง และแก้ได้ด้วยงบเขต ----
const STORY = [
  { key: 'flood', label: 'น้ำท่วม', page: 2 },
  { key: 'wastewater', label: 'น้ำเสีย', page: 4 },
  { key: 'education', label: 'การศึกษา', page: 6 },
  { key: 'crime', label: 'จุดเสี่ยง', page: 8 },
  { key: 'parks', label: 'สวนสาธารณะ', page: 10 },
].map((t) => ({ ...t, ...dd.topics[t.key], median: index.medians.topics[t.key] }))

const dDD = budget.districts[DD]
const dPT = budget.districts[PT]

export default function WhyDindaeng() {
  return (
    <SlideFrame
      kicker="01 · ทำไมต้องเป็นเขตดินแดง"
      title="ดินแดงอยู่อันดับ 50 จาก 50 เขต ไม่ใช่เพราะแย่ด้านเดียว แต่ต่ำกว่าค่ากลางทุกด้าน"
      source="ที่มา: Bangkok Index 2025 – Rocket Media Lab; ข้อบัญญัติงบประมาณ กทม. 2568 · คะแนน 1–50 ยิ่งมากยิ่งดี · เส้นเขต: OpenGISData-Thailand (CC BY 4.0)"
    >
      <div className={s.grid}>
        {/* ---- คะแนนรวม 50 เขต (แผนที่) ---- */}
        <ChartCard
          title="คะแนนรวม 50 เขต"
          legend={[
            { label: 'ดินแดง (อันดับ 50)', color: color.dindaeng },
            { label: 'ปทุมวัน (อันดับ 1)', color: color.pathumwan },
          ]}
        >
          <BangkokMap />
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
            <p className={s.miniTitle}>งบทั้งเขตดินแดง ปี 2568 {fmt.mb(dDD.total)} ล้านบาท</p>
          </div>
        </ChartCard>
      </div>

      {/* ---- แผนที่นำทาง: 5 เรื่องที่จะเล่า ---- */}
      <div className={s.story}>
        <p className={s.storyHead}>
          <b>5 เรื่องที่จะเล่า</b>
        </p>
        <ol className={s.storyList}>
          {STORY.map((t) => (
            <li key={t.key}>
              <b>{t.label}</b>
              <span className="num">อันดับ <strong>{t.rank}</strong> จาก 50</span>
              <small className="num">คะแนน {fmt.dec(t.score)} · ค่ากลาง {fmt.dec(t.median)}</small>
            </li>
          ))}
        </ol>
      </div>
    </SlideFrame>
  )
}
