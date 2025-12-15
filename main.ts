import postgres from "npm:postgres"
import { Hono } from "npm:hono"
const sql = postgres()

const app = new Hono()

app.get("/", async (c) => {
    const result =
        await sql`SELECT id, name, notes, name_confidence FROM slack_channels`
    return c.json(result)
})

Deno.serve(app.fetch)
