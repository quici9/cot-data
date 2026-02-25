"""
COT Data Fetcher — CFTC Legacy Report
Chạy mỗi thứ Bảy 08:00 GMT+7 (01:00 UTC)
Fetch → Validate → Tính COT Index → Lưu JSON
"""

import requests
import json
import os
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

# ─────────────────────────────────────────────
#  CONFIG
# ─────────────────────────────────────────────

# CFTC Socrata API — Legacy COT, Futures Only
CFTC_API = "https://publicreporting.cftc.gov/resource/6dca-aqww.json"

# 52 tuần = 53 records để tính High/Low (buffer thêm 1)
LOOKBACK_WEEKS = 54

# Map tên contract CFTC → symbol chuẩn của tool
CONTRACT_MAP = {
    "EURO FX - CHICAGO MERCANTILE EXCHANGE":           "EUR",
    "BRITISH POUND - CHICAGO MERCANTILE EXCHANGE":     "GBP",
    "JAPANESE YEN - CHICAGO MERCANTILE EXCHANGE":      "JPY",
    "AUSTRALIAN DOLLAR - CHICAGO MERCANTILE EXCHANGE": "AUD",
    "CANADIAN DOLLAR - CHICAGO MERCANTILE EXCHANGE":   "CAD",
    "SWISS FRANC - CHICAGO MERCANTILE EXCHANGE":       "CHF",
    "NZ DOLLAR - CHICAGO MERCANTILE EXCHANGE":         "NZD",
    "USD INDEX - ICE FUTURES U.S.":                    "USD",
}

# Output paths
ROOT = Path(__file__).parent.parent
DATA_DIR     = ROOT / "data"
HISTORY_DIR  = DATA_DIR / "history"
LATEST_FILE  = DATA_DIR / "cot-latest.json"

# ─────────────────────────────────────────────
#  HELPERS
# ─────────────────────────────────────────────

def log(msg): 
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}")

def get_iso_week_label(date_str):
    """2024-01-05T00:00:00.000 → 2024-W01"""
    d = datetime.fromisoformat(date_str.replace(".000", ""))
    return f"{d.isocalendar()[0]}-W{d.isocalendar()[1]:02d}"

def net_position(row):
    """Large Spec Net = Long - Short"""
    try:
        long  = int(row.get("noncomm_positions_long_all",  0))
        short = int(row.get("noncomm_positions_short_all", 0))
        return long - short
    except (ValueError, TypeError):
        return None

def open_interest(row):
    """Total Open Interest"""
    try:
        return int(row.get("open_interest_all", 0))
    except (ValueError, TypeError):
        return None

def cot_index(current, low_52, high_52):
    """Normalize về 0–100"""
    rng = high_52 - low_52
    if rng == 0:
        return 50.0
    return round(min(100, max(0, (current - low_52) / rng * 100)), 2)

def cot_label(idx):
    if idx <  10: return "EXTREME BEAR"
    if idx <  25: return "BEARISH"
    if idx <  40: return "BEARISH MILD"
    if idx <  60: return "NEUTRAL"
    if idx <  75: return "BULLISH MILD"
    if idx <  90: return "BULLISH"
    return "EXTREME BULL"

# ─────────────────────────────────────────────
#  FETCH
# ─────────────────────────────────────────────

def fetch_cftc_data():
    """
    Fetch LOOKBACK_WEEKS records cho 8 contracts.
    Dùng $where filter để chỉ lấy đúng market_and_exchange_names cần thiết.
    Retry 3 lần nếu fail.
    """
    names_filter = " OR ".join(
        [f"market_and_exchange_names='{name}'" for name in CONTRACT_MAP.keys()]
    )
    
    params = {
        "$where": f"({names_filter})",
        "$order": "report_date_as_yyyy_mm_dd DESC",
        "$limit": len(CONTRACT_MAP) * LOOKBACK_WEEKS,
    }

    for attempt in range(1, 4):
        try:
            log(f"Fetching CFTC API... (attempt {attempt}/3)")
            r = requests.get(CFTC_API, params=params, timeout=30)
            r.raise_for_status()
            data = r.json()
            log(f"Fetched {len(data)} records")
            return data
        except requests.exceptions.Timeout:
            log(f"Timeout on attempt {attempt}")
        except requests.exceptions.HTTPError as e:
            log(f"HTTP error: {e}")
            # 4xx = không retry
            if r.status_code < 500:
                raise
        except requests.exceptions.ConnectionError:
            log(f"Connection error on attempt {attempt}")
        
        if attempt < 3:
            import time; time.sleep(10 * attempt)
    
    raise RuntimeError("CFTC API unreachable after 3 attempts")

