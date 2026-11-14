"""
แปลงข้อมูลดิบใน data/raw/ เป็น JSON ใน src/data/ (PRD 8.3)

รัน:  npm run data      (หรือ python3 -I data/scripts/build_data.py)

สิ่งที่ script นี้ทำ
1. อ่าน Bangkok Index 2025 ฉบับทางการ (คะแนน 16 หัวข้อ × 50 เขต) เป็นแกนหลัก
2. อ่านค่าดิบจาก xlsx/csv ของกลุ่ม แล้วแก้ปัญหาที่ตรวจพบ
   - สะกด "ราษฏร์บูรณะ" → "ราษฎร์บูรณะ"
   - ไฟล์ BOD ชื่อเขตเลื่อน 2 แถว: ค่าที่เขียน "ธนบุรี" เป็นของทุ่งครุ, ค่าที่เขียน "นนทบุรี" เป็นของธนบุรี
   - ไฟล์จุดตรวจคุณภาพน้ำ (waterquality) คอลัมน์ "ดินแดง" คือพื้นที่บริการโรงบำบัด จึงเลือกจุดด้วยพิกัดในขอบเขตเขตแทน
3. ตรวจว่าทุกชุดมีครบ 50 เขตชื่อตรงกัน และค่าดิบให้คะแนนตรงกับดัชนีทางการ
4. ตรวจตัวเลขหลักให้ตรงกับ ข้อมูลรวม_ตรวจแล้ว.md ถ้าไม่ตรงจะหยุดทันที (ไม่เขียน JSON)

ห้ามแก้ไฟล์ใน src/data/ ด้วยมือ ให้แก้ที่นี่แล้วรันใหม่
"""
import csv
import math
import json
import statistics as st
import sys
from pathlib import Path

import openpyxl

ROOT = Path(__file__).resolve().parents[2]
RAW = ROOT / 'data' / 'raw'
OUT = ROOT / 'src' / 'data'

DD, PT = 'ดินแดง', 'ปทุมวัน'
ERRORS = []


# ---------- เครื่องมือ ----------
def fix_name(s):
    return str(s).replace('ราษฏร์', 'ราษฎร์').strip()


def check(label, got, want, tol=0.005):
    ok = abs(got - want) <= tol if isinstance(want, (int, float)) else got == want
    print(f"  {'✓' if ok else '✗'} {label}: {got}" + ('' if ok else f'  (ควรเป็น {want})'))
    if not ok:
        ERRORS.append(label)


def r2(x, n=2):
    return None if x is None else round(float(x), n)


def read_csv(name):
    with open(RAW / name, encoding='utf-8-sig') as f:
        return list(csv.DictReader(f))


def sheet_rows(wb, name, min_row=2):
    return [r for r in wb[name].iter_rows(min_row=min_row, values_only=True) if any(c is not None for c in r)]


def rank_desc(values, v):
    """อันดับแบบดัชนี (มากสุด = 1, ค่าเท่ากันได้อันดับเดียวกัน)"""
    return sorted(values, reverse=True).index(v) + 1


def spearman(x, y):
    def ranks(v):
        order = sorted(range(len(v)), key=lambda i: v[i])
        r = [0.0] * len(v)
        i = 0
        while i < len(v):
            j = i
            while j + 1 < len(v) and v[order[j + 1]] == v[order[i]]:
                j += 1
            for k in range(i, j + 1):
                r[order[k]] = (i + j) / 2 + 1
            i = j + 1
        return r

    rx, ry = ranks(x), ranks(y)
    mx, my = st.mean(rx), st.mean(ry)
    num = sum((a - mx) * (b - my) for a, b in zip(rx, ry))
    den = (sum((a - mx) ** 2 for a in rx) * sum((b - my) ** 2 for b in ry)) ** 0.5
    return num / den


def minmax_inv(x, lo, hi):
    """คะแนน 1–50 แบบดัชนี 2025 สำหรับตัวชี้วัดที่ 'น้อยดี'"""
    return 1 + 49 * (hi - x) / (hi - lo)


PENDING = {}


def write(name, data):
    """เก็บไว้ก่อน จะเขียนลงไฟล์จริงตอนท้ายเมื่อตรวจผ่านทั้งหมด"""
    PENDING[name] = data


# ---------- 1. ดัชนีทางการ ----------
print('1) Bangkok Index 2025 ฉบับทางการ')
off = openpyxl.load_workbook(RAW / 'bangkok_index_2025_official.xlsx', data_only=True)
DIMS = [('public', 'ด้านบริการสาธารณะ', 'บริการสาธารณะ'), ('economy', 'ด้านเศรษฐกิจ', 'เศรษฐกิจ'),
        ('welfare', 'ด้านสวัสดิภาพ', 'สวัสดิภาพ'), ('environment', 'ด้านสิ่งแวดล้อม', 'สิ่งแวดล้อม')]
TOPIC_KEYS = {
    'สาธารณสุข': 'health', 'ขนส่งสาธารณะ': 'transit', 'การศึกษา': 'education', 'คุณภาพชีวิต': 'quality',
    'งบประมาณรายเขต': 'budget', 'รายได้จากการจัดเก็บภาษี': 'tax', 'การจดทะเบียนธุรกิจ': 'business',
    'สถานประกอบการอาหาร': 'food', 'อัคคีภัย': 'fire', 'อุทกภัย': 'flood',
    'จุดเสี่ยงอาชญากรรม': 'crime', 'อุบัติเหตุบนท้องถนน': 'accident',
    'ขยะ': 'waste', 'น้ำเสีย': 'wastewater', 'อากาศ': 'air', 'สวนสาธารณะ': 'parks',
}
topics_meta, scores = [], {}
for key, sheet, label in DIMS:
    rows = [r for r in off[sheet].iter_rows(values_only=True) if any(c is not None for c in r)]
    names = [rows[0][i] for i in (3, 5, 7, 9)]
    for n in names:
        topics_meta.append({'key': TOPIC_KEYS[n], 'label': n, 'dim': key})
    for r in rows[2:]:
        d = scores.setdefault(fix_name(r[1]), {})
        for n, i in zip(names, (4, 6, 8, 10)):
            d[TOPIC_KEYS[n]] = r[i]

DISTRICTS = sorted(scores)
check('จำนวนเขตในดัชนี', len(DISTRICTS), 50)
TOPICS = [t['key'] for t in topics_meta]
DIM_TOPICS = {k: [t['key'] for t in topics_meta if t['dim'] == k] for k, _, _ in DIMS}


def overall_of(sc):
    dims = {k: sum(sc[t] for t in ts) / 4 for k, ts in DIM_TOPICS.items()}
    return sum(dims.values()) / 4, dims


def table_from(scores_map):
    out = {}
    for n, sc in scores_map.items():
        o, dims = overall_of(sc)
        out[n] = {'overall': o, 'dims': dims, 'topics': sc}
    return out


