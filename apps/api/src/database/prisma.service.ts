import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "../generated/prisma/client";

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  public constructor() {
    const tursoUrl: string | undefined = process.env.TURSO_DATABASE_URL;
    const tursoAuthToken: string | undefined = process.env.TURSO_AUTH_TOKEN;
    const localUrl: string = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
    const adapter =
      tursoUrl && tursoAuthToken
        ? new PrismaLibSql({ url: tursoUrl, authToken: tursoAuthToken })
        : new PrismaLibSql({ url: localUrl });
    super({ adapter });
  }

  public async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  public async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
