"""
เตรียมข้อมูลแผนที่ดินแดง → src/data/map.json (วิธีตาม แนวคิด_แผนที่และheatmap_จุดเสี่ยง.md)

รัน:  npm run map      (หรือ python3 -I data/scripts/build_map.py)

ไฟล์ต้นทาง (data/raw/map/)
- osm_boundary_dindaeng.json : ขอบเขตเขตดินแดง OSM relation 2938031 (Overpass, ODbL)
- osm_roads_schools.json     : ถนนสายหลัก (motorway/trunk/primary/secondary) และโรงเรียน (amenity=school) ในเขต
- risk_areas_bma_2567_2568.csv : บัญชีพื้นที่เสี่ยงและพื้นที่อันตราย กทม. สำนักเทศกิจ (data.bangkok.go.th ชุด ced48, encoding cp874)
- bangkok_districts.geojson    : เส้นเขต 50 เขตกรุงเทพฯ จาก chingchai/OpenGISData-Thailand (CC BY 4.0) ตัดเฉพาะ pro_code 10
- worldpop_5_19_dindaeng.json  : ประชากรอายุ 5–19 ปี (WorldPop 2020 Constrained Age/Sex, ตาราง ~100 ม.)
                                 ตัดจากไฟล์ประเทศไทย 6 ไฟล์ (tha_{f,m}_{5,10,15}_2020_constrained.tif) รวมกัน
                                 ไฟล์ใหญ่ไม่เก็บใน repo · ดาวน์โหลดได้จาก data.worldpop.org

ขั้นตอน
1. ต่อเส้นขอบเขต (stitch) ให้เป็นวงปิด
2. แปลง lat/lon → เมตร (equirectangular เฉพาะพื้นที่) → px ใน viewBox กว้าง W
3. จุดเสี่ยง: กรองดินแดง ปี 2567+2568 ตรวจให้ได้ 17 จุด และตรวจจำนวนทุกเขตให้ตรงกับดัชนี
   เรียงหมายเลขเหนือ→ใต้ เลื่อนหมุดที่ทับกัน (มีเส้นโยงไปตำแหน่งจริง)
4. ถนน: ตัดให้อยู่ใน bbox ของเขต เก็บเป็น path · หาจุดวางชื่อถนนที่อยู่ในเขต
ถ้าตรวจไม่ผ่านจะไม่เขียนไฟล์
"""
import csv
import io
import json
import math
import sys
from collections import Counter
from pathlib import Path

import openpyxl

ROOT = Path(__file__).resolve().parents[2]
RAW = ROOT / 'data' / 'raw' / 'map'
OUT = ROOT / 'src' / 'data' / 'map.json'
W = 800  # ความกว้าง viewBox (px)
PAD = 24
PIN = 22  # รัศมีหมุด (px ใน viewBox) ใช้คำนวณการทับกัน
ERRORS = []


def check(label, got, want):
    ok = got == want
    print(f"  {'✓' if ok else '✗'} {label}: {got}" + ('' if ok else f'  (ควรเป็น {want})'))
    if not ok:
        ERRORS.append(label)


# ---------- 1. ขอบเขต ----------
print('1) ขอบเขตเขตดินแดง (OSM)')
rel = json.loads((RAW / 'osm_boundary_dindaeng.json').read_text())['elements'][0]
check('ชื่อ relation', rel['tags'].get('name'), 'เขตดินแดง')
segs = [[(p['lon'], p['lat']) for p in m['geometry']] for m in rel['members'] if m['type'] == 'way' and m['role'] == 'outer']
ring = segs.pop(0)
while segs:
    end = ring[-1]
    for i, s in enumerate(segs):
        if s[0] == end:
            ring += s[1:]
        elif s[-1] == end:
            ring += s[::-1][1:]
        else:
            continue
        segs.pop(i)
        break
    else:
        ERRORS.append('ต่อเส้นขอบเขตไม่ครบวง')
        break
check('ขอบเขตปิดวง', ring[0] == ring[-1], True)

lat0 = sum(p[1] for p in ring) / len(ring)
KX, KY = 111_320 * math.cos(math.radians(lat0)), 110_540


def to_m(lon, lat):
    return lon * KX, -lat * KY


mxs, mys = zip(*[to_m(*p) for p in ring])
x0, x1, y0, y1 = min(mxs), max(mxs), min(mys), max(mys)
S = (W - 2 * PAD) / (x1 - x0)  # px ต่อเมตร
H = round((y1 - y0) * S + 2 * PAD)