TBL = table_from(scores)
ov = [TBL[n]['overall'] for n in DISTRICTS]
check('คะแนนรวมดินแดง', r2(TBL[DD]['overall']), 17.35)
check('อันดับดินแดง', rank_desc(ov, TBL[DD]['overall']), 50)
check('คะแนนรวมปทุมวัน', r2(TBL[PT]['overall']), 32.03)

districts_out = []
for n in DISTRICTS:
    t = TBL[n]
    districts_out.append({
        'name': n,
        'overall': r2(t['overall'], 4),
        'rank': rank_desc(ov, t['overall']),
        'dims': {k: {'score': r2(v, 4), 'rank': rank_desc([TBL[m]['dims'][k] for m in DISTRICTS], v)}
                 for k, v in t['dims'].items()},
        'topics': {k: {'score': r2(v, 4), 'rank': rank_desc([TBL[m]['topics'][k] for m in DISTRICTS], v)}
                   for k, v in t['topics'].items()},
    })
districts_out.sort(key=lambda d: d['rank'])
dd_out = next(d for d in districts_out if d['name'] == DD)
for k, want in [('public', 31), ('economy', 36), ('welfare', 46), ('environment', 44)]:
    check(f'อันดับด้าน {k} ของดินแดง', dd_out['dims'][k]['rank'], want)
for k, want in [('air', 8), ('accident', 11), ('transit', 11)]:
    check(f'จุดแข็ง {k}', dd_out['topics'][k]['rank'], want)

write('index', {
    'source': 'Bangkok Index 2025 – Rocket Media Lab (ข้อมูลดิบ เผยแพร่ 25 พ.ค. 2026)',
    'dims': [{'key': k, 'label': lab} for k, _, lab in DIMS],
    'topics': topics_meta,
    'medians': {
        'overall': r2(st.median(ov), 4),
        'dims': {k: r2(st.median([TBL[n]['dims'][k] for n in DISTRICTS]), 4) for k in DIM_TOPICS},
        'topics': {k: r2(st.median([TBL[n]['topics'][k] for n in DISTRICTS]), 4) for k in TOPICS},
    },
    'districts': districts_out,
})


def assert_names(label, names):
    names = set(names)
    missing, extra = set(DISTRICTS) - names, names - set(DISTRICTS)
    check(f'{label}: ชื่อเขตตรงกับดัชนี', not missing and not extra, True)
    if missing or extra:
        print('     ขาด:', missing, ' เกิน:', extra)


# ---------- 2. งบประมาณ ----------
print('2) งบประมาณเขต 2568')
x = openpyxl.load_workbook(RAW / 'visual_data_dindaeng.xlsx', data_only=True)
b7 = sheet_rows(x, '7_โครงสร้างงบ_2568')
cats = [r for r in b7 if isinstance(r[1], (int, float)) and r[0] not in ('รวม', 'ประชากร', 'งบต่อหัว (บาท/คน)')]
tot = next(r for r in b7 if r[0] == 'รวม')
pop = next(r for r in b7 if r[0] == 'ประชากร')
check('ผลรวมหมวดงบดินแดง', sum(r[1] for r in cats), tot[1])
check('ผลรวมหมวดงบปทุมวัน', sum(r[3] for r in cats), tot[3])
pc_dd, pc_pt = tot[1] / pop[1], tot[3] / pop[3]
check('งบต่อหัวดินแดง', round(pc_dd), 3426)
check('งบต่อหัวปทุมวัน', round(pc_pt), 8382)
drain_share = next(r for r in cats if r[0].startswith('ระบายน้ำ'))[2]
check('สัดส่วนงบระบายน้ำดินแดง (%)', r2(drain_share * 100, 1), 2.2)
b8 = [r for r in sheet_rows(x, '8_งบระบายน้ำดินแดง_2568') if isinstance(r[1], (int, float)) and not str(r[0]).startswith('รวม')]
write('budget', {
    'source': 'ข้อบัญญัติงบประมาณ กทม. 2568 (ไฟล์ 68002)',
    'year': 2568,
    'districts': {
        DD: {'total': tot[1], 'population': pop[1], 'perCapita': round(pc_dd, 2)},
        PT: {'total': tot[3], 'population': pop[3], 'perCapita': round(pc_pt, 2)},
    },
    'perCapitaRatio': r2(pc_pt / pc_dd),
    'categories': [{'name': r[0], DD: r[1], f'{DD}_pct': r2(r[2] * 100, 2), PT: r[3], f'{PT}_pct': r2(r[4] * 100, 2)} for r in cats],
    'drainageParts': [{'name': r[0], 'baht': r[1], 'pct': r2(r[2] * 100, 1)} for r in b8],
})

# ---------- 3. น้ำท่วม ----------
print('3) น้ำท่วม')
fl = read_csv('flood_2568_bangkok_50districts.csv')
fl_rows = [{'name': fix_name(r['เขต']), 'floods': int(r['จำนวนครั้งน้ำท่วมขัง 2568']),
            'drainBudget': int(r['งบงานระบายน้ำของสำนักงานเขต 2568 (บาท)']),
            'totalBudget': int(r['งบรวมสำนักงานเขต 2568 (บาท)'])} for r in fl]
assert_names('น้ำท่วม', [r['name'] for r in fl_rows])
fmax, fmin = max(r['floods'] for r in fl_rows), min(r['floods'] for r in fl_rows)
check('สูตรคะแนนน้ำท่วมตรงกับดัชนี (คลาดสูงสุด)',
      r2(max(abs(minmax_inv(r['floods'], fmin, fmax) - scores[r['name']]['flood']) for r in fl_rows), 3), 0, 0.001)
for r in fl_rows:
    r['floodRank'] = rank_desc([q['floods'] for q in fl_rows], r['floods'])
    r['budgetRank'] = rank_desc([q['drainBudget'] for q in fl_rows], r['drainBudget'])
dd_fl = next(r for r in fl_rows if r['name'] == DD)
check('ดินแดงท่วม (ครั้ง)', dd_fl['floods'], 41)
check('อันดับท่วมดินแดง', dd_fl['floodRank'], 2)
check('อันดับงบระบายน้ำดินแดง', dd_fl['budgetRank'], 31)
med_b = st.median(r['drainBudget'] for r in fl_rows)
check('มัธยฐานงบระบายน้ำ (ล้าน)', r2(med_b / 1e6), 11.14)
zero = [r for r in fl_rows if r['floods'] == 0]
cut = sorted((r['floods'] for r in fl_rows), reverse=True)[9]  # ค่าที่อันดับ 10 แล้วรวมทุกเขตที่เสมอ
top = [r for r in fl_rows if r['floods'] >= cut]
check('จำนวนเขตที่ไม่ท่วม', len(zero), 11)
check('งบรวมเขตที่ไม่ท่วม (ล้าน)', r2(sum(r['drainBudget'] for r in zero) / 1e6, 1), 347.9)
check('จำนวนเขตท่วมบ่อยสุด (รวมที่เสมอ)', len(top), 11)
check('งบรวมเขตท่วมบ่อยสุด (ล้าน)', r2(sum(r['drainBudget'] for r in top) / 1e6, 1), 188.5)
rho = spearman([r['floods'] for r in fl_rows], [r['drainBudget'] for r in fl_rows])
check('Spearman ρ', r2(rho, 3), 0.006, 0.001)

