import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { taskTitle } = await req.json();

    if (!taskTitle) {
      return new Response(
        JSON.stringify({ error: "Task title is required" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: "OpenAI API key not configured" }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const systemPrompt = `You are a helpful assistant who breaks down big tasks into simple, clear subtasks. Given a main task title, return a list of 5 to 7 clear, short subtasks needed to complete it. The subtasks should be practical and written in plain language. Return them as a plain JSON array. Do not include any extra text or explanations.\n\nMain task: "Plan a wedding"\nExample output:\n[\n  "Book wedding venue",\n  "Hire a photographer",\n  "Send invitations",\n  "Arrange catering",\n  "Plan wedding ceremony",\n  "Choose a wedding dress",\n  "Plan honeymoon"\n]\nNow generate subtasks for this task:\n"${taskTitle}"`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: taskTitle,
          },
        ],
        response_format: { type: "text" },
        temperature: 1,
        max_completion_tokens: 2048,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return new Response(
        JSON.stringify({ error: "OpenAI API request failed", details: error }),
        {
          status: response.status,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const data = await response.json();
    const subtasksText = data.choices[0]?.message?.content;

    if (!subtasksText) {
      return new Response(
        JSON.stringify({ error: "No subtasks generated" }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Parse the JSON array from the response
    let subtasks: string[];
    try {
      subtasks = JSON.parse(subtasksText);
    } catch (e) {
      return new Response(
        JSON.stringify({ error: "Failed to parse subtasks", details: subtasksText }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    return new Response(
      JSON.stringify({ subtasks }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});