def to_px(lon, lat):
    mx, my = to_m(lon, lat)
    return round((mx - x0) * S + PAD, 1), round((my - y0) * S + PAD, 1)


ring_px = [to_px(*p) for p in ring]


def path_d(pts, close=False):
    d = 'M' + ' L'.join(f'{x},{y}' for x, y in pts)
    return d + (' Z' if close else '')


def inside(x, y, poly=ring_px):
    c = False
    for (xa, ya), (xb, yb) in zip(poly, poly[1:] + poly[:1]):
        if (ya > y) != (yb > y) and x < (xb - xa) * (y - ya) / (yb - ya) + xa:
            c = not c
    return c


area_km2 = abs(sum(xa * yb - xb * ya for (xa, ya), (xb, yb) in zip(ring_px, ring_px[1:]))) / 2 / S ** 2 / 1e6
print(f'  · พื้นที่จากขอบเขต ≈ {area_km2:.2f} ตร.กม. (ทางการราว 8.35) · viewBox {W}×{H} · {S:.4f} px/ม.')
check('พื้นที่ใกล้ 8.35 ตร.กม. (±0.5)', abs(area_km2 - 8.35) < 0.5, True)

# ---------- 2. ถนน ----------
print('2) ถนนสายหลักและโรงเรียน (OSM)')
osm = json.loads((RAW / 'osm_roads_schools.json').read_text())['elements']
ROAD_RANK = {'motorway': 0, 'trunk': 1, 'primary': 2, 'secondary': 3, 'tertiary': 4}
# เพิ่มถนนรองที่มีจุดท่วม (ประชาสุข ประชาสงเคราะห์ช่วงใต้ เทียมร่วมมิตร) จาก osm_flood_refs.json
refs = json.loads((RAW / 'osm_flood_refs.json').read_text())['elements']
EXTRA = ('ถนนประชาสุข', 'ถนนประชาสงเคราะห์', 'ถนนเทียมร่วมมิตร')
seen_ids = {e['id'] for e in osm if e['type'] == 'way'}
extra = [e for e in refs if e['tags'].get('name') in EXTRA and e['id'] not in seen_ids
         and e['tags'].get('highway') in ('tertiary', 'secondary', 'residential', 'unclassified')]
for e in extra:
    e['tags'] = {**e['tags'], 'highway': 'tertiary'}
