import re

file_path = "/home/flashey/logifast/src/app/globals.css"

with open(file_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

# We only want to replace colors in the AUTH REDESIGN section: lines 11985 to the end
# Since python arrays are 0-indexed, line 11985 is index 11984
start_idx = 11984

replacements = [
    ("#FF5722", "#0066FF"),
    ("#FF8A65", "#D4AF37"),
    ("#FFB74D", "#FFE0B2"), # Let's use #FFE0B2 or #F5C75D for a gold gradient stop
    ("255,87,34", "0,102,255"),
    ("255, 87, 34", "0, 102, 255"),
    ("255, 138, 101", "212, 175, 55"), # gold RGB: 212, 175, 55
    ("rgba(255,255,255,0.6)", "rgba(255,255,255,0.08)"), # make inputs/cards glassmorphism more futuristic in light mode
]

for idx in range(start_idx, len(lines)):
    line = lines[idx]
    for old, new in replacements:
        line = line.replace(old, new)
        line = line.replace(old.lower(), new)
    lines[idx] = line

with open(file_path, "w", encoding="utf-8") as f:
    f.writelines(lines)

print("CSS colors replaced successfully in Auth section!")
