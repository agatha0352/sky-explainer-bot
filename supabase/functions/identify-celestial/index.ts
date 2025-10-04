import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, image, type } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log(`Processing ${type} request`);

    let messages;
    if (type === "image") {
      messages = [
        {
          role: "system",
          content: "You are an expert astronomer who identifies celestial objects from images. Provide detailed, accurate information in a fun and educational way.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Please identify this celestial object and provide comprehensive information about it.",
            },
            {
              type: "image_url",
              image_url: {
                url: image,
              },
            },
          ],
        },
      ];
    } else {
      messages = [
        {
          role: "system",
          content: "You are an expert astronomer providing detailed information about celestial objects. Your responses are fun, clear, and educational.",
        },
        {
          role: "user",
          content: `Tell me everything about ${query}. Provide detailed information about this celestial object.`,
        },
      ];
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        tools: [
          {
            type: "function",
            function: {
              name: "provide_celestial_info",
              description: "Provide structured information about a celestial object",
              parameters: {
                type: "object",
                properties: {
                  name: {
                    type: "string",
                    description: "The name of the celestial object",
                  },
                  type: {
                    type: "string",
                    description: "Type of object (exoplanet, comet, asteroid, star, galaxy, etc.)",
                  },
                  distance: {
                    type: "string",
                    description: "Distance from Earth or solar system",
                  },
                  orbit: {
                    type: "string",
                    description: "What it orbits around (star name, planet, etc.) and orbital details",
                  },
                  moons: {
                    type: "string",
                    description: "Information about moons or rings if applicable",
                  },
                  size: {
                    type: "string",
                    description: "Size comparisons and dimensions",
                  },
                  composition: {
                    type: "string",
                    description: "What it's made of (gases, rocks, ice, etc.)",
                  },
                  special: {
                    type: "string",
                    description: "Unique or interesting features that make it special",
                  },
                  notes: {
                    type: "string",
                    description: "Additional fun facts and interesting information",
                  },
                },
                required: ["name", "type", "distance", "orbit", "moons", "size", "composition", "special", "notes"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "provide_celestial_info" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limits exceeded. Please try again later." }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to continue." }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    console.log("AI response received");

    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error("No tool call in response");
    }

    const celestialInfo = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(celestialInfo), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
