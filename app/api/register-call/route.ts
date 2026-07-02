import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // Pulls whichever spelling variation is currently saved in your Vercel settings
    const apiKey = process.env.RETELL_API_KEY || process.env.RETEL_AI_API_KEY || process.env.RETELL_AI_API_KEY;
    const agentId = process.env.NEXT_PUBLIC_AGENT_ID || process.env.RETELL_AI_AGENT_ID;

    if (!apiKey || !agentId) {
      console.error("Missing API credentials in Vercel environment variables.");
      return NextResponse.json({ error: "Missing API Key or Agent ID" }, { status: 400 });
    }

    // Swapping out the dead legacy endpoint for Retell's active v2 endpoint
    const response = await fetch("https://api.retellai.com/v2/create-web-call", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        agent_id: agentId,
      }),
    });

    if (!response.ok) {
      const errorResponseText = await response.text();
      console.error("Retell API Error response:", errorResponseText);
      return NextResponse.json(
        { error: `Retell API Error: ${response.status}`, details: errorResponseText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Vercel Backend Exception:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
