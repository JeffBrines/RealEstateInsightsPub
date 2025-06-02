import type { Express } from "express";
import { createServer, type Server } from "http";
import OpenAI from "openai";
import { aiQuerySchema, aiResponseSchema, Property } from "@shared/schema";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY || "sk-demo-key"
});

export async function registerRoutes(app: Express): Promise<Server> {
  
  // AI Query endpoint
  app.post("/api/ai/query", async (req, res) => {
    try {
      const { query, data, filters } = aiQuerySchema.parse(req.body);
      
      if (!openai.apiKey || openai.apiKey === "sk-demo-key") {
        // Fallback response when no API key is available
        return res.json({
          answer: "AI service is not configured. Please provide an OpenAI API key to enable AI features.",
          data: { error: "No API key configured" }
        });
      }

      // Prepare data summary for AI context
      const dataSummary = {
        totalProperties: data.length,
        averagePrice: data.reduce((sum: number, p: Property) => sum + p.price, 0) / data.length,
        priceRange: {
          min: Math.min(...data.map((p: Property) => p.price)),
          max: Math.max(...data.map((p: Property) => p.price))
        },
        statusDistribution: data.reduce((acc: Record<string, number>, p: Property) => {
          acc[p.status] = (acc[p.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        bedroomDistribution: data.reduce((acc: Record<number, number>, p: Property) => {
          acc[p.beds] = (acc[p.beds] || 0) + 1;
          return acc;
        }, {} as Record<number, number>),
        cities: Array.from(new Set(data.map((p: Property) => p.city))),
        propertyTypes: Array.from(new Set(data.map((p: Property) => p.propertyType)))
      };

      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a real estate data analyst. Analyze the provided real estate data and answer user questions with accurate, specific information. 

            Data summary: ${JSON.stringify(dataSummary)}
            
            Provide responses in JSON format with:
            - answer: A clear, conversational response
            - data: Relevant calculations or statistics
            
            When providing statistics, always reference the actual data provided. Be specific about counts, averages, and ranges.`
          },
          {
            role: "user",
            content: query
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1,
      });

      const aiResponse = JSON.parse(completion.choices[0].message.content || "{}");
      
      const response = aiResponseSchema.parse({
        answer: aiResponse.answer || "I couldn't process that query. Please try rephrasing.",
        data: aiResponse.data || {},
        filters: aiResponse.filters
      });

      res.json(response);

    } catch (error) {
      console.error("AI query error:", error);
      res.status(500).json({
        answer: "I'm having trouble processing your request right now. Please try again later.",
        data: { error: "Internal server error" }
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
