import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { createServer } from "./server";
import { createServer as createHttpServer } from "http";
import { type ViteDevServer } from "vite";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    fs: {
      allow: ["./client", "./shared"],
      deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**", "server/**"],
    },
  },
  build: {
    outDir: "dist/spa",
  },
  plugins: [react(), expressPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
}));

function expressPlugin(): Plugin {
  let viteServer: ViteDevServer;
  let httpServer: any;

  return {
    name: "express-plugin",
    apply: "serve",
    configureServer(server) {
      viteServer = server;

      return () => {
        const { app, httpServer: expressHttpServer, io } = createServer();

        // Attach Vite's transform middleware to express
        server.middlewares.use(app);

        // Store reference for the configResolved hook
        httpServer = expressHttpServer;
      };
    },
    configResolved() {
      // Socket.IO will work with the Vite dev server through the express middleware
    },
  };
}
