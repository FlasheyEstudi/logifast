/**
 * LOGIFAST — Tests E2E de flujos críticos.
 * Ejecuta con: node tests/e2e.js
 * Requiere servidor corriendo en http://localhost:3000
 *
 * Uso:
 *   1. npm run dev
 *   2. node tests/e2e.js
 */

const BASE = process.env.API_URL || 'http://localhost:3000';

let passed = 0;
let failed = 0;
const failures = [];

function assert(condition, name, details) {
  if (condition) {
    console.log(`  ✅ ${name}`);
    passed++;
  } else {
    console.log(`  ❌ ${name}`);
    if (details) console.log(`     ${details}`);
    failed++;
    failures.push(name);
  }
}

async function fetchJSON(method, path, body, cookies) {
  const headers = { 'Content-Type': 'application/json' };
  if (cookies) headers.Cookie = cookies;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { _raw: text }; }
  return { status: res.status, json, headers: res.headers };
}

function getCookie(res) {
  const setCookie = res.headers.get('set-cookie');
  if (!setCookie) return '';
  const match = setCookie.match(/lf-session=([^;]+)/);
  return match ? `lf-session=${match[1]}` : '';
}

async function testAuth() {
  console.log('\n🔐 Auth Tests');

  // 1. Login con credenciales válidas
  let res = await fetchJSON('POST', '/api/auth/login', {
    email: 'cliente@logifast.com',
    password: '123456',
  });
  const clienteCookies = getCookie(res);
  assert(res.status === 200 && res.json.ok, 'Login cliente válido');
  assert(res.json.user?.role === 'cliente', 'Login retorna rol cliente');
  assert(res.json.user?.fotoUrl !== undefined, 'Login incluye fotoUrl');

  // 2. Login con contraseña incorrecta
  res = await fetchJSON('POST', '/api/auth/login', {
    email: 'cliente@logifast.com',
    password: 'incorrecta',
  });
  assert(res.status === 401, 'Login incorrecto retorna 401');
  assert(!res.json.ok, 'Login incorrecto retorna ok=false');

  // 3. Login con email inexistente
  res = await fetchJSON('POST', '/api/auth/login', {
    email: 'noexiste@test.com',
    password: '123456',
  });
  assert(res.status === 401, 'Login email inexistente retorna 401');

  // 4. /api/auth/me con cookie
  res = await fetchJSON('GET', '/api/auth/me', null, clienteCookies);
  assert(res.status === 200 && res.json.user?.email === 'cliente@logifast.com', 'me() retorna usuario logueado');

  // 5. /api/auth/me sin cookie
  res = await fetchJSON('GET', '/api/auth/me');
  assert(res.status === 200 && res.json.user === null, 'me() sin cookie retorna null');

  // 6. Logout
  res = await fetchJSON('POST', '/api/auth/logout', {}, clienteCookies);
  assert(res.status === 200 && res.json.ok, 'Logout exitoso');

  // 7. Login repartidor
  res = await fetchJSON('POST', '/api/auth/login', {
    email: 'repartidor@logifast.com',
    password: '123456',
  });
  const repartidorCookies = getCookie(res);
  assert(res.status === 200 && res.json.user?.role === 'repartidor', 'Login repartidor válido');

  // 8. Login admin
  res = await fetchJSON('POST', '/api/auth/login', {
    email: 'admin@logifast.com',
    password: '123456',
  });
  const adminCookies = getCookie(res);
  assert(res.status === 200 && res.json.user?.role === 'admin', 'Login admin válido');

  // 9. Login ingeniero
  res = await fetchJSON('POST', '/api/auth/login', {
    email: 'ingeniero@logifast.com',
    password: '123456',
  });
  const ingenieroCookies = getCookie(res);
  assert(res.status === 200 && res.json.user?.role === 'ingeniero', 'Login ingeniero válido');

  // 10. Register con email duplicado
  res = await fetchJSON('POST', '/api/auth/register', {
    name: 'Test',
    email: 'cliente@logifast.com',
    password: '123456',
    role: 'cliente',
  });
  assert(res.status === 409, 'Register duplicado retorna 409');

  // 11. Register con contraseña corta
  res = await fetchJSON('POST', '/api/auth/register', {
    name: 'Test',
    email: 'nuevo@test.com',
    password: '123',
    role: 'cliente',
  });
  assert(res.status === 400, 'Register contraseña corta retorna 400');

  // 12. Forgot password
  res = await fetchJSON('POST', '/api/auth/forgot-password', {
    email: 'cliente@logifast.com',
  });
  assert(res.status === 200 && res.json.ok, 'Forgot password exitoso');

  // 13. Forgot password email inexistente (mismo response por seguridad)
  res = await fetchJSON('POST', '/api/auth/forgot-password', {
    email: 'noexiste@test.com',
  });
  assert(res.status === 200 && res.json.ok, 'Forgot password email inexistente retorna mismo response');

  return { clienteCookies, repartidorCookies, adminCookies, ingenieroCookies };
}

