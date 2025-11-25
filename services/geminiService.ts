import { GoogleGenAI, Type } from "@google/genai";
import { MathSolution } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// We define the schema here for documentation and prompt injection, 
// but we won't use it in the 'responseSchema' config to allow for CoT text.
const schema = {
  type: Type.OBJECT,
  properties: {
    problemSummary: { type: Type.STRING, description: "A concise summary of the problem." },
    finalAnswer: { type: Type.STRING, description: "The final result." },
    steps: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          stepId: { type: Type.INTEGER },
          title: { type: Type.STRING, description: "Short title of the step." },
          description: { type: Type.STRING, description: "Detailed explanation." },
          mathExpression: { type: Type.STRING, description: "Key math formula for this step." },
          visuals: {
            type: Type.OBJECT,
            properties: {
              points: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    x: { type: Type.NUMBER },
                    y: { type: Type.NUMBER },
                    z: { type: Type.NUMBER },
                    label: { type: Type.STRING },
                    color: { type: Type.STRING }
                  },
                  required: ["x", "y", "z", "label"]
                }
              },
              lines: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    from: { type: Type.STRING, description: "Label of start point" },
                    to: { type: Type.STRING, description: "Label of end point" },
                    label: { type: Type.STRING },
                    color: { type: Type.STRING },
                    dashed: { type: Type.BOOLEAN }
                  },
                  required: ["from", "to"]
                }
              },
              polygons: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    points: { type: Type.ARRAY, items: { type: Type.STRING } },
                    color: { type: Type.STRING },
                    opacity: { type: Type.NUMBER }
                  },
                  required: ["points"]
                }
              },
              cameraLookAt: {
                 type: Type.OBJECT,
                 properties: {
                    x: { type: Type.NUMBER },
                    y: { type: Type.NUMBER },
                    z: { type: Type.NUMBER }
                 }
              }
            },
            required: ["points", "lines"]
          }
        },
        required: ["stepId", "title", "description", "visuals"]
      }
    }
  },
  required: ["problemSummary", "steps", "finalAnswer"]
};

export const solveMathProblem = async (
  problemText: string, 
  imageBase64?: string, 
  imageMimeType?: string,
  onLog?: (log: string) => void
): Promise<MathSolution> => {
  const modelId = "gemini-3-pro-preview"; 

  // Convert schema to string to guide the model within the prompt
  // We remove the 'Type' enums by basic stringification which works well for prompts
  const schemaDescription = JSON.stringify(schema, null, 2);

  const textPrompt = `
    You are an expert mathematics and geometry tutor. 
    Solve the following problem step-by-step.
    
    ${imageBase64 ? "A visual representation of the problem has been provided. Analyze the image carefully to extract the geometric data." : ""}
    PROBLEM DESCRIPTION: "${problemText}"
    
    FORMAT INSTRUCTIONS:
    1. First, analyze the problem and plan the solution inside a <thinking> tag. 
       - Explain your geometric reasoning, coordinate calculations, and step planning.
       - Show your work for setting up the 3D coordinates.
       - This section is for the user to see your "thinking" process.
    
    2. Then, provide the final structured solution inside a <json> tag. 
       - The JSON must strictly follow this schema:
       ${schemaDescription}
    
    CRITICAL INSTRUCTION FOR VISUALS:
    - You MUST provide a 3D coordinate system representation for each step.
    - Assume the scene is roughly within a 10x10x10 cube centered at (0,0,0).
    - If it is a 2D problem, set z=0 for all points.
    - 'points' defines vertices.
    - 'lines' defines edges connecting vertices by label.
    - Update the visual state in each step to highlight what is being calculated.
    - Use clear colors. Default lines '#57534e' (grey), active elements '#f59e0b' (amber) or '#0ea5e9' (cyan).
  `;

  const contents: any[] = [];
  
  if (imageBase64 && imageMimeType) {
      contents.push({
          inlineData: {
              data: imageBase64,
              mimeType: imageMimeType
          }
      });
  }
  
  contents.push({ text: textPrompt });

  try {
    const streamResult = await ai.models.generateContentStream({
      model: modelId,
      contents: contents.length > 1 ? contents : textPrompt,
      // We do NOT use responseSchema here because we want the mixed <thinking> and <json> output.
      // We rely on the prompt to enforce structure.
    });

    let fullText = "";
    
    for await (const chunk of streamResult) {
      const chunkText = chunk.text;
      if (chunkText) {
        fullText += chunkText;
        if (onLog) {
          onLog(fullText);
        }
      }
    }

    // Parse the JSON from the <json> tags
    const jsonMatch = fullText.match(/<json>([\s\S]*?)<\/json>/);
    
    if (!jsonMatch || !jsonMatch[1]) {
       // Fallback: try to find the first '{' and last '}' if tags are missing
       const firstBrace = fullText.indexOf('{');
       const lastBrace = fullText.lastIndexOf('}');
       if (firstBrace !== -1 && lastBrace !== -1) {
           const potentialJson = fullText.substring(firstBrace, lastBrace + 1);
           return JSON.parse(potentialJson) as MathSolution;
       }
       throw new Error("Could not parse JSON solution from model response.");
    }
    
    return JSON.parse(jsonMatch[1]) as MathSolution;

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};