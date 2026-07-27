import os
import re

FILES = [
    'src/app/api/ingeniero/mantenimientos/route.ts',
    'src/app/api/ingeniero/mantenimientos/[id]/iniciar/route.ts',
    'src/app/api/ingeniero/mantenimientos/[id]/completar/route.ts',
    'src/app/api/ingeniero/mantenimientos/[id]/cancelar/route.ts',
    'src/app/api/ingeniero/repuestos/route.ts',
    'src/app/api/ingeniero/alertas/route.ts',
    'src/app/api/ingeniero/motos/route.ts',
    'src/app/api/ingeniero/stats/route.ts',
    'src/app/api/horarios/route.ts',
    'src/app/api/feriados/route.ts',
    'src/app/api/codigos/route.ts',
    'src/app/api/campanas/route.ts',
    'src/app/api/banners/route.ts',
    'src/app/api/feed/route.ts',
    'src/app/api/plantillas/route.ts',
    'src/app/api/notificaciones-auto/route.ts',
    'src/app/api/mensajes/route.ts',
    'src/app/api/zonas/route.ts',
    'src/app/api/tiendas/route.ts',
    'src/app/api/tiendas/[id]/route.ts',
    'src/app/api/tiendas/[id]/productos/route.ts',
    'src/app/api/audit/route.ts',
]

CTX_PATTERN = re.compile(r"console\.error\(\s*['\"]\[(\w+)\]['\"]\s*,")

for filepath in FILES:
    if not os.path.exists(filepath):
        continue

    with open(filepath, 'r') as f:
        lines = f.readlines()

    if any('handleError' in l for l in lines):
        print(f"SKIP: {filepath}")
        continue

    new_lines = []
    i = 0
    modified = False
    while i < len(lines):
        line = lines[i]
        if 'catch (error)' in line:
            if i + 1 < len(lines):
                next_line = lines[i + 1]
                m = CTX_PATTERN.search(next_line)
                if m:
                    ctx = m.group(1)
                    new_lines.append("} catch (error) {\n")
                    new_lines.append(f"    return handleError(error, '{ctx}');\n")
                    new_lines.append("  }\n")
                    i += 3
                    if i < len(lines) and lines[i].strip() == '}':
                        i += 1
                    modified = True
                    continue
        new_lines.append(line)
        i += 1

    if modified:
        content = ''.join(new_lines)
        if "@/lib/auth/helpers" not in content:
            import_match = re.search(r'((?:import [^\n]+\n)+)', content)
            if import_match:
                last_import_end = import_match.end()
                content = content[:last_import_end] + "import { handleError } from '@/lib/auth/helpers';\n" + content[last_import_end:]

        with open(filepath, 'w') as f:
            f.write(content)
        print(f"OK: {filepath}")
    else:
        print(f"NO CHANGE: {filepath}")

print("\nDone!")