roads, label_cand = [], {}
for e in osm + extra:
    t = e.get('tags', {})
    if e['type'] != 'way' or t.get('highway') not in ROAD_RANK or 'geometry' not in e:
        continue
    pts = [to_px(p['lon'], p['lat']) for p in e['geometry']]
    if not any(-50 < x < W + 50 and -50 < y < H + 50 for x, y in pts):
        continue
    name = t.get('name')
    roads.append({'kind': t['highway'], 'name': name, 'd': path_d(pts)})
    if name and t['highway'] != 'motorway':
        inner = [(x, y) for x, y in pts if inside(x, y)]
        if len(inner) >= 2:
            length = sum(math.dist(a, b) for a, b in zip(inner, inner[1:]))
            if length > label_cand.get(name, (0,))[0]:
                (xa, ya), (xb, yb) = inner[len(inner) // 2 - 1], inner[len(inner) // 2]
                ang = math.degrees(math.atan2(yb - ya, xb - xa))
                if ang > 90: ang -= 180
                if ang < -90: ang += 180
                label_cand[name] = (length, round((xa + xb) / 2, 1), round((ya + yb) / 2, 1), round(ang, 1))
roads.sort(key=lambda r: -ROAD_RANK[r['kind']])  # วาดเส้นเล็กก่อน เส้นใหญ่ทับ
road_labels = [{'name': n.replace('ถนน', 'ถ.'), 'x': x, 'y': y, 'angle': a}
               for n, (L, x, y, a) in sorted(label_cand.items(), key=lambda kv: -kv[1][0]) if L > 60]
print(f'  · ถนน {len(roads)} เส้น · ป้ายชื่อ {len(road_labels)}: {[r["name"] for r in road_labels]}')

# โรงเรียนเอกชน (ผู้ใช้ยืนยันสังกัดเอง 12 พ.ย. จากเว็บโรงเรียน/ฐานข้อมูล สช.) · ที่เหลือยังไม่ได้แยกสังกัด
PRIVATE_SCHOOLS = {'โรงเรียนนิธิปริญญา', 'โรงเรียนอำนวยพิทยา', 'โรงเรียนจำนงค์พิทยา', 'โรงเรียนแม่พระฟาติมา'}

schools = []
for e in osm:
    t = e.get('tags', {})
    if t.get('amenity') != 'school':
        continue
    c = e.get('center') or {'lat': e.get('lat'), 'lon': e.get('lon')}
    x, y = to_px(c['lon'], c['lat'])
    if not inside(x, y):
        continue
    name = t.get('name') or t.get('name:en') or '(ไม่มีชื่อ)'
    schools.append({'name': name, 'x': x, 'y': y, 'lat': c['lat'], 'lng': c['lon'], 'osm': f"{e['type']}/{e['id']}",
                    'private': name in PRIVATE_SCHOOLS})
print(f'  · โรงเรียนใน OSM ภายในขอบเขต {len(schools)} แห่ง (ดัชนีนับ 8 แห่ง)')
check('โรงเรียนเอกชนที่ยืนยันแล้วอยู่บนแผนที่ครบ', sorted(x['name'] for x in schools if x['private']), sorted(PRIVATE_SCHOOLS))

# ---------- 3. จุดเสี่ยง ----------
print('3) จุดเสี่ยง (สำนักเทศกิจ)')
raw = (RAW / 'risk_areas_bma_2567_2568.csv').read_bytes()
for enc in ('utf-8-sig', 'cp874'):
    try:
        text = raw.decode(enc)
        break
    except UnicodeDecodeError:
        continue
rows = [r for r in csv.DictReader(io.StringIO(text)) if r['AFiscalYeal'] in ('2567', '2568')]
fix = lambda s: s.replace('ราษฏร์', 'ราษฎร์').strip()
by_dist = Counter(fix(r['AreaDist']) for r in rows)
x = openpyxl.load_workbook(ROOT / 'data' / 'raw' / 'visual_data_dindaeng.xlsx', data_only=True)['5_จุดเสี่ยงอาชญากรรม']
idx = {fix(r[0]): int(r[1]) for r in x.iter_rows(min_row=2, values_only=True) if r[0] and isinstance(r[1], (int, float)) and not str(r[0]).startswith(('ค่า', 'ที่มา'))}
mismatch = {k: (by_dist.get(k), v) for k, v in idx.items() if by_dist.get(k) != v}
check('จำนวนจุดเสี่ยงทั้ง 50 เขตตรงกับดัชนี', len(idx) == 50 and not mismatch, True)
if mismatch:
    print('     ไม่ตรง (บัญชี, ดัชนี):', mismatch)

dd = [r for r in rows if fix(r['AreaDist']) == 'ดินแดง']
check('ดินแดง ปี 2567', sum(r['AFiscalYeal'] == '2567' for r in dd), 10)
check('ดินแดง ปี 2568', sum(r['AFiscalYeal'] == '2568' for r in dd), 7)
types = Counter(r['AGroup'].strip() for r in dd)
check('ประเภท จุดล่อแหลมต่อการเกิดอาชญากรรม', types['จุดล่อแหลมต่อการเกิดอาชญากรรม'], 10)
check('ประเภท ประชากรหนาแน่น/พลุกพล่าน', types['ประชากรหนาแน่น/พลุกพล่าน'], 5)

dd.sort(key=lambda r: -float(r['ALatitude']))  # เหนือ → ใต้
points, placed = [], []
OFFS = [(0, 0)] + [(math.cos(a) * d, math.sin(a) * d) for d in (2 * PIN + 2, 3 * PIN + 4, 4 * PIN + 6)
                   for a in [math.radians(t) for t in (0, 180, 270, 90, 315, 225, 45, 135)]]
for i, r in enumerate(dd, 1):
    lat, lng = float(r['ALatitude']), float(r['ALongitude'])
    px, py = to_px(lng, lat)
    if not inside(px, py):
        ERRORS.append(f'จุด {r["AName"]} อยู่นอกขอบเขต')
    for dx, dy in OFFS:
        lx, ly = round(px + dx, 1), round(py + dy, 1)
        if all(math.dist((lx, ly), q) >= 2 * PIN for q in placed):
            break
    placed.append((lx, ly))
    points.append({
        'no': i, 'name': r['AName'].strip(), 'year': int(r['AFiscalYeal']),
        'type': r['AGroup'].strip(), 'place': r['characteristics'].strip(), 'placeType': r['AType'].strip(),
        'police': r['APoliceStation'].strip(), 'lat': lat, 'lng': lng,
        'x': px, 'y': py, 'pinX': lx, 'pinY': ly, 'moved': (lx, ly) != (px, py),
    })
moved = sum(p['moved'] for p in points)
print(f'  · หมุดที่ต้องเลื่อนเพราะทับกัน {moved} จุด (มีเส้นโยงไปตำแหน่งจริง)')

# สถานที่เดียวกันที่อยู่ทั้ง 2 ปี (ห่างกันไม่เกิน 120 ม.)
for p in points:
    p['repeatOf'] = next((q['no'] for q in points if q['year'] != p['year'] and q['no'] < p['no']
                          and math.dist((p['x'], p['y']), (q['x'], q['y'])) / S < 120), None)
print(f'  · จุดที่น่าจะเป็นสถานที่เดิมซ้ำ 2 ปี: {[(p["no"], p["repeatOf"]) for p in points if p["repeatOf"]]}')

# ---------- 4. จุดท่วมซ้ำซาก (พิกัดโดยประมาณ) ----------
print('4) จุดท่วมซ้ำซาก (พิกัดโดยประมาณจาก geocode_flood.py)')
with open(ROOT / 'data' / 'raw' / 'dindaeng_flood_hotspots_2568.csv', encoding='utf-8-sig') as f:
    hs = {r['จุด']: r for r in csv.DictReader(f)}
with open(RAW / 'flood_hotspots_coords.csv', encoding='utf-8-sig') as f:
    coords = list(csv.DictReader(f))
check('ชื่อจุดท่วมตรงกับไฟล์จุดท่วม', sorted(c['spot'] for c in coords) == sorted(hs), True)
flood_pts = []
for c in coords:
    h = hs[c['spot']]
    item = {'spot': c['spot'], 'count': int(h['ครั้งที่ท่วม 2568']), 'levelMax': int(h['ระดับน้ำสูงสุด (ซม.)']),
            'dryAvg': int(h['เวลาแห้งเฉลี่ย (นาที)']), 'method': c['method'], 'confidence': c['confidence']}
    if c['lat']:
        lat, lng = float(c['lat']), float(c['lng'])
        fx, fy = to_px(lng, lat)
        near_edge = not inside(fx, fy)
        item.update({'lat': lat, 'lng': lng, 'x': fx, 'y': fy, 'onBoundary': near_edge})
        if near_edge:
            print(f"  · {c['spot']} อยู่บน/นอกแนวเขตเล็กน้อย (ถนนแนวเขต) ยังวางไว้")
    flood_pts.append(item)
flood_pts.sort(key=lambda p: -p['count'])
print(f"  · วางบนแผนที่ {sum('x' in p for p in flood_pts)} จุด รวม {sum(p['count'] for p in flood_pts if 'x' in p)} จาก {sum(p['count'] for p in flood_pts)} ครั้ง")

# ---------- 5. ความหนาแน่นเด็กอายุ 5–19 ปี (WorldPop) ----------
print('5) ประชากรเด็ก 5–19 ปี (WorldPop 2020)')
wp = json.loads((RAW / 'worldpop_5_19_dindaeng.json').read_text())
cell, lon_o, lat_o = wp['cell'], wp['origin']['lon'], wp['origin']['lat']
kids_cells, kids_inside = [], 0.0
for r, row in enumerate(wp['values']):
    for c, v in enumerate(row):
        if v <= 0:
            continue
        xa, ya = to_px(lon_o + c * cell, lat_o - r * cell)  # มุมซ้ายบนของช่อง
        xb, yb = to_px(lon_o + (c + 1) * cell, lat_o - (r + 1) * cell)
        cx, cy = (xa + xb) / 2, (ya + yb) / 2
        if inside(cx, cy):
            kids_inside += v
        if -50 < cx < W + 50 and -50 < cy < H + 50:  # เก็บช่องรอบเขตด้วย แผนที่จะตัดขอบให้เอง
            kids_cells.append([round(xa, 1), round(ya, 1), round(xb - xa, 1), round(yb - ya, 1), round(v, 1)])
kids_max = max(c[4] for c in kids_cells)
print(f'  · เด็ก 5–19 ปีในเขต (ประมาณ) {kids_inside:,.0f} คน · ช่องละสูงสุด {kids_max:.0f} คน · {len(kids_cells)} ช่อง')
check('เด็ก 5–19 ปีในเขตอยู่ในช่วงที่สมเหตุสมผล (5,000–30,000)', 5000 < kids_inside < 30000, True)

# ---------- 6. แผนที่กรุงเทพฯ 50 เขต (ใช้ในสไลด์ 1) ----------
print('6) แผนที่กรุงเทพฯ 50 เขต')
bk = json.loads((RAW / 'bangkok_districts.geojson').read_text())['features']
check('จำนวนเขตกรุงเทพฯ', len(bk), 50)
allpts = [pt for f in bk for poly in f['geometry']['coordinates'] for ringc in poly for pt in ringc]
blat0 = sum(p[1] for p in allpts) / len(allpts)
bkx = math.cos(math.radians(blat0))
bx0, bx1 = min(p[0] for p in allpts) * bkx, max(p[0] for p in allpts) * bkx
by0, by1 = -max(p[1] for p in allpts), -min(p[1] for p in allpts)
BW, BPAD = 800, 8
bS = (BW - 2 * BPAD) / (bx1 - bx0)
BH = round((by1 - by0) * bS + 2 * BPAD)


def bpx(lon, lat):
    return round((lon * bkx - bx0) * bS + BPAD, 1), round((-lat - by0) * bS + BPAD, 1)


bkk_districts = []
for f in bk:
    d = ''
    sx = sy = n = 0
    for poly in f['geometry']['coordinates']:
        for ringc in poly:
            pts = [bpx(*pt) for pt in ringc]
            d += 'M' + ' L'.join(f'{x},{y}' for x, y in pts) + ' Z '
            for x, y in pts:
                sx, sy, n = sx + x, sy + y, n + 1
    bkk_districts.append({'name': f['properties']['amp_th'], 'd': d.strip(), 'cx': round(sx / n, 1), 'cy': round(sy / n, 1)})
print(f'  · viewBox {BW}×{BH} · {sum(len(x["d"]) for x in bkk_districts) / 1024:.0f} KB path')

if ERRORS:
    print(f'\n✗ ตรวจไม่ผ่าน {len(ERRORS)} รายการ: {ERRORS}\n  ไม่ได้เขียน {OUT.name}')
    sys.exit(1)

OUT.write_text(json.dumps({
    'viewBox': [0, 0, W, H],
    'pxPerM': round(S, 6),
    'credit': 'แผนที่ฐาน © OpenStreetMap contributors (ODbL)',
    'boundary': path_d(ring_px, close=True),
    'roads': roads,
    'roadLabels': road_labels,
    'risk': {
        'source': 'บัญชีพื้นที่เสี่ยงและพื้นที่อันตราย กทม. สำนักเทศกิจ (data.bangkok.go.th) ปีงบประมาณ 2567–2568',
        'note': 'พื้นที่ที่หน่วยงานขึ้นบัญชีเฝ้าระวัง ไม่ใช่จุดเกิดคดี · บางสถานที่อยู่ในบัญชีทั้ง 2 ปี',
        'types': [{'type': t, 'count': c} for t, c in types.most_common()],
        'points': points,
    },
    'flood': {
        'note': 'ตำแหน่งโดยประมาณ หาจากชื่อถนน/ซอย/สถานที่อ้างอิงใน OSM (ข้อมูลต้นทางไม่มีพิกัด) · 1 จุดไม่ระบุตำแหน่ง',
        'points': flood_pts,
    },
    'bangkok': {
        'source': 'เส้นเขต: OpenGISData-Thailand (chingchai) CC BY 4.0',
        'viewBox': [0, 0, BW, BH],
        'districts': bkk_districts,
    },
    'kids': {
        'source': 'WorldPop 2020 Constrained Age/Sex structures · อายุ 5–19 ปี · ตาราง ~100 ม. (data.worldpop.org)',
        'note': 'ประมาณการจากแบบจำลอง ไม่ใช่ที่อยู่นักเรียนจริง · ปี 2020 (2563)',
        'total': round(kids_inside),
        'max': round(kids_max, 1),
        'cells': kids_cells,  # [x, y, w, h, คน]
    },
    'schools': {
        'note': 'จาก OSM (amenity=school) · private = โรงเรียนเอกชนที่ยืนยันแล้ว 4 แห่ง ที่เหลือยังไม่แยก กทม./สพฐ.',
        'items': schools,
    },
}, ensure_ascii=False, indent=1), encoding='utf-8')
print(f'\n✓ ผ่านทั้งหมด · เขียน {OUT.relative_to(ROOT)} ({OUT.stat().st_size / 1024:.1f} KB)')
