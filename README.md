# Perfutico

Boutique de perfumería con React, Vite, Tailwind CSS, Lucide React y Firebase Authentication + Firestore.

## Inicio local

1. Copia `.env.example` a `.env.local` y completa las credenciales Firebase, el número de WhatsApp comercial y los datos reales de SINPE Móvil.
2. En Firebase habilita Authentication con correo/contraseña y Google. Crea Cloud Firestore.
3. Publica las reglas incluidas en `firestore.rules` y el índice de `firestore.indexes.json`. Con Firebase CLI, inicia sesión, selecciona el proyecto correcto y ejecuta `firebase deploy --only firestore` desde esta carpeta. También puedes publicar las reglas desde Firebase Console; el índice se administra en Firestore > Índices.
4. Ejecuta `npm install` y `npm run dev`.

Sin credenciales se muestra un catálogo de demostración. Las cuentas, los favoritos, las sugerencias, las órdenes guardadas y la administración requieren Firebase.

## Primer administrador

Crea una cuenta desde la tienda y copia su UID desde Firebase Authentication. En Firestore, crea un documento `admins/{UID}` con el campo `role` (string) igual a `admin`. Esta acción se hace en Firebase Console: las reglas deniegan cambios de roles desde el navegador.

## Publicar en Vercel

Importa la carpeta o su repositorio en Vercel, configura las variables `VITE_*` del archivo `.env.local` y despliega. `vercel.json` contiene el rewrite de la SPA.

## Colecciones Firestore

- `products`: catálogo público e inventario; el panel avisa cuando quedan 3 unidades o menos, y solo administración puede modificar el stock.
- `admins/{uid}`: rol de acceso, administrado desde Firebase Console.
- `users/{uid}/favorites`: favoritos privados por cuenta.
- `users/{uid}/suggestions`: sugerencias del perfil. Cada cliente puede consultar las propias; el administrador puede ver todas en Administración > Sugerencias y marcarlas como revisadas.
- `orders`: pedidos SINPE de invitados o usuarios; al confirmar el SINPE, una transacción descuenta las unidades. Si se cancela antes del envío, las devuelve al inventario. Pedidos anteriores a este control requieren ajustar el stock manualmente.

El buzón de administración consulta el grupo de colecciones `suggestions`. Para que funcione en Firebase, deben estar publicadas la regla de grupo incluida en `firestore.rules` y el índice incluido en `firestore.indexes.json`.

Los teléfonos y titular de ejemplo deben sustituirse antes de recibir pedidos. Las imágenes iniciales son referencias de muestra.

Las solicitudes pendientes no reservan unidades; el sistema vuelve a validar y descuenta el stock cuando el administrador confirma el SINPE. Si varias solicitudes compiten por las últimas unidades, el panel no permitirá confirmar una orden que ya no tenga disponibilidad.
