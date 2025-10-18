import prisma from "../../../lib/prisma";
import { POST as MakeUser } from '../../../app/api/users/route';
import { type CreateUser, UserCreated, UserCreatedSchema } from '../../../lib/validation_schemas';
import { NextRequest } from 'next/server';

beforeAll(async () => {
    // Clean test db before testing
    // (We need to clear all tables not just users,
    //  but we can add more once we test more things)
    await prisma.user.deleteMany()
});

describe('Testing user endpoints', () => {
    test('Succesfully creates a new user', async () => {
        // Make a fake user request
        const body: CreateUser = { 
            name: "test_user_a",
            email: "testemail@fakedomain.com"
        };
        const req = new NextRequest('http://fake_url/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        // Now call the route directly
        const res = await MakeUser(req);

        // Check response
        expect(res.status).toEqual(201);
        const newUser: UserCreated = UserCreatedSchema.parse(await res.json());
        expect(newUser.name).toEqual(body.name);
        expect(newUser.email).toEqual(body.email);

        // Clean up
        await prisma.user.delete({
            where: { id: newUser.id.toString() }
        });
    });
});