# ─────────────────────────────────────────────
#  VALIDATE
# ─────────────────────────────────────────────

def validate_latest_week(records_by_pair):
    """
    Đảm bảo tất cả 8 pairs đều có data của cùng 1 tuần.
    Nếu tuần mới nhất thiếu pair nào → giữ file cũ (holiday/delay).
    """
    latest_dates = {}
    for pair, records in records_by_pair.items():
        if records:
            latest_dates[pair] = records[0]["date"]
    
    if not latest_dates:
        raise ValueError("Không có data nào được fetch")
    
    # Lấy ngày mới nhất trong tất cả pairs
    most_recent = max(latest_dates.values())
    
    # Check tất cả pairs có cùng ngày không
    missing = []
    for pair, date in latest_dates.items():
        if date != most_recent:
            missing.append(f"{pair} ({date} vs {most_recent})")
    
    if missing:
        log(f"WARNING: Các pairs sau chưa có data tuần mới: {missing}")
        log("Có thể CFTC delay do holiday. Kiểm tra lại.")
        return False, most_recent
    
    log(f"✓ Tất cả {len(latest_dates)} pairs đều có data ngày {most_recent}")
    return True, most_recent

# ─────────────────────────────────────────────
#  PROCESS
# ─────────────────────────────────────────────

def process(raw_data):
    """
    Parse raw → group by pair → tính COT Index 52 tuần cho từng pair.
    """
    # Group records theo pair, sort theo date DESC
    grouped = {symbol: [] for symbol in CONTRACT_MAP.values()}
    
    for row in raw_data:
        name = row.get("market_and_exchange_names", "").strip()
        symbol = CONTRACT_MAP.get(name)
        if not symbol:
            continue
        net = net_position(row)
        if net is None:
            continue
        grouped[symbol].append({
            "date": row["report_date_as_yyyy_mm_dd"],
            "net":  net,
            "oi":   open_interest(row),
            "week": get_iso_week_label(row["report_date_as_yyyy_mm_dd"])
        })
    
    # Sort DESC
    for sym in grouped:
        grouped[sym].sort(key=lambda x: x["date"], reverse=True)
    
    # Diagnostic: log record count per pair
    for sym in sorted(grouped.keys()):
        count = len(grouped[sym])
        if count == 0:
            log(f"WARNING: {sym} — 0 records (contract name mismatch?)")
        else:
            log(f"  {sym}: {count} records, latest={grouped[sym][0]['date'][:10]}")

    
    # Validate
    all_valid, latest_date = validate_latest_week(grouped)
    if not all_valid:
        return None, "DELAY"
    
    # Tính COT Index cho từng pair
    entries = []
    for symbol, records in grouped.items():
        if len(records) < 2:
            log(f"WARNING: {symbol} chỉ có {len(records)} records — bỏ qua")
            continue
        
        nets = [r["net"] for r in records]
        
        current  = nets[0]
        prev     = nets[1]
        
        # 52 tuần lookback (index 0..51)
        window   = nets[:52]
        low_52   = min(window)
        high_52  = max(window)
        
        idx      = cot_index(current, low_52, high_52)
        delta    = current - prev
        
        # Xu hướng 4 tuần: so sánh current vs 4 tuần trước
        trend_4w = "—"
        if len(records) >= 5:
            net_4w_ago = nets[4]
            diff_4w    = current - net_4w_ago
            pct        = diff_4w / abs(net_4w_ago) * 100 if net_4w_ago != 0 else 0
            if   pct >  15: trend_4w = "Tăng mạnh"
            elif pct >   5: trend_4w = "Tăng"
            elif pct >   1: trend_4w = "Tăng nhẹ"
            elif pct >  -1: trend_4w = "Ổn định"
            elif pct >  -5: trend_4w = "Giảm nhẹ"
            elif pct > -15: trend_4w = "Giảm"
            else:           trend_4w = "Giảm mạnh"
        
        # Momentum: prev_delta = delta of previous week
        prev_delta = nets[1] - nets[2] if len(records) >= 3 else None

        # Open Interest
        oi_cur  = records[0].get("oi")
        oi_prev = records[1].get("oi") if len(records) >= 2 else None
        oi_delta = (oi_cur - oi_prev) if (oi_cur is not None and oi_prev is not None) else None

        # 4-week history
        history_4w = nets[:4] if len(records) >= 4 else nets[:len(records)]

        # Historical averages
        avg_13w = round(sum(nets[:13]) / min(13, len(nets))) if len(nets) >= 4 else None
        avg_26w = round(sum(nets[:26]) / min(26, len(nets))) if len(nets) >= 8 else None

        entries.append({
            "pair":       symbol,
            "cur":        current,
            "prev":       prev,
            "lo":         low_52,
            "hi":         high_52,
            "t4":         trend_4w,
            "idxNum":     idx,
            "label":      cot_label(idx),
            "delta":      delta,
            "prev_delta": prev_delta,
            "oi":         oi_cur,
            "oi_prev":    oi_prev,
            "oi_delta":   oi_delta,
            "history_4w": history_4w,
            "avg_13w":    avg_13w,
            "avg_26w":    avg_26w,
            "reportDate": records[0]["date"],
            "weekLabel":  records[0]["week"],
        })
    
    return entries, latest_date

