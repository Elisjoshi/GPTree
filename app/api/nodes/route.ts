import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { error } from "console";

const CreateNodeSchema = z.object({
    parentId: z.union([z.string(), z.number()]),
    message: z.string().min(1, "Message cannot be empty"),
    name: z.string().optional().default("node"),
    userId: z.string().min(1, "User ID is required"),
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const parsed = CreateNodeSchema.parse(body);

        const parentId = typeof parsed.parentId === 'string' ? parseInt(parsed.parentId, 10) : parsed.parentId;
        if (Number.isNaN(parentId)) {
            return NextResponse.json(
                { error: "Invalid parentId" },
                { status: 400 }
            );
        }

        // check if parent exists
        const parent = await prisma.node.findUnique({ where: { id: parentId } });
        if (!parent) {
            return NextResponse.json(
                { error: "Parent node not found" },
                { status: 404 }
            );
        }

        // check this is user's node
        if (parsed.userId) {
            const tree = await prisma.tree.findUnique({ where: { id: parent.treeId }, select: { userId: true } });
            if (!tree) return NextResponse.json({ error: "Tree not found" }, { status: 404 });
            if (tree.userId !== parsed.userId) {
                return NextResponse.json(
                    { error: "Unauthorized" },
                    { status: 403 }
                );
            }
        }

        // create the new node
        const created = await prisma.node.create({
            data: {
                name: parsed.name,
                question: '',
                content: parsed.message,
                followups: [],
                treeId: parent.treeId,
                parentId: parent.id,
            },
        });

        return NextResponse.json(created, { status: 201 });
    } catch (err) {
        console.error("POST /api/node error", err);

        if (err instanceof z.ZodError) {
            return NextResponse.json(
                { errors: z.flattenError(err) },
                { status: 400 }
            );
        }

        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
};