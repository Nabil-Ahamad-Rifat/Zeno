import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import tailwind from '@astrojs/tailwind'
import markdoc from '@astrojs/markdoc'
import keystatic from '@keystatic/astro'

export default defineConfig({
  integrations: [react(), tailwind(), markdoc(), keystatic()],
  output: 'hybrid',
  server: { port: 5173 },
})