async function testAuthProteccion(cookies) {
  console.log('\n🔒 Protección de rutas');

  // 1. Endpoint admin sin cookie → 401
  let res = await fetchJSON('POST', '/api/campanas', { titulo: 'test' });
  assert(res.status === 401, 'POST /api/campanas sin cookie → 401');

  // 2. Endpoint admin con cookie de cliente → 403
  res = await fetchJSON('POST', '/api/campanas', { titulo: 'test' }, cookies.clienteCookies);
  assert(res.status === 403, 'POST /api/campanas como cliente → 403');

  // 3. Endpoint admin con cookie de admin → success
  res = await fetchJSON('GET', '/api/campanas', null, cookies.adminCookies);
  assert(res.status === 200, 'GET /api/campanas como admin → 200');

  // 4. Endpoint ingeniero con cookie de cliente → 403
  res = await fetchJSON('GET', '/api/ingeniero/motos', null, cookies.clienteCookies);
  assert(res.status === 403, 'GET /api/ingeniero/motos como cliente → 403');

  // 5. Endpoint ingeniero con cookie de ingeniero → 200
  res = await fetchJSON('GET', '/api/ingeniero/motos', null, cookies.ingenieroCookies);
  assert(res.status === 200, 'GET /api/ingeniero/motos como ingeniero → 200');

  // 6. Upload sin auth
  res = await fetchJSON('POST', '/api/upload', null);
  assert(res.status === 401, 'POST /api/upload sin cookie → 401');
}

async function testMarketplace(cookies) {
  console.log('\n🛒 Marketplace Tests');

  // 1. Lista tiendas
  let res = await fetchJSON('GET', '/api/tiendas');
  assert(res.status === 200, 'GET /api/tiendas responde 200');
  assert(Array.isArray(res.json), 'Tiendas es un array');

  // 2. Detalle de tienda
  if (res.json.length > 0) {
    const tiendaId = res.json[0].id;
    res = await fetchJSON('GET', `/api/tiendas/${tiendaId}`);
    assert(res.status === 200, 'GET /api/tiendas/[id] responde 200');
    assert(res.json.id === tiendaId, 'Tienda tiene ID correcto');

    // 3. Productos de tienda
    res = await fetchJSON('GET', `/api/tiendas/${tiendaId}/productos`);
    assert(res.status === 200, 'GET /api/tiendas/[id]/productos responde 200');
    assert(Array.isArray(res.json.productos), 'Productos es un array');
  }

  // 4. Lista productos
  res = await fetchJSON('GET', '/api/productos');
  assert(res.status === 200, 'GET /api/productos responde 200');
  assert(res.json.total !== undefined, 'Productos tiene total');

  // 5. Crear orden de compra
  res = await fetchJSON('GET', '/api/tiendas');
  if (res.json.length > 0) {
    const tiendaId = res.json[0].id;
    res = await fetchJSON('GET', `/api/tiendas/${tiendaId}/productos`);
    if (res.json.productos?.length > 0) {
      const productoId = res.json.productos[0].id;
      res = await fetchJSON('POST', '/api/ordenes-compra', {
        tiendaId,
        items: [{ productoId, cantidad: 1 }],
        direccionEntrega: 'Test address',
        metodoPago: 'efectivo',
      }, cookies.clienteCookies);
      assert(res.status === 201 || res.json.ok, 'POST /api/ordenes-compra crea orden');
    }
  }

  // 6. Lista órdenes de compra del cliente
  res = await fetchJSON('GET', '/api/ordenes-compra', null, cookies.clienteCookies);
  assert(res.status === 200, 'GET /api/ordenes-compra del cliente → 200');

  // 7. Stories
  res = await fetchJSON('GET', '/api/stories');
  assert(res.status === 200, 'GET /api/stories → 200');
  assert(Array.isArray(res.json.stories), 'Stories es array');

  // 8. Zonas
  res = await fetchJSON('GET', '/api/zonas');
  assert(res.status === 200, 'GET /api/zonas → 200');
}

