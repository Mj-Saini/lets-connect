import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import express from "express";
import cors from "cors";
import { createSocketIO } from "./server";
import { handleDemo } from "./server/routes/demo";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    fs: {
      allow: [
        path.resolve(__dirname),
         path.resolve(__dirname, "client"),
    path.resolve(__dirname, "shared"),
    path.resolve(__dirname, "node_modules"),
        // "./client", "./shared"
      ],
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
  return {
    name: "express-plugin",
    apply: "serve",
    configureServer(viteServer) {
      // Create Express app for API routes
      const app = express();
      app.use(cors());
      app.use(express.json());
      app.use(express.urlencoded({ extended: true }));

      // API routes
      app.get("/api/ping", (_req, res) => {
        const ping = process.env.PING_MESSAGE ?? "ping";
        res.json({ message: ping });
      });

      app.get("/api/demo", handleDemo);

      // Create Socket.IO and attach to Vite's HTTP server
      const io = createSocketIO();
      io.attach(viteServer.httpServer as any);

      // Add Express as middleware
      viteServer.middlewares.use(app);

      // Log Socket.IO setup
      console.log("✨ Socket.IO attached to dev server");
    },
  };
}
