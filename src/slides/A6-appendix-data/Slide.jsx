import SlideFrame from '../../components/SlideFrame.jsx'
import s from './style.module.css'

// สไลด์ A6 (ภาคผนวก): ที่มาของข้อมูลหลัก ราคาจุดเสี่ยง เงินเดือนครู และวิธีคำนวณคะแนนหลังแก้
// แก้เฉพาะไฟล์ในโฟลเดอร์นี้ (ดู CLAUDE.md) · รายละเอียดอยู่ใน ข้อมูลรวม_ตรวจแล้ว.md

const GROUPS = [
  {
    title: 'แก้จุดเสี่ยง (หน้า 9): ราคาต่อหน่วย', col: 1,
    items: [
      { what: 'CCTV 70,000 บาท/ตัว', src: 'อิงงบกล้องใหม่ สำนักการจราจรฯ ปี 2569 ≈ 68,800 (ข่าวสด)', est: true },
      { what: 'โคมไฟ LED · ตัดแต่งสวน · ทางข้าม+ป้าย · อาสาจราจร · สวนหย่อม', src: 'ประมาณการของกลุ่ม', est: true },
    ],
  },
  {
    title: 'การศึกษา (หน้า 7)', col: 1,
    items: [
      { what: 'เงินเดือนครูผู้ช่วย 18,220 บาท/เดือน (ป.ตรี 4 ปี)', src: 'มติ ครม. ตามข่าว มีผล 1 พ.ค. 2568 (ยังไม่เห็นประกาศตัวจริง)', est: true },
      { what: 'ผู้ช่วยครู · ศูนย์พัฒนาเด็กเล็ก', src: 'ยังไม่ประเมินงบ ไม่นับในคะแนน', est: true },
    ],
  },
  {
    title: 'วิธีคำนวณ', col: 1,
    items: [
      { what: 'คะแนนและอันดับหลังแก้ (หน้า 13)', src: 'คำนวณเอง จากสูตร Bangkok Index 2025 โดยสมมติเขตอื่นคงที่ ไม่ใช่คะแนนทางการ' },
      { what: 'ค่ากลาง', src: 'มัธยฐานของ 50 เขต' },
    ],
  },
  {
    title: 'ข้อมูลหลักที่ใช้', col: 2,
    items: [
      { what: 'คะแนนและอันดับ 50 เขต (น้ำท่วม น้ำเสีย การศึกษา จุดเสี่ยง สวน)', src: 'Bangkok Index 2025' },
      { what: 'งบเขต ปี 2568', src: 'ข้อบัญญัติงบประมาณ กทม. 2568' },
      { what: 'จุดตรวจคุณภาพน้ำ ม.ค.–เม.ย. 2566', src: 'data.bangkok.go.th ชุด waterquality' },
      { what: 'จุดเสี่ยง 17 จุด', src: 'บัญชีพื้นที่เสี่ยง สำนักเทศกิจ ปี 2567–2568' },
      { what: 'เกณฑ์ BOD 15 มก./ล.', src: 'ยังไม่ได้บันทึกแหล่งต้นฉบับ', est: true },
      { what: 'งบเขต ปี 2569', src: 'ดูภาคผนวก A1 (ยังไม่ได้ตรวจไฟล์ต้นทาง)', est: true },
    ],
  },
]

const LINKS = [
  ['Bangkok Index 2025', 'https://rocketmedialab.co/database-bangkok-index-2025/'],
  ['ข่าวสด: งบกล้อง CCTV', 'https://www.khaosod.co.th/politics/news_10346352'],
  ['ข้อมูลเปิด กทม.', 'https://data.bangkok.go.th'],
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
