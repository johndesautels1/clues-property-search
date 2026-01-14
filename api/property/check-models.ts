import { GoogleGenerativeAI } from "@google/generative-ai";

// 1. Setup your key
const API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "YOUR_API_KEY_HERE";

if (!API_KEY || API_KEY === "YOUR_API_KEY_HERE") {
  console.error("❌ Error: API Key not found. Set GEMINI_API_KEY in your env or paste it in the script.");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);

async function main() {
  console.log("---------------------------------------------------");
  console.log("📡 CONNECTION CHECK: Google Generative AI (Jan 2026)");
  console.log("---------------------------------------------------");

  // PART A: List Available Models (Direct API Fetch for raw truth)
  // We use fetch here because the SDK versioning for listing models can vary,
  // but the HTTP endpoint is the source of truth.
  try {
    console.log("\n🔍 Fetching available models for your API key...");

    const listResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`);
    const data = await listResponse.json();

    if (!data.models) {
        throw new Error("No models returned from API.");
    }

    const relevantModels = data.models
      .filter((m: any) => m.name.includes("gemini"))
      .map((m: any) => m.name.replace("models/", ""));

    // Filter for the ones we care about
    const pro3 = relevantModels.find((m: string) => m.includes("gemini-3-pro"));
    const flash25 = relevantModels.find((m: string) => m.includes("gemini-2.5-flash"));

    console.log(`\n✅ Access Confirmed. Found ${relevantModels.length} models.`);

    if (pro3) {
        console.log(`   🌟 TARGET MODEL FOUND: \x1b[32m${pro3}\x1b[0m (Ready for use)`);
    } else {
        console.log(`   ❌ WARNING: gemini-3-pro NOT listed. You may need to enable it in Google AI Studio.`);
    }

    // List top 5 recent ones for verification
    console.log("\n   Recent Models Available:");
    relevantModels.slice(0, 5).forEach((m: string) => console.log(`   - ${m}`));

  } catch (error) {
    console.error("   ❌ Failed to list models:", error);
  }

  // PART B: Test Generation with gemini-3-pro
  console.log("\n---------------------------------------------------");
  console.log("🧪 TEST: Sending 'Hello World' to gemini-3-pro...");

  try {
    // Specifically testing the model you need for the 181 data fields
    const model = genAI.getGenerativeModel({ model: "gemini-3-pro" });

    const result = await model.generateContent("Return exactly the string 'Connection Successful'.");
    const response = await result.response;
    const text = response.text();

    console.log(`\n🤖 Model Responded: "${text.trim()}"`);
    console.log("\n✅ SUCCESS: gemini-3-pro is active and working.");

  } catch (error: any) {
    console.log("\n❌ FAIL: Could not generate with gemini-3-pro.");
    console.error("   Error Details:", error.message);

    if (error.message.includes("404") || error.message.includes("not found")) {
        console.log("\n   💡 TIP: If you see a 404, switch your code to 'gemini-2.5-pro' temporarily.");
    }
  }
  console.log("---------------------------------------------------");
}

main();
