# App de registro de tiro (PWA)

Repositorio **público**: solo código, sin datos personales.

App web para registrar sesiones de tiro con arco recurvo. Se publica en GitHub Pages (HTTPS, necesario para instalarla y para compartir archivos).

## Reglas de seguridad
- Sin conexiones de red: ni librerías, ni fuentes externas, ni analítica, ni llamadas a servidores.
- Todos los datos se quedan en el dispositivo.
- CSP con `connect-src 'none'`.
- Código legible y auditable.
