# 📖 NEXUS — Hướng Dẫn Sử Dụng

> **NEXUS** — ICT Trading Command Center  
> Hệ thống 5 công cụ phân tích giao dịch kết nối thành một workflow hoàn chỉnh.

---

## Mục Lục

1. [Tổng Quan Hệ Thống](#1-tổng-quan-hệ-thống)
2. [Cài Đặt & Truy Cập](#2-cài-đặt--truy-cập)
3. [Tool 1 — COT Dashboard](#3-tool-1--cot-dashboard)
4. [Tool 2 — Daily Bias Board](#4-tool-2--daily-bias-board)
5. [Tool 3 — Kill Zone Timer](#5-tool-3--kill-zone-timer)
6. [Tool 4 — Trade Journal](#6-tool-4--trade-journal)
7. [Tool 5 — Performance Hub](#7-tool-5--performance-hub)
8. [Settings & Cloud Sync](#8-settings--cloud-sync)
9. [Luồng Làm Việc Hàng Ngày](#9-luồng-làm-việc-hàng-ngày)
10. [Cấu Trúc Dữ Liệu](#10-cấu-trúc-dữ-liệu)
11. [FAQ & Xử Lý Sự Cố](#11-faq--xử-lý-sự-cố)

---

## 1. Tổng Quan Hệ Thống

NEXUS là bộ công cụ hỗ trợ trader ICT, gồm 5 module kết nối với nhau:

```
┌────────────────────────────────────────────────────────┐
│                     NEXUS HUB                          │
├──────────┬──────────┬──────────┬──────────┬────────────┤
│  COT     │  Daily   │  Kill    │  Trade   │  Perf      │
│ Dashboard│  Bias    │  Zone    │  Journal │  Hub       │
│          │  Board   │  Timer   │          │            │
└──────────┴──────────┴──────────┴──────────┴────────────┘
     ▲           │          │          ▲          ▲
     │           │          │          │          │
     └───────────┼──────────┼──────────┘          │
      COT bias   │   Session │  Trade data        │
      auto-fill  │   info    │                    │
                 └──────────┘                     │
                                Journal data ─────┘
```

| Module | Chức năng | Tần suất sử dụng |
|--------|-----------|-------------------|
| **COT Dashboard** | Phân tích COT Index 52 tuần, Matrix 8 cặp tiền, Signal tự động | Cuối tuần (khi có data mới) |
| **Daily Bias Board** | Xác định bias hàng ngày từ COT + Lãi suất + Tin tức | Mỗi tối trước phiên giao dịch |
| **Kill Zone Timer** | Đồng hồ Kill Zone real-time, Timeline tin tức | Trong ngày giao dịch |
| **Trade Journal** | Nhật ký giao dịch, auto-fill context từ các tool khác | Mỗi lần vào/thoát lệnh |
| **Performance Hub** | Phân tích Win Rate, RR, Expectancy, Prop Firm tracker | Cuối tuần review |

### Nguyên tắc thiết kế

- **Zero backend** — Toàn bộ data lưu trên `localStorage` của trình duyệt
- **Offline-first** — Hoạt động hoàn toàn không cần internet (trừ fetch COT data)
- **Single Source of Truth** — COT data fetch 1 lần, tất cả tool đọc chung
- **Auto-fill tối đa** — Giảm thiểu nhập liệu thủ công

---

## 2. Cài Đặt & Truy Cập

### Truy cập Online (GitHub Pages)

Truy cập trực tiếp:

```
https://quici9.github.io/cot-data/
```

Không cần cài đặt, hoạt động trên mọi trình duyệt hiện đại (Chrome, Firefox, Safari, Edge).

### Chạy Local

```bash
# Clone repo
git clone https://github.com/quici9/cot-data.git
cd cot-data

# Mở trực tiếp file HTML
open index.html

# Hoặc chạy local server (khuyến nghị)
npx serve .
# → truy cập http://localhost:3000
```

### Fetch data COT thủ công

```bash
pip install requests
python scripts/fetch_cot.py
```

### Auto-fetch (GitHub Actions)

Data COT được tự động fetch mỗi **Thứ Bảy 08:00 GMT+7** qua GitHub Actions.  
Có thể chạy thủ công: **Actions → Fetch COT Data → Run workflow**.

---

## 3. Tool 1 — COT Dashboard

**Đường dẫn:** `cot/index.html` | **Sidebar:** COT Dashboard

### Chức năng chính

COT Dashboard phân tích dữ liệu **Commitment of Traders** từ CFTC cho 8 đồng tiền:

| Đồng tiền | Hợp đồng CFTC |
|------------|----------------|
| EUR | EURO FX — CME |
| GBP | BRITISH POUND — CME |
| JPY | JAPANESE YEN — CME |
| AUD | AUSTRALIAN DOLLAR — CME |
| CAD | CANADIAN DOLLAR — CME |
| CHF | SWISS FRANC — CME |
| NZD | NZ DOLLAR — CME |
| USD | USD INDEX — ICE FUTURES U.S. |

### COT Index Formula

```
COT Index = (Current − 52w Low) / (52w High − 52w Low) × 100
```

### 7 Zone phân loại

| Khoảng | Label | Ý nghĩa |
|--------|-------|---------|
| 0 – 10 | EXTREME BEAR | Spec short cực đoan → reversal risk |
| 10 – 25 | BEARISH | Spec đang net short, bias bán |
| 25 – 40 | BEARISH MILD | Short vừa phải |
| 40 – 60 | NEUTRAL | Không có bias rõ ràng |
| 60 – 75 | BULLISH MILD | Long vừa phải |
| 75 – 90 | BULLISH | Spec đang net long, bias mua |
| 90 – 100 | EXTREME BULL | Spec long cực đoan → caution |

### Các tính năng

- **COT Matrix** — Bảng tổng hợp 8 cặp tiền: Net Position, Delta, COT Index, OI
- **Ranking & Best Pairs** — Xếp hạng pairs theo strength, gợi ý cặp tốt nhất
- **Signals / Divergence** — Phát hiện tự động flip, extreme, divergence
- **Pair Strength Grid 8×8** — Ma trận sức mạnh giữa các cặp tiền
- **4-Week History** — Lịch sử 4 tuần gần nhất cho mỗi pair
- **Action Plan** — Đề xuất giao dịch dựa trên phân tích
- **Export** — Xuất Markdown, JSON, CSV, Summary
- **Import** — Nhập từ CSV/Paste, JSON, File upload

### Cách sử dụng

1. Vào **COT Dashboard**
2. Data sẽ tự động tải từ `data/cot-latest.json` (được fetch hàng tuần)
3. Xem **COT Matrix** để nắm bức tranh tổng thể
4. Kiểm tra **Signals** để xem có cảnh báo đặc biệt
5. Xem **Best Pairs** để biết cặp nào đáng giao dịch nhất
6. Lưu bias tuần bằng nút **Lock Weekly Bias** → Data tự động truyền sang Daily Bias Board

---

## 4. Tool 2 — Daily Bias Board

**Đường dẫn:** `bias/index.html` | **Sidebar:** Daily Bias

### Mục đích

Mỗi tối trước khi ngủ, mở tool này, điền **5-10 phút**, có ngay **Daily Bias rõ ràng** cho ngày mai.

### Wizard 6 bước

| Bước | Nội dung | Loại |
|------|----------|------|
| **Step 1** | Chọn pairs muốn trade hôm nay | Thủ công |
| **Step 2** | COT bias — tự động lấy từ COT Dashboard | Tự động |
| **Step 3** | News bias — đánh giá tin tức tác động | Bán tự động |
| **Step 4** | Interest Rate spread — chênh lệch lãi suất | Tự động |
| **Step 5** | Market condition — đánh giá thị trường | Thủ công |
| **Step 6** | Final bias + Confidence score | Tổng hợp |

### Logic xác định Confidence

```
🟢 HIGH CONFIDENCE — Khi 3+ nguồn đồng thuận
🟡 MEDIUM — Khi có 1 nguồn trái chiều
🔴 LOW — Khi có contradiction rõ ràng hoặc tin Tier 1
```

### Cách sử dụng

1. Vào **Daily Bias Board**
2. Chọn pairs bạn muốn theo dõi
3. Kiểm tra COT bias (auto-fill từ COT Dashboard)
4. Đánh giá news impact
5. Xem interest rate spread
6. Nhập market condition assessment
7. Nhấn **Save Bias** → Bias được lưu và tự động link vào Trade Journal

---

## 5. Tool 3 — Kill Zone Timer

**Đường dẫn:** `killzone/index.html` | **Sidebar:** Kill Zone

### Kill Zone Schedule (giờ EST)

| Kill Zone | Thời gian EST | Mô tả |
|-----------|---------------|-------|
| 🌏 **Asian** | 7:00 PM – 10:00 PM | Phiên Á — LQ sweep, accumulation |
| 🇬🇧 **London** | 2:00 AM – 5:00 AM | Phiên London — High volatility |
| 🇺🇸 **New York** | 7:00 AM – 9:00 AM | Phiên NY — Continuation/reversal |
| 🔒 **London Close** | 10:00 AM – 12:00 PM | London close — Reversal window |

### Tính năng

- **Real-time Clock** — Hiển thị giờ hiện tại và Kill Zone đang active
- **Progress Bar** — Thanh tiến trình cho KZ đang diễn ra
- **Countdown** — Đếm ngược đến KZ tiếp theo
- **News Timeline** — Timeline tin tức sắp tới theo thời gian
- **Smart Recommendation** — Khuyến nghị dựa trên Daily Bias đã lưu
- **Tự động điều chỉnh DST** — Tự chuyển đổi khi Mỹ/EU đổi giờ

### Cách sử dụng

1. Mở **Kill Zone Timer** và **để chạy nền trong ngày**
2. Timer tự động hiển thị KZ đang active
3. Kiểm tra **News Timeline** trước khi vào lệnh
4. Đọc **Smart Recommendation** để biết tin tức có ảnh hưởng đến bias không

---

## 6. Tool 4 — Trade Journal

**Đường dẫn:** `journal/index.html` | **Sidebar:** Journal

### Triết lý

> Journal tốt nhất là journal được **điền đầy đủ** — phải nhanh và không đau.

### KPI Dashboard

Bảng tổng hợp hiệu suất giao dịch hiển thị ngay đầu trang:

- **Total Trades** — Tổng số lệnh
- **Win Rate** — Tỷ lệ thắng
- **Avg Risk:Reward** — RR trung bình
- **Net R-Multiple** — Tổng R đạt được

### Cấu trúc Trade Entry

Khi tạo lệnh mới, form gồm 5 phần:

**Section 1 — Context (auto-fill)**

Tự động lấy từ COT Dashboard + Daily Bias:
- Pair, Session, COT Bias, Rate Spread, News Risk

**Section 2 — Execution (nhập tay)**
- Entry Price, Stop Loss, TP1/TP2/TP3
- Auto-calc: pip distance, RR, risk amount

**Section 3 — ICT Setup Checklist**

```
□ Liquidity swept before entry
□ MSS confirmed on LTF
□ In Kill Zone
□ FVG or OB present
□ HTF bias aligned  
□ No news within 30 minutes
→ Auto-calc compliance %
```

**Section 4 — Psychology (quick select)**
- Mood: Calm / Anxious / Excited / Tired / Revenge
- Confidence: 1–5
- Notes: free text

**Section 5 — Result (điền sau khi đóng lệnh)**
- Close Price, Outcome (Win/Loss/BE)
- Auto-calc: actual RR, P/L, duration

### Cách sử dụng

1. Vào **Trade Journal**
2. Nhấn **+ New Trade** để mở form
3. Context sẽ tự động fill từ COT + Daily Bias
4. Nhập thông tin Execution
5. Check ICT Setup Checklist
6. Chọn Mood + Confidence
7. **Save** → Trade card hiện trên danh sách
8. Sau khi đóng lệnh → **Edit** để nhập Result

### Filter & Search

- Filter theo: Pair, Session, Outcome, thời gian
- Mỗi trade hiển thị dạng card với đầy đủ thông tin KPI

---

## 7. Tool 5 — Performance Hub

**Đường dẫn:** `performance/index.html` | **Sidebar:** Performance

### Mục đích

Không phải để nhìn P/L, mà để **tìm ra đâu là edge thực sự** của bạn.

### Metrics tổng quan

| Metric | Mô tả |
|--------|-------|
| **Win Rate** | Tỷ lệ lệnh thắng / tổng lệnh |
| **Avg Risk:Reward** | RR trung bình trên các lệnh thắng |
| **Expectancy** | Kỳ vọng trung bình mỗi lệnh (R) |
| **Net R** | Tổng R tích lũy |

### Breakdown Analysis

Phân tích hiệu suất theo nhiều chiều:

```
├── Pair      → EUR/JPY vs GBP/JPY — Cặp nào bạn trade tốt hơn?
├── Session   → London vs NY — Bạn giỏi hơn ở phiên nào?
├── Day       → Thứ mấy bạn trade tốt nhất?
├── Mood      → Calm vs Anxious — Tâm lý ảnh hưởng ra sao?
└── Compliance → Tuân thủ checklist vs không — Khác biệt thế nào?
```

### Auto Insights

Hệ thống tự động phát hiện patterns và đưa ra nhận xét:

```
"⚡ Khi bạn trade London Session với Compliance ≥ 5/6,
 Win Rate là 71% và Avg RR là 2.6.
 Khi bạn trade NY Session, Win Rate chỉ 38%.
 → Cân nhắc giảm frequency ở NY."
```

### Equity Curve

Biểu đồ equity theo thời gian, vẽ bằng Canvas.

### Prop Firm Tracker

Theo dõi tiến trình challenge prop firm:

```
Profit Target: $10,000  │ Current: $6,240 (62.4%)
Daily DD Limit: $1,000  │ Today: $240 (24%)
Max DD Limit: $5,000    │ Used: $1,840 (36.8%)
Days Remaining: 18      │ Daily target needed: $196
Status: 🟢 ON TRACK
```

Cấu hình Prop Firm tại **Settings → Prop Firm Settings**.

---

## 8. Settings & Cloud Sync

**Đường dẫn:** `settings/index.html` | **Sidebar:** Settings

### Cloud Sync (GitHub Gist)

NEXUS hỗ trợ đồng bộ dữ liệu giữa nhiều thiết bị qua **GitHub Secret Gist** với mã hóa **AES-256-GCM**.

#### Thiết lập lần đầu

1. Vào **Settings** → phần **Cloud Sync**
2. Tạo **GitHub Personal Access Token (PAT)**:
   - Vào [github.com/settings/tokens](https://github.com/settings/tokens)
   - Tạo token với scope: `gist`
   - Copy token
3. Nhập **PAT** vào ô GitHub Token
4. Đặt **Mật khẩu mã hóa** (ghi nhớ — mất mật khẩu = mất data cloud)
5. Nhấn **Kết nối**

#### Các thao tác sync

| Thao tác | Mô tả |
|----------|-------|
| **Sync** | Merge thông minh — kết hợp data local và cloud |
| **Push** | Đẩy data local lên cloud (ghi đè cloud) |
| **Pull** | Kéo data cloud về local (ghi đè local) |
| **Ngắt kết nối** | Xóa credentials, xóa Gist trên cloud |

#### Dữ liệu được sync

```
✅ nexus_trades         — Nhật ký giao dịch
✅ nexus_weekly_bias     — Bias tuần từ COT
✅ nexus_daily_bias      — Bias hàng ngày
✅ nexus_alerts          — Lịch sử cảnh báo
✅ nexus_rates           — Lãi suất NHTW
✅ nexus_settings        — Cài đặt chung
✅ nexus_prop_settings   — Cài đặt Prop Firm
✅ cot_history           — Lịch sử COT
✅ cot_actionplan_*      — Action plans
```

#### Bảo mật

- Data được **mã hóa AES-256-GCM** trước khi upload
- Sử dụng **PBKDF2** với 100,000 iterations để derive key
- GitHub Token chỉ lưu local, **không bao giờ gửi cho bên thứ 3**
- Gist là **Secret** (không index, không tìm kiếm được)

### Local Backup

- **Export JSON** — Xuất toàn bộ data thành file `.json`
- **Import JSON** — Nhập data từ file backup
- **Xoá toàn bộ dữ liệu** — Reset localStorage về trạng thái ban đầu

### Trạng thái Sync

Trạng thái đồng bộ hiển thị trên **sidebar navigation**:

| Trạng thái | Ý nghĩa |
|------------|---------|
| 🟢 Synced | Data đã đồng bộ, không có thay đổi |
| 🟡 Pending | Có thay đổi chưa được sync |
| ⚫ Offline | Chưa cấu hình sync |

---

## 9. Luồng Làm Việc Hàng Ngày

### Cuối tuần (Thứ 7–CN)

```
1. Data COT tự động cập nhật (08:00 Thứ 7)
2. Mở COT Dashboard → Xem COT Matrix
3. Phân tích Signals, Best Pairs, Pair Strength
4. Lock Weekly Bias cho tuần mới
5. Review Performance Hub → Rút bài học tuần trước
```

### Mỗi tối (trước phiên giao dịch)

```
1. Mở Daily Bias Board
2. Chọn pairs → Review COT bias (auto)
3. Đánh giá News + Rate spread
4. Nhập Market condition
5. Save Final Bias → Sẵn sàng cho ngày mai
```

### Trong ngày giao dịch

```
1. Mở Kill Zone Timer → Để chạy nền
2. Kiểm tra KZ nào đang active
3. Xem News Timeline trước khi vào lệnh
4. Khi vào lệnh → Mở Trade Journal → + New Trade
5. Trade context auto-fill → Nhập execution + checklist
6. Sau khi đóng lệnh → Edit trade → Nhập result
```

### Tổng kết (hàng tuần)

```
1. Mở Performance Hub
2. Xem Breakdown: Pair nào tốt nhất? Session nào?
3. Đọc Auto Insights
4. Kiểm tra Prop Firm progress
5. Điều chỉnh strategy cho tuần sau
```

---

## 10. Cấu Trúc Dữ Liệu

### Cây thư mục

```
cot-data/
├── index.html              ← Hub chính (NEXUS landing page)
├── hub.html                ← Hub backup
├── cot/
│   └── index.html          ← COT Dashboard
├── bias/
│   └── index.html          ← Daily Bias Board
├── killzone/
│   └── index.html          ← Kill Zone Timer
├── journal/
│   └── index.html          ← Trade Journal
├── performance/
│   └── index.html          ← Performance Hub
├── settings/
│   └── index.html          ← Settings & Sync
├── shared/                 ← Shared layer
│   ├── style.css           ← Design system (tokens, components)
│   ├── utils.js            ← COT zones, icons, toast, helpers
│   ├── store.js            ← localStorage manager
│   ├── crypto.js           ← AES-256-GCM encryption
│   ├── sync.js             ← GitHub Gist sync engine
│   └── nav.js              ← Sidebar navigation
├── data/
│   ├── cot-latest.json     ← Data COT tuần mới nhất
│   └── history/
│       └── YYYY-WXX.json   ← Lịch sử theo tuần ISO
├── scripts/
│   └── fetch_cot.py        ← Script fetch từ CFTC API
└── .github/
    └── workflows/
        └── fetch-cot.yml   ← GitHub Actions tự động fetch
```

### localStorage Keys

| Key | Mô tả | Tool sử dụng |
|-----|-------|--------------|
| `nexus_cot_latest` | Data COT tuần mới nhất | COT Dashboard |
| `nexus_weekly_bias` | Bias tuần (locked) | COT → Daily Bias |
| `nexus_daily_bias` | Bias hàng ngày | Daily Bias → Journal |
| `nexus_trades` | Nhật ký giao dịch | Journal → Performance |
| `nexus_rates` | Lãi suất NHTW | Daily Bias |
| `nexus_alerts` | Lịch sử cảnh báo | COT Dashboard |
| `nexus_settings` | Cài đặt chung | Settings |
| `nexus_matrix_cache` | Cache COT Matrix | COT Dashboard |
| `nexus_github_config` | GitHub token + Gist ID | Sync |

### Shared Layer

Mỗi trang HTML load chung 5 file shared theo thứ tự:

```html
<script src="shared/utils.js"></script>   <!-- 1. Zones, icons, helpers -->
<script src="shared/store.js"></script>   <!-- 2. localStorage manager -->
<script src="shared/crypto.js"></script>  <!-- 3. AES encryption -->
<script src="shared/sync.js"></script>    <!-- 4. GitHub Gist sync -->
<script src="shared/nav.js"></script>     <!-- 5. Sidebar navigation -->
```

**Lưu ý:** Thứ tự load quan trọng vì có dependency chain:
- `sync.js` phụ thuộc `crypto.js` và `store.js`
- `nav.js` phụ thuộc `utils.js` (SVG icons)
- `store.js` tự động gọi `SyncEngine.markDirty()` khi data thay đổi

---

## 11. FAQ & Xử Lý Sự Cố

### Data COT không cập nhật?

1. Kiểm tra **Actions** tab trên GitHub → xem workflow có chạy thành công không
2. Chạy thủ công: **Actions → Fetch COT Data → Run workflow**
3. CFTC thường publish data muộn 1-2 ngày sau thứ 6 → workflow sẽ retry

### Data bị mất khi xoá browser data?

NEXUS lưu data trên `localStorage`. Nếu clear browser data, data sẽ mất.  
**Giải pháp:** 
- Thiết lập **Cloud Sync** tại Settings
- Hoặc **Export JSON** định kỳ để backup

### Muốn dùng trên điện thoại?

Giao diện NEXUS responsive, hoạt động trên mobile browser.  
Để sync data giữa mobile và desktop → dùng **Cloud Sync**.

### Quên mật khẩu mã hóa cloud?

⚠️ **Không thể khôi phục.** Mật khẩu mã hóa không được lưu ở đâu.  
Bạn cần:
1. Ngắt kết nối sync cũ
2. Thiết lập lại sync mới với mật khẩu mới
3. Push data local lên cloud mới

### Kill Zone giờ sai?

Kiểm tra timezone của trình duyệt. NEXUS tự động convert sang múi giờ local.  
Nếu thiết bị đang ở timezone khác → điều chỉnh trong Settings hoặc system clock.

### Sync bị conflict?

Dùng nút **Sync** (merge thông minh) thay vì Push/Pull:
- **Sync** sẽ so sánh timestamp và merge data thông minh
- Trades được merge theo ID — không mất entry nào
- Các data khác dùng "last write wins" theo timestamp

---

## Tech Stack

| Thành phần | Công nghệ |
|------------|-----------|
| Frontend | Vanilla HTML + CSS + JavaScript |
| Fonts | Inter, Space Mono, Syne (Google Fonts) |
| Icons | Lucide SVG (inline) |
| Storage | localStorage + GitHub Gist |
| Encryption | Web Crypto API (AES-256-GCM) |
| Data Source | CFTC Socrata API |
| CI/CD | GitHub Actions |
| Hosting | GitHub Pages |

---

> **NEXUS** v1.0 — Private, Internal use only.  
> Dữ liệu: CFTC.gov · Cập nhật mỗi thứ Sáu
