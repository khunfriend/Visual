import SlideFrame from '../../components/SlideFrame.jsx'
import s from './style.module.css'

// สไลด์ A6 (ภาคผนวก): ที่มาของข้อมูลหลัก ราคาจุดเสี่ยง เงินเดือนครู และวิธีคำนวณคะแนนหลังแก้
// แก้เฉพาะไฟล์ในโฟลเดอร์นี้ (ดู CLAUDE.md) · รายละเอียดอยู่ใน ข้อมูลรวม_ตรวจแล้ว.md

const GROUPS = [
  {
    title: 'แก้จุดเสี่ยง (หน้า 9)', col: 1,
    items: [
      { what: 'CCTV 70,000 บาท/ตัว', src: 'งบกล้องใหม่ สำนักการจราจรฯ ≈ 68,800 บาท/ตัว (ข่าวสด)' },
      { what: 'โคมไฟ LED พร้อมเสา 16,000 บาท/ชุด', src: 'ราคาขาย HomePro ชุดไฟถนน LED 100 วัตต์ พร้อมเสา' },
      { what: 'อาสาจราจร 400 บาท/วัน', src: 'ค่าจ้างขั้นต่ำ กทม. ปี 2568' },
      { what: 'ปรับที่รกร้างเป็นสวนหย่อม 300,000 บาท', src: '300 ตร.ม. × 1,000 บาท/ตร.ม. (ค่าสวน 15 นาที)' },
      { what: 'ตัดแต่งสวน · ทางข้าม+ป้าย', src: 'ประมาณการของกลุ่ม ยังไม่พบแหล่งอ้างอิง', est: true },
    ],
  },
  {
    title: 'การศึกษา (หน้า 7)', col: 1,
    items: [
      { what: 'เงินเดือนครูผู้ช่วย 18,220 บาท/เดือน', src: 'อัตรา ป.ตรี 4 ปี มีผล 1 พ.ค. 2568 (มติชน)' },
    ],
  },
  {
    title: 'วิธีคำนวณ', col: 1,
    items: [
      { what: 'คะแนนและอันดับหลังแก้', src: 'คำนวณจากสูตร Bangkok Index 2025 โดยสมมติเขตอื่นคงที่' },
      { what: 'ค่ากลาง', src: 'มัธยฐานของ 50 เขต' },
    ],
  },
  {
    title: 'ข้อมูลหลักที่ใช้', col: 2,
    items: [
      { what: 'คะแนน อันดับ จุดท่วม และฝนรายวัน', src: 'Bangkok Index 2025' },
      { what: 'งบเขต ปี 2568', src: 'ข้อบัญญัติงบประมาณ กทม. 2568' },
      { what: 'จุดตรวจคุณภาพน้ำ ม.ค.–เม.ย. 2566', src: 'data.bangkok.go.th ชุด waterquality' },
      { what: 'จุดเสี่ยง 17 จุด', src: 'บัญชีพื้นที่เสี่ยง สำนักเทศกิจ ปี 2567–2568' },
      { what: 'ความยาวท่อในซอย (225 ซอย)', src: 'สำนักงานเขตดินแดง' },
      { what: 'ขีดจำกัดระบบระบายน้ำ 60 มม.', src: 'ตัวเลขของ กทม. ยังไม่ได้ตรวจต้นฉบับ', est: true },
      { what: 'เกณฑ์ BOD 15 มก./ล.', src: 'ยังไม่ได้บันทึกแหล่งต้นฉบับ', est: true },
    ],
  },
]

const LINKS = [
  ['ข่าวสด: งบกล้อง CCTV', 'https://www.khaosod.co.th/politics/news_10346352'],
  ['HomePro: ไฟถนน LED พร้อมเสา', 'https://www.homepro.co.th/p/888224900868'],
  ['มติชน: เงินเดือนครูผู้ช่วย', 'https://www.matichon.co.th/education/news_4505382'],
  ['สยามรัฐ: สวน 15 นาที', 'https://siamrath.co.th/bangkok/e81304bb-2cab-46a3-a69d-8a6cc4723873'],
  ['Bangkok Index 2025', 'https://rocketmedialab.co/database-bangkok-index-2025/'],
  ['ข้อมูลเปิด กทม.', 'https://data.bangkok.go.th'],
  ['สำนักงานเขตดินแดง: ถนน ตรอก ซอย', 'https://webportal.bangkok.go.th/dindaeng/page/sub/624'],
]

export default function AppendixData() {
  return (
    <SlideFrame
      kicker="ภาคผนวก · ข้อมูลและวิธีคำนวณ"
      title="ที่มาของข้อมูลและตัวเลขที่ประมาณเอง"
      source="รายละเอียดตัวเลขและวิธีคำนวณทั้งหมดอยู่ใน ข้อมูลรวม_ตรวจแล้ว.md"
    >
      <div className={s.cols}>
        {[1, 2].map((col) => (
          <div key={col} className={s.list}>
            {GROUPS.filter((g) => g.col === col).map((g) => (
              <section key={g.title} className={s.group}>
                <h2 className={s.groupTitle}>{g.title}</h2>
                {g.items.map((it) => (
                  <div key={it.what} className={s.item}>
                    <b>
                      {it.what}
                      {it.est && <em className={s.est}>ประมาณการ / ยังไม่ได้ตรวจ</em>}
                    </b>
                    <span>{it.src}</span>
                  </div>
                ))}
              </section>
            ))}
            {col === 2 && (
              <section className={s.links}>
                <h2 className={s.groupTitle}>ลิงก์ที่มา</h2>
                <ul>
                  {LINKS.map(([label, url]) => (
                    <li key={url}><a href={url} target="_blank" rel="noreferrer">{label}</a></li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        ))}
      </div>
    </SlideFrame>
  )
}
