import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { createServer as createExpressServer } from "./server";
import { createServer as createHttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    fs: {
      allow: ["./client", "./shared"],
      deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**", "server/**"],
    },
    middlewareMode: true,
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
  let io: SocketIOServer;

  return {
    name: "express-plugin",
    apply: "serve",
    configureServer(viteServer) {
      const { app, io: socketIO } = createExpressServer();
      io = socketIO;

      // Bind Socket.IO to Vite's HTTP server
      io.attach((viteServer.httpServer as any), {
        cors: {
          origin: "*",
          methods: ["GET", "POST"],
        },
      });

      // Use Express app for regular HTTP requests
      return () => {
        viteServer.middlewares.use(app);
      };
    },
  };
}
