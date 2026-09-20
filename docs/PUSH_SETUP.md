# Notificaciones push reales — qué falta para activarlas

La aplicación ya sabe **recibir** notificaciones con la app cerrada. Este documento
lista lo único que no puedo generar yo porque depende de una credencial tuya.

## Estado actual (verificado en el código)

- `@capacitor/push-notifications` **ya está instalado** en las apps Android Cliente y
  Repartidor, y en el proyecto principal.
- El backend ya sabe **enviar** por FCM HTTP v1 (`src/lib/push/fcm.ts`) y decide
  cuándo hacerlo (`src/lib/push/notificar-pedido.ts`), con deduplicación por
  pedido + estado.
- El cliente ya **registra** el dispositivo y guarda el token en la tabla
  `DeviceToken` (`src/services/push.ts` + `/api/device-token`).
- Lo que faltaba hasta ahora no era código: era la **credencial de Firebase**. Sin
  ella, el sistema avisa en la bandeja interna y por socket, y no intenta fingir un
  push que no puede entregar.

## Lo que necesito de ti

### 1. Proyecto de Firebase

1. Crear (o usar) un proyecto en <https://console.firebase.google.com>.
2. Dentro, agregar una **app Android** por cada app del repo. El `applicationId`
   debe coincidir EXACTAMENTE con el del proyecto Android correspondiente
   (revisar `android/app/build.gradle` en cada carpeta).
3. Descargar `google-services.json` de cada app y colocarlo en:

```
~/Escritorio/LogiFast-Cliente-Android/android/app/google-services.json
~/Escritorio/LogiFast-Repartidor-Android/android/app/google-services.json
```

Estos archivos **no se suben al repositorio** (son por app y por entorno).

### 2. Credencial del servidor

En Firebase: *Configuración del proyecto → Cuentas de servicio → Generar nueva clave
privada*. Se descarga un JSON. Su contenido completo va en la variable de entorno del
servidor (Netlify, y el servicio realtime en Railway si aplica):

```
FCM_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...","client_email":"...","token_uri":"https://oauth2.googleapis.com/token"}
```

Notas:
- Va el JSON **entero en una línea** (los saltos de línea de `private_key` como `\n`).
- Es un secreto: no debe quedar en el repositorio ni en capturas.
- Sin esta variable, `pushConfigurado()` devuelve `false` y no se envía nada.

### 3. (Solo si compilas con Gradle) Plugin de Google Services

`android/build.gradle` y `android/app/build.gradle` deben declarar el plugin
`com.google.gms.google-services`. Si el build falla al compilar por
`google-services.json`, ese paso falta. Lo dejo señalado, no aplicado, porque tocar la
configuración de Gradle sin el archivo real rompería el build actual.

## Cómo verificar cuando lo tengas

1. Instalar la app en un teléfono real (el emulador sin Google Play no entrega push).
2. Abrir la app y revisar en la consola: `[push]` no debe reportar error.
3. Comprobar en base de datos que apareció la fila:

```sql
SELECT "userId", plataforma, activo, "ultimoUso" FROM "DeviceToken" ORDER BY "ultimoUso" DESC LIMIT 5;
```

4. Cerrar la app por completo (swipe en el selector de tareas).
5. Cambiar el estado de un pedido desde la tienda.
6. Debe aparecer la notificación del sistema. Al tocarla, abre el tracking de ESE pedido.

## Qué pasa mientras tanto

Nada se rompe. Con la app abierta o en segundo plano todo funciona como antes:
Socket.IO actualiza el estado al instante y el aviso interno (`sileo`) aparece igual.
Lo único que no ocurre hasta configurar Firebase es la notificación con la app
**completamente cerrada**.
