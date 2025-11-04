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
