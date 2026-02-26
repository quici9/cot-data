import re

file_path = 'cot/index.html'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

replacements = {
    '✕ Xoá tất cả': '${SVG_ICONS.x} Xóa tất cả',
    '<span class="imp-drop-icon">📂</span>': '<span class="imp-drop-icon">${SVG_ICONS.folder}</span>',
    'disabled>✓ Nạp vào': 'disabled>${SVG_ICONS.check} Nạp vào',
    '<div class="signals-title">⚡ Tín Hiệu Đặc Biệt</div>': '<div class="signals-title">${SVG_ICONS.zap} Tín Hiệu Đặc Biệt</div>',
    '<div class="actionplan-title">📋 Kế Hoạch Tuần Này</div>': '<div class="actionplan-title">${SVG_ICONS.clipboard} Kế Hoạch Tuần Này</div>',
    '<div class="ap-saved-hint" id="apSavedHint">✓ Đã lưu tự động</div>': '<div class="ap-saved-hint" id="apSavedHint">${SVG_ICONS.check} Đã lưu tự động</div>',
    '<td class="action-note">⚠ Cẩn thận': '<td class="action-note">${SVG_ICONS.alertTriangle} Cẩn thận',
    'hint.textContent = \'✕ Định dạng không hợp lệ\'': "hint.innerHTML = `<span style=\"display:flex;align-items:center;gap:4px\">${SVG_ICONS.x} Định dạng không hợp lệ</span>`",
    'hint.textContent = \'✓ Đọc được': "hint.innerHTML = `<span style=\"display:flex;align-items:center;gap:4px\">${SVG_ICONS.check} Đọc được",
    "label: 'OI ✓', star: ": "label: `OI ${SVG_ICONS.check}`, star: ",
    "label: 'OI ⚠', star: ": "label: `OI ${SVG_ICONS.alertTriangle}`, star: ",
    '<div class="pairs-section-label" style="color:var(--muted)">⚠ TRÁNH': '<div class="pairs-section-label" style="display:flex;align-items:center;gap:4px;color:var(--muted)">${SVG_ICONS.alertTriangle} TRÁNH',
    "icon: '🔄'": "icon: SVG_ICONS.refresh",
    "icon: '⚠️'": "icon: SVG_ICONS.alertTriangle",
    "icon: '📈'": "icon: SVG_ICONS.trendingUp",
    "icon: '🔥'": "icon: SVG_ICONS.zap",
    "icon: '🔀'": "icon: SVG_ICONS.shuffle",
    "icon: '💨'": "icon: SVG_ICONS.signalExhaust",
    "conf = '🟢 STRONG'": "conf = 'STRONG'",  # Removing since text is descriptive enough
    "conf = '🟡 REVERSAL?'": "conf = 'REVERSAL?'",
    "conf = '⚪ WEAK'": "conf = 'WEAK'",
    "\\n### ⚠ Tránh\\n": "\\n### Tránh\\n",
    "| ⚠ Cẩn thận reversal": "| Cẩn thận reversal",
    "⚠ TRÁNH:": "TRÁNH:",
    "showToast('✓ Đã copy!')": "showToast(`${SVG_ICONS.check} Đã copy!`)",
    "<span class=\"imp-err-msg\">⚠ ${r.error}</span>": "<span class=\"imp-err-msg\" style=\"display:flex;align-items:center;gap:4px\">${SVG_ICONS.alertTriangle} ${r.error}</span>",
    "<td style=\"color:var(--green)\">✓</td>": "<td style=\"color:var(--green)\">${SVG_ICONS.check}</td>",
    "nameEl.textContent = `📎 ${file.name}`": "nameEl.innerHTML = `<span style=\"display:flex;align-items:center;gap:4px\">${SVG_ICONS.paperclip} ${file.name}</span>`",
    "showToast(`✓ Đã nạp": "showToast(`${SVG_ICONS.check} Đã nạp",
    "showToast('✓ Đã lưu cấu hình": "showToast(`${SVG_ICONS.check} Đã lưu cấu hình",
    "<button class=\"btn-gh-edit\" onclick=\"editGhConfig()\">✎ Sửa</button>": "<button class=\"btn-gh-edit\" onclick=\"editGhConfig()\" style=\"display:flex;align-items:center;gap:4px\">${SVG_ICONS.edit} Sửa</button>",
    "showToast('⚠ Chưa cấu hình GitHub', 'warn')": "showToast(`${SVG_ICONS.alertTriangle} Chưa cấu hình GitHub`, 'warn')",
    "btn.innerHTML = '✕ Không tìm": "btn.innerHTML = SVG_ICONS.x + ' Không tìm",
    "btn.innerHTML = '✕ Repo Private'": "btn.innerHTML = SVG_ICONS.x + ' Repo Private'",
    "btn.innerHTML = '✕ JSON lỗi format'": "btn.innerHTML = SVG_ICONS.x + ' JSON lỗi format'",
    "btn.innerHTML = '✕ Dữ liệu rỗng'": "btn.innerHTML = SVG_ICONS.x + ' Dữ liệu rỗng'",
    "btn.innerHTML = '✕ Field thiếu'": "btn.innerHTML = SVG_ICONS.x + ' Field thiếu'",
    "statusEl.innerHTML = `⚠ Dữ liệu đã cũ": "statusEl.innerHTML = `<span style=\"display:flex;align-items:center;gap:4px\">${SVG_ICONS.alertTriangle} Dữ liệu đã cũ",
    "btn.innerHTML = '✓ Đã tải xong!'": "btn.innerHTML = SVG_ICONS.check + ' Đã tải xong!'",
    "statusEl.textContent.includes('⚠')": "statusEl.innerHTML.includes('alertTriangle')",
    "showToast(`✓ Đã tải": "showToast(`${SVG_ICONS.check} Đã tải",
    "btn.innerHTML = '✕ Lỗi kết nối'": "btn.innerHTML = SVG_ICONS.x + ' Lỗi kết nối'",
    "showToast('⚠ Không có cache', 'warn')": "showToast(`${SVG_ICONS.alertTriangle} Không có cache`, 'warn')",
    "showToast(`✓ Đã load": "showToast(`${SVG_ICONS.check} Đã load",
    "status.textContent = '✓ Đã lock bias!'": "status.innerHTML = SVG_ICONS.check + ' Đã lock bias!'",
    "showToast('✓ Weekly Bias đã lock": "showToast(`${SVG_ICONS.check} Weekly Bias đã lock",
    "showToast('⚠ Chưa có Matrix data', 'warn')": "showToast(`${SVG_ICONS.alertTriangle} Chưa có Matrix data`, 'warn')",
    "showToast(`✓ Đã lưu": "showToast(`${SVG_ICONS.check} Đã lưu"
}

for old, new in replacements.items():
    content = content.replace(old, new)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