ev = read_csv('dindaeng_flood_events_2568.csv')
events = []
for r in ev:
    m, d, y = map(int, r['วันที่ (ค.ศ. ด/ว/ป)'].split('/'))
    road = r['ถนน']
    if r['จุด'].startswith('ประชาสุข') and road == 'ถนนรัชดาภิเษก':
        road = 'ถนนประชาสุข'  # แก้แถวที่พิมพ์ผิด (20/5/2025)
    events.append({'date': f'{y:04d}-{m:02d}-{d:02d}', 'spot': r['จุด'], 'road': road,
                   'levelMin': int(r['ระดับน้ำต่ำสุด (ซม.)']), 'levelMax': int(r['ระดับน้ำสูงสุด (ซม.)']),
                   'dryMin': int(r['เวลาแห้ง (นาที)']), 'rain': float(r['ฝนรวม (มม.)'])})
# วันละ 1 แถว · ฝนเป็นค่าเดียวของทั้งวัน (ทุกจุดในวันเดียวกันใช้ค่าฝนเดียวกัน)
# events = จำนวนครั้งที่ท่วมในวันนั้น · spots = จำนวนจุดที่ท่วม (จุดเดียวท่วมได้หลายครั้งในวันเดียว)
days = {}
for e in events:
    d = days.setdefault(e['date'], {'date': e['date'], 'rain': e['rain'], 'events': 0, 'spotNames': set()})
    d['events'] += 1
    d['spotNames'].add(e['spot'])
    if d['rain'] != e['rain']:
        ERRORS.append(f"ฝนในวันเดียวกันไม่เท่ากัน {e['date']}")
days = [{'date': d['date'], 'rain': d['rain'], 'events': d['events'], 'spots': len(d['spotNames'])}
        for d in sorted(days.values(), key=lambda d: d['date'])]
check('วันที่ท่วม (วัน)', len(days), 12)
check('ผลรวมครั้งที่ท่วมรายวัน', sum(d['events'] for d in days), 41)
check('จำนวนเหตุการณ์', len(events), 41)
check('ฝนเฉลี่ยต่อวันที่ท่วม (มม.)', r2(st.mean(d['rain'] for d in days), 1), 59.2)
check('เวลาท่วมรวม (ชม.)', round(sum(e['dryMin'] for e in events) / 60), 71)
check('เวลาแห้งเฉลี่ย (นาที)', round(st.mean(e['dryMin'] for e in events)), 104)

hs = read_csv('dindaeng_flood_hotspots_2568.csv')
hotspots = [{'spot': r['จุด'], 'count': int(r['ครั้งที่ท่วม 2568']), 'levelMax': int(r['ระดับน้ำสูงสุด (ซม.)']),
             'dryAvg': int(r['เวลาแห้งเฉลี่ย (นาที)']), 'rainAvg': float(r['ฝนเฉลี่ยวันที่ท่วม (มม.)']),
             'lat': float(r['ละติจูด (ใส่เอง)']) if r['ละติจูด (ใส่เอง)'] else None,
             'lng': float(r['ลองจิจูด (ใส่เอง)']) if r['ลองจิจูด (ใส่เอง)'] else None} for r in hs]
check('ผลรวมครั้งจากจุดท่วม', sum(h['count'] for h in hotspots), 41)

# บัญชีจุดเสี่ยงน้ำท่วม กทม. 737 จุด (ถอดบทเรียนปี 2565) พร้อมสถานะและโครงการ (ไฟล์ปรับปรุง พ.ย. 2567)
# คัดเฉพาะแถวที่คอลัมน์เขต = ดินแดง ลง flood_risk_bma_dindaeng.csv ด้วยมือจาก flood_risk_bma_737_status.pdf
bma = read_csv('flood_risk_bma_dindaeng.csv')
hs_count = {h['spot']: h['count'] for h in hotspots}
check('จุดเสี่ยงน้ำท่วม กทม. ในดินแดง', len(bma), 8)
check('สถานะ เสร็จบางส่วน', sum(r['status'] == 'แก้ไขแล้วเสร็จบางส่วน' for r in bma), 3)
check('สถานะ อยู่ระหว่างดำเนินการ', sum(r['status'] == 'อยู่ระหว่างดำเนินการแก้ไข' for r in bma), 5)
check('ชื่อจุดที่จับคู่กับจุดท่วม 2568 มีอยู่จริง', all(r['match_2568'] in hs_count for r in bma if r['match_2568']), True)
matched = {r['match_2568'] for r in bma if r['match_2568']}
bma_risk = [{'no': r['no'], 'list': r['list'], 'point': r['point'], 'status': r['status'],
             'floods2568': hs_count.get(r['match_2568'], 0), 'projects': r['projects'].split(' · ')} for r in bma]
not_listed = [h for h in hotspots if h['spot'] not in matched]
check('จุดท่วมบ่อยที่สุดไม่อยู่ในบัญชี กทม.', (not_listed[0]['spot'], not_listed[0]['count']), ('ประชาสุข ซอยอินทามระ 34', 9))

write('flood', {
    'source': 'Bangkok Index 2025: อุทกภัย (น้ำท่วมขังบนถนนสายหลัก 2568); ข้อบัญญัติงบประมาณ กทม. 2568',
    'districts': sorted(fl_rows, key=lambda r: r['floodRank']),
    'medianDrainBudget': med_b,
    'groups': {
        'zero': {'count': len(zero), 'drainBudget': sum(r['drainBudget'] for r in zero), 'names': [r['name'] for r in zero]},
        'top': {'count': len(top), 'minFloods': cut, 'drainBudget': sum(r['drainBudget'] for r in top), 'names': [r['name'] for r in top]},
    },
    'spearman': r2(rho, 4),
    'spearmanP': 0.97,
    'systemCapacityMm': 60,
    'bmaRisk': {
        'source': 'บัญชีจุดเสี่ยงน้ำท่วม 737 จุด (ถอดบทเรียนน้ำท่วมปี 2565) สถานะและโครงการ · กทม. (ไฟล์ปรับปรุง พ.ย. 2567)',
        'points': bma_risk,
        'notListed': [{'spot': h['spot'], 'count': h['count']} for h in not_listed],
    },
    'dindaeng': {
        'events': events, 'days': days, 'hotspots': hotspots,
        'rainPerDayAvg': r2(st.mean(d['rain'] for d in days), 1),
        'totalHours': r2(sum(e['dryMin'] for e in events) / 60, 1),
        'dryAvgMin': r2(st.mean(e['dryMin'] for e in events), 0),
    },
    'scoreFormula': {'lo': fmin, 'hi': fmax, 'note': 'คะแนน = 1 + 49 × (hi − ครั้ง) ÷ (hi − lo)'},
})

