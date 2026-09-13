/**
 * sync-mobile.js
 * Script de sincronización automática del frontend compilado de LogiFast
 * hacia las aplicaciones móviles de Capacitor (Cliente y Repartidor).
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '..');
const DESKTOP_DIR = path.resolve('/home/flashey/Escritorio');

const CLIENTE_DIR = path.join(DESKTOP_DIR, 'LogiFast-Cliente-Android');
const REPARTIDOR_DIR = path.join(DESKTOP_DIR, 'LogiFast-Repartidor-Android');

const CLIENTE_HTML = path.join(ROOT_DIR, '.next/server/app/app/cliente.html');
const REPARTIDOR_HTML = path.join(ROOT_DIR, '.next/server/app/app/repartidor.html');
const NEXT_STATIC = path.join(ROOT_DIR, '.next/static');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  const stats = fs.statSync(src);
  if (stats.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const file of fs.readdirSync(src)) {
      copyRecursive(path.join(src, file), path.join(dest, file));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

function syncProject(projectName, targetDir, htmlSource) {
  console.log(`\n📦 Sincronizando ${projectName}...`);
  const targetPublic = path.join(targetDir, 'public');

  if (!fs.existsSync(htmlSource)) {
    console.error(`❌ No se encontró el archivo compilado: ${htmlSource}`);
    console.error('Ejecuta primero: npx next build');
    process.exit(1);
  }

  // 1. Asegurar carpeta public en el proyecto destino
  fs.mkdirSync(targetPublic, { recursive: true });

  // 2. Copiar assets generales de public/ (logos, iconos, sw, sonidos)
  console.log('  → Copiando assets públicos (logo.png, iconos)...');
  copyRecursive(PUBLIC_DIR, targetPublic);

  // 3. Copiar bundle de Next.js (_next/static)
  console.log('  → Copiando bundles estáticos de React (_next/static)...');
  const targetNextStatic = path.join(targetPublic, '_next', 'static');
  fs.mkdirSync(targetNextStatic, { recursive: true });
  copyRecursive(NEXT_STATIC, targetNextStatic);

  // 4. Copiar página compilada como index.html
  console.log(`  → Instalando index.html nativo desde ${path.basename(htmlSource)}...`);
  fs.copyFileSync(htmlSource, path.join(targetPublic, 'index.html'));

  // 4.5 Asegurar soporte nativo de GPS para Huawei (sin Google Play Services)
  const geoJavaDest = path.join(
    targetDir,
    'node_modules/@capacitor/geolocation/android/src/main/java/com/capacitorjs/plugins/geolocation/Geolocation.java'
  );
  const geoPatchSrc = path.join(ROOT_DIR, 'scripts/patches/Geolocation.java');
  if (fs.existsSync(geoPatchSrc) && fs.existsSync(path.dirname(geoJavaDest))) {
    console.log('  → Asegurando parche nativo GPS para Huawei (LocationManager)...');
    fs.copyFileSync(geoPatchSrc, geoJavaDest);
  }

  // 5. Ejecutar npx cap sync android
  console.log('  → Ejecutando npx cap sync android...');
  try {
    execSync('npx cap sync android', { cwd: targetDir, stdio: 'inherit' });
    console.log(`✅ ${projectName} sincronizado exitosamente.`);
  } catch (err) {
    console.error(`⚠️ Advertencia al ejecutar cap sync en ${projectName}:`, err.message);
  }
}

console.log('🚀 INICIANDO SINCRONIZACIÓN MÓVIL LOGIFAST');
console.log('Origen:', ROOT_DIR);

if (fs.existsSync(CLIENTE_DIR)) {
  syncProject('LogiFast Cliente', CLIENTE_DIR, CLIENTE_HTML);
} else {
  console.warn('⚠️ Carpeta de Cliente no encontrada en:', CLIENTE_DIR);
}

if (fs.existsSync(REPARTIDOR_DIR)) {
  syncProject('LogiFast Repartidor', REPARTIDOR_DIR, REPARTIDOR_HTML);
} else {
  console.warn('⚠️ Carpeta de Repartidor no encontrada en:', REPARTIDOR_DIR);
}

console.log('\n🎉 ¡PROCESO COMPLETADO! Ambas apps tienen su frontend React real empaquetado y listo para Android.');
