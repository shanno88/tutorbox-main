import { db } from "@/db";
import { Todo, todos } from "@/db/schema";
import { count, eq } from "drizzle-orm";

/**
 * Here is an example CRUD methods for the todo table.
 * If you plan to keep your code base "clean", we recommend
 * no where else know about dizzle other than your data-access directory.
 */

export async function getTodo(todoId: string) {
  if (process.env.NODE_ENV !== "production") {
    throw new Error("Todos are disabled in development (Drizzle/Postgres is disabled)");
  }

  const todo = await db.query.todos.findFirst({
    where: (todos, { eq }) => eq(todos.id, todoId),
  });

  return todo;
}

export async function getTodos(userId: string) {
  if (process.env.NODE_ENV !== "production") {
    return [];
  }

  const todos = await db.query.todos.findMany({
    where: (todos, { eq }) => eq(todos.userId, userId),
    orderBy: (todos, { asc }) => [asc(todos.createdAt)],
  });

  return todos;
}

export async function createTodo(newTodo: Omit<Todo, "id" | "createdAt">) {
  if (process.env.NODE_ENV !== "production") {
    throw new Error("Todos are disabled in development (Drizzle/Postgres is disabled)");
  }

  const [todo] = await db.insert(todos).values(newTodo).returning();
  return todo;
}

export async function updateTodo(todoId: string, updatedFields: Partial<Todo>) {
  if (process.env.NODE_ENV !== "production") {
    throw new Error("Todos are disabled in development (Drizzle/Postgres is disabled)");
  }

  await db.update(todos).set(updatedFields).where(eq(todos.id, todoId));
}

export async function deleteTodo(todoId: string) {
  if (process.env.NODE_ENV !== "production") {
    throw new Error("Todos are disabled in development (Drizzle/Postgres is disabled)");
  }

  await db.delete(todos).where(eq(todos.id, todoId));
}

export async function getTodosCount(userId: string) {
  if (process.env.NODE_ENV !== "production") {
    return 0;
  }

  const [{ count: totalTodos }] = await db
    .select({ count: count() })
    .from(todos)
    .where(eq(todos.userId, userId));

  return totalTodos;
}
