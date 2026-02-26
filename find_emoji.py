import os
import re

# Broad emoji regex including symbols and pictographs
emoji_pattern = re.compile(
    "|".join([
        "[\U00010000-\U0010ffff]",
        "[\u2600-\u27bf]"
    ])
)

for root, _, files in os.walk('.'):
    for file in files:
        if file.endswith('.html'):
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8') as f:
                lines = f.readlines()
                for i, line in enumerate(lines):
                    if emoji_pattern.search(line):
                        print(f"{path}:{i+1}:{line.strip()}")
