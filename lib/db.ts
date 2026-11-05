import {PrismaClient} from '@prisma/client';
import {PrismaBetterSqlite3} from '@prisma/adapter-better-sqlite3';
const globalDb=globalThis as unknown as {db?:PrismaClient};
export const db=globalDb.db??new PrismaClient({adapter:new PrismaBetterSqlite3({url:'file:./prisma/lab.db'})});
if(process.env.NODE_ENV!=='production')globalDb.db=db;
