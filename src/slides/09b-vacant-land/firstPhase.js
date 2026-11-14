import { vacant } from '../../lib/data.js'

const { plan } = vacant

// ระยะแรก 3 แห่ง กำหนดใน data/scripts/build_data.py (FIRST_PHASE) เลขแปลงตรงกับแผนในภาคผนวก A3
// เลือกชุดที่กระจายทั่วเขตที่สุด (ดู vacant.firstPhase.coveragePct และ ข้อมูลรวม_ตรวจแล้ว.md)
export const firstPhase = vacant.firstPhase
const siteNumbers = firstPhase.sites
export const firstSites = siteNumbers.map((no) => plan.sites.find((site) => site.no === no))
export const firstArea = firstSites.reduce((sum, site) => sum + site.areaM2, 0)
export const withMaint = (baht) => baht * (1 + plan.maintenanceRate)
export const firstBudget = firstSites.reduce((sum, site) => sum + withMaint(site.buildBaht), 0)
