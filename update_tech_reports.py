import glob
import re

files = glob.glob('src/**/build*TechnicalReport.ts', recursive=True)

for file in files:
    with open(file, 'r') as f:
        content = f.read()
    
    # Simple strategy: look for "score:" and if there's no "ludicScore:" around it, inject it.
    if 'ludicScore:' in content:
        continue
    
    # Just append ludicScore: metrics.ludicScore (or m.ludicScore or similar) to the returned object
    # For many games, the param is `metrics: [Game]Metrics`
    if 'metrics' in content:
        content = re.sub(r'(score:[^,\n]+,?)', r'\1\n      ludicScore: metrics.ludicScore,', content)
    elif 'm: ' in content: # visual search uses 'm'
        content = re.sub(r'(score:[^,\n]+,?)', r'\1\n      ludicScore: m.ludicScore,', content)
        
    with open(file, 'w') as f:
        f.write(content)

print("Updated technical reports.")