# ---------- 4. น้ำเสีย ----------
print('4) น้ำเสีย (BOD)')
bod_raw = read_csv('bod_bangkok_index_2025.csv')
RENAME_BOD = {'ธนบุรี': 'ทุ่งครุ', 'นนทบุรี': 'ธนบุรี'}  # ดู docstring ข้อ 2
bod = [{'name': RENAME_BOD.get(fix_name(r['เขต']), fix_name(r['เขต'])), 'bod': float(r['BOD เฉลี่ย (มก./ล.)']),
        'canals': int(r['จำนวนคลอง'])} for r in bod_raw]
assert_names('BOD', [r['name'] for r in bod])
bmax, bmin = max(r['bod'] for r in bod), min(r['bod'] for r in bod)
check('BOD ให้คะแนนตรงกับดัชนี (คลาดสูงสุด)',
      r2(max(abs(minmax_inv(r['bod'], bmin, bmax) - scores[r['name']]['wastewater']) for r in bod), 2), 0, 0.03)
for r in bod:
    r['rank'] = rank_desc([-q['bod'] for q in bod], -r['bod'])  # น้อยดี: อันดับ 1 = BOD ต่ำสุด
    r['score'] = r2(scores[r['name']]['wastewater'], 4)
dd_b = next(r for r in bod if r['name'] == DD)
check('BOD ดินแดง', dd_b['bod'], 25.81)

# จุดตรวจคุณภาพน้ำรายจุด (data.bangkok.go.th ชุด waterquality, cp874, ม.ค.–เม.ย. 2566)
# คอลัมน์ service_area_plant = "ดินแดง" คือพื้นที่บริการของโรงบำบัด ไม่ใช่ตัวเขต
# จึงเลือกจุดจากพิกัดที่อยู่ในขอบเขตเขตดินแดง (OSM relation 2938031) แทน
rel = json.loads((RAW / 'map' / 'osm_boundary_dindaeng.json').read_text())['elements'][0]
segs = [[(p['lon'], p['lat']) for p in m['geometry']] for m in rel['members'] if m['type'] == 'way' and m['role'] == 'outer']
ring = segs.pop(0)
while segs:
    for i, sg in enumerate(segs):
        if sg[0] == ring[-1]:
            ring += sg[1:]
        elif sg[-1] == ring[-1]:
            ring += sg[::-1][1:]
        else:
            continue
        segs.pop(i)
        break
    else:
        ERRORS.append('ต่อเส้นขอบเขตดินแดงไม่ครบวง')
        break


def in_dindaeng(lon, lat):
    inside = False
    for (x1, y1), (x2, y2) in zip(ring, ring[1:]):
        if (y1 > lat) != (y2 > lat) and lon < x1 + (lat - y1) * (x2 - x1) / (y2 - y1):
            inside = not inside
    return inside


wq_text = (RAW / 'waterquality' / 'waterquality_bma.csv').read_bytes().decode('cp874')
wq = {}
for r in csv.DictReader(wq_text.splitlines()):
    lon, lat = float(r['longitude']), float(r['lattitude'])
    if not in_dindaeng(lon, lat):
        continue
    k = r['sample_id']
    wq.setdefault(k, {'canal': r['canal'], 'point': r['sample_points'].strip(), 'months': {}, 'do': []})
    wq[k]['months'][f"{r['sample_year']}-{int(r['sample_month']):02d}"] = float(r['bod_value'])
    wq[k]['do'].append(float(r['do_value']))  # ออกซิเจนละลายน้ำ (มก./ล.)
stations = sorted(
    ({'id': k, 'canal': v['canal'], 'point': v['point'], 'bod': r2(st.mean(v['months'].values())),
      'do': r2(st.mean(v['do'])), 'doZeroAll': all(d == 0 for d in v['do']), 'months': v['months']}
     for k, v in wq.items()),
    key=lambda x: -x['bod'])
check('จุดตรวจน้ำในดินแดง (จุด)', len(stations), 7)
check('ทุกจุดมีข้อมูลครบ 4 เดือน', all(len(x['months']) == 4 for x in stations), True)
check('BOD จุดตรวจ (มากไปน้อย)', [x['bod'] for x in stations], [36.5, 32.25, 31.25, 28.0, 27.5, 25.0, 9.5])
check('จุดเกินมาตรฐาน 15', sum(x['bod'] > 15 for x in stations), 6)
check('จุดที่ DO = 0 ทุกเดือน', sum(x['doZeroAll'] for x in stations), 6)
check('อันดับ BOD ดินแดง', dd_b['rank'], 49)
check('มัธยฐาน BOD', r2(st.median(r['bod'] for r in bod)), 11.59)
write('wastewater', {
    'source': 'Bangkok Index 2025: น้ำเสีย (ค่าเฉลี่ยคุณภาพคลอง 2540–2567, สำนักการระบายน้ำ)',
    'standard': 15,
    'median': r2(st.median(r['bod'] for r in bod)),
    'neighbors': ['ห้วยขวาง', 'ราชเทวี', 'จตุจักร', 'พญาไท'],
    'districts': sorted(bod, key=lambda r: r['rank']),
    'scoreFormula': {'lo': bmin, 'hi': bmax},
    'stations': stations,
    'stationsSource': 'data.bangkok.go.th ชุด waterquality (สำนักการระบายน้ำ) · ค่าเฉลี่ย ม.ค.–เม.ย. 2566 · จุดที่อยู่ในขอบเขตเขตดินแดง',
})

# ---------- 5. การศึกษา ----------
print('5) การศึกษา')
ed = [r for r in sheet_rows(x, '4_การศึกษา') if isinstance(r[0], int)]
edu = [{'name': fix_name(r[1]), 'children': r[2], 'schools': r[3], 'students': r[4], 'teachers': r[5]} for r in ed]
assert_names('การศึกษา', [r['name'] for r in edu])


def edu_scores(rows):
    a = [r['schools'] / r['children'] * 1000 for r in rows]
    b = [r['students'] / r['teachers'] for r in rows]
    s1 = lambda v: 1 + 49 * (v - min(a)) / (max(a) - min(a))
    s2 = lambda v: 1 + 49 * (max(b) - v) / (max(b) - min(b))
    return {r['name']: (s1(ai) + s2(bi)) / 2 for r, ai, bi in zip(rows, a, b)}


base = edu_scores(edu)
check('สูตรคะแนนการศึกษาตรงกับดัชนี (คลาดสูงสุด)',
      r2(max(abs(base[n] - scores[n]['education']) for n in base), 3), 0, 0.006)
for r in edu:
    r['schoolsPer1000'] = r2(r['schools'] / r['children'] * 1000, 3)
    r['studentsPerTeacher'] = r2(r['students'] / r['teachers'], 2)
    r['score'] = r2(scores[r['name']]['education'], 4)
    r['rankStudentsPerTeacher'] = rank_desc([q['students'] / q['teachers'] for q in edu], r['students'] / r['teachers'])
