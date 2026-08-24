import { cloudflare } from "@cloudflare/vite-plugin";
import { sites } from "@openai/sites-vite-plugin";
import { defineConfig } from "vite";

export default defineConfig({
  publicDir: false,
  build: {
    rollupOptions: {
      input: "./index.html"
    }
  },
  plugins: [
    sites(),
    cloudflare({
      viteEnvironment: { name: "server" }
    })
  ]
});
