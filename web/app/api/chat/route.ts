import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
    const body = await req.json();

    const payload = {
        messages: body.messages,
        address: body.address,
        userId: body.address,
        existingMemory: body.existingMemory,
    };

    const response = await fetch(`${process.env.API_URL}/api/chat`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });

    return new Response(response.body, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
        },
    });
}
