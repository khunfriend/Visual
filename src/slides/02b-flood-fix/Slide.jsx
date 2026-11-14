import { Bar, BarChart, CartesianGrid, Cell, LabelList, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import SlideFrame from '../../components/SlideFrame.jsx'
import { ChartCard, SvgLabel, TipBox, axisCommon, gridProps } from '../../components/charts/kit.jsx'
import { color } from '../../theme/theme.js'
import { flood, scenarios } from '../../lib/data.js'
import s from './style.module.css'

// สไลด์ 02b (หน้า 3 บนจอ): แก้เฉพาะไฟล์ในโฟลเดอร์นี้ (ดู CLAUDE.md)
// ตัวเลขทุกตัวต้องตรงกับ ข้อมูลรวม_ตรวจแล้ว.md
// ค่าใช้จ่าย = ประมาณการของกลุ่ม (จำนวน × ราคาต่อหน่วย) ไม่ใช่ราคากลาง · ลอกท่อและสำรวจออกแบบอยู่ในช่วงราคาของร่างงบ xlsx ชีต 9

const hs = flood.dindaeng.hotspots
const nSpots = hs.length // 11 จุดท่วมปี 2568
// จุดที่ท่อเล็ก ระบายไม่ทัน (ยังไม่อยู่ในบัญชีจุดเสี่ยงน้ำท่วม กทม.)
const PIPE_SPOTS = ['ประชาสุข ซอยอินทามระ 34', 'ประชาสุข ซอยอินทามระ 45–53', 'ประชาสงเคราะห์ ซอยเปรมสมบัติ แยก 33']
// จุดที่ต้องเร่งระบายลงคลอง
const OUTLET_SPOTS = ['รัชดาภิเษก แยกเทียมร่วมมิตร', 'ถนนดินแดง หน้าโรงเรียนพิบูลประชาสรรค์']
const cnt = (names) => names.reduce((a, n) => a + (hs.find((h) => h.spot === n)?.count || 0), 0)

// ฝนของ 12 วันที่ท่วม (ปี 2568) เทียบขีดจำกัดระบบระบายน้ำ 60 มม.
const CAP = flood.systemCapacityMm
const TH_MONTH = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
const rainDays = flood.dindaeng.days.map((d) => {
  const [, m, day] = d.date.split('-').map(Number)
  return { ...d, label: `${day} ${TH_MONTH[m - 1]}`, under: d.rain < CAP }
})
const underCap = rainDays.filter((d) => d.under).length

const line = (label, qty, unit, price, short) => ({ label, qty, unit, price, short, sum: qty * price })
const GROUPS = [
  {
    title: 'ปรับปรุงระบบท่อระบายน้ำ',
    cause: 'ท่อเล็กและแนวท่อไม่ดี รับน้ำฝนไม่ทัน ระบายลงคลองช้า น้ำจึงขังบนถนน',
    kind: 'ครั้งเดียว',
    where: `${PIPE_SPOTS.length + OUTLET_SPOTS.length} จุดที่ท่วมซ้ำ (รวม ${cnt([...PIPE_SPOTS, ...OUTLET_SPOTS])} ครั้งในปี 68)`,
    steps: [
      'ขยายขนาดท่อในจุดที่น้ำมากเกินความสามารถของท่อ',
      'เพิ่มท่อในจุดที่น้ำสะสมเป็นประจำ',
      'ปรับแนวท่อให้ระบายลงคลอง/ระบบหลักได้เร็วขึ้น',
    ],
    cost: [
      line('สำรวจและออกแบบ', PIPE_SPOTS.length, 'จุด', 800000, 'สำรวจออกแบบ'),
      line('ขยาย/เพิ่มท่อ Ø 1.00 ม.', PIPE_SPOTS.length * 300, 'ม.', 20000, 'ท่อใหม่'),
      line('ท่อลอดถนนลงคลอง', OUTLET_SPOTS.length, 'จุด', 1500000, 'ท่อลอด'),
    ],
  },
  {
    title: 'เพิ่มประสิทธิภาพการบำรุงรักษา',
    cause: 'ท่อและช่องรับน้ำอุดตันจากตะกอน ขยะ และไขมัน น้ำไหลลงท่อไม่ได้',
    kind: 'ต่อปี',
    where: `ทุกจุดที่ท่วมปี 68 (${nSpots} จุด)`,
    steps: [
      'ลอกท่อและกำจัดตะกอนอย่างสม่ำเสมอ',
      'เก็บขยะที่อุดตันช่องรับน้ำ',
      'ตรวจระบบระบายน้ำก่อนเข้าฤดูฝน',
    ],
    cost: [
      // ราคากลางลอกท่อ: สนน. ประมูลปี 2561 ราคากลาง 24,891,000 บาท ยาว 307,230 ม. ≈ 81 บาท/ม. · สมมติท่อจุดละ 500 ม.
      line('ลอกท่อเพิ่ม 3 รอบ (จุดละ 500 ม.)', nSpots * 500 * 3, 'ม.', 81, 'ลอกท่อ'),
      // ค่าแรงขั้นต่ำ กทม. 400 บาท/วัน (มีผล 1 ก.ค. 2568)
      line('ทีมเก็บขยะช่องรับน้ำ (4 คน × 150 วันฝน)', 600, 'คน-วัน', 400, 'เก็บขยะ'),
      // ไม่พบราคากลางงานกล้องตรวจท่อในไทย → ค่าประมาณ
      line('กล้องตรวจท่อก่อนฤดูฝน*', nSpots, 'จุด', 30000, 'ตรวจท่อ*'),
    ],
  },
].map((g) => ({ ...g, sum: g.cost.reduce((a, c) => a + c.sum, 0) }))

const mb = (b) => (b / 1e6).toFixed(2)
const th = (n) => n.toLocaleString('th-TH')
const nowCase = scenarios.cases.find((c) => c.key === 'now')
const targetCase = scenarios.cases.find((c) => c.key === 'target')

export default function FloodFix() {
  return (
    <SlideFrame
      kicker="03 · แก้น้ำท่วม"
      title={`แก้น้ำท่วม 2 แนวทาง ตั้งเป้าลดจาก ${nowCase.floods} เหลือ ${targetCase.floods} ครั้งในปีแรก`}
      source="ราคาอ้างอิง: ราคากลางลอกท่อ สนน. ปี 2561 ≈ 81 บาท/ม. · ค่าแรงขั้นต่ำ กทม. 400 บาท/วัน (1 ก.ค. 2568) · งานท่อและ * ยังไม่มีราคากลาง เป็นประมาณการของกลุ่ม · ครั้งที่ท่วม: Bangkok Index 2025 (2568)"
    >
      <div className={s.page}>
        <div className={s.table} role="table">
          <div className={`${s.row} ${s.head}`} role="row">
            <span>แนวทาง</span>
            <span>สาเหตุ</span>
            <span>สิ่งที่ทำ</span>
            <span>ใช้เงิน</span>
          </div>
          {GROUPS.map((g, i) => (
            <div key={g.title} className={s.row} role="row">
              <div className={s.problem}>
                <b>
                  {i + 1}. {g.title}
                </b>
              </div>
              <p className={s.cause}>{g.cause}</p>
              <ul className={s.steps}>
                {g.steps.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
              <div className={s.cost}>
                <b className={`${s.money} num`}>
                  {mb(g.sum)} <small>ล้านบาท{g.kind === 'ต่อปี' ? '/ปี' : ' (ครั้งเดียว)'}</small>
                </b>
                {/* รายละเอียดวิธีคิด (จำนวน × ราคา) ดูได้เมื่อชี้ */}
                <span title={g.cost.map((c) => `${c.label} ${th(c.qty)} ${c.unit} × ${th(c.price)} บาท`).join('\n')}>
                  {g.cost.map((c) => `${c.short} ${mb(c.sum)}`).join(' · ')} ล้าน
                </span>
              </div>
            </div>
          ))}
        </div>

        <ChartCard
          className={s.rainCard}
          title={`${underCap} จาก ${rainDays.length} วันที่ท่วม ฝนยังไม่ถึงขีดจำกัดของระบบ ${CAP} มม.`}
          legend={[
            { label: `ฝนต่ำกว่า ${CAP} มม. แต่ยังท่วม`, color: color.rainUnder },
            { label: `ฝน ${CAP} มม. ขึ้นไป (เกินขีดจำกัด)`, color: color.rainOver },
            { label: `ขีดจำกัดระบบ ${CAP} มม.`, color: color.reference, kind: 'dash' },
          ]}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rainDays} margin={{ top: 28, right: 16, bottom: 0, left: 0 }} barCategoryGap="30%">
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="label" {...axisCommon} interval={0} />
              <YAxis {...axisCommon} domain={[0, 100]} ticks={[0, 50, 100]} width={44} />
              <ReferenceLine y={CAP} stroke={color.reference} strokeDasharray="6 5" strokeWidth={2} />
              <Tooltip
                cursor={{ fill: color.grid }}
                content={<TipBox render={(r) => ({ title: `${r.label} 2568`, rows: [['ฝนทั้งวัน', `${r.rain} มม.`], ['ท่วม', `${r.events} ครั้ง ใน ${r.spots} จุด`]] })} />}
              />
              <Bar dataKey="rain" radius={[4, 4, 0, 0]} maxBarSize={56} isAnimationActive={false}>
                {rainDays.map((d) => (
                  <Cell key={d.date} fill={d.under ? color.rainUnder : color.rainOver} />
                ))}
                <LabelList dataKey="rain" content={({ x, y, width, value }) => (
                  <SvgLabel x={x + width / 2} y={y - 10} weight={500} fill={color.textMuted}>{value}</SvgLabel>
                )} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

      </div>
    </SlideFrame>
  )
}
