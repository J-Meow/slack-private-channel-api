import postgres from "npm:postgres"
import { Hono } from "npm:hono"
const sql = postgres()

const app = new Hono()

app.get("/channel/:channel", async (c) => {
    const result =
        await sql`SELECT id, name, notes, confirmed FROM slack_channels WHERE id=${c.req.param("channel")}`
    if (result.length) {
        return c.json({ ...result[0], success: true })
    } else {
        return c.json({ id: c.req.param("channel"), success: false })
    }
})

Deno.serve({ port: 6493 }, app.fetch)
