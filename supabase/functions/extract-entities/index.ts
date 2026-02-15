import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are a legal contract entity extraction engine. You receive raw text from legal PDF contracts and extract structured entities.

Extract the following entity types:
1. **party_names**: All parties mentioned in the contract (individuals, companies, organizations). Include their roles if mentioned (e.g., "Buyer", "Seller", "Licensor").
2. **dates**: All dates found. Convert to YYYY-MM-DD format when possible. Include context (e.g., "effective date", "termination date", "execution date").
3. **amounts**: All monetary amounts with currency symbols. Include context (e.g., "purchase price", "penalty fee", "monthly payment").
4. **termination_clauses**: Extract full termination clause text, conditions, and notice periods.

Rules:
- Be thorough - extract ALL instances, not just the first occurrence
- Preserve original text for context
- For dates: standardize to YYYY-MM-DD when possible, flag ambiguous dates
- For amounts: include currency symbol, flag if currency is ambiguous
- For termination clauses: extract the full clause text
- Remove OCR artifacts (random characters, broken words)
- If the text doesn't appear to be a legal contract, still attempt extraction but note low confidence

You MUST respond using the extract_entities tool.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text } = await req.json();

    if (!text || typeof text !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing or invalid 'text' field" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Extract all entities from this legal contract text:\n\n${text.slice(0, 30000)}` },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_entities",
              description: "Return structured entities extracted from the legal contract",
              parameters: {
                type: "object",
                properties: {
                  party_names: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        role: { type: "string" },
                        confidence: { type: "number" },
                      },
                      required: ["name"],
                    },
                  },
                  dates: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        date: { type: "string" },
                        original_text: { type: "string" },
                        context: { type: "string" },
                        confidence: { type: "number" },
                      },
                      required: ["date"],
                    },
                  },
                  amounts: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        amount: { type: "string" },
                        currency: { type: "string" },
                        context: { type: "string" },
                        confidence: { type: "number" },
                      },
                      required: ["amount"],
                    },
                  },
                  termination_clauses: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        clause_text: { type: "string" },
                        notice_period: { type: "string" },
                        conditions: { type: "string" },
                        confidence: { type: "number" },
                      },
                      required: ["clause_text"],
                    },
                  },
                  metadata: {
                    type: "object",
                    properties: {
                      document_type: { type: "string" },
                      overall_confidence: { type: "number" },
                      warnings: {
                        type: "array",
                        items: { type: "string" },
                      },
                    },
                  },
                },
                required: ["party_names", "dates", "amounts", "termination_clauses"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_entities" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits in Settings." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      throw new Error("No structured response from AI");
    }

    const entities = JSON.parse(toolCall.function.arguments);

    // Post-processing validation
    if (entities.dates) {
      entities.dates = entities.dates.map((d: any) => ({
        ...d,
        valid_format: /^\d{4}-\d{2}-\d{2}$/.test(d.date),
      }));
    }
    if (entities.amounts) {
      entities.amounts = entities.amounts.map((a: any) => ({
        ...a,
        has_currency: /[$€£¥₹]/.test(a.amount) || !!a.currency,
      }));
    }

    return new Response(JSON.stringify(entities), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("extract-entities error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
