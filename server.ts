import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

app.use(express.json());

// API: Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// Helper: Guard against missing API Key
const checkApiKey = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!process.env.GEMINI_API_KEY) {
    res.status(500).json({
      error: "GEMINI_API_KEY is not configured in your Secrets panel.",
    });
    return;
  }
  next();
};

// API: Get study task recommendations & plan
app.post("/api/ai/recommend-tasks", checkApiKey, async (req, res) => {
  try {
    const { tasks, notes } = req.body;

    const prompt = `You are a world-class smart study advisor and productivity expert. 
Analyze the user's current tasks and study notes to provide:
1. Prioritized suggestions for what they should work on next.
2. 3 concrete study task recommendations tailored to their deadlines and subject areas.
3. A short, highly motivating focus quote or tip.

Current Tasks:
${JSON.stringify(tasks || [], null, 2)}

Current Study Notes:
${JSON.stringify(notes || [], null, 2)}

Respond with a JSON object matching this schema:
{
  "recommendations": [
    {
      "title": "Task title (e.g. Solve 5 calculus problems)",
      "reason": "Why this is recommended (related to tasks, notes or deadlines)",
      "priority": "High" | "Medium" | "Low",
      "estimatedMinutes": number,
      "category": "Study" | "Revision" | "Exercise" | "Research"
    }
  ],
  "focusPlan": "A brief, actionable plan or tip for the current session (max 3 sentences)",
  "motivation": "A very short motivational micro-quote (max 10 words)"
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recommendations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  reason: { type: Type.STRING },
                  priority: { type: Type.STRING, enum: ["High", "Medium", "Low"] },
                  estimatedMinutes: { type: Type.INTEGER },
                  category: { type: Type.STRING, enum: ["Study", "Revision", "Exercise", "Research"] },
                },
                required: ["title", "reason", "priority", "estimatedMinutes", "category"],
              },
            },
            focusPlan: { type: Type.STRING },
            motivation: { type: Type.STRING },
          },
          required: ["recommendations", "focusPlan", "motivation"],
        },
      },
    });

    const text = response.text || "{}";
    res.json(JSON.parse(text));
  } catch (error: any) {
    console.error("Error in /api/ai/recommend-tasks:", error);
    res.status(500).json({ error: error.message || "Failed to generate recommendations" });
  }
});

// API: Generate flashcards from content or topic
app.post("/api/ai/generate-flashcards", checkApiKey, async (req, res) => {
  try {
    const { source, count = 5 } = req.body;

    const prompt = `You are an expert educator. Create exactly ${count} highly effective study flashcards based on this content/topic:
"${source}"

Flashcards should have a clear, concise question/concept on the front and a complete, clear, and punchy explanation on the back.
Keep fronts short (usually under 15 words) and backs focused (under 40 words).

Respond with a JSON object matching this schema:
{
  "flashcards": [
    {
      "front": "Question or prompt",
      "back": "Answer or explanation"
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            flashcards: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  front: { type: Type.STRING },
                  back: { type: Type.STRING },
                },
                required: ["front", "back"],
              },
            },
          },
          required: ["flashcards"],
        },
      },
    });

    const text = response.text || "{}";
    res.json(JSON.parse(text));
  } catch (error: any) {
    console.error("Error in /api/ai/generate-flashcards:", error);
    res.status(500).json({ error: error.message || "Failed to generate flashcards" });
  }
});

// API: Break down task or note into subtasks/action items
app.post("/api/ai/suggest-subtasks", checkApiKey, async (req, res) => {
  try {
    const { title, description } = req.body;

    const prompt = `Take this task or study topic and break it down into 3-5 bite-sized, actionable subtasks:
Title: "${title}"
Description: "${description || "None"}"

Respond with a JSON object matching this schema:
{
  "subtasks": [
    {
      "title": "Subtask action (e.g. Set up database schema)",
      "duration": "Estimated time (e.g. 15 mins)"
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            subtasks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  duration: { type: Type.STRING },
                },
                required: ["title", "duration"],
              },
            },
          },
          required: ["subtasks"],
        },
      },
    });

    const text = response.text || "{}";
    res.json(JSON.parse(text));
  } catch (error: any) {
    console.error("Error in /api/ai/suggest-subtasks:", error);
    res.status(500).json({ error: error.message || "Failed to generate subtasks" });
  }
});

// API: General study assistant chat
app.post("/api/ai/chat", checkApiKey, async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    // Filter and map the history correctly
    const formattedHistory = history.map((item: any) => ({
      role: item.role === "user" ? "user" : "model",
      parts: [{ text: item.content }],
    }));

    const chat = ai.chats.create({
      model: "gemini-3.5-flash",
      config: {
        systemInstruction: `You are Aura, a friendly, ultra-supportive AI study companion and academic coach. 
Your goal is to help users study effectively, manage deadlines, beat procrastination, and optimize their Pomodoro sessions.
Give highly actionable, clear, and encouraging study/focus tips. Keep answers concise, beautiful, and structured with bullet points where appropriate. Ask centering questions if they feel overwhelmed.`,
      },
      history: formattedHistory,
    });

    const response = await chat.sendMessage({ message });
    res.json({ reply: response.text });
  } catch (error: any) {
    console.error("Error in /api/ai/chat:", error);
    res.status(500).json({ error: error.message || "Failed to generate response" });
  }
});

// Serve static assets in production, use Vite middleware in dev
const startServer = async () => {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
};

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
