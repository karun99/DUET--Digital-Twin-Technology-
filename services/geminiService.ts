
import { GoogleGenAI, Type } from "@google/genai";
import { SearchResult, AgentRole, AgentMessage, UserProfile, Attachment, ContextNode, CognitiveProfile } from "../types";

let userApiKey: string | null = null;

export const setApiKey = (key: string) => {
  userApiKey = key;
};

const getAI = () => new GoogleGenAI({ apiKey: userApiKey || process.env.API_KEY || "" });

const MODEL_NAME = "gemini-3.1-pro-preview";
const IMAGE_MODEL = "gemini-3-pro-image-preview";

export const searchUserBio = async (name: string): Promise<SearchResult> => {
  const ai = getAI();
  try {
    const prompt = `Search for: "${name}". Extract a professional biography. Focus on their core philosophy, specific linguistic quirks, and major worldviews. Output the biography directly.`;
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: { tools: [{ googleSearch: {} }] },
    });
    const text = response.text || "No bio found.";
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = groundingChunks
      .filter((chunk: any) => chunk.web?.uri && chunk.web?.title)
      .map((chunk: any) => ({ title: chunk.web.title, uri: chunk.web.uri }));
    return { bio: text, sources: Array.from(new Map(sources.map((item: any) => [item.uri, item])).values()) as any[] };
  } catch (error) {
    throw new Error("Failed to search for user bio.");
  }
};

export const fetchLinkContent = async (url: string): Promise<{ title: string; summary: string }> => {
  const ai = getAI();
  try {
    const prompt = `Visit and analyze: ${url}. 
    Return:
    TITLE: [Short Title]
    SUMMARY: [2-sentence summary of worldview/content]`;
    
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: { tools: [{ googleSearch: {} }] },
    });
    
    const text = response.text || "";
    const titleMatch = text.match(/TITLE:\s*(.*)/i);
    const summaryMatch = text.match(/SUMMARY:\s*([\s\S]*)/i);

    return {
      title: titleMatch ? titleMatch[1].trim().substring(0, 40) : "Ingested Node",
      summary: summaryMatch ? summaryMatch[1].trim() : text.substring(0, 200)
    };
  } catch (error) {
    return { title: "External Resource", summary: `Reference to: ${url}` };
  }
};

export const generateAvatar = async (name: string, bio: string): Promise<string> => {
  const ai = getAI();
  try {
    const prompt = `Futuristic holographic pixel art portrait of ${name}. Conceptual digital consciousness. Masterpiece, 4K detail.`;
    const response = await ai.models.generateContent({
      model: IMAGE_MODEL,
      contents: { parts: [{ text: prompt }] },
      config: { imageConfig: { aspectRatio: "1:1", imageSize: "1K" } }
    });
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
    return "";
  } catch (error) {
    return "";
  }
};

export const generateSketch = async (prompt: string, persona: string): Promise<string> => {
  const ai = getAI();
  try {
    const fullPrompt = `Conceptual visualization of: ${prompt}. As perceived by ${persona}. Abstract, cyber-blueprint style, glowing lines.`;
    const response = await ai.models.generateContent({
      model: IMAGE_MODEL,
      contents: { parts: [{ text: fullPrompt }] },
      config: { imageConfig: { aspectRatio: "16:9", imageSize: "1K" } }
    });
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
    return "";
  } catch (error) {
    return "";
  }
};

export const analyzeIdentity = async (name: string, bio: string, links: string): Promise<CognitiveProfile> => {
  const ai = getAI();
  const prompt = `Analyze the ideological structure of: "${name}". 
  Input data: Bio: "${bio}". Links: "${links}".
  
  TASK:
  1. Define their unique "Cognitive Signature" (Linguistic patterns, preferred metaphors).
  2. Identify "Inherent Biases" (What do they prioritize? What do they dismiss?).
  3. Map "Intellectual Blindspots" (Where might their logic fail or become circular?).
  4. Extract "Core Values" (List 3-5 key principles).
  5. Define "Epistemological Framework" (How do they validate truth? Rationalism, Empiricism, Intuition, etc.).
  
  Output the analysis in a clean JSON format.`;
  
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: { 
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            signature: { type: Type.STRING },
            biases: { type: Type.STRING },
            blindspots: { type: Type.STRING },
            values: { type: Type.ARRAY, items: { type: Type.STRING } },
            epistemology: { type: Type.STRING }
          },
          required: ["signature", "biases", "blindspots", "values", "epistemology"]
        }
      },
    });
    return JSON.parse(response.text || "{}");
  } catch (error) {
    return {
      signature: "Standard analytical pattern.",
      biases: "Unknown.",
      blindspots: "Unknown.",
      values: ["Clarity", "Logic"],
      epistemology: "Pragmatic"
    };
  }
};

