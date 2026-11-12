"""
หาพิกัดโดยประมาณของจุดท่วมซ้ำซาก 11 จุด → data/raw/map/flood_hotspots_coords.csv

รัน:  python3 -I data/scripts/geocode_flood.py   (รันครั้งเดียว ผลลัพธ์เก็บเป็น CSV ให้คนตรวจ/แก้ได้)

ข้อมูลต้นทางไม่มีพิกัด มีแค่ชื่อถนนกับจุดอ้างอิง เช่น "ประชาสุข ซอยอินทามระ 34"
วิธีหา (ใช้ OSM ใน data/raw/map/osm_flood_refs.json)
- ปากซอย:    จุดบนถนนหลักที่ใกล้ปลายซอยที่สุด
- หน้าสถานที่: จุดบนถนนหลักที่ใกล้สถานที่อ้างอิงที่สุด (พิกัดสถานที่จาก OSM ระบุ id ไว้)
- แยก:       จุดที่ถนนสองเส้นใกล้กันที่สุด
ทุกจุดเป็น "ตำแหน่งโดยประมาณ" ต้องให้ผู้ใช้ตรวจก่อนใช้จริง
ถ้าแก้พิกัดด้วยมือใน CSV ให้เปลี่ยนคอลัมน์ method เป็น "manual" แล้วอย่ารัน script นี้ทับ
"""
import csv
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
RAW = ROOT / 'data' / 'raw' / 'map'
OUT = RAW / 'flood_hotspots_coords.csv'

els = json.loads((RAW / 'osm_flood_refs.json').read_text())['elements']
LAT0 = 13.775
KX, KY = 111_320 * math.cos(math.radians(LAT0)), 110_540


def m(p):  # (lat, lon) → เมตร
    return p[1] * KX, p[0] * KY


def lines(name):
    out = [[(g['lat'], g['lon']) for g in e['geometry']] for e in els if e['tags'].get('name') == name]
    assert out, f'ไม่พบถนน {name} ใน OSM'
    return out


def snap(p, name):
    """จุดบนถนน name ที่ใกล้ p ที่สุด คืน (lat, lon, ระยะเมตร)"""
    px, py = m(p)
    best = None
    for ln in lines(name):
        for a, b in zip(ln, ln[1:]):
            (ax, ay), (bx, by) = m(a), m(b)
            dx, dy = bx - ax, by - ay
            t = max(0, min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy or 1)))
            qx, qy = ax + t * dx, ay + t * dy
            d = math.hypot(px - qx, py - qy)
            if best is None or d < best[2]:
                best = (qy / KY, qx / KX, d)
    return best


def soi_mouth(soi, main):
    """ปากซอย: ปลายซอยที่อยู่ใกล้ถนนหลักที่สุด แล้วยึดลงบนถนนหลัก"""
    ends = [p for ln in lines(soi) for p in (ln[0], ln[-1])]
    return min((snap(p, main) for p in ends), key=lambda r: r[2])


def junction(a, b):
    pts = [p for ln in lines(a) for p in ln]
    return min((snap(p, b) for p in pts), key=lambda r: r[2])


# สถานที่อ้างอิงจาก OSM (lat, lon)
LANDMARK = {
    'ตลาดห้วยขวาง (way 331795213)': (13.777663, 100.568488),
    'โรงเรียนพิบูลประชาสรรค์ (way 605778962)': (13.7628882, 100.5514513),
    'สถานเอกอัครราชทูตจีน (way 368893106)': (13.763122, 100.5669),
    'กรมทหารราบที่ 1 (way 863471744)': (13.776194, 100.551191),
}

