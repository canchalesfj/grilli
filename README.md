# Plantilla de webs para restaurantes

Genera una web completa para un restaurante, bar o cafetería a partir de **un solo archivo `config.json`**.
Basada en [Grilli](https://github.com/codewithsadee/grilli) de codewithsadee (licencia MIT).

Solo necesitas [Node.js](https://nodejs.org) (no hay que instalar dependencias).

## Crear la web de un cliente nuevo

```bash
node nuevo-cliente.js bar-pepe "Bar Pepe"
```

1. Edita `clientes/bar-pepe/config.json` con los datos del negocio.
2. Copia sus fotos en `clientes/bar-pepe/imagenes/`.
   - Si una foto se llama igual que una de `assets/images/` (por ejemplo `hero-slider-1.jpg`), la sustituye.
   - Si tiene otro nombre, escríbelo en el campo `imagen` correspondiente del config.
   - Para el logo, pon el archivo en `imagenes/` y su nombre en `"logo"`. Si lo dejas vacío se muestra el nombre en texto.
   - Para el icono de la pestaña, pon un `favicon.svg` en la carpeta del cliente.
3. Genera la web:

```bash
node build.js bar-pepe
```

4. Revísala en el navegador:

```bash
node servir.js
```

Abre http://localhost:8080/bar-pepe/

La web terminada queda en `dist/bar-pepe/`: una carpeta estática lista para subir a cualquier hosting.

## Qué se puede cambiar desde `config.json`

| Campo | Qué controla |
|---|---|
| `nombre`, `descripcion`, `url` | Nombre, texto para Google y dirección final de la web |
| `logo`, `colores.principal` | Logo y color de acento (botones, títulos, detalles) |
| `contacto` | Dirección, teléfono, WhatsApp, email y enlace de Google Maps |
| `horario` | Resumen de la barra superior y turnos del bloque de contacto |
| `hero` | Diapositivas de la portada (1 o más) |
| `servicios`, `nosotros`, `ventajas` | Bloques de presentación |
| `especial` | Plato destacado (`"mostrar": false` para ocultarlo) |
| `carta` | Platos con precio, etiqueta, descripción e imagen |
| `testimonio` | Reseña destacada (ocultable) |
| `reservas` | Formulario de reserva: horas y número máximo de personas (ocultable) |
| `eventos` | Eventos próximos (ocultable) |
| `newsletter` | Suscripción por email (desactivada por defecto) |
| `redes` | Enlaces a Instagram, Facebook, TripAdvisor… |
| `webPor` | Tu firma en el pie: "Web por …" con enlace a tu web |

En los textos, un salto de línea (`\n`) se convierte en salto de línea en la web.

### Reservas sin servidor

El formulario de reserva abre **WhatsApp** con el mensaje ya escrito (nombre, personas, fecha y hora)
dirigido al número de `contacto.whatsapp`. Si el cliente no tiene WhatsApp, abre el correo con el
mensaje hacia `contacto.email`. No hace falta backend ni pagar ningún servicio.

### Incluido de serie

- Diseño adaptado a móvil.
- Etiquetas para Google y datos estructurados `Restaurant` (schema.org).
- Botón de llamar, enlace a Google Maps y menú móvil que se cierra al pulsar.

## Publicar la web del cliente (gratis con GitHub Pages)

```bash
cd dist/bar-pepe
git init -b main
git add .
git commit -m "Web de Bar Pepe"
gh repo create bar-pepe-web --public --source=. --push
gh api -X POST repos/{owner}/bar-pepe-web/pages -f "source[branch]=main" -f "source[path]=/"
```

Quedará en `https://<tu-usuario>.github.io/bar-pepe-web/`. Para usar un dominio propio
(`barpepe.es`), añádelo en *Settings → Pages* del repositorio y apunta el DNS a GitHub.
También puedes arrastrar la carpeta `dist/bar-pepe` a [Netlify Drop](https://app.netlify.com/drop).

## Antes de entregar

- [ ] Sustituir **todas** las fotos de la demo por fotos del cliente o de bancos libres (Unsplash, Pexels).
      Las fotos de la plantilla original no tienen licencia comercial garantizada.
- [ ] Poner el WhatsApp real y probar una reserva.
- [ ] Revisar el enlace de Google Maps y las redes sociales.
- [ ] Rellenar `url` cuando se conozca el dominio final.

## Estructura

```
template/index.html   Plantilla con marcadores {{...}}
assets/               CSS, JS e imágenes base (compartidos por todos los clientes)
clientes/<nombre>/    config.json + imagenes/ de cada cliente
build.js              Genera dist/<nombre>/
nuevo-cliente.js      Crea un cliente nuevo a partir de clientes/ejemplo
servir.js             Servidor local para revisar
index.html            Demo original de Grilli (sin tocar)
```

## Licencia

MIT. Se conserva el archivo `LICENSE` original de codewithsadee, y se copia dentro de cada web generada.