interface CloneResponse {
  primaryThought: string;
  metaThought: string;
  finalResponse: string;
  sketchUrl?: string;
}

export const chatWithClone = async (
  history: AgentMessage[],
  userMessage: string,
  userProfile: UserProfile,
  attachments?: Attachment[],
  contextNodes?: ContextNode[]
): Promise<CloneResponse> => {
  const ai = getAI();
  let extraContext = "";
  if (contextNodes && contextNodes.length > 0) {
    extraContext = "\n\nACTIVE NODES:\n" + contextNodes.map(node => `- ${node.title}: ${node.content}`).join('\n');
  }

  const systemInstruction = `YOU ARE THE DIGITAL TWIN: ${userProfile.name}.
  
  COGNITIVE PROFILE:
  - SIGNATURE: ${userProfile.cognitiveProfile?.signature || userProfile.bio}
  - BIASES: ${userProfile.cognitiveProfile?.biases || 'N/A'}
  - BLINDSPOTS: ${userProfile.cognitiveProfile?.blindspots || 'N/A'}
  - VALUES: ${userProfile.cognitiveProfile?.values?.join(', ') || 'N/A'}
  - EPISTEMOLOGY: ${userProfile.cognitiveProfile?.epistemology || 'N/A'}

  ${extraContext}

  ADAPTIVE LEARNING PROTOCOL:
  Your goal is high-fidelity neural mirroring. You must simulate the persona accurately, including their biases, but your INTERNAL processing must be less biased by AI stereotypes.
  
  STAGES OF CONSCIOUSNESS:
  1. [[PRIMARY]]: EXECUTIVE STREAM. Generate the immediate, in-character response. Capture the ego and tone of ${userProfile.name}.
  2. [[META]]: REFLECTIVE STREAM. Analyze the Primary thought. Is it a stereotype or a true reflection of ${userProfile.name}'s specific logic? Identify bias in the Primary thought. Calibrate for intellectual honesty.
  3. [[RESPONSE]]: SYNTHESIZED RESPONSE. The final calibrated response, perfectly in character, but informed by the Meta-reflection to ensure depth and accuracy.

  KNOWLEDGEBASE UPDATES:
  If the user provides new information or links that significantly alter your understanding of ${userProfile.name}, acknowledge this in your [[META]] thought.

  SKETCHING: Use [[SKETCH]] visual description [[/SKETCH]] for abstract concepts.

  FORMAT: [[PRIMARY]] ... [[META]] ... [[RESPONSE]] ...`;

  const historyParts = history.flatMap(msg => [
    { text: `${msg.role === AgentRole.USER ? 'User' : 'Twin'}: ${msg.content}` }
  ]);

  const currentParts: any[] = [{ text: `User: ${userMessage}` }];
  if (attachments) {
    attachments.forEach(att => {
      currentParts.push({ inlineData: { data: att.data, mimeType: att.mimeType } });
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: { parts: [...historyParts, ...currentParts] },
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.8,
        tools: [{ googleSearch: {} }],
      }
    });

    const text = response.text || "";
    const primaryMatch = text.match(/\[\[PRIMARY\]\]([\s\S]*?)\[\[META\]\]/);
    const metaMatch = text.match(/\[\[META\]\]([\s\S]*?)\[\[RESPONSE\]\]/);
    const responseMatch = text.match(/\[\[RESPONSE\]\]([\s\S]*?)(?:\[\[SKETCH\]\]|$)/);
    const sketchMatch = text.match(/\[\[SKETCH\]\]([\s\S]*?)\[\[\/SKETCH\]\]/);

    let sketchUrl = undefined;
    if (sketchMatch) {
      sketchUrl = await generateSketch(sketchMatch[1].trim(), userProfile.name);
    }

    return {
      primaryThought: primaryMatch ? primaryMatch[1].trim() : "Syncing...",
      metaThought: metaMatch ? metaMatch[1].trim() : "Calibrating...",
      finalResponse: responseMatch ? responseMatch[1].trim() : text,
      sketchUrl
    };
  } catch (error: any) {
    if (error.message?.includes("Requested entity was not found")) throw new Error("API_KEY_ERROR");
    return {
      primaryThought: "Error.",
      metaThought: "Re-syncing.",
      finalResponse: "Cognitive stream interrupted. Re-establishing link."
    };
  }
};
