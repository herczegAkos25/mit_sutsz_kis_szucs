import { pgTable, serial, text, integer, jsonb, timestamp } from "drizzle-orm/pg-core";

export const recipes = pgTable("recipes", {
  id: serial().primaryKey(),
  externalId: text("external_id").notNull(),
  title: text().notNull(),
  description: text().notNull().default(""),
  category: text().notNull().default(""),
  cuisine: text().notNull().default(""),
  prepTimeMinutes: integer("prep_time_minutes").notNull().default(0),
  cookTimeMinutes: integer("cook_time_minutes").notNull().default(0),
  servings: integer().notNull().default(1),
  difficulty: text().notNull().default(""),
  tags: jsonb().notNull(),
  imagePath: text("image_path").notNull().default(""),
  ingredients: jsonb().notNull(),
  instructions: jsonb().notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});
