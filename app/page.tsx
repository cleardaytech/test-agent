"use client";
import React, { useState, useEffect } from "react";
import { RetellWebClient } from "retell-client-js-sdk";

// Initialize the Retell Client outside the component
const webClient = new RetellWebClient();

export default function VoiceAgentPage() {
  // Application States
  const [appState, setAppState] = useState("form"); // form, connecting, active, ended
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  
  // User Info Form State
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");

  // Setup Event Listeners for the Retell SDK
  useEffect(() => {
    webClient.on("call_started", () => {
      setAppState("active");
    });

    webClient.on("call_ended", () => {
      setAppState("ended");
      setIsAgentSpeaking(false);
    });

    // These trigger the visual pulse effect
    webClient.on("agent_start_talking", () => setIsAgentSpeaking(true));
    webClient.on("agent_stop_talking", () => setIsAgentSpeaking(false));

    return () => {
      webClient.off("call_started");
      webClient.off("call_ended");
      webClient.off("agent_start_talking");
      webClient.off("agent_stop_talking");
    };
  }, []);

  // Timer logic for the active call
  useEffect(() => {
    let timer;
    if (appState === "active") {
      timer = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [appState]);

  // Format timer to MM:SS
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleStartCall = async (e) => {
    e.preventDefault();
    setAppState("connecting");

    try {
      // 1. Send form data to your backend
      const response = await fetch("/api/register-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userName, userEmail }),
      });

      const data = await response.json();
      
      if (data.access_token) {
        // 2. Start the call using the returned token
        await webClient.startCall({
          accessToken: data.access_token,
        });
      } else {
        console.error("No token received");
        setAppState("form");
      }
    } catch (error) {
      console.error("Failed to start call", error);
      setAppState("form");
    }
  };

  const handleEndCall = () => {
    webClient.stopCall();
    setAppState("ended");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 font-sans">
      
      {/* YOUR LOGO GOES HERE */}
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
            <button 
              type="submit" 
              className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition"
            >
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

        {/* STATE 3: ACTIVE CALL (AVATAR & TIMER) */}
        {appState === "active" && (
          <div className="flex flex-col items-center py-6 gap-6">
            <p className="text-gray-500 font-mono text-lg">{formatTime(callDuration)}</p>
            
            {/* The Avatar Image - Pulses when agent speaks */}
            <div className={`w-32 h-32 rounded-full overflow-hidden border-4 border-gray-100 ${isAgentSpeaking ? 'agent-speaking-pulse border-blue-400' : ''}`}>
              <img 
                src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80" 
                alt="Agent Avatar" 
                className="w-full h-full object-cover"
              />
            </div>

            <p className="text-sm font-semibold text-gray-700">
              {isAgentSpeaking ? "Agent is speaking..." : "Listening..."}
            </p>

            <button 
              onClick={handleEndCall}
              className="mt-4 px-8 py-3 bg-red-500 text-white font-bold rounded-full hover:bg-red-600 transition"
            >
              End Call
            </button>
          </div>
        )}

        {/* STATE 4: POST-CALL OFFER */}
        {appState === "ended" && (
          <div className="flex flex-col items-center text-center gap-4 py-4">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-3xl mb-2">
              ✓
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Thanks for chatting, {userName}!</h2>
            <p className="text-gray-600 mb-4">
              We've sent a summary of your call to {userEmail}. As a thank you, here is a special offer.
            </p>
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg w-full">
              <p className="font-bold text-yellow-800">Free Strategy Guide</p>
              <p className="text-sm text-yellow-700 mb-3">Claim your free gift below.</p>
              <button className="w-full bg-yellow-500 text-white font-bold py-2 rounded hover:bg-yellow-600">
                Claim Offer
              </button>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 text-sm text-gray-400 hover:text-gray-600 underline"
            >
              Start a new session
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
