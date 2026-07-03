import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    // Grab the user data sent from your frontend form
    const { userName, userEmail } = await request.json(); 

    const apiKey = process.env.RETELL_API_KEY || process.env.RETEL_AI_API_KEY || process.env.RETELL_AI_API_KEY;
    const agentId = process.env.NEXT_PUBLIC_AGENT_ID || process.env.RETELL_AI_AGENT_ID;

    const response = await fetch("https://api.retellai.com/v2/create-web-call", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        agent_id: agentId,
        // This injects the form data into the AI's system prompt!
        retell_llm_dynamic_variables: {
          user_name: userName || "Friend",
          user_email: userEmail || "Unknown"
        }
      }),
    });

    if (!response.ok) {
      return NextResponse.json({ error: "API Error" }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
