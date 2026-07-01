import os
import re

fpath = "src/attentions/sustained/games/SalaDeVigilia/EvaluationReportPanel.tsx"
with open(fpath, "r") as f:
    content = f.read()

# Add ReguaLudica import if missing
if "import { ReguaLudica }" not in content:
    imports_end = [m for m in re.finditer(r"^import .*;\n", content, re.MULTILINE)]
    if imports_end:
        insert_pos = imports_end[-1].end()
        content = content[:insert_pos] + "import { ReguaLudica } from '../../../../shared/components/ReguaLudica';\n" + content[insert_pos:]

# Replace the text score with ReguaLudica
pattern = r'<div style=\{\{ fontSize: \'1\.5rem\'.*?</div>'
replacement = '<ReguaLudica score={scaleResult.score} level={scaleResult.level} />'

content = re.sub(pattern, replacement, content, flags=re.DOTALL)

with open(fpath, "w") as f:
    f.write(content)
print("Injected into SalaDeVigilia")
