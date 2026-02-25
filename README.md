# COT Data — CFTC Weekly Positioning

Dữ liệu **Commitment of Traders (COT)** được tự động fetch từ CFTC mỗi tuần, tính toán COT Index 52 tuần, và phục vụ trực tiếp cho [COT Index Calculator](https://quici9.github.io/cot-data/).

---

## Tổng Quan

| Thành phần | Mô tả |
|---|---|
| `index.html` | Frontend single-page — COT Index Calculator + COT Matrix + Bảng Tham Chiếu |
| `scripts/fetch_cot.py` | Python script fetch dữ liệu từ CFTC Socrata API |
| `.github/workflows/fetch-cot.yml` | GitHub Actions — tự động chạy mỗi thứ Bảy 08:00 GMT+7 |
| `data/cot-latest.json` | Dữ liệu tuần mới nhất (8 currency pairs) |
| `data/history/YYYY-WXX.json` | Lịch sử theo tuần ISO |

---

## 8 Currency Pairs

| Pair | Hợp đồng CFTC |
|---|---|
| **EUR** | EURO FX — CME |
| **GBP** | BRITISH POUND — CME |
| **JPY** | JAPANESE YEN — CME |
| **AUD** | AUSTRALIAN DOLLAR — CME |
| **CAD** | CANADIAN DOLLAR — CME |
| **CHF** | SWISS FRANC — CME |
| **NZD** | NZ DOLLAR — CME |
| **USD** | USD INDEX — ICE FUTURES U.S. |

---

## Cấu Trúc Dữ Liệu

### `data/cot-latest.json`

```json
{
  "meta": {
    "weekLabel": "2026-W08",
    "reportDate": "2026-02-17T00:00:00.000",
    "fetchedAt": "2026-02-25T13:49:51.628082+00:00",
    "source": "CFTC Legacy COT — Futures Only",
    "pairsCount": 8
  },
  "entries": [
    {
      "pair": "EUR",
      "cur": 174480,          // Net Position tuần hiện tại
      "prev": 180305,         // Net Position tuần trước
      "lo": -25425,           // 52-week low
      "hi": 180305,           // 52-week high
      "idxNum": 97.17,        // COT Index (0–100)
      "label": "EXTREME BULL",// Bias label
      "delta": -5825,         // Thay đổi net position
      "oi": 916813,           // Total Open Interest
      "oi_prev": 926273,      // OI tuần trước
      "oi_delta": -9460,      // OI thay đổi
      "history_4w": [...],    // Net position 4 tuần gần nhất
      "avg_13w": 143155,      // Trung bình 13 tuần
      "avg_26w": 126498       // Trung bình 26 tuần
    }
  ]
}
```

### COT Index Formula

```
COT Index = (Current − 52w Low) / (52w High − 52w Low) × 100
```

| Khoảng | Label |
|---|---|
| 0 – 10 | EXTREME BEAR |
| 10 – 25 | BEARISH |
| 25 – 40 | BEARISH MILD |
| 40 – 60 | NEUTRAL |
| 60 – 75 | BULLISH MILD |
| 75 – 90 | BULLISH |
| 90 – 100 | EXTREME BULL |

---

## Auto-Fetch Workflow

```
┌──────────────────────────────────────────────┐
│  GitHub Actions — Mỗi Thứ Bảy 01:00 UTC     │
│  (08:00 GMT+7)                               │
├──────────────────────────────────────────────┤
│  1. Checkout repo                            │
│  2. Setup Python 3.11 + requests             │
│  3. python scripts/fetch_cot.py              │
│     → Fetch 53 tuần data từ CFTC API         │
│     → Validate 8 pairs đầy đủ               │
│     → Tính COT Index + OI                    │
│     → Ghi data/cot-latest.json               │
│     → Ghi data/history/YYYY-WXX.json         │
│  4. Nếu có thay đổi → commit + push          │
└──────────────────────────────────────────────┘
```

Có thể chạy thủ công từ GitHub UI: **Actions → Fetch COT Data → Run workflow**

---

## Frontend — COT Index Calculator

Mở trực tiếp `index.html` hoặc truy cập qua GitHub Pages.

### 3 Tabs chính

1. **⬡ Tính COT Index** — Nhập thủ công Net Position, tính COT Index + hiển thị gauge
2. **⬢ COT Matrix** — Toàn bộ 8 pairs trong 1 bảng, kèm:
   - GitHub Auto-Fetch (kết nối repo để lấy data tự động)
   - Ranking & Best Pairs
   - Signals / Divergence tự động
   - Pair Strength Grid 8×8
   - 4-Week History
   - Action Plan
   - Export (Markdown / JSON / CSV / Summary)
   - Import (CSV/Paste, JSON, File upload)
3. **⊞ Bảng Tham Chiếu** — Giải thích các zone và cách đọc COT

---

## Chạy Local

```bash
# Fetch data thủ công
pip install requests
python scripts/fetch_cot.py

# Mở frontend
open index.html
```

---

## License

Private — Internal use only.