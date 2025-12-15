import postgres from "npm:postgres"

const sql = postgres()

const result = await sql`SELECT * FROM slack_channels`
console.log(result)

await sql.end()
