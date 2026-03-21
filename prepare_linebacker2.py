import os, json, csv, math
from datetime import datetime

# ── CONFIG ──────────────────────────────────────────────────────
CSV_FOLDER  = r'D:\dataviz2\data\code\datamil-vietnam-war-thor-data'
OUTPUT_FILE = r'data\data_linebacker2.json'

# Linebacker II: 18-29 December 1972
DATE_FROM = datetime(1972, 12, 18)
DATE_TO   = datetime(1972, 12, 29)

CSV_FILES = [
    'VietNam_1972_0.csv',
    'VietNam_1972_1.csv',
]

LAT_MIN, LAT_MAX = 5.0, 30.0
LON_MIN, LON_MAX = 95.0, 120.0


# ── DATE PARSER ──────────────────────────────────────────────────
def parse_msndate(s):
    if not s:
        return None
    s = s.strip()

    if len(s) == 10 and s[4] == '-':
        try:
            return datetime.strptime(s, '%Y-%m-%d')
        except ValueError:
            pass

    if len(s) == 8 and s.isdigit():
        try:
            return datetime.strptime(s, '%Y%m%d')
        except ValueError:
            pass

    try:
        parts = s.split('/')
        if len(parts) == 3:
            m, d, y = int(parts[0]), int(parts[1]), int(parts[2])
            if y < 100:
                y += 1900 if y >= 60 else 2000
            return datetime(y, m, d)
    except (ValueError, TypeError):
        pass

    return None


# ── HELPERS ──────────────────────────────────────────────────────
def parse_coord(val):
    try:
        v = float(val or '')
        return None if math.isnan(v) else v
    except (ValueError, TypeError):
        return None

def parse_int(val):
    try:
        v = int(float(val or 0))
        return v if v != 0 else None
    except (ValueError, TypeError):
        return None

def parse_float_field(val, decimals=1):
    try:
        v = float(val or 0)
        if math.isnan(v) or v == 0:
            return None
        return round(v, decimals)
    except (ValueError, TypeError):
        return None

def strip_str(row, key):
    v = (row.get(key) or '').strip()
    return v or None

def parse_timeontarget(val):
    """
    Convertit TIMEONTARGET brut THOR en :
      - heure HH:MM
      - minutes depuis minuit
    Exemples:
      35   -> 00:35
      845  -> 08:45
      1251 -> 12:51
    """
    raw = parse_int(val)
    if raw is None:
        return None, None, None

    hours = raw // 100
    minutes = raw % 100

    if hours == 24 and minutes == 0:
        return raw, "24:00", 1440

    if not (0 <= hours <= 23 and 0 <= minutes <= 59):
        return raw, None, None

    hhmm = f"{hours:02d}:{minutes:02d}"
    total_minutes = hours * 60 + minutes
    return raw, hhmm, total_minutes


# ── MAIN ────────────────────────────────────────────────────────
def main():
    print('THOR — Linebacker II Data Extractor')
    print('=' * 50)
    print(f'Period : {DATE_FROM.date()} → {DATE_TO.date()}')
    print(f'Output : {OUTPUT_FILE}')
    print()

    records = []
    total_read = 0
    skipped_date = 0
    skipped_coord = 0
    skipped_weight = 0

    for fname in CSV_FILES:
        fpath = os.path.join(CSV_FOLDER, fname)
        if not os.path.exists(fpath):
            print(f'  ⚠ Missing: {fname}')
            continue

        file_kept = 0
        print(f'  📂 {fname} ... ', end='', flush=True)

        with open(fpath, encoding='utf-8', errors='replace', newline='') as fp:
            reader = csv.DictReader(fp)
            for row in reader:
                total_read += 1

                # ── Date filter ──────────────────────────────────
                dt = parse_msndate(row.get('MSNDATE'))
                if dt is None or not (DATE_FROM <= dt <= DATE_TO):
                    skipped_date += 1
                    continue

                # ── Coordinate filter ────────────────────────────
                lat = parse_coord(row.get('TGTLATDD_DDD_WGS84'))
                lon = parse_coord(row.get('TGTLONDDD_DDD_WGS84'))
                if lat is None or lon is None:
                    skipped_coord += 1
                    continue
                if not (LAT_MIN < lat < LAT_MAX and LON_MIN < lon < LON_MAX):
                    skipped_coord += 1
                    continue

                # ── Weapon weight filter ─────────────────────────
                ww = parse_float_field(row.get('WEAPONTYPEWEIGHT'))
                if ww is None or ww < 1:
                    skipped_weight += 1
                    continue

                # ── Time conversion ──────────────────────────────
                to_raw, to_hhmm, to_min = parse_timeontarget(row.get('TIMEONTARGET'))

                rec = {
                    'la': round(lat, 4),
                    'lo': round(lon, 4),
                    'yr': dt.year,
                    'mo': dt.month,
                    'dy': dt.day,
                    'dt': dt.strftime('%Y-%m-%d'),
                    'ww': ww,
                }

                for short, col in [
                    ('ms', 'MILSERVICE'),
                    ('md', 'MFUNC_DESC'),
                    ('wt', 'WEAPONTYPE'),
                    ('tt', 'TGTTYPE'),
                    ('tc', 'TGTCOUNTRY'),
                    ('tl', 'TAKEOFFLOCATION'),
                    ('ar', 'AIRCRAFT_ROOT'),
                    ('ao', 'AIRCRAFT_ORIGINAL'),
                ]:
                    v = strip_str(row, col)
                    if v:
                        rec[short] = v

                nw = parse_int(row.get('NUMWEAPONSDELIVERED'))
                if nw is not None:
                    rec['nw'] = nw

                na = parse_int(row.get('NUMOFACFT'))
                if na is not None:
                    rec['na'] = na

                if to_raw is not None:
                    rec['to'] = to_raw
                if to_hhmm is not None:
                    rec['to_hhmm'] = to_hhmm
                if to_min is not None:
                    rec['to_min'] = to_min

                records.append(rec)
                file_kept += 1

        print(f'{file_kept:,} rows kept')

    print(f'\nTotal read         : {total_read:,}')
    print(f'Skipped (date)     : {skipped_date:,}')
    print(f'Skipped (coords)   : {skipped_coord:,}')
    print(f'Skipped (weight<1) : {skipped_weight:,}')
    print(f'✅ Kept            : {len(records):,}')

    os.makedirs(os.path.dirname(OUTPUT_FILE) or '.', exist_ok=True)
    print(f'\nWriting {OUTPUT_FILE}...')
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(records, f, separators=(',', ':'), ensure_ascii=False)

    size_mb = os.path.getsize(OUTPUT_FILE) / (1024 * 1024)
    print(f'✅ {OUTPUT_FILE} → {len(records):,} rows / {size_mb:.2f} MB')


if __name__ == '__main__':
    main()