dd_e = next(r for r in edu if r['name'] == DD)
med_spt = st.median(r['students'] / r['teachers'] for r in edu)
check('นักเรียนต่อครูดินแดง', r2(dd_e['studentsPerTeacher'], 1), 23.1)
check('อันดับนักเรียนต่อครู (มากสุด = 1)', dd_e['rankStudentsPerTeacher'], 4)
check('มัธยฐานนักเรียนต่อครู', r2(med_spt, 1), 19.8)


# ครูที่เสนอเพิ่ม: 50 คน (ปรับจาก 88 เมื่อ 12 พ.ย.) · 88 คือจำนวนที่ทำให้ถึงค่ากลาง 19.8 พอดี
# เหตุผลที่ใช้ 50 ดู ข้อมูลรวม_ตรวจแล้ว.md หัวข้อ "เพิ่มโรงเรียนและครู"
TEACHERS_ADD = 50
TEACHERS_TO_MEDIAN = 88


def edu_scenario(add_schools, add_teachers):
    rows = [dict(r) for r in edu]
    d = next(r for r in rows if r['name'] == DD)
    d['schools'] += add_schools
    d['teachers'] += add_teachers
    s = edu_scores(rows)
    return {'addSchools': add_schools, 'addTeachers': add_teachers, 'score': r2(s[DD]),
            'rank': rank_desc(list(s.values()), s[DD])}


check('ครูที่ต้องเพิ่มถึงค่ากลาง', math.ceil(dd_e['students'] / med_spt - dd_e['teachers']), TEACHERS_TO_MEDIAN)
edu_scen = [edu_scenario(0, 0), edu_scenario(1, 0), edu_scenario(0, TEACHERS_ADD), edu_scenario(1, TEACHERS_ADD)]
for sc, want in zip(edu_scen, [(6.01, 48), (6.52, 48), (9.54, 43), (10.05, 42)]):
    check(f"ฉากทัศน์การศึกษา +{sc['addSchools']} รร. +{sc['addTeachers']} ครู", (sc['score'], sc['rank']), want)
write('education', {
    'source': 'Bangkok Index 2025: การศึกษา (ปีการศึกษา 2568)',
    'medianStudentsPerTeacher': r2(med_spt, 2),
    'medianSchoolsPer1000': r2(st.median(r['schools'] / r['children'] * 1000 for r in edu), 3),
    'schoolsBreakdown': {DD: {'bma': 3, 'obec': 5}, PT: {'bma': 7, 'obec': 3}},
    'teachersNeeded': TEACHERS_ADD,
    'teachersToMedian': TEACHERS_TO_MEDIAN,
    'studentsPerTeacherAfter': r2(dd_e['students'] / (dd_e['teachers'] + TEACHERS_ADD), 2),
    'avgTeachersPerSchool': r2(dd_e['teachers'] / dd_e['schools'], 1),
    'teacherSalary': {'monthly': 18220, 'annualTotal': TEACHERS_ADD * 18220 * 12, 'annualTotalToMedian': TEACHERS_TO_MEDIAN * 18220 * 12,
                      'note': 'ครูผู้ช่วย วุฒิ ป.ตรี 4 ปี (ยังไม่ยืนยันอัตรา กทม.)'},
    'districts': sorted(edu, key=lambda r: -r['score']),
    'scenarios': edu_scen,
})

# ---------- 6. จุดเสี่ยง ----------
print('6) จุดเสี่ยงอาชญากรรม')
cr = [r for r in sheet_rows(x, '5_จุดเสี่ยงอาชญากรรม') if isinstance(r[1], (int, float)) and fix_name(r[0]) in scores]
crime = [{'name': fix_name(r[0]), 'points': int(r[1])} for r in cr]
assert_names('จุดเสี่ยง', [r['name'] for r in crime])
cmax, cmin = max(r['points'] for r in crime), min(r['points'] for r in crime)
check('สูตรคะแนนจุดเสี่ยงตรงกับดัชนี (คลาดสูงสุด)',
      r2(max(abs(minmax_inv(r['points'], cmin, cmax) - scores[r['name']]['crime']) for r in crime), 3), 0, 0.001)
for r in crime:
    r['score'] = r2(scores[r['name']]['crime'], 4)
check('จุดเสี่ยงดินแดง', next(r['points'] for r in crime if r['name'] == DD), 17)
check('มัธยฐานจุดเสี่ยง', st.median(r['points'] for r in crime), 12)
write('risk', {
    'source': 'บัญชีพื้นที่เสี่ยงและพื้นที่อันตราย สำนักเทศกิจ (2567–2568); Bangkok Index 2025',
    'note': 'เป็นพื้นที่ที่หน่วยงานขึ้นบัญชีเฝ้าระวัง ไม่ใช่จุดที่เกิดคดีจริง',
    'median': st.median(r['points'] for r in crime),
    'districts': sorted(crime, key=lambda r: -r['points']),
    'dindaengTypes': {'unverified': False, 'note': 'ตรวจกับบัญชีสำนักเทศกิจ (data/raw/map) แล้วใน build_map.py · พิกัดอยู่ใน map.json',
                      'items': [{'type': 'จุดล่อแหลมต่อการเกิดอาชญากรรม', 'count': 10},
                                {'type': 'ประชากรหนาแน่น/พลุกพล่าน', 'count': 5},
                                {'type': 'จุดรกร้าง/พื้นที่ลักลอบทิ้งขยะ', 'count': 1},
                                {'type': 'จุดมืด จุดเปลี่ยว', 'count': 1}]},
    'scoreFormula': {'lo': cmin, 'hi': cmax},
})

# ---------- 7. สวนสาธารณะ ----------
print('7) สวนสาธารณะ')
pk = [r for r in sheet_rows(x, '6_สวนสาธารณะ') if isinstance(r[0], int)]
parks = [{'name': fix_name(r[1]), 'population': r[3], 'greenM2': r[4], 'accessibleParks': r[5],
          'accessibleM2': r[6], 'greenPerCapita': r[7], 'accessiblePerCapita': r[8],
          'score': r2(scores[fix_name(r[1])]['parks'], 4)} for r in pk]
assert_names('สวน', [r['name'] for r in parks])
check('คะแนนสวนในไฟล์กลุ่มตรงกับดัชนี (คลาดสูงสุด)',
      r2(max(abs(r[2] - scores[fix_name(r[1])]['parks']) for r in pk), 3), 0, 0.006)
dd_p = next(r for r in parks if r['name'] == DD)
med_g = st.median(r['greenPerCapita'] for r in parks)
med_a = st.median(r['accessiblePerCapita'] for r in parks)
check('คะแนนสวนดินแดง', r2(dd_p['score']), 1.69)
print(f'  · มัธยฐานพื้นที่สีเขียวต่อคน {med_g} ตร.ม. ดินแดง {dd_p["greenPerCapita"]} '
      f'(ต้องเพิ่ม {med_g / dd_p["greenPerCapita"]:.2f} เท่า)')
