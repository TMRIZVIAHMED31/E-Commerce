# Add shadcn/ui to the Ecommerce Frontend

This project uses Vite, React, JavaScript, and Tailwind CSS v4.
Run every command from this directory:

```powershell
cd d:\PROJECT\Ecommerce-mern\frontend
```

## 1. Install Tailwind CSS

These packages are already installed if you ran the previous setup command. Run this only if they are missing:

```powershell
npm install tailwindcss @tailwindcss/vite
```

Do not run `npx shadcn@latest init` yet. Configure Vite and the import alias first.

## 2. Configure Vite

Replace `vite.config.js` with:

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(process.cwd(), './src'),
    },
  },
  server: {
    port: 5173,
  },
});
```

## 3. Configure Tailwind CSS

Add this line at the very top of `src/index.css`:

```css
@import "tailwindcss";
```

Keep the existing CSS below this import. The existing application styles can continue to be used alongside shadcn/ui.

## 4. Configure the `@` import alias

Create `jsconfig.json` in the `frontend` directory:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"]
}
```

The alias allows imports such as:

```js
import { Button } from '@/components/ui/button';
```

## 5. Initialize shadcn/ui

Run:

```powershell
npx shadcn@latest init
```

Recommended choices for this JavaScript project:

- Component library: `Base UI` or the library you prefer
- Preset: `Nova` or the preset you prefer
- Use CSS variables: `Yes`
- Components directory: `src/components`
- Utilities directory: `src/lib/utils.js`

The command should create `components.json` and the shadcn utility files.

## 6. Add components

For example:

```powershell
npx shadcn@latest add button card input dialog dropdown-menu
```

Components will be added under:

```text
src/components/ui/
```

## 7. Use a component

Example in any `.jsx` file:

```jsx
import { Button } from '@/components/ui/button';

export default function Example() {
  return (
    <Button type="button" onClick={() => alert('Added to cart')}>
      Add to cart
    </Button>
  );
}
```

## 8. Verify the setup

Open a PowerShell terminal and run these commands from the `frontend` directory:

```powershell
Set-Location d:\PROJECT\Ecommerce-mern\frontend
npm run build
```

If the build succeeds, start the development server in the same directory:

```powershell
Set-Location d:\PROJECT\Ecommerce-mern\frontend
npm run dev
```

Open `http://localhost:5173` in the browser.

## Troubleshooting

### `Validating Tailwind CSS. Found v4.`

Confirm both items are present:

- `tailwindcss()` is included in the `plugins` array in `vite.config.js`.
- `@import "tailwindcss";` is the first line of `src/index.css`.

### `Could not find valid path aliases`

Confirm both items are present:

- `jsconfig.json` exists in the `frontend` directory.
- `vite.config.js` contains the `@` alias pointing to `src`.

Then run the initialization command again:

```powershell
npx shadcn@latest init
```

### Existing styles look unchanged

That is expected. shadcn/ui adds reusable components; it does not automatically replace the existing CSS or pages. Add shadcn components to pages one at a time, beginning with forms, dialogs, buttons, and dropdowns.
