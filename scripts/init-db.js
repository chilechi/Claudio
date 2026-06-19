import { applySchema, databasePath, openDatabase } from "./db-common.js";

const db = openDatabase();
applySchema(db);
db.close();

console.log(`Claudio 数据库已初始化：${databasePath()}`);