async function testRepartidor(cookies) {
  console.log('\n🛵 Repartidor Tests');

  // 1. Perfil
  let res = await fetchJSON('GET', '/api/repartidor/perfil', null, cookies.repartidorCookies);
  assert(res.status === 200, 'GET /api/repartidor/perfil → 200');
  assert(res.json.id !== undefined, 'Perfil tiene ID');

  // 2. Moto
  res = await fetchJSON('GET', '/api/repartidor/moto', null, cookies.repartidorCookies);
  assert(res.status === 200, 'GET /api/repartidor/moto → 200');

  // 3. Conexión
  res = await fetchJSON('PATCH', '/api/repartidor/conexion', { accion: 'conectar' }, cookies.repartidorCookies);
  assert(res.status === 200, 'PATCH /api/repartidor/conexion conectar → 200');
  assert(res.json.conectado === true, 'Repartidor conectado');

  // 4. Desconectar
  res = await fetchJSON('PATCH', '/api/repartidor/conexion', { accion: 'desconectar' }, cookies.repartidorCookies);
  assert(res.status === 200, 'PATCH /api/repartidor/conexion desconectar → 200');

  // 5. Órdenes (activa e historial)
  res = await fetchJSON('GET', '/api/repartidor/ordenes?estado=activa', null, cookies.repartidorCookies);
  assert(res.status === 200, 'GET /api/repartidor/ordenes?activa → 200');

  res = await fetchJSON('GET', '/api/repartidor/ordenes?estado=historial', null, cookies.repartidorCookies);
  assert(res.status === 200, 'GET /api/repartidor/ordenes?historial → 200');

  // 6. Stats
  res = await fetchJSON('GET', '/api/repartidor/stats?periodo=hoy', null, cookies.repartidorCookies);
  assert(res.status === 200, 'GET /api/repartidor/stats?periodo=hoy → 200');
  assert(res.json.stats !== undefined, 'Stats tiene stats');

  // 7. Notificaciones
  res = await fetchJSON('GET', '/api/repartidor/notificaciones', null, cookies.repartidorCookies);
  assert(res.status === 200, 'GET /api/repartidor/notificaciones → 200');

  // 8. Calificaciones
  res = await fetchJSON('GET', '/api/repartidor/calificaciones', null, cookies.repartidorCookies);
  assert(res.status === 200, 'GET /api/repartidor/calificaciones → 200');

  // 9. Recargas
  res = await fetchJSON('GET', '/api/recargas', null, cookies.repartidorCookies);
  assert(res.status === 200, 'GET /api/recargas → 200');

  // 10. Recarga con código inválido
  res = await fetchJSON('POST', '/api/recargas', {
    metodo: 'codigo',
    codigo: 'CODIGO_INEXISTENTE',
  }, cookies.repartidorCookies);
  assert(res.status === 400, 'Recarga con código inválido → 400');
}

async function testSocial(cookies) {
  console.log('\n👥 Social Tests');

  // 1. Like a un producto
  let res = await fetchJSON('GET', '/api/productos');
  if (res.json.productos?.length > 0) {
    const productoId = res.json.productos[0].id;

    res = await fetchJSON('POST', '/api/social/likes', { productoId }, cookies.clienteCookies);
    assert(res.status === 200, 'POST /api/social/likes → 200');
    assert(res.json.liked === true, 'Like creado');

    // 2. Ver like
    res = await fetchJSON('GET', `/api/social/likes?productoId=${productoId}`, null, cookies.clienteCookies);
    assert(res.status === 200, 'GET /api/social/likes → 200');
    assert(res.json.liked === true, 'Like confirmado');

    // 3. Unlike (toggle)
    res = await fetchJSON('POST', '/api/social/likes', { productoId }, cookies.clienteCookies);
    assert(res.json.liked === false, 'Unlike (toggle)');

    // 4. Comentar
    res = await fetchJSON('POST', '/api/social/comentarios', {
      entidad: 'producto',
      entidadId: productoId,
      contenido: 'Excelente producto!',
    }, cookies.clienteCookies);
    assert(res.status === 200 && res.json.ok, 'POST /api/social/comentarios → 200');

    // 5. Ver comentarios
    res = await fetchJSON('GET', `/api/social/comentarios?entidad=producto&entidadId=${productoId}`);
    assert(res.status === 200, 'GET /api/social/comentarios → 200');
    assert(res.json.comentarios.length > 0, 'Comentarios no vacío');

    // 6. Valorar producto
    res = await fetchJSON('POST', '/api/valoraciones', {
      productoId,
      estrellas: 5,
      comentario: 'Muy bueno',
    }, cookies.clienteCookies);
    assert(res.status === 200, 'POST /api/valoraciones → 200');

    // 7. Ver valoraciones
    res = await fetchJSON('GET', `/api/valoraciones?productoId=${productoId}`);
    assert(res.status === 200, 'GET /api/valoraciones → 200');
    assert(res.json.total > 0, 'Valoraciones no vacío');
  }
}

