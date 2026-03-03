## Action Plan — Lot Size Calculator

---

### Tab mới: "⊗ Lot Calculator"

Thêm vào thanh tabs hiện tại, đứng sau "⬢ COT Matrix" và trước "⊞ Bảng Tham Chiếu".

---

### Input — 5 trường

| Trường | Chi tiết |
|--------|----------|
| Cặp tiền | Dropdown tất cả major pairs |
| Tổng vốn ($) | Nhập số, nhớ giá trị qua localStorage |
| Risk % | Slider + input, mặc định 1% |
| SL (pips) | Nhập số nguyên |
| Spread (pips) | Nhập thập phân, VD: 1.2 |

**Riêng JPY pairs** — khi chọn cặp có JPY, xuất hiện thêm 1 trường: **Tỷ giá hiện tại** (VD: USD/JPY = 150.00). Trường này ẩn với non-JPY pairs.

**Lưu localStorage:** Vốn, Risk % — giữ nguyên giữa các lần dùng. SL và Spread reset mỗi lần (thay đổi theo từng lệnh).

---

### Pip Value logic theo từng nhóm

```
Nhóm 1 — Quote là USD (pip value cố định):
EUR/USD, GBP/USD, AUD/USD, NZD/USD
→ 1 pip = $10/lot — không cần thêm input

Nhóm 2 — Base là USD (pip value động):
USD/JPY, USD/CAD, USD/CHF
→ pip value = $10 ÷ tỷ giá hiện tại × tỷ giá quote
→ Cần nhập tỷ giá

Nhóm 3 — Cross pairs (cả base lẫn quote không phải USD):
EUR/JPY, GBP/JPY, EUR/GBP, EUR/CHF, GBP/CHF ...
→ pip value phức tạp hơn
→ Cần nhập tỷ giá USD của quote currency
```

**Giải pháp đơn giản hóa:** Với tất cả pairs không phải nhóm 1, tool hỏi thêm **"Pip value per standard lot ($)"** — người dùng tự nhập từ broker. Hiển thị gợi ý cách tìm con số này.

Lý do: Tránh sai lệch khi tính chéo nhiều cặp, đồng thời người dùng ICT thường biết pip value cặp mình trade.

---

### Output — 3 khối

**Khối 1 — Kết quả chính** (font lớn, nổi bật):
```
LOT SIZE: 0.61
Risk thực: $100.65
Pip risk: 16.5 pips (15 SL + 1.5 spread)
```

**Khối 2 — Projection R:R:**
```
TP 1:1 → +$100.65  (16.5 pips)
TP 1:2 → +$201.30  (33.0 pips)
TP 1:3 → +$301.95  (49.5 pips)
```
Hiển thị cả 3 mức, highlight mức R:R đang nhắm tới (mặc định 1:2 theo profile trader).

**Khối 3 — Cảnh báo thông minh:**
- Spread > 25% SL → `⚠ Spread ăn quá nhiều risk — cân nhắc mở rộng SL`
- Lot < 0.01 → `⚠ Lot dưới mức tối thiểu — tăng vốn hoặc giảm SL`
- Risk $ < $1 → `⚠ Risk quá nhỏ`
- SL = 0 → validate không cho tính

---

### Tính năng phụ — Prop Firm Mode

Toggle switch "Prop Firm Mode" — khi bật, xuất hiện thêm 2 trường:
- **Daily Loss Limit** ($) — VD: $500
- **Đã loss hôm nay** ($) — VD: $120

Output thêm:
```
Room còn lại: $380
Lệnh này dùng: $100.65 (26.5% room)
Còn có thể trade: 3 lệnh tương tự
⚠ Nếu thua lệnh này còn $279.35 room
```

---

### Không làm

- Không fetch tỷ giá realtime — tránh dependency, người dùng tự nhập
- Không lưu lịch sử lệnh — không phải journal, chỉ là calculator
- Không tích hợp với COT data — 2 tool độc lập, chỉ cùng tab bar

---

### Thứ tự code

1. HTML structure — tab mới, layout 2 cột (input trái, output phải)
2. Pip value logic theo nhóm pairs
3. Core calculation function
4. R:R projection
5. Cảnh báo
6. Prop Firm Mode toggle
7. localStorage cho vốn + risk %
