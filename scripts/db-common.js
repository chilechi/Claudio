import { mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { DatabaseSync } from "node:sqlite";

export function databasePath() {
  return process.env.DATABASE_PATH || join("data", "claudio.sqlite");
}

export function openDatabase() {
  const path = databasePath();
  mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec("PRAGMA foreign_keys = ON");
  return db;
}

export function applySchema(db) {
  const schema = readFileSync(join("db", "schema.sql"), "utf8");
  db.exec(schema);
}

export function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8").replace(/^\uFEFF/, ""));
}
