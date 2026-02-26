import re

file_path = '/Users/ttdh/WebstormProjects/cot-data/cot/index.html'
with open(file_path, 'r') as f:
    content = f.read()

# Remove old header styles
content = re.sub(
    r"  header \{.*?\}\n  \.tag \{.*?\}\n  h1 \{.*?\}\n  h1 span \{.*?\}\n  \.subtitle \{.*?\}\n",
    "",
    content,
    flags=re.DOTALL
)

# Replace <header> section
old_header = """  <header>
    <div class="tag"><a href="../index.html" style="color:inherit;text-decoration:none">NEXUS</a> · COT Dashboard</div>
    <h1>COT <span>Dashboard</span></h1>
    <div class="subtitle">Commitment of Traders · 52-Week Normalized Positioning · Macro Bias Filter</div>
  </header>"""

new_header = """  <div class="nx-page-header">
    <h1 class="nx-title"><a href="../index.html" style="color:inherit;text-decoration:none">NEXUS</a> · COT <span class="hl">Dashboard</span></h1>
    <p class="nx-subtitle">Commitment of Traders · 52-Week Normalized Positioning · Macro Bias Filter</p>
  </div>"""

content = content.replace(old_header, new_header)

with open(file_path, 'w') as f:
    f.write(content)
