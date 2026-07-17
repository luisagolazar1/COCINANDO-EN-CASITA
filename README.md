# Recetario Criollo 🇦🇷

App web estática (sin frameworks, sin build) con recetas argentinas. Filtrá por ingredientes que tenés, categoría, dificultad y tiempo, y encontrá qué cocinar.

- `index.html` — estructura de la página
- `style.css` — estilos (identidad visual tipo cartel de almacén/fileteado porteño)
- `script.js` — lógica de filtros, tarjetas y modal de receta
- `recetas.js` — base de datos de recetas (`const RECETAS = [...]`)

Al ser 100% HTML/CSS/JS estático, no necesita `npm install` ni build para funcionar: alcanza con abrir `index.html`.

## Ver en el celular y en la compu

### Opción rápida (sin subir a ningún lado)
Abrí `index.html` con doble clic. Funciona local, pero para verla desde el celular conviene desplegarla (abajo).

### Subir a GitHub
```bash
cd recetario-arg
git init
git add .
git commit -m "Recetario criollo"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/recetario-criollo.git
git push -u origin main
```

### Desplegar en Vercel
1. Entrá a [vercel.com](https://vercel.com) e iniciá sesión con tu cuenta de GitHub.
2. **Add New → Project** y elegí el repo `recetario-criollo`.
3. Framework: **Other** (o "No framework" / estático). No hace falta build command ni output directory.
4. **Deploy**. En un minuto te da una URL tipo `https://recetario-criollo.vercel.app`, accesible desde el celular y la compu.

Cada vez que hagas `git push` a `main`, Vercel vuelve a desplegar solo.

### Alternativa: GitHub Pages
En el repo: **Settings → Pages → Source: main / (root)**. Da una URL tipo `https://tu-usuario.github.io/recetario-criollo/`.

## Agregar más recetas
Cada receta en `recetas.js` sigue este formato:

```js
{
  "id": 60,
  "nombre": "Nombre de la receta",
  "categoria": "Una de las categorías existentes",
  "tiempo": 45,
  "porciones": 4,
  "dificultad": "Fácil | Media | Difícil",
  "tags": ["ingrediente1", "ingrediente2"],
  "ingredientes": ["500 g de ingrediente1", "2 unidades de ingrediente2"],
  "pasos": ["Paso 1...", "Paso 2..."]
}
```

`tags` son las palabras clave usadas para el filtro "Ingredientes que tenés" — conviene mantenerlas en minúscula y sin tildes cuando se pueda, coherentes con las ya usadas en el resto del archivo.
