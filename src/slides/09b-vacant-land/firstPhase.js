import { vacant } from '../../lib/data.js'

const { plan } = vacant

// เลขแปลงตรงกับแผนในภาคผนวก A3
const siteNumbers = [3, 1, 6]
export const firstSites = siteNumbers.map((no) => plan.sites.find((site) => site.no === no))
export const firstArea = firstSites.reduce((sum, site) => sum + site.areaM2, 0)
export const withMaint = (baht) => baht * (1 + plan.maintenanceRate)
export const firstBudget = firstSites.reduce((sum, site) => sum + withMaint(site.buildBaht), 0)