gap_acc = (med_a - dd_p['accessiblePerCapita']) * dd_p['population']
print(f'  · มัธยฐานสวนเข้าถึงได้ต่อคน {med_a} ดินแดง {dd_p["accessiblePerCapita"]} '
      f'ต้องเพิ่ม {gap_acc:,.0f} ตร.ม. ≈ Pocket Park 300 ตร.ม. {gap_acc / 300:.0f} แห่ง')
write('parks', {
    'source': 'Bangkok Index 2025: สวนสาธารณะ (สำนักสิ่งแวดล้อม 2568)',
    'medianGreenPerCapita': med_g,
    'medianAccessiblePerCapita': med_a,
    'dindaengGap': {'greenTimes': r2(med_g / dd_p['greenPerCapita']), 'accessibleM2': round(gap_acc),
                    'pocketParks300m2': round(gap_acc / 300)},
    'districts': parks,
})

# ---------- 7b. ที่ว่างในเขตสำหรับทำสวน (สไลด์ 11) ----------
# ต้นทาง: data/raw/parks_vacant/ (ทะเบียนพื้นที่สีเขียว กทม. รายแปลง + ข้อกำหนดกราฟของกลุ่ม)
# ฐาน % ใช้พื้นที่สวนจริง 34,426.8 ตร.ม. (ไม่ปัด 0.32 ก่อนคูณ) จึงได้ 35,909 ไม่ใช่ 35,440 ของหน้า 9
print('7b) ที่ว่างในเขตสำหรับทำสวน')
vac_rows = [r for r in read_csv('parks_vacant/vacant_land_dindaeng_bma.csv') if r['ลำดับ'].strip()]
vac_total_row = next(r for r in read_csv('parks_vacant/vacant_land_dindaeng_bma.csv') if not r['ลำดับ'].strip())
vac_spec = json.loads((RAW / 'parks_vacant' / 'park_charts_data.json').read_text(encoding='utf-8'))
gap_exact = med_a * dd_p['population'] - dd_p['accessibleM2']
check('พื้นที่สวนที่ต้องเพิ่ม (คิดจากพื้นที่จริง)', round(gap_exact), 35909, 0.5)
check('ตรงกับ gap_m2 ในไฟล์ต้นทาง', r2(gap_exact, 1), vac_spec['baseline']['gap_m2'], 0.1)
OWNERS = ['รัฐบาล', 'ศาสนสถาน', 'เอกชน']
vac_groups = []
for o in OWNERS:
    rs = [r for r in vac_rows if r['กลุ่มเจ้าของ'] == o]
    a = sum(float(r['พื้นที่ (ตร.ม.)']) for r in rs)
    vac_groups.append({'owner': o, 'plots': len(rs), 'areaM2': round(a), 'pctOfGap': r2(a / gap_exact * 100, 1)})
vac_area = sum(g['areaM2'] for g in vac_groups)
check('จำนวนแปลงที่ว่าง', len(vac_rows), 64)
check('ทุกแปลงมีกลุ่มเจ้าของ', sum(g['plots'] for g in vac_groups), len(vac_rows))
check('พื้นที่ว่างรวม (ตร.ม.)', vac_area, float(vac_total_row['พื้นที่ (ตร.ม.)']))
check('แปลงตามเจ้าของ (รัฐ/ศาสนา/เอกชน)', [g['plots'] for g in vac_groups], [5, 2, 57])
check('พื้นที่ตามเจ้าของ', [g['areaM2'] for g in vac_groups], [11248, 9400, 104408])
check('ที่ว่างทั้งหมดเทียบที่ต้องเพิ่ม (%)', r2(vac_area / gap_exact * 100, 1), 348.3)
years = [int(r['ปีที่บันทึก']) for r in vac_rows]

# แผนสร้างสวน: แปลงรัฐ + ศาสนสถานทั้ง 7 แปลง แล้วเติมที่เอกชนเท่าที่ยังขาด
c2 = vac_spec['chart2_where_to_build']
COST_M2, MAINT = c2['cost_per_m2_baht'], c2['maintenance_rate']
sites = []
for sp in c2['sites']:
    if sp['no'] is None:
        continue
    row = next(r for r in vac_rows if float(r['พื้นที่ (ตร.ม.)']) == sp['area_m2'] and r['เจ้าของ'].startswith(sp['owner'][:4]))
    check(f"แปลงในแผน {sp['no']} อยู่ในกลุ่มรัฐ/ศาสนา", row['กลุ่มเจ้าของ'] in ('รัฐบาล', 'ศาสนสถาน'), True)
    sites.append({'no': sp['no'], 'name': sp['name'], 'owner': sp['owner'], 'group': sp['group'], 'use': sp['use'],
                  'areaM2': sp['area_m2'], 'year': int(row['ปีที่บันทึก'])})
pub_area = sum(site['areaM2'] for site in sites)
check('ที่รัฐ + ศาสนสถานในแผน = ทั้งหมดของ 2 กลุ่ม', pub_area, vac_groups[0]['areaM2'] + vac_groups[1]['areaM2'])
priv = next(sp for sp in c2['sites'] if sp['no'] is None)
sites.append({'no': None, 'name': priv['name'], 'owner': priv['owner'], 'group': priv['group'], 'use': priv['use'],
              'areaM2': round(gap_exact - pub_area), 'privatePlots': vac_groups[2]['plots']})
for site in sites:
    site['pctOfGap'] = r2(site['areaM2'] / gap_exact * 100, 1)
    site['buildBaht'] = site['areaM2'] * COST_M2
build_total = sum(site['buildBaht'] for site in sites)
check('ที่เอกชนที่ยังขาด (ตร.ม.)', sites[-1]['areaM2'], 15261)
check('รัฐ + ศาสนสถาน (% ของที่ต้องเพิ่ม)', r2(pub_area / gap_exact * 100, 1), 57.5)
check('ค่าก่อสร้างรวม (ล้านบาท)', r2(build_total / 1e6), 71.82)
check('ค่าบำรุงรักษาต่อปี (ล้านบาท)', r2(build_total * MAINT / 1e6), 7.18)
check('รวมทั้งหมด (ล้านบาท)', r2(build_total * (1 + MAINT) / 1e6), 79.00)
# สัดส่วนการใช้พื้นที่ทั้งเขต (หน้า 11): พื้นที่เขตทางการ 8.35 ตร.กม. (ข้อมูลรวม: ขอบเขต OSM คำนวณได้ 8.45)
# พื้นที่สีเขียว = Bangkok Index (สำนักงานสวนดูแล) · สวนที่เข้าถึงได้ถือเป็นส่วนหนึ่งของพื้นที่สีเขียว
# ที่ว่างมาจากทะเบียนพื้นที่สีเขียวคนละชุด จึงนับแยก (อาจซ้อนกันได้บ้าง)
DISTRICT_AREA_M2 = 8_350_000
land = {
    'districtAreaM2': DISTRICT_AREA_M2,
    'parkM2': dd_p['accessibleM2'],
    'greenOtherM2': r2(dd_p['greenM2'] - dd_p['accessibleM2'], 1),
    'vacantM2': vac_area,
}
land['usedM2'] = r2(DISTRICT_AREA_M2 - land['parkM2'] - land['greenOtherM2'] - land['vacantM2'], 1)
check('พื้นที่สีเขียวดินแดง (ตร.ม.)', round(dd_p['greenM2']), 219931)
check('สวนที่เข้าถึงได้ < พื้นที่สีเขียว', dd_p['accessibleM2'] < dd_p['greenM2'], True)
check('สัดส่วนที่ว่างต่อพื้นที่เขต (%)', r2(vac_area / DISTRICT_AREA_M2 * 100, 1), 1.5)
# ข้อเสนอ: ดึงที่ว่างมาทำสวน 50% (หน้า 11) · ไม่รวมค่าที่ดิน
# แบ่งพื้นที่: 60% สวนสาธารณะเต็มรูปแบบ (2,000 บาท/ตร.ม. ตามแผนรายแปลง อ้างสวนวัดหัวลำโพง)
#             40% สวน 15 นาที (≈ 1,000 บาท/ตร.ม. ค่าเฉลี่ยสวน 15 นาที กทม. จากสยามรัฐ ใน park_charts_brief.md)
HALF = 0.5
COST_15MIN = 1000
MIX = [{'kind': 'สวนสาธารณะ', 'share': 0.6, 'costPerM2': COST_M2},
       {'kind': 'สวน 15 นาที', 'share': 0.4, 'costPerM2': COST_15MIN}]
half_m2 = vac_area * HALF
for m in MIX:
    m['areaM2'] = r2(half_m2 * m['share'], 1)
    m['buildBaht'] = round(half_m2 * m['share'] * m['costPerM2'])
half_build = sum(m['buildBaht'] for m in MIX)
half = {
    'share': HALF,
    'areaM2': round(half_m2),
    'perCapitaAfter': r2((dd_p['accessibleM2'] + half_m2) / dd_p['population']),
    'pctOfGap': r2(half_m2 / gap_exact * 100, 1),
    'mix': MIX,
    'buildBaht': half_build,
    'maintenanceBaht': round(half_build * MAINT),
    'totalBaht': round(half_build * (1 + MAINT)),
    'privateM2Needed': round(half_m2 - pub_area),
}
check('ที่ว่าง 50% (ตร.ม.)', half['areaM2'], 62528)
check('สวนต่อคนหลังเพิ่ม 50%', half['perCapitaAfter'], 0.89)
check('ค่าก่อสร้าง 60/40 (ล้านบาท)', r2(half_build / 1e6), 100.04)
check('งบรวม 50% (ล้านบาท)', r2(half['totalBaht'] / 1e6), 110.05)

# ระยะแรก 3 แห่ง: เลือกให้กระจายทั่วเขตที่สุด วัดเป็น % ของพื้นที่เขตที่อยู่ในระยะเส้นตรง 800 ม. (เดินราว 10 นาที)
# จากแปลงใหม่อย่างน้อย 1 แห่ง · พิกัด = กึ่งกลางรูปแปลง GIS ในหน้ารายละเอียดทะเบียนพื้นที่สีเขียว (vacant_public_coords.csv)
# เส้นเขตจาก map/bangkok_districts.geojson · ตาราง 0.0005° (ราว 55 ม.) · ยังไม่นับสวนเดิม และไม่ใช่ระยะเดินจริง
FIRST_PHASE, WALK_M = [5, 1, 6], 800
coords = {int(r['แปลงในแผน']): (float(r['lat']), float(r['lon']))
          for r in read_csv('parks_vacant/vacant_public_coords.csv')}
check('มีพิกัดครบทุกแปลงรัฐ + ศาสนสถาน', sorted(coords), [x['no'] for x in sites if x['no']])
dd_geom = next(f for f in json.loads((RAW / 'map' / 'bangkok_districts.geojson').read_text(encoding='utf-8'))['features']
               if f['properties']['amp_th'] == DD)['geometry']
dd_rings = [p[0] for p in dd_geom['coordinates']] if dd_geom['type'] == 'MultiPolygon' else [dd_geom['coordinates'][0]]


def in_ring(lon, lat, ring):
    inside = False
    for (x1, y1), (x2, y2) in zip(ring, ring[1:] + ring[:1]):
        if (y1 > lat) != (y2 > lat) and lon < (x2 - x1) * (lat - y1) / (y2 - y1) + x1:
            inside = not inside
    return inside


all_pts = [pt[:2] for ring in dd_rings for pt in ring]
lon0, lon1 = min(p[0] for p in all_pts), max(p[0] for p in all_pts)
lat0, lat1 = min(p[1] for p in all_pts), max(p[1] for p in all_pts)
STEP = 0.0005
cells = [(lat0 + i * STEP, lon0 + j * STEP)
         for i in range(int((lat1 - lat0) / STEP) + 1) for j in range(int((lon1 - lon0) / STEP) + 1)
         if any(in_ring(lon0 + j * STEP, lat0 + i * STEP, [p[:2] for p in ring]) for ring in dd_rings)]
M_LAT, M_LON = 111320, 111320 * math.cos(math.radians((lat0 + lat1) / 2))


def coverage(nos):
    pts = [coords[n] for n in nos]
    near = sum(any(math.hypot((c[0] - p[0]) * M_LAT, (c[1] - p[1]) * M_LON) <= WALK_M for p in pts) for c in cells)
    return near / len(cells) * 100


from itertools import combinations  # noqa: E402
cover_all = {combo: coverage(combo) for combo in combinations(sorted(coords), 3)}
first_cover = coverage(FIRST_PHASE)
check('ระยะแรก: พื้นที่เขตในระยะ 800 ม. (%)', r2(first_cover, 1), 45.7, 0.15)
check('ระยะแรกครอบคลุมดีที่สุดใน 35 ชุด', r2(first_cover, 3), r2(max(cover_all.values()), 3))
check('ชุดเดิม (แปลง 3, 1, 6) ครอบคลุม (%)', r2(coverage([3, 1, 6]), 1), 36.2, 0.15)
first_area = sum(x['areaM2'] for x in sites if x['no'] in FIRST_PHASE)
check('ระยะแรก 3 แห่ง (ตร.ม.)', first_area, 12748)
north = max(coords.values())[0]
print(f'  · ระยะแรก {FIRST_PHASE} ครอบคลุม {first_cover:.1f}% · แปลงรัฐ/ศาสนาเหนือสุดที่ lat {north:.4f} '
      f'(เขตยาวถึง {lat1:.4f})')

write('vacant', {
    'half': half,
    'land': land,
    'source': 'ทะเบียนพื้นที่สีเขียว เขตดินแดง (greenparks.bangkok.go.th รายงาน 19) · ที่ว่างบันทึกปี '
              f'{min(years)}–{max(years)}',
    'links': vac_spec['meta']['sources'],
    'population': dd_p['population'],
    'accessibleM2': dd_p['accessibleM2'],
    'medianPerCapita': med_a,
    'gapM2': r2(gap_exact, 1),
    'perCapitaIfAll': r2((dd_p['accessibleM2'] + vac_area) / dd_p['population']),
    'years': [min(years), max(years)],
    'groups': vac_groups,
    'total': {'plots': len(vac_rows), 'areaM2': vac_area, 'pctOfGap': r2(vac_area / gap_exact * 100, 1)},
    'plan': {
        'costPerM2': COST_M2,
        'maintenanceRate': MAINT,
        'sites': sites,
        'publicAreaM2': pub_area,
        'publicPctOfGap': r2(pub_area / gap_exact * 100, 1),
        'buildBaht': build_total,
        'maintenanceBaht': round(build_total * MAINT),
        'totalBaht': round(build_total * (1 + MAINT)),
    },
    'firstPhase': {
        'sites': FIRST_PHASE,
        'walkM': WALK_M,
        'coveragePct': r2(first_cover, 1),
        'coveragePctOld': r2(coverage([3, 1, 6]), 1),
        'combos': len(cover_all),
    },
})

# ---------- 8. ฉากทัศน์คะแนนรวม ----------
print('8) ฉากทัศน์คะแนนรวม (เพิ่มทั้งโรงเรียนและครู)')
EDU_BOTH = next(s for s in edu_scen if s['addSchools'] == 1 and s['addTeachers'] == TEACHERS_ADD)['score']


def overall_scenario(crime_pts=None, floods=None, edu_score=None, bod_val=None):
    sc = {n: dict(v) for n, v in scores.items()}
    d = sc[DD]
    if crime_pts is not None:
        d['crime'] = minmax_inv(crime_pts, cmin, cmax)
    if floods is not None:
        d['flood'] = minmax_inv(floods, fmin, fmax)
    if edu_score is not None:
        d['education'] = edu_score
    if bod_val is not None:
        d['wastewater'] = minmax_inv(bod_val, bmin, bmax)
    o = {n: overall_of(v)[0] for n, v in sc.items()}
    return r2(o[DD]), rank_desc(list(o.values()), o[DD])


CASES = [
    ('now', 'ตอนนี้ (2568)', dict()),
    ('careful', 'ปีแรก ระมัดระวัง', dict(crime_pts=12, floods=31, edu_score=EDU_BOTH)),
    ('target', 'ปีแรก ตามเป้า', dict(crime_pts=9, floods=29, edu_score=EDU_BOTH)),
    ('good', 'ปีแรก กรณีดี', dict(crime_pts=8, floods=27, edu_score=EDU_BOTH)),
    ('longterm', 'ระยะยาว ตามเป้า', dict(crime_pts=9, floods=29, edu_score=EDU_BOTH, bod_val=15)),
]
scen = []
for key, label, kw in CASES:
    s, rk = overall_scenario(**kw)
    scen.append({'key': key, 'label': label, 'crime': kw.get('crime_pts', 17), 'floods': kw.get('floods', 41),
                 'eduScore': kw.get('edu_score', r2(scores[DD]['education'])), 'bod': kw.get('bod_val', 25.81),
                 'score': s, 'rank': rk})
for sc, want in zip(scen, [(17.35, 50), (19.32, 46), (20.07, 41), (20.42, 40), (21.59, 32)]):
    check(f"ฉากทัศน์ {sc['label']}", (sc['score'], sc['rank']), want)

base_o = TBL[DD]['overall']
steps = [
    ('จุดเสี่ยง 17 → 9 จุด', 'crime', minmax_inv(9, cmin, cmax)),
    ('น้ำท่วม 41 → 29 ครั้ง', 'flood', minmax_inv(29, fmin, fmax)),
    (f'การศึกษา +1 โรงเรียน +{TEACHERS_ADD} ครู', 'education', EDU_BOTH),
]
waterfall = [{'label': 'ตอนนี้', 'value': r2(base_o)}]
for label, k, new in steps:
    waterfall.append({'label': label, 'topicFrom': r2(scores[DD][k]), 'topicTo': r2(new),
                      'delta': r2((new - scores[DD][k]) / 16, 3)})
waterfall.append({'label': 'หลังแก้ (ปีแรก ตามเป้า)', 'value': scen[2]['score']})
check('waterfall รวม', r2(base_o + sum(w.get('delta', 0) for w in waterfall[1:-1])), 20.07, 0.011)
check('น้ำเสียเรื่องเดียว BOD 15', overall_scenario(bod_val=15), (18.87, 46))
write('scenarios', {
    'note': 'คำนวณจากคะแนนจริง 16 หัวข้อ × 50 เขต สมมติให้เขตอื่นคงที่',
    'cases': scen,
    'waterfall': waterfall,
    'single': {
        'crimeOnly': dict(zip(('score', 'rank'), overall_scenario(crime_pts=9))),
        'floodOnly': dict(zip(('score', 'rank'), overall_scenario(floods=29))),
        'eduOnly': dict(zip(('score', 'rank'), overall_scenario(edu_score=EDU_BOTH))),
        # น้ำเสียเรื่องเดียว (ระยะยาว BOD → มาตรฐาน 15) ใช้ในแถบผลต่อคะแนนหน้าแก้น้ำเสีย
        'bodOnly': dict(zip(('score', 'rank'), overall_scenario(bod_val=15))),
    },
})

# ---------- 9. งบที่ขอ (ร่าง) ----------
ask = [r for r in sheet_rows(x, '9_งบที่ขอเพิ่ม') if r[1] and isinstance(r[2], (int, float)) and r[1] not in ('รวม',)]
write('ask', {
    'draft': True,
    'note': 'ร่างจาก xlsx ชีต 9 · ยอดรวมจริงรอผู้ใช้ส่ง (ห้ามใช้ยอดรวมนี้ในสไลด์)',
    'items': [{'topic': r[0], 'item': r[1], 'low': r[2], 'high': r[3], 'type': r[4]} for r in ask if not str(r[1]).startswith('%')],
})

# ---------- สรุป ----------
if ERRORS:
    print(f'\n✗ ตรวจไม่ผ่าน {len(ERRORS)} รายการ: {ERRORS}')
    print('  ไม่ได้เขียน JSON (ไฟล์เดิมใน src/data/ ยังอยู่) แก้ปัญหาแล้วรันใหม่')
    sys.exit(1)
OUT.mkdir(parents=True, exist_ok=True)
for name, data in PENDING.items():
    (OUT / f'{name}.json').write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding='utf-8')
print(f'\n✓ ผ่านทั้งหมด · เขียน JSON ไว้ที่ {OUT.relative_to(ROOT)}/')
for f in sorted(OUT.glob('*.json')):
    print(f'  {f.name:18} {f.stat().st_size / 1024:6.1f} KB')
