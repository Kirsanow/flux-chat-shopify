import { PrismaClient } from "@prisma/client";

declare global {
  var prismaGlobal: PrismaClient | undefined;
}

let prisma: PrismaClient;

if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient();
} else {
  // In development, use a global variable to preserve the client across hot reloads
  if (!global.prismaGlobal) {
    global.prismaGlobal = new PrismaClient({
      log: ["error", "warn"],
    });
  }
  prisma = global.prismaGlobal;
}

export default prisma;
