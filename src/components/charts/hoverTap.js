// ชี้/แตะเพื่อดูข้อมูล ใช้ได้ทั้งเมาส์และจอสัมผัส (iPad)
// - เมาส์: ชี้ = เปิด · เอาเมาส์ออก = ปิด
// - จอสัมผัส/ปากกา: แตะ = เปิด · แตะซ้ำ = ปิด · แตะอันอื่น = สลับ
// เดิมใช้ onMouseEnter + onClick: บน iPad การแตะยิงทั้ง mouseenter (เปิด) และ click (ปิด) ติดกัน กล่องจึงเปิดแล้วเด้งปิด
// ที่นี่ใช้ pointer event แยกชนิดอุปกรณ์ จึงไม่ซ้อนกัน · click ถูกหยุดไว้ไม่ให้ไปเปิดหน้าต่าง "ขยาย" ของกราฟ
//
// ใช้:  <g {...hoverTap(key, hover === key, setHover)}>…</g>
//       <svg {...tapAway(setHover)}>   ← แตะพื้นที่ว่างในกราฟเพื่อปิด (จอสัมผัส)
export function hoverTap(key, isOn, set) {
  return {
    onPointerEnter: (e) => {
      if (e.pointerType === 'mouse') set(key)
    },
    onPointerLeave: (e) => {
      if (e.pointerType === 'mouse') set(null)
    },
    onPointerDown: (e) => {
      if (e.pointerType === 'mouse') return
      e.stopPropagation()
      set(isOn ? null : key)
    },
    onClick: (e) => e.stopPropagation(),
  }
}

export function tapAway(set) {
  return {
    onPointerDown: (e) => {
      if (e.pointerType !== 'mouse') set(null)
    },
  }
}
