import { db } from "../../db/index.js";
import { recipes } from "../../db/schema.js";

export default async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Érvénytelen kérés." }, { status: 400 });
  }

  if (!body?.title || !body?.category) {
    return Response.json({ error: "A recept neve és kategóriája kötelező." }, { status: 400 });
  }

  try {
    const [created] = await db
      .insert(recipes)
      .values({
        externalId: String(body.id ?? Date.now()),
        title: body.title,
        description: body.description ?? "",
        category: body.category,
        cuisine: body.cuisine ?? "",
        prepTimeMinutes: Number(body.prep_time_minutes) || 0,
        cookTimeMinutes: Number(body.cook_time_minutes) || 0,
        servings: Number(body.servings) || 1,
        difficulty: body.difficulty ?? "",
        tags: body.tags ?? [],
        imagePath: body.image_path ?? "",
        ingredients: body.ingredients ?? [],
        instructions: body.instructions ?? [],
      })
      .returning();

    return Response.json({ message: "Sikeres mentés!", recipe: created }, { status: 201 });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
};