SPOTS = [
    ('ประชาสุข ซอยอินทามระ 34', 'ปากซอยอินทามระ 34 บนถนนประชาสุข', 'สูง', lambda: soi_mouth('ซอยอินทามระ 34', 'ถนนประชาสุข')),
    ('รัชดาภิเษก แยกเทียมร่วมมิตร', 'แยกถนนรัชดาภิเษก × ถนนเทียมร่วมมิตร', 'สูง', lambda: junction('ถนนเทียมร่วมมิตร', 'ถนนรัชดาภิเษก')),
    ('ประชาสงเคราะห์ หน้าตลาดห้วยขวาง', 'ถนนประชาสงเคราะห์ จุดที่ใกล้ตลาดห้วยขวางที่สุด', 'สูง',
     lambda: snap(LANDMARK['ตลาดห้วยขวาง (way 331795213)'], 'ถนนประชาสงเคราะห์')),
    ('ถนนดินแดง หน้าโรงเรียนพิบูลประชาสรรค์', 'ถนนดินแดง จุดที่ใกล้โรงเรียนที่สุด', 'สูง',
     lambda: snap(LANDMARK['โรงเรียนพิบูลประชาสรรค์ (way 605778962)'], 'ถนนดินแดง')),
    ('ประชาสงเคราะห์ ซอยเปรมสมบัติ แยก 33', 'ปากซอยประชาสงเคราะห์ 33 บนถนนประชาสงเคราะห์ (ตีความว่าซอยเปรมสมบัติ = ซอย 33)', 'ปานกลาง',
     lambda: soi_mouth('ซอยประชาสงเคราะห์ 33', 'ถนนประชาสงเคราะห์')),
    ('ประชาสุข ซอยอินทามระ 45–53', 'กึ่งกลางระหว่างปากซอยอินทามระ 45 กับ 53 บนถนนประชาสุข', 'ปานกลาง',
     lambda: tuple((a + b) / 2 for a, b in zip(soi_mouth('ซอยอินทามระ 45', 'ถนนประชาสุข'), soi_mouth('ซอยอินทามระ 53', 'ถนนประชาสุข')))),
    ('ประชาสงเคราะห์ ซอย 9', 'ปากซอยประชาสงเคราะห์ 9 บนถนนประชาสงเคราะห์', 'สูง',
     lambda: soi_mouth('ซอยประชาสงเคราะห์ 9', 'ถนนประชาสงเคราะห์')),
    ('รัชดาภิเษก หน้าสถานทูตจีน', 'ถนนรัชดาภิเษก จุดที่ใกล้สถานทูตจีนที่สุด', 'สูง',
     lambda: snap(LANDMARK['สถานเอกอัครราชทูตจีน (way 368893106)'], 'ถนนรัชดาภิเษก')),
    ('ประชาสงเคราะห์ (ไม่ระบุช่วง)', 'ข้อมูลต้นทางไม่ระบุตำแหน่ง ไม่วางบนแผนที่', 'ไม่มี', None),
    ('วิภาวดีรังสิต ขาออก (กรมทหารราบที่ 1)', 'ถนนวิภาวดีรังสิต จุดที่ใกล้กรมทหารราบที่ 1 ที่สุด (อาจอยู่บนแนวเขตพอดี)', 'ปานกลาง',
     lambda: snap(LANDMARK['กรมทหารราบที่ 1 (way 863471744)'], 'ถนนวิภาวดีรังสิต')),
    ('ถนนดินแดง ซอยสุทธิพร 2', 'ปากซอยสุทธิพร 2 บนถนนดินแดง', 'สูง', lambda: soi_mouth('ซอยสุทธิพร 2', 'ถนนดินแดง')),
]

rows = []
for spot, method, conf, fn in SPOTS:
    if fn is None:
        rows.append({'spot': spot, 'lat': '', 'lng': '', 'method': method, 'confidence': conf, 'snap_m': ''})
        print(f'  – {spot}: ไม่วางบนแผนที่')
        continue
    lat, lon, d = fn()
    if d > 100 and conf == 'สูง':
        conf = 'ปานกลาง'  # จุดอ้างอิงอยู่ห่างถนนเกิน 100 ม. ลดความมั่นใจ
    rows.append({'spot': spot, 'lat': round(lat, 6), 'lng': round(lon, 6), 'method': method, 'confidence': conf, 'snap_m': round(d)})
    print(f'  · {spot}: {lat:.6f}, {lon:.6f}  (ห่างจุดอ้างอิง {d:.0f} ม., ความมั่นใจ{conf})')

with OUT.open('w', encoding='utf-8-sig', newline='') as f:
    w = csv.DictWriter(f, fieldnames=list(rows[0]))
    w.writeheader()
    w.writerows(rows)
print(f'\n✓ เขียน {OUT.relative_to(ROOT)}')
