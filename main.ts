import postgres from "npm:postgres"
import { Hono } from "npm:hono"
const sql = postgres()

const app = new Hono()

app.get("/channel/:channel", async (c) => {
    const isId =
        c.req.param("channel")[0].toLowerCase() != c.req.param("channel")[0]
    let result
    if (isId) {
        result =
            await sql`SELECT id, name, notes, confirmed FROM slack_channels WHERE id=${c.req.param("channel")}`
    } else {
        result =
            await sql`SELECT id, name, notes, confirmed FROM slack_channels WHERE name=${c.req.param("channel")}`
    }
    if (result.length) {
        return c.json({ ...result[0], success: true })
    } else {
        return c.json({
            ...(isId
                ? { id: c.req.param("channel") }
                : { name: c.req.param("channel") }),
            success: false,
        })
    }
})

app.post("/channel/", async (c) => {
    const json = await c.req.json()
    if (!json.name) {
        return c.json({ error: "No name included", success: false }, 400)
    }
    const response = await (
        await fetch(
            "https://slack.com/api/chat.postMessage?channel=" +
                Deno.env.get("BOTCHANNEL") +
                "&blocks=" +
                encodeURIComponent(
                    JSON.stringify([
                        {
                            type: "section",
                            text: {
                                type: "mrkdwn",
                                text: `#${json.name.replaceAll("<", "[less than]").replaceAll("@", "[at]").replaceAll("`", "[backtick]").replaceAll(" ", "[space]")} \`${json.name.replaceAll("<", "[less than]").replaceAll("@", "[at]").replaceAll("`", "[backtick]").replaceAll(" ", "[space]")}\``,
                            },
                        },
                    ]),
                ),
            {
                method: "POST",
                headers: {
                    Authorization: "Bearer " + Deno.env.get("BOTTOKEN"),
                },
            },
        )
    ).json()
    console.log(response)
    try {
        const idIfiedText = response.message.blocks[0].text.text.split(" `")[0]
        if (idIfiedText.startsWith("<")) {
            const channelId = idIfiedText.slice(2, -1).split("|")[0]
            const originalChannel =
                await sql`SELECT id, name, confirmed FROM slack_channels WHERE id=${channelId}`
            if (originalChannel.length) {
                await sql`UPDATE slack_channels SET name=${json.name},confirmed=TRUE WHERE id=${channelId}`
            } else {
                await sql`INSERT INTO slack_channels("id", "name", "confirmed") VALUES(${channelId}, ${json.name}, TRUE)`
            }
            return c.json({ success: true, id: channelId })
        } else {
            return c.json({ error: "Channel does not exist", success: false })
        }
    } catch (err) {
        console.error(err)
        return c.json(
            { error: "An unknown error occurred", success: false },
            500,
        )
    }
})

Deno.serve({ port: 6493 }, app.fetch)
