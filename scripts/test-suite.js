const fs = require('fs');
const path = require('path');

console.log('====================================================');
console.log('   LOGIFAST AUTOMATED FULL SYSTEM VERIFICATION TEST   ');
console.log('====================================================\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, testName) {
  totalTests++;
  if (condition) {
    console.log(`[PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`[FAIL] ${testName}`);
    failedTests++;
  }
}

// 1. Test PWA Configuration & Assets
const manifestPath = path.join(__dirname, '../public/manifest.json');
assert(fs.existsSync(manifestPath), 'PWA: manifest.json file exists');
if (fs.existsSync(manifestPath)) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  assert(manifest.start_url === '/', 'PWA: manifest start_url is "/" (no 404)');
  assert(manifest.scope === '/', 'PWA: manifest scope is "/"');
  assert(manifest.display === 'standalone', 'PWA: display is "standalone"');
}

const swPath = path.join(__dirname, '../public/sw.js');
assert(fs.existsSync(swPath), 'PWA: Service Worker sw.js file exists');

const icon192Path = path.join(__dirname, '../public/icons/icon-192.png');
const icon512Path = path.join(__dirname, '../public/icons/icon-512.png');
assert(fs.existsSync(icon192Path), 'PWA: Icon icon-192.png exists');
assert(fs.existsSync(icon512Path), 'PWA: Icon icon-512.png exists');

// 2. Test Prisma Schema Integrity
const prismaSchemaPath = path.join(__dirname, '../prisma/schema.prisma');
assert(fs.existsSync(prismaSchemaPath), 'Database: schema.prisma exists');
if (fs.existsSync(prismaSchemaPath)) {
  const schemaText = fs.readFileSync(prismaSchemaPath, 'utf8');
  assert(schemaText.includes('model User'), 'Database Schema: User model defined');
  assert(schemaText.includes('model OrdenServicio'), 'Database Schema: OrdenServicio model defined');
  assert(schemaText.includes('model OrdenCompra'), 'Database Schema: OrdenCompra model defined');
  assert(schemaText.includes('model RepartidorProfile'), 'Database Schema: RepartidorProfile model defined');
  assert(schemaText.includes('model Tienda'), 'Database Schema: Tienda model defined');
  assert(schemaText.includes('model Producto'), 'Database Schema: Producto model defined');
  assert(schemaText.includes('model Moto'), 'Database Schema: Moto model defined');
}

// 3. Test API Route Definitions (Check all 81 routes)
const apiDir = path.join(__dirname, '../src/app/api');
function getAllRouteFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllRouteFiles(filePath));
    } else if (file === 'route.ts') {
      results.push(filePath);
    }
  });
  return results;
}

const routeFiles = getAllRouteFiles(apiDir);
assert(routeFiles.length >= 70, `API Routes: Found ${routeFiles.length} valid route.ts files (expected >= 70)`);

let validHandlers = 0;
routeFiles.forEach((routeFile) => {
  const content = fs.readFileSync(routeFile, 'utf8');
  if (content.includes('export async function GET') ||
      content.includes('export async function POST') ||
      content.includes('export async function PATCH') ||
      content.includes('export async function DELETE') ||
      content.includes('export async function PUT')) {
    validHandlers++;
  }
});
assert(validHandlers === routeFiles.length, `API Routes: All ${routeFiles.length} route.ts files export valid HTTP handlers`);

// 4. Test Key Component Existence
const clientAppPath = path.join(__dirname, '../src/components/client/ClientSolicitar.tsx');
const adminDashboardPath = path.join(__dirname, '../src/components/dashboard/DashboardShell.tsx');
const driverAppPath = path.join(__dirname, '../src/components/repartidor/RepartidorShell.tsx');
const storeAppPath = path.join(__dirname, '../src/lib/store.ts');
const driverStorePath = path.join(__dirname, '../src/lib/repartidor-store.ts');

assert(fs.existsSync(clientAppPath), 'Frontend: ClientSolicitar.tsx exists');
assert(fs.existsSync(adminDashboardPath), 'Frontend: DashboardShell.tsx exists');
assert(fs.existsSync(driverAppPath), 'Frontend: RepartidorShell.tsx exists');
assert(fs.existsSync(storeAppPath), 'Frontend Store: store.ts exists');
assert(fs.existsSync(driverStorePath), 'Frontend Store: repartidor-store.ts exists');

console.log('\n====================================================');
console.log(` RESULTS: ${passedTests}/${totalTests} TESTS PASSED (${Math.round((passedTests / totalTests) * 100)}%)`);
console.log('====================================================\n');

if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
