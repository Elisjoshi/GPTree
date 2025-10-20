// We use this route to create a new tree for a user

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { type CreateTree, CreateTreeSchema } from "@/lib/validation_schemas";

// Create a new tree for a user
export async function POST(request: NextRequest) {
    try {
        // Read and parse the request
        const body = await request.json();
        console.log("Received body for tree creation:", body);
        const data: CreateTree = CreateTreeSchema.parse(body);

        // Create the tree
        const newTree = await prisma.tree.create({ data });

        // Return the new tree
        return NextResponse.json(newTree, { status: 201 });
    } catch (err) {
        console.error("Error creating tree:", err);
        // If the error was in parsing, it's the client's fault: return 400

        if (err instanceof z.ZodError) {
            return NextResponse.json(
                { errors: z.flattenError(err) },
                { status: 400 }
            );
        }

        // Otherwise it's the server's fault: return 500
        // We might want to have other error cases later, like if prisma fails
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}