async function testDireccionesYPagos(cookies) {
  console.log('\n📍 Direcciones y Pagos Tests');

  // 1. Lista direcciones
  let res = await fetchJSON('GET', '/api/direcciones', null, cookies.clienteCookies);
  assert(res.status === 200, 'GET /api/direcciones → 200');

  // 2. Crear dirección
  res = await fetchJSON('POST', '/api/direcciones', {
    etiqueta: 'Casa Test',
    direccion: 'Dirección de prueba 123',
    lat: 12.12,
    lng: -86.25,
    referencia: 'Portón negro',
    predeterminada: true,
  }, cookies.clienteCookies);
  assert(res.status === 200 && res.json.ok, 'POST /api/direcciones → 200');
  const dirId = res.json.direccion?.id;

  // 3. Eliminar dirección
  if (dirId) {
    res = await fetchJSON('DELETE', `/api/direcciones?id=${dirId}`, null, cookies.clienteCookies);
    assert(res.status === 200, 'DELETE /api/direcciones → 200');
  }

  // 4. Métodos de pago
  res = await fetchJSON('GET', '/api/metodos-pago', null, cookies.clienteCookies);
  assert(res.status === 200, 'GET /api/metodos-pago → 200');
}

async function testMiTienda(cookies) {
  console.log('\n🏪 Mi Tienda Tests');

  // 1. GET tienda del cliente
  let res = await fetchJSON('GET', '/api/cliente/tienda', null, cookies.clienteCookies);
  assert(res.status === 200, 'GET /api/cliente/tienda → 200');

  // Si el cliente ya tiene tienda (creada en seed o test anterior)
  if (res.json.tienda) {
    const tiendaId = res.json.tienda.id;
    assert(res.json.tienda.stats !== undefined, 'Tienda incluye stats');

    // 2. Productos de la tienda
    res = await fetchJSON('GET', '/api/tiendas/' + tiendaId + '/productos');
    assert(res.status === 200, 'GET productos de mi tienda → 200');

    // 3. Pedidos de la tienda
    res = await fetchJSON('GET', '/api/cliente/tienda/pedidos', null, cookies.clienteCookies);
    assert(res.status === 200, 'GET /api/cliente/tienda/pedidos → 200');
  }
}

async function testExportData(cookies) {
  console.log('\n📤 Export Data Tests');

  // 1. Export sin auth
  let res = await fetchJSON('GET', '/api/auth/export-data');
  assert(res.status === 401, 'GET /api/auth/export-data sin cookie → 401');

  // 2. Export con auth
  res = await fetchJSON('GET', '/api/auth/export-data', null, cookies.clienteCookies);
  assert(res.status === 200, 'GET /api/auth/export-data con cookie → 200');
  assert(res.json.user !== undefined, 'Export incluye user');
  assert(res.json.generatedAt !== undefined, 'Export incluye timestamp');
}

async function testChangePassword(cookies) {
  console.log('\n🔑 Change Password Tests');

  // 1. Sin auth
  let res = await fetchJSON('POST', '/api/auth/change-password', {
    currentPassword: '123456',
    newPassword: 'nueva123',
  });
  assert(res.status === 401, 'POST /api/auth/change-password sin cookie → 401');

  // 2. Contraseña actual incorrecta
  res = await fetchJSON('POST', '/api/auth/change-password', {
    currentPassword: 'incorrecta',
    newPassword: 'nueva123',
  }, cookies.clienteCookies);
  assert(res.status === 401, 'Change password con contraseña actual incorrecta → 401');

  // 3. Nueva contraseña igual a actual
  res = await fetchJSON('POST', '/api/auth/change-password', {
    currentPassword: '123456',
    newPassword: '123456',
  }, cookies.clienteCookies);
  assert(res.status === 400, 'Change password misma contraseña → 400');

  // 4. Cambio exitoso y revertir
  res = await fetchJSON('POST', '/api/auth/change-password', {
    currentPassword: '123456',
    newPassword: 'nueva123',
  }, cookies.clienteCookies);
  assert(res.status === 200, 'Change password exitoso → 200');

  // Revertir
  res = await fetchJSON('POST', '/api/auth/change-password', {
    currentPassword: 'nueva123',
    newPassword: '123456',
  }, cookies.clienteCookies);
  assert(res.status === 200, 'Revertir password → 200');
}

async function main() {
  console.log('🧪 LOGIFAST — Tests E2E');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`Target: ${BASE}`);
  console.log('');

  try {
    const cookies = await testAuth();
    await testAuthProteccion(cookies);
    await testMarketplace(cookies);
    await testRepartidor(cookies);
    await testSocial(cookies);
    await testDireccionesYPagos(cookies);
    await testMiTienda(cookies);
    await testExportData(cookies);
    await testChangePassword(cookies);

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log(`✅ Pasaron: ${passed}`);
    console.log(`❌ Fallaron: ${failed}`);
    if (failures.length > 0) {
      console.log('\nTests fallidos:');
      failures.forEach(f => console.log(`  - ${f}`));
    }
    process.exit(failed === 0 ? 0 : 1);
  } catch (err) {
    console.error('\n💥 Error fatal:', err);
    process.exit(1);
  }
}

main();
