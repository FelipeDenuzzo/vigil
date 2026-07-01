import re
import os

files = [
    "src/attentions/sustained/games/FruitWatch/FruitWatchReportPanel.tsx",
    "src/attentions/sustained/games/LongMazes/LongMazesReportPanel.tsx",
]

for fpath in files:
    if not os.path.exists(fpath):
        continue
    with open(fpath, "r") as f:
        content = f.read()
    
    # regex for FruitWatch and LongMazes:
    # <p style={s.ludicScore}>{emoji} {score}</p>
    # {label && <p style={s.ludicLabel}>{label}</p>}
    # <div style={s.gaugeWrap}> ... </div> </div>
    pattern = r'<p style=\{s\.ludicScore\}>.*?</p>\s*\{label && <p style=\{s\.ludicLabel\}>.*?</p>\}\s*<div style=\{s\.gaugeWrap\}>.*?<div style=\{s\.gaugeLegend\}>.*?</div>\s*</div>'
    replacement = '<ReguaLudica score={score} level={level} />'
    
    new_content = re.sub(pattern, replacement, content, flags=re.DOTALL)
    
    with open(fpath, "w") as f:
        f.write(new_content)
    print(f"Fixed {fpath}")

