import { asc } from "drizzle-orm";
import { db } from "../../db/index.js";
import { recipes } from "../../db/schema.js";

export default async (req: Request) => {
  if (req.method !== "GET") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const rows = await db.select().from(recipes).orderBy(asc(recipes.id));

  const result = rows.map((row) => ({
    id: row.externalId,
    title: row.title,
    description: row.description,
    category: row.category,
    cuisine: row.cuisine,
    prep_time_minutes: row.prepTimeMinutes,
    cook_time_minutes: row.cookTimeMinutes,
    servings: row.servings,
    difficulty: row.difficulty,
    tags: row.tags,
    image_path: row.imagePath,
    ingredients: row.ingredients,
    instructions: row.instructions,
  }));

  return Response.json(result);
};
