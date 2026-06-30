import glob

instruction = "\nINSTRUÇÃO CRÍTICA DO SCORE: O score OBRIGATÓRIO desta sessão é de ${input.ludicScore ?? 0}/100. Você NÃO DEVE tentar recalcular ou deduzir o score. Retorne EXATAMENTE este valor numérico na propriedade 'score'."

files = glob.glob('vigil-evaluator/src/prompts/*.ts')

for file in files:
    if 'utils.ts' in file or '_longitudinalBlock.ts' in file: continue
    
    with open(file, 'r') as f:
        content = f.read()
        
    if "INSTRUÇÃO CRÍTICA DO SCORE" in content:
        continue
        
    # We need to inject it right before `Gere o laudo nos 3 níveis do schema` or before the last backtick
    if "─────────────────────────────────────────────────────────────────────────────" in content:
        content = content.replace("─────────────────────────────────────────────────────────────────────────────", "─────────────────────────────────────────────────────────────────────────────\n" + instruction)
    
    with open(file, 'w') as f:
        f.write(content)

print("Updated prompt files.")
