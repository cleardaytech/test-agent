"use client";
import React, { useState, useEffect, FormEvent } from "react";
import { RetellWebClient } from "retell-client-js-sdk";

const webClient = new RetellWebClient();

export default function VoiceAgentPage() {
  // Added "analyzing" and "summary_ready" to our app states
  const [appState, setAppState] = useState<"form" | "connecting" | "active" | "ended" | "analyzing" | "summary_ready">("form");
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  
  // Data States
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [callId, setCallId] = useState(""); // We need this to ask Retell for the summary later
  const [callSummary, setCallSummary] = useState("");

  // Retell Event Listeners
  useEffect(() => {
    webClient.on("call_started", () => setAppState("active"));
    
    webClient.on("call_ended", () => {
      setIsAgentSpeaking(false);
      setAppState("ended"); 
    });

    webClient.on("agent_start_talking", () => setIsAgentSpeaking(true));
    webClient.on("agent_stop_talking", () => setIsAgentSpeaking(false));

    return () => {
      webClient.off("call_started");
      webClient.off("call_ended");
      webClient.off("agent_start_talking");
      webClient.off("agent_stop_talking");
    };
  }, []);

  // Timer logic
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (appState === "active") {
      timer = setInterval(() => setCallDuration((prev) => prev + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [appState]);

  // The Magic Loop: Fetch Summary after call ends
  useEffect(() => {
    if (appState === "ended" && callId) {
      setAppState("analyzing"); // Instantly show the loading screen

      const fetchSummary = async () => {
        try {
          const res = await fetch("/api/get-call", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ callId })
          });
          
          const callData = await res.json();
          
          // Retell only adds 'call_analysis' AFTER it finishes generating the summary
          if (callData.call_analysis && callData.call_analysis.call_summary) {
            setCallSummary(callData.call_analysis.call_summary);
            setAppState("summary_ready");
          } else {
            // If it's not ready yet, wait 3 seconds and check again
            setTimeout(fetchSummary, 3000);
          }
        } catch (error) {
          console.error("Error fetching summary", error);
        }
      };

      fetchSummary();
    }
  }, [appState, callId]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleStartCall = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAppState("connecting");

    try {
      const response = await fetch("/api/register-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userName, userEmail }),
      });

      const data = await response.json();
      
      if (data.access_token) {
        setCallId(data.call_id); // SAVE THE CALL ID
        await webClient.startCall({ accessToken: data.access_token });
      } else {
        setAppState("form");
      }
    } catch (error) {
      setAppState("form");
    }
  };

  const handleEndCall = () => {
    webClient.stopCall();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 font-sans">
      
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-800">My Brand Name</h1>
        <p className="text-gray-500">AI Voice Assistant</p>
      </div>

      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        
        {/* STATE 1: THE FORM */}
        {appState === "form" && (
          <form onSubmit={handleStartCall} className="flex flex-col gap-4">
            <h2 className="text-xl font-semibold mb-2">Let's get started</h2>
            <input 
              type="text" 
              placeholder="Your Name" 
              required
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input 
              type="email" 
              placeholder="Your Email" 
              required
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition">
              Start Conversation
            </button>
          </form>
        )}

        {/* STATE 2: CONNECTING */}
        {appState === "connecting" && (
          <div className="flex flex-col items-center justify-center py-10 gap-4">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="text-gray-600 font-medium animate-pulse">Connecting to Agent...</p>
          </div>
        )}

        {/* STATE 3: ACTIVE CALL */}
        {appState === "active" && (
          <div className="flex flex-col items-center py-6 gap-6">
            <p className="text-gray-500 font-mono text-lg">{formatTime(callDuration)}</p>
            <div className={`w-32 h-32 rounded-full overflow-hidden border-4 border-gray-100 ${isAgentSpeaking ? 'agent-speaking-pulse border-blue-400' : ''}`}>
              <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80" alt="Agent Avatar" className="w-full h-full object-cover"/>
            </div>
            <p className="text-sm font-semibold text-gray-700">{isAgentSpeaking ? "Agent is speaking..." : "Listening..."}</p>
            <button onClick={handleEndCall} className="mt-4 px-8 py-3 bg-red-500 text-white font-bold rounded-full hover:bg-red-600 transition">
              End Call
            </button>
          </div>
        )}

        {/* STATE 4: ANALYZING (Waiting for Retell) */}
        {appState === "analyzing" && (
          <div className="flex flex-col items-center text-center gap-4 py-8">
            <div className="w-10 h-10 border-4 border-gray-200 border-t-gray-800 rounded-full animate-spin"></div>
            <h2 className="text-xl font-bold text-gray-800">Generating Summary...</h2>
            <p className="text-gray-500 text-sm">The AI is finalizing your notes. This usually takes 5-10 seconds.</p>
          </div>
        )}

        {/* STATE 5: SUMMARY READY */}
        {appState === "summary_ready" && (
          <div className="flex flex-col items-center text-center gap-4 py-4">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-3xl mb-2">✓</div>
            <h2 className="text-2xl font-bold text-gray-800">Call Complete</h2>
            
            {/* The Retell Summary Box */}
            <div className="w-full p-4 bg-gray-50 border border-gray-200 rounded-lg text-left mt-2 mb-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">AI Call Summary</p>
              <p className="text-sm text-gray-700 leading-relaxed">{callSummary}</p>
            </div>

            <button onClick={() => window.location.reload()} className="mt-2 text-sm text-gray-500 hover:text-gray-800 underline">
              Start a new session
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
