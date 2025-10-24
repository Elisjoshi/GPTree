// We use this route to get a tree by tree ID
// (note that we're using GetByUserID for now because
//  it works with our schema for now, but once we get a
//  few trees in our db to see what the ID's look like)

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { type GetByTreeId, GetByTreeIdSchema } from "@/lib/validation_schemas";

// Get a tree by tree ID
export async function GET(request: NextRequest, params: GetByTreeId) {
    try {
        // Read and parse the request
        const data: GetByTreeId = GetByTreeIdSchema.parse(params);

        // Find the tree
        const newTree = await prisma.tree.findUnique({ 
            where: {id: data.id}
         });

        // Return the new tree
        return NextResponse.json(newTree, { status: 200 });
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