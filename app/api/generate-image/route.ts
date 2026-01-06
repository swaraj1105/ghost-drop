import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();
    const cleanPrompt = encodeURIComponent(prompt);

    // ---------------------------------------------------------
    // STRATEGY 1: POLLINATIONS AI (Primary - Unlimited & Free)
    // ---------------------------------------------------------
    console.log("Strategy 1: Attempting Pollinations...");
    const seed = Math.floor(Math.random() * 100000);
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${cleanPrompt}?width=1024&height=1024&seed=${seed}&nologo=true&model=flux`;

    try {
        const response = await fetch(pollinationsUrl, {
            headers: {
                // We spoof the User-Agent to look like a real browser (Fixes 403 Error)
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            }
        });

        if (response.ok) {
            const arrayBuffer = await response.arrayBuffer();
            return new NextResponse(arrayBuffer, {
                headers: { "Content-Type": "image/jpeg" },
            });
        }
    } catch (e) {
        console.warn("Pollinations failed. Switching to Backup...", e);
    }

    // ---------------------------------------------------------
    // STRATEGY 2: HUGGING FACE (Backup - Reliable API)
    // ---------------------------------------------------------
    console.log("Strategy 2: Attempting Hugging Face...");
    
    // 🔑 PASTE YOUR TOKEN HERE
    // ✅ Secure Way: Read from Environment Variable
    const HF_API_KEY = process.env.HF_API_KEY; 

    if (!HF_API_KEY) {
        throw new Error("Missing Hugging Face API Key on Server");
    }
    
    // We use 'stable-diffusion-v1-5' because it is rarely restricted/deleted
    const hfResponse = await fetch(
      "https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5",
      {
        headers: {
          Authorization: `Bearer ${HF_API_KEY}`,
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({ inputs: prompt }),
      }
    );

    if (hfResponse.ok) {
        const hfBlob = await hfResponse.blob();
        const hfBuffer = await hfBlob.arrayBuffer();
        return new NextResponse(hfBuffer, {
            headers: { "Content-Type": "image/jpeg" },
        });
    }

    // If both fail, return 503 so Frontend can use Offline Mode
    return NextResponse.json({ error: "All AI Services Busy" }, { status: 503 });

  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}