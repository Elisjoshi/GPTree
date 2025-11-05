import { StructuredNodeSchema } from "@/lib/validation_schemas";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
export type Message = { role: "system" | "user" | "assistant"; content: string };

// General method to get a response from Groq
export async function getGroqResponse(messages: Message[]) {
    try {
        // Validate input
        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            throw new Error("messages (non-empty array) required");
        }

        // Check Groq API key
        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
            throw new Error("server misconfiguration: GROQ_API_KEY missing");
        }

        // Forward to Groq
        const upstream = await groq.chat.completions.create({
            model: "compound-beta",
            messages,
            temperature: 0.7,
            stream: true,
        });

        // Now we want to make a readable stream to return
        return new ReadableStream({
            async start(controller) {
                try {
                    // We read from the stream from Groq one chunk at a time
                    for await (const chunk of upstream) {
                        // If that chunk has content, we enqueue it
                        // (i.e. push it into the stream to the client)
                        const content = chunk.choices[0]?.delta?.content;
                        if (content) controller.enqueue(new TextEncoder().encode(content));
                    }
                } catch (err) {
                    // If there's an error, we report it
                    controller.error(err);
                } finally {
                    // And we close the stream when done
                    controller.close();
                }
            },
        });
    } catch (err: unknown) {
        console.error("Error getting a response from Groq:", err);
        throw err;
    }
}

// Helper function for parsing
export function parseStructuredNode(content: string) {
    let parsed: unknown;
    try {
        const trimmed = content.trim();
        parsed = JSON.parse(trimmed);
    } catch (e) {
        throw new Error("Failed to parse node content as JSON: " + (e instanceof Error ? e.message : String(e)));
    }
    // Validate the parsed object with Zod
    const r = StructuredNodeSchema.safeParse(parsed);
    if (!r.success) {
        console.error("Validation errors:", r.error.format());
        throw new Error("Parsed node content does not match expected schema: " + JSON.stringify(r.error.format()));
    }
    return r.data;
}

export const groqNodeResponseStructure = {
    type: 'json_schema',
    json_schema: {
        name: 'root_node_text',
        schema: {
            type: 'object',
            properties: {
                name: { type: 'string' },
                content: { type: 'string' },
                followups: { type: 'array', items: { type: 'string' } }
            }
        },
        required: ['name', 'content', 'followups'],
        additional_properties: false,
    }
};

// Some behavioral promts for Groq will go here
export const nodeSystemPrompt = `You will be a knowledgeable and patient instructor. You will assist in the generation of personal textbooks for the user.
Each response should have 500 words or less. All of your outputs are required to be valid JSON matching the following schema: ${JSON.stringify(StructuredNodeSchema)}
Specifically, the content field must be in basic markdown format, using headings, bullet points, and numbered lists where appropriate to enhance readability.`;

export async function generateNodeFields(prompt: string) {

    // Generate content for the root node based on the prompt
    // We're streaming to the backend right now but eventually
    // we will stream to the client
    const stream = await getGroqResponse([
        { role: "system", content: nodeSystemPrompt },
        { role: "user", content: `I want to learn about: ${prompt}.` }
    ]);
    let content = "";
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        content += decoder.decode(value);
    }
    // Parse and validate the content as a StructuredNode
    return parseStructuredNode(content);
}

