// จุดเดียวสำหรับดึงข้อมูลเข้าสไลด์: import { flood, index } from '../../lib/data.js'
// ไฟล์ใน src/data/ สร้างโดย `npm run data` ห้ามแก้ด้วยมือ
import index from '../data/index.json'
import budget from '../data/budget.json'
import flood from '../data/flood.json'
import wastewater from '../data/wastewater.json'
import education from '../data/education.json'
import risk from '../data/risk.json'
import parks from '../data/parks.json'
import scenarios from '../data/scenarios.json'
import ask from '../data/ask.json'
import map from '../data/map.json'
import vacant from '../data/vacant.json'

export { index, budget, flood, wastewater, education, risk, parks, scenarios, ask, map, vacant }

const riskTypeOrder = new Map(map.risk.types.map(({ type }, index) => [type, index]))
export const riskPointsByType = [...map.risk.points].sort((a, b) =>
  (riskTypeOrder.get(a.type) ?? riskTypeOrder.size) - (riskTypeOrder.get(b.type) ?? riskTypeOrder.size)
)
export const riskPinNumbers = new Map(riskPointsByType.map((point, index) => [point.no, index + 1]))

export const DD = 'ดินแดง'
export const PT = 'ปทุมวัน'

// ข้อมูลรายเขตของดินแดงจากดัชนี (คะแนน/อันดับ 4 ด้าน 16 หัวข้อ)
export const dindaeng = index.districts.find((d) => d.name === DD)
