// We use this route to create a new tree for a user

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { type CreateTree, CreateTreeSchema } from "@/lib/validation_schemas";

const CreateTreeWithInitialSchema = CreateTreeSchema.extend({
    initialMessage: z.string().min(1, "Initial message cannot be empty"),
});

// Create a new tree for a user
export async function POST(request: NextRequest) {
    try {
        // Read and parse the request
        const body = await request.json();
        const data = CreateTreeWithInitialSchema.parse(body) as CreateTree & {initialMessage: string };

        const { initialMessage, ...treeData } = data;

        // Create the tree
        const created = await prisma.$transaction(async (tx) => {
            const newTree = await tx.tree.create({ data: treeData });
            
            // Create the Root Node
            const rootNode = await tx.node.create({
                data: {
                    name: "root",
                    question: '',
                    content: initialMessage,
                    followups: [],
                    treeId: newTree.id,
                    parentId: null,
                },
            });

            return { tree: newTree, node: rootNode };
        });
        
        
        // Return the new tree and node
        const ret = JSON.parse(JSON.stringify(created));
        return NextResponse.json(ret, { status: 201 });
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

export async function GET(request: NextRequest) {
    try {
        const url = new URL(request.url);
        const userId = url.searchParams.get('userId');

        if (!userId) {
            return NextResponse.json(
                { error: 'Missing userId parameter' },
                { status: 400 }
            );
        }

        const trees = await prisma.tree.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            include: {
                node: {
                    orderBy: { id: 'asc' },
                    take: 1,
                },
             },
        });

        return NextResponse.json(trees, { status: 200 });
    } catch (err) {
        console.error("Error fetching trees:", err);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}