# ─────────────────────────────────────────────
#  SAVE
# ─────────────────────────────────────────────

def save(entries, report_date):
    DATA_DIR.mkdir(exist_ok=True)
    HISTORY_DIR.mkdir(exist_ok=True)
    
    # Parse week label từ report date
    d = datetime.fromisoformat(report_date.replace(".000", ""))
    iso = d.isocalendar()
    week_label = f"{iso[0]}-W{iso[1]:02d}"
    week_file  = HISTORY_DIR / f"{week_label}.json"
    
    payload = {
        "meta": {
            "weekLabel":   week_label,
            "reportDate":  report_date,
            "fetchedAt":   datetime.now(timezone.utc).isoformat(),
            "source":      "CFTC Legacy COT — Futures Only",
            "pairsCount":  len(entries),
        },
        "entries": entries
    }
    
    # Lưu history (chỉ ghi nếu chưa có — không overwrite)
    if not week_file.exists():
        week_file.write_text(json.dumps(payload, ensure_ascii=False, indent=2))
        log(f"✓ Saved history: {week_file.name}")
    else:
        log(f"History {week_file.name} đã tồn tại — bỏ qua")
    
    # Luôn update latest
    LATEST_FILE.write_text(json.dumps(payload, ensure_ascii=False, indent=2))
    log(f"✓ Updated: {LATEST_FILE.name}")

# ─────────────────────────────────────────────
#  MAIN
# ─────────────────────────────────────────────

def main():
    log("=== COT Fetcher START ===")
    
    try:
        raw = fetch_cftc_data()
    except Exception as e:
        log(f"FATAL: Fetch thất bại — {e}")
        sys.exit(1)
    
    entries, result = process(raw)
    
    if result == "DELAY":
        log("CFTC delay hoặc holiday — giữ nguyên file cũ, không ghi đè")
        log("=== COT Fetcher END (no update) ===")
        sys.exit(0)  # Exit 0 = không fail workflow, chỉ skip
    
    if not entries:
        log("FATAL: Không có entries nào sau khi process")
        sys.exit(1)
    
    save(entries, result)
    log(f"=== COT Fetcher END — {len(entries)} pairs saved ===")

if __name__ == "__main__":
    main()