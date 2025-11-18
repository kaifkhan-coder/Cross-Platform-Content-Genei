
import { GoogleGenAI, Type } from "@google/genai";
import type { Tone, PostContent, AspectRatio } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const responseSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      platform: {
        type: Type.STRING,
        enum: ['LinkedIn', 'Twitter', 'Instagram'],
        description: 'The social media platform name.'
      },
      text: {
        type: Type.STRING,
        description: 'The generated social media post content, tailored for the platform.'
      },
      image_prompt: {
        type: Type.STRING,
        description: 'A concise, descriptive prompt for an AI image generator to create a relevant visual.'
      }
    },
    required: ['platform', 'text', 'image_prompt'],
  },
};

export const generateSocialPosts = async (idea: string, tone: Tone): Promise<PostContent[]> => {
  const prompt = `
    Based on the following idea and tone, generate tailored social media posts for LinkedIn, Twitter, and Instagram.

    **Idea:** "${idea}"
    **Tone:** "${tone}"

    **Platform-specific Instructions:**
    - **LinkedIn:** Create a professional, long-form post (2-3 paragraphs) that encourages discussion and engagement.
    - **Twitter:** Write a short, punchy tweet (under 280 characters) with a clear call-to-action or a thought-provoking question.
    - **Instagram:** Craft a visually-focused caption. Start with a hook, provide some value, and include 3-5 relevant hashtags at the end.

    For each post, also create a concise, descriptive prompt for an AI image generator that visually captures the essence of the post.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: responseSchema,
      },
    });

    const jsonText = response.text.trim();
    const parsedResponse = JSON.parse(jsonText) as PostContent[];
    
    // Ensure the order is consistent
    const platformOrder: PostContent['platform'][] = ['LinkedIn', 'Twitter', 'Instagram'];
    return parsedResponse.sort((a, b) => platformOrder.indexOf(a.platform) - platformOrder.indexOf(b.platform));

  } catch (error) {
    console.error("Error generating social posts:", error);
    throw new Error("Failed to generate content. Please check your input and try again.");
  }
};


export const generateImage = async (prompt: string, aspectRatio: AspectRatio): Promise<string> => {
  try {
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: `High-quality, professional photograph style: ${prompt}`,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
        aspectRatio,
      },
    });
    
    const base64ImageBytes = response.generatedImages[0].image.imageBytes;
    return `data:image/jpeg;base64,${base64ImageBytes}`;
  } catch (error) {
    console.error("Error generating image:", error);
    throw new Error("Failed to generate an image for the post.");
  }
};
