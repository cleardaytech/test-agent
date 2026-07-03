import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { callId } = await request.json();
    
    // Pull the API key just like we did for registering the call
    const apiKey = process.env.RETELL_API_KEY || process.env.RETEL_AI_API_KEY || process.env.RETELL_AI_API_KEY;

    // Ask Retell for the data associated with this specific call
    const response = await fetch(`https://api.retellai.com/v2/get-call/${callId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch" }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
