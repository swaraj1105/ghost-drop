import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();
    const cleanPrompt = encodeURIComponent(prompt);

    // ---------------------------------------------------------
    // STRATEGY 1: POLLINATIONS AI
    // ---------------------------------------------------------
    console.log("Strategy 1: Attempting Pollinations...");
    const seed = Math.floor(Math.random() * 100000);
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${cleanPrompt}?width=1024&height=1024&seed=${seed}&nologo=true&model=turbo`;

    try {
        const response = await fetch(pollinationsUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            }
        });

        if (response.ok) {
            const arrayBuffer = await response.arrayBuffer();
            return new NextResponse(arrayBuffer, {
                headers: { "Content-Type": "image/jpeg" },
            });
        } else {
            console.warn(`[Pollinations] Failed with status: ${response.status}`);
        }
    } catch (e) {
        console.warn("[Pollinations] Network error:", e);
    }

    // ---------------------------------------------------------
    // STRATEGY 2: HUGGING FACE (Updated to New Router API)
    // ---------------------------------------------------------
    console.log("Strategy 2: Attempting Hugging Face...");
    
    const HF_API_KEY = process.env.HF_API_KEY; 

    if (HF_API_KEY) {
        // FIXED: Pointing to the new router.huggingface.co endpoint
        const hfResponse = await fetch(
          "https://router.huggingface.co/hf-inference/models/stabilityai/stable-diffusion-xl-base-1.0",
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
        } else {
            const errorText = await hfResponse.text();
            console.error(`[Hugging Face] Failed: ${hfResponse.status} - ${errorText}`);
        }
    } else {
        console.error("[Hugging Face] Missing HF_API_KEY in Vercel Environment Variables");
    }

    // ---------------------------------------------------------
    // FALLBACK
    // ---------------------------------------------------------
    console.log("All AI generation strategies failed.");
    return NextResponse.json({ error: "All AI Services Busy" }, { status: 503 });

  } catch (error) {
    console.error("[API Route] Critical Server Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}