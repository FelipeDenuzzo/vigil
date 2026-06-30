import glob
import re

files = glob.glob('src/**/use*Evaluation.ts', recursive=True)

for file in files:
    with open(file, 'r') as f:
        content = f.read()
    
    # Change ludicScore: metrics.ludicScore to ludicScore: metrics.ludicScore ?? undefined
    content = content.replace('ludicScore: metrics.ludicScore }', 'ludicScore: metrics.ludicScore ?? undefined }')
    
    with open(file, 'w') as f:
        f.write(content)

print("Updated callEvaluator usages.")
