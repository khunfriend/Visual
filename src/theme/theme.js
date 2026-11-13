// แหล่งเดียวของสี ฟอนต์ และขนาด (ดู PRD หัวข้อ 7)
// - ไฟล์ JS (เช่น กราฟ Recharts) ให้ import ค่าจากไฟล์นี้
// - ไฟล์ CSS ใช้ผ่านตัวแปร var(--...) ที่ Deck ใส่ไว้ที่ราก (ดู toCssVars)
// ห้ามเขียนรหัสสีตรง ๆ ในไฟล์สไลด์

export const color = {
  // สีที่มีความหมายตายตัว ใช้เหมือนกันทุกหน้า
  dindaeng: '#D9480F', // ดินแดง
  pathumwan: '#1C7ED6', // ปทุมวัน (อันดับ 1 / คู่เทียบ)
  other: '#ADB5BD', // เขตอื่น
  reference: '#495057', // เส้นมัธยฐาน / มาตรฐาน
  contrast: '#2B8A3E', // กลุ่มเปรียบเทียบพิเศษ เช่น เขตท่วมน้อยแต่ได้งบมาก (ผ่านตัวตรวจสีคู่กับส้ม/ฟ้า)
  neighbor: '#2B8A3E', // เขียวเข้ม: เขตข้างเคียงที่เน้น (ค่าเดียวกับ contrast ซึ่งผ่านตัวตรวจสีคู่กับส้มดินแดงแล้ว)

  // ประเภทจุดเสี่ยง 4 แบบ (ผ่านตัวตรวจสี dataviz ทุกคู่ และไม่ใช้ส้มของดินแดง)
  riskType: {
    'จุดล่อแหลมต่อการเกิดอาชญากรรม': '#A61E4D',
    'ประชากรหนาแน่น/พลุกพล่าน': '#7950F2',
    'จุดรกร้าง/พื้นที่ลักลอบทิ้งขยะ': '#B07D00',
    'จุดมืด จุดเปลี่ยว': '#1098AD',
  },

  // ที่ว่างทำสวน (สไลด์ 11) ตามเจ้าของที่ดิน และตามกลุ่มแปลงในแผนสร้างสวน · สีจาก park_charts_brief.md
  vacantOwner: {
    'รัฐบาล': '#1BAF7A',
    'ศาสนสถาน': '#D99A00',
    'เอกชน': '#C9C7BF',
  },
  vacantGroup: {
    'หน่วยงานราชการ (สถานีวิทยุ)': '#6250D6',
    'การทางพิเศษ (ใต้ทางด่วน)': '#1BAF7A',
    'การเคหะ (แฟลต)': '#2A78D6',
    'ศาสนสถาน (วัด คริสตจักร)': '#D99A00',
    'ที่ว่างเอกชน (ส่วนที่ยังขาด)': '#C9C7BF',
  },

  // heatmap ความหนาแน่น (เหลืองอ่อน → แดงเข้ม)
  heat: ['#FFF3BF', '#FFA94D', '#E8590C', '#A61E1E'],

  // พื้นผิวและตัวอักษร (ธีมสว่าง)
  bg: '#F1F3F5', // พื้นนอกสไลด์ (letterbox)
  surface: '#FFFFFF', // พื้นสไลด์
  surfaceAlt: '#F8F9FA', // กล่องรอง
  border: '#DEE2E6',
  grid: '#E9ECEF', // เส้นกริดกราฟ
  text: '#212529',
  textMuted: '#5C636A',
  textFaint: '#868E96',
}

export const font = {
  family: "'IBM Plex Sans Thai', 'Sarabun', system-ui, sans-serif",
}

// ขนาดตัวอักษร (px) บนพื้นที่สไลด์ 1920×1080 · ขั้นต่ำ 20 ยกเว้นที่มา 16 (PRD N3)
export const size = {
  title: 56,
  subtitle: 28,
  body: 24,
  label: 20,
  source: 16,
}

export const stage = { width: 1920, height: 1080 }

export function toCssVars() {
  const vars = {}
  for (const [k, v] of Object.entries(color)) {
    if (typeof v === 'string') vars[`--c-${k}`] = v
  }
  color.heat.forEach((v, i) => (vars[`--c-heat-${i}`] = v))
  for (const [k, v] of Object.entries(size)) vars[`--fs-${k}`] = `${v}px`
  vars['--font'] = font.family
  return vars
}
