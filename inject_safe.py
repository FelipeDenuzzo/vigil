import os
import re

files = [
    "src/attentions/alternated/games/ColorShape/ColorShapeReportPanel.tsx",
    "src/attentions/alternating/games/Insetos/InsetosReportPanel.tsx",
    "src/attentions/divided/games/MentalVault/MentalVaultReportPanel.tsx",
    "src/attentions/divided/games/SelectiveListening/SelectiveListeningReportPanel.tsx",
    "src/attentions/selective/games/AcharOFaltando/AcharOFaltandoReportPanel.tsx",
    "src/attentions/selective/games/VisualSearchHunt/EvaluationReportPanel.tsx",
    "src/attentions/sustained/games/FruitWatch/FruitWatchReportPanel.tsx",
    "src/attentions/sustained/games/LongMazes/LongMazesReportPanel.tsx",
]

for fpath in files:
    if not os.path.exists(fpath):
        continue
    with open(fpath, "r") as f:
        content = f.read()
    
    # 1. Add import ReguaLudica
    if "import { ReguaLudica }" not in content:
        imports_end = [m for m in re.finditer(r"^import .*;\n", content, re.MULTILINE)]
        if imports_end:
            insert_pos = imports_end[-1].end()
            content = content[:insert_pos] + "import { ReguaLudica } from '../../../../shared/components/ReguaLudica';\n" + content[insert_pos:]
            
    is_report = 'report.ludic.score' in content or 'report.ludic?.score' in content or 'report.score' in content
    score_var = "report.score" if is_report else "score"
    level_var = "report.level" if is_report else "level"
    
    if 'AcharOFaltando' in fpath:
        score_var = "score"
        level_var = "level"
        
    if 'FruitWatch' in fpath:
        score_var = "score"
        level_var = "level"
        
    # In VisualSearchHunt, the old code used report.ludic.score. We must remove that because we reverted it.
    content = content.replace("report.ludic.score", "report.score")
    content = content.replace("report.ludic.emoji", "'🎯'")
    content = content.replace("report.ludic.label", "''")

    # The block we want to replace has:
    # <p style={s.ludicScore}>...</p>
    # <p style={s.ludicLabel}>...</p>
    # <div style={s.gaugeWrap}>
    #   ...
    # </div> (gaugeLegend)
    # </div> (gaugeWrap)
    # Optional </div> if it was wrapped in ludicContainer.
    
    # Let's just regex match the exact block for the gauge:
    if "s.ludicContainer" in content:
        # AcharOFaltando
        pattern = r'<div style=\{s\.ludicContainer\}>.*?<div style=\{s\.gaugeLegend\}>.*?</div>\s*</div>\s*</div>'
    else:
        # Others
        pattern = r'<p style=\{s\.ludicScore\}>.*?</p>\s*<p style=\{s\.ludicLabel\}>.*?</p>\s*<div style=\{s\.gaugeWrap\}>.*?<div style=\{s\.gaugeLegend\}>.*?</div>\s*</div>'
        
    replacement = f'<ReguaLudica score={{{score_var}}} level={{{level_var}}} />'
    new_content = re.sub(pattern, replacement, content, flags=re.DOTALL)
    
    with open(fpath, "w") as f:
        f.write(new_content)
    print(f"Injected into {fpath}")
