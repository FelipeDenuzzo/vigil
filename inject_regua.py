import os
import re

files_to_modify = [
    "src/attentions/alternated/games/ColorShape/ColorShapeReportPanel.tsx",
    "src/attentions/alternating/games/Insetos/InsetosReportPanel.tsx",
    "src/attentions/divided/games/MentalVault/MentalVaultReportPanel.tsx",
    "src/attentions/divided/games/SelectiveListening/SelectiveListeningReportPanel.tsx",
    "src/attentions/selective/games/AcharOFaltando/AcharOFaltandoReportPanel.tsx",
    "src/attentions/selective/games/VisualSearchHunt/EvaluationReportPanel.tsx",
    "src/attentions/sustained/games/FruitWatch/FruitWatchReportPanel.tsx",
    "src/attentions/sustained/games/LongMazes/LongMazesReportPanel.tsx",
    "src/attentions/sustained/games/SalaDeVigilia/EvaluationReportPanel.tsx",
]

for fpath in files_to_modify:
    if not os.path.exists(fpath):
        print(f"Skipping {fpath}")
        continue
    with open(fpath, "r") as f:
        content = f.read()

    # Import ReguaLudica
    if "import { ReguaLudica }" not in content:
        # Find the last import
        imports_end = [m for m in re.finditer(r"^import .*;\n", content, re.MULTILINE)]
        if imports_end:
            insert_pos = imports_end[-1].end()
            content = content[:insert_pos] + "import { ReguaLudica } from '../../../../shared/components/ReguaLudica';\n" + content[insert_pos:]

    # VisualSearchHunt and SalaDeVigilia use report.ludic.score, others use score
    is_report = 'report.ludic.score' in content or 'report.ludic?.score' in content
    
    score_var = "report.ludic.score" if is_report else "score"
    level_var = "report.level" if is_report else "level"

    if 'AcharOFaltando' in fpath:
        score_var = 'score'
        level_var = 'level'

    # The block looks like:
    # <div style={s.ludicContainer}> ... </div> (Achar o Faltando)
    # or just <p style={s.ludicScore}>...</p> <p style={s.ludicLabel}>...</p> <div style={s.gaugeWrap}>...</div>

    # Remove s.gaugeWrap ...
    content = re.sub(r'<div style=\{s\.gaugeWrap\}>.*?</div>\s*</div>\s*</div>', '', content, flags=re.DOTALL)
    # Actually regex matching HTML is bad. Let's just replace the entire {tab === 'ludic' && ( <> ... </> )} block
    
    # We will replace from {tab === 'ludic' && ( up to )} right before {tab === 'analysis'
    pattern = r"\{tab === 'ludic' && \(\s*<>(.*?)</>\s*\)\}"
    
    def repl(m):
        inner = m.group(1)
        # We replace the whole inner with ReguaLudica, BUT we must keep any grid/metrics!
        # If there are metricsGrid, we keep them.
        metrics_grid = ""
        if "metricsGrid" in inner:
            # extract metrics grid
            match_metrics = re.search(r'(<div style=\{s\.metricsGrid\}>.*)', inner, flags=re.DOTALL)
            if match_metrics:
                metrics_grid = match_metrics.group(1)
        
        replacement = f"""
          <>
            <ReguaLudica score={{{score_var}}} level={{{level_var}}} />
            {metrics_grid}
          </>
"""
        return "{tab === 'ludic' && (" + replacement + ")}"

    new_content = re.sub(pattern, repl, content, flags=re.DOTALL)
    
    # Check if there is <div style={s.ludicContainer}> 
    new_content = re.sub(r'<div style=\{s\.ludicContainer\}>.*?<div style=\{s\.gaugeWrap\}>.*?</div>\s*</div>\s*</div>\s*</div>', f'<ReguaLudica score={{{score_var}}} level={{{level_var}}} />', new_content, flags=re.DOTALL)

    with open(fpath, "w") as f:
        f.write(new_content)
    print(f"Patched {fpath}")

