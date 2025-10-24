// This file has all of the schemas that we expect to deal with!
// Zod can grab the schemas from this file and use them to validate
// incoming requests at runtime

import { z } from 'zod';

// Schema for creating a new user
export const CreateUserSchema = z.object({
    name: z.string().min(1).max(30),
    email: z.email()
    // Oauth handles login so no password field
})

// We can export the type of the CreateUserSchema for use elsewhere
export type CreateUser = z.infer<typeof CreateUserSchema>;

// Schema for what we expect from prisma when getting a user
export const UserSchema = z.object({
    id: z.string().min(1),
    name: z.string().min(1).max(30).nullable(),
    email: z.email(),
    emailVerified: z.date().nullable(),
    createdAt: z.coerce.date(),
    image: z.string().nullable(),
});
// We can export this too
export type User = z.infer<typeof UserSchema>;

// Schema for requesting something by user id
export const GetByUserIdSchema = z.object({
    id: z.string().min(1)
});
export type GetByUserId = z.infer<typeof GetByUserIdSchema>;

// Schema for creating a new tree
export const CreateTreeSchema = z.object({
    name: z.string().min(1).max(100),
    userId: z.string().min(1)
});
export type CreateTree = z.infer<typeof CreateTreeSchema>;

// Schema for what we expect from prisma when getting a tree
export const TreeSchema = z.object({
    id: z.number().min(1),
    name: z.string().min(1).max(100).optional().nullable(),
    userId: z.string().min(1),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date()
});
export type Tree = z.infer<typeof TreeSchema>;

// Schema for a list of trees
export const TreeListSchema = z.array(z.object({
    id: z.number().min(1),
    name: z.string().min(1).max(100).optional().nullable(),
    _count: z.object({node: z.number().min(0)})
}));
export type TreeList = z.infer<typeof TreeListSchema>;

// Schema for getting a tree by its ID
export const GetByTreeIdSchema = z.object({
    id: z.number().min(1)
});
export type GetByTreeId = z.infer<typeof GetByTreeIdSchema>;