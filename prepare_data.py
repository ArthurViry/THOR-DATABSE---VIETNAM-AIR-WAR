"""
THOR — Vietnam Air War
prepare_data.py  v2

Stratified sampling: keeps at least MIN_PER_YEAR rows per year,
then samples globally so total stays under TARGET_ROWS.

Usage:
    cd D:\\dataviz2\\data\\code\\vietnam-dataviz
    python prepare_data.py
"""

import os, json, csv, math, random
from collections import defaultdict

# ── CONFIG ─────────────────────────────────────────────────────
CSV_FOLDER  = r'D:\dataviz2\data\code\datamil-vietnam-war-thor-data'
OUTPUT_FILE = r'data\data.json'

TARGET_ROWS   = 700000   # target total rows in output
MIN_PER_YEAR  = 20000    # guarantee at least this many rows per year (if available)

CSV_FILES = [
    'VietNam_1965.csv',
    'VietNam_1966_0.csv', 'VietNam_1966_1.csv',
    'VietNam_1967_0.csv', 'VietNam_1967_1.csv', 'VietNam_1967_2.csv', 'Vietnam_1967_Oct.csv',
    'VietNam_1968_0.csv', 'VietNam_1968_1.csv', 'VietNam_1968_2.csv', 'VietNam_1968_3.csv',
    'VietNam_1969_0.csv', 'VietNam_1969_1.csv', 'VietNam_1969_2.csv',
    'VietNam_1970_0.csv', 'VietNam_1970_1.csv', 'VietNam_1970_2.csv',
    'VietNam_1971_0.csv', 'VietNam_1971_1.csv',
    'VietNam_1972_0.csv', 'VietNam_1972_1.csv',
    'VietNam_1973.csv', 'VietNam_1974.csv', 'VietNam_1975.csv',
]

# ── HELPERS ────────────────────────────────────────────────────
def parse_year(row):
    try:
        y = int(float(row.get('Year', 0) or 0))
        if 1960 < y < 1980: return y
    except: pass
    try:
        s = str(row.get('MSNDATE', '') or '')
        y = int(s[:4])
        if 1960 < y < 1980: return y
    except: pass
    return None

def parse_month(row):
    try:
        s = str(row.get('MSNDATE', '') or '')
        if len(s) >= 6: return int(s[4:6])
    except: pass
    return None

def parse_float(val):
    try:
        v = float(val or 0)
        return v if not math.isnan(v) else 0
    except: return 0

def parse_coord(val):
    try:
        v = float(val or '')
        return v if not math.isnan(v) else None
    except: return None

# ── MAIN ──────────────────────────────────────────────────────
def main():
    os.makedirs('data', exist_ok=True)

    # Step 1: read all valid rows, bucket by year
    buckets = defaultdict(list)
    total_read = 0

    for fname in CSV_FILES:
        fpath = os.path.join(CSV_FOLDER, fname)
        if not os.path.exists(fpath):
            print(f'  ⚠️  Not found: {fname}')
            continue

        print(f'  📂 {fname}...', end=' ')
        count = 0

        with open(fpath, encoding='utf-8', errors='replace') as f:
            reader = csv.DictReader(f)
            for row in reader:
                total_read += 1
                lat = parse_coord(row.get('TGTLATDD_DDD_WGS84'))
                lon = parse_coord(row.get('TGTLONDDD_DDD_WGS84'))
                if lat is None or lon is None: continue
                if not (5 < lat < 30 and 95 < lon < 120): continue
                year = parse_year(row)
                if not year: continue

                month   = parse_month(row)
                weapons = parse_float(row.get('NUMWEAPONSDELIVERED'))
                weight  = parse_float(row.get('WEAPONTYPEWEIGHT')) * weapons

                record = {
                    'yr': year, 'mo': month,
                    'la': round(lat, 4), 'lo': round(lon, 4),
                    'ms': (row.get('MILSERVICE') or '').strip(),
                    'mf': (row.get('MFUNC_DESC') or '').strip(),
                    'nw': int(weapons),
                    'wt': (row.get('WEAPONTYPE') or '').strip(),
                    'ww': round(parse_float(row.get('WEAPONTYPEWEIGHT')), 1),
                    'wc': (row.get('WEAPONTYPECLASS') or '').strip(),
                    'tt': (row.get('TGTTYPE') or '').strip(),
                    'tc': (row.get('TGTCOUNTRY') or '').strip(),
                    'ar': (row.get('AIRCRAFT_ROOT') or '').strip(),
                    'ao': (row.get('AIRCRAFT_ORIGINAL') or '').strip(),
                    'tl': (row.get('TAKEOFFLOCATION') or '').strip(),
                    'dt': str(row.get('MSNDATE') or '').strip(),
                    'wr': round(weight, 1),
                }
                buckets[year].append(record)
                count += 1

        print(f'{count:,} valid rows')

    print(f'\n✅ Total read    : {total_read:,}')
    total_valid = sum(len(v) for v in buckets.items() and buckets.values())
    print(f'✅ Total valid   : {total_valid:,}')
    print(f'📊 Year breakdown:')
    for y in sorted(buckets.keys()):
        print(f'   {y}: {len(buckets[y]):,}')

    # Step 2: stratified sampling
    # First guarantee MIN_PER_YEAR per year
    sampled = []
    remaining_budget = TARGET_ROWS

    year_samples = {}
    for y in sorted(buckets.keys()):
        rows = buckets[y]
        n = min(len(rows), MIN_PER_YEAR)
        year_samples[y] = random.sample(rows, n) if len(rows) > n else rows[:]
        remaining_budget -= len(year_samples[y])

    # Distribute remaining budget proportionally
    total_remaining = sum(max(0, len(buckets[y]) - MIN_PER_YEAR) for y in buckets)
    if remaining_budget > 0 and total_remaining > 0:
        for y in sorted(buckets.keys()):
            extra_available = max(0, len(buckets[y]) - MIN_PER_YEAR)
            if extra_available <= 0: continue
            extra_quota = int(remaining_budget * extra_available / total_remaining)
            already_taken = set(id(r) for r in year_samples[y])
            extra_pool = [r for r in buckets[y] if id(r) not in already_taken]
            if extra_quota > 0 and extra_pool:
                extra = random.sample(extra_pool, min(extra_quota, len(extra_pool)))
                year_samples[y].extend(extra)

    # Merge and shuffle
    for y in sorted(year_samples.keys()):
        sampled.extend(year_samples[y])
        print(f'   {y}: {len(year_samples[y]):,} sampled (from {len(buckets[y]):,})')

    random.shuffle(sampled)

    print(f'\n📝 Writing {OUTPUT_FILE} ({len(sampled):,} rows)...')
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(sampled, f, separators=(',', ':'), ensure_ascii=False)

    size_mb = os.path.getsize(OUTPUT_FILE) / (1024 * 1024)
    print(f'✅ File created  : {OUTPUT_FILE}')
    print(f'📦 Size          : {size_mb:.1f} MB')
    print(f'\n🚀 Launch your Python server and open localhost:8080')

if __name__ == '__main__':
    random.seed(42)  # reproducible
    print('THOR — Data Preparation v2\n' + '='*40)
    main()
