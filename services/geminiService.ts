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
       - IMPORTANT: Output ONLY the JSON instance data. Do NOT repeat the schema definition.
       - Do not put markdown code block ticks (like \`\`\`json) inside the <json> tags. Just the raw JSON string.
    
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

    // --- ROBUST JSON EXTRACTION ---

    let jsonStr = "";
    
    // Strategy 1: Targeted Extraction (Best for mixed output)
    // We look for the "problemSummary" key followed by a string value (indicated by :).
    // This distinguishes the actual data from a schema definition (where problemSummary is followed by an object).
    const dataMarkerRegex = /"problemSummary"\s*:\s*"/;
    const match = fullText.match(dataMarkerRegex);
    
    if (match && match.index !== undefined) {
        // Walk backwards to find the opening brace for this object
        let openBraceIdx = -1;
        let balance = 0;
        for (let i = match.index; i >= 0; i--) {
            if (fullText[i] === '}') balance++;
            if (fullText[i] === '{') {
                if (balance === 0) {
                    openBraceIdx = i;
                    break;
                }
                balance--;
            }
        }

        if (openBraceIdx !== -1) {
            // Walk forwards to find the matching closing brace
            let closeBraceIdx = -1;
            balance = 0;
            for (let i = openBraceIdx; i < fullText.length; i++) {
                if (fullText[i] === '{') balance++;
                if (fullText[i] === '}') {
                    balance--;
                    if (balance === 0) {
                        closeBraceIdx = i;
                        break;
                    }
                }
            }

            if (closeBraceIdx !== -1) {
                jsonStr = fullText.substring(openBraceIdx, closeBraceIdx + 1);
            }
        }
    }
    
    // Strategy 2: Explicit <json> tags (Case insensitive)
    if (!jsonStr) {
        const tagMatch = fullText.match(/<json>([\s\S]*?)<\/json>/i);
        if (tagMatch && tagMatch[1]) {
          jsonStr = tagMatch[1];
        } 
    }
    
    // Strategy 3: Markdown code blocks (common fallback)
    if (!jsonStr) {
      const codeBlockMatches = [...fullText.matchAll(/```(?:json)?([\s\S]*?)```/g)];
      for (const match of codeBlockMatches) {
        if (match[1] && match[1].includes("problemSummary")) {
            jsonStr = match[1];
            break;
        }
      }
    }

    // Strategy 4: Naked JSON finding (Last resort)
    if (!jsonStr) {
       const startIdx = fullText.indexOf('{');
       const endIdx = fullText.lastIndexOf('}');
       if (startIdx !== -1 && endIdx !== -1) {
           jsonStr = fullText.substring(startIdx, endIdx + 1);
       }
    }

    if (!jsonStr) {
        console.error("Gemini Response Text (Failed to extract JSON):", fullText);
        throw new Error("Could not extract JSON solution from model response.");
    }

    // Clean up
    jsonStr = jsonStr.trim();
    jsonStr = jsonStr.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/\s*```$/, '');

    try {
        return JSON.parse(jsonStr) as MathSolution;
    } catch (parseError) {
        console.error("JSON Parse Error:", parseError);
        console.error("Attempted JSON String:", jsonStr);
        throw new Error("Could not parse JSON solution from model response.");
    }

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
