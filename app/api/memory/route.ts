import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase/server';
import { ApiResponse, MemoryEntry } from '@/lib/types';
import { logger } from '@/lib/logger';
import { GoogleGenAI } from '@google/genai';

export async function GET(req: Request) {
  const { supabase, user } = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ success: false, error: { message: "Unauthorized" } }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "100", 10) || 100, 500);
  const q = (searchParams.get("q") || "").trim();
  const agent = (searchParams.get("agent") || "").trim();

  let query = supabase
    .from("memories")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (q) {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("Missing GEMINI_API_KEY for embedding");
      
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.embedContent({
        model: 'text-embedding-004',
        contents: q,
      });
      
      const embeddings = response.embeddings;
      if (!embeddings || embeddings.length === 0 || !embeddings[0].values) {
        throw new Error("Failed to generate embedding");
      }
      
      const embedding = embeddings[0].values;
      
      const { data: rpcData, error: rpcError } = await supabase.rpc('match_memories', {
        query_embedding: JSON.stringify(embedding),
        match_threshold: 0.1, // Adjust as needed
        match_count: limit,
      });

      if (rpcError) throw rpcError;
      
      let filteredData = rpcData || [];
      if (agent) {
        filteredData = filteredData.filter((m: any) => m.agent_label === agent);
      }
      
      return NextResponse.json({ success: true, data: filteredData });
    } catch (err: any) {
      logger.error('memory_api', 'Vector search failed, falling back to ilike', { message: err.message });
      // Fallback to text search
      const escaped = q.replace(/[%_]/g, (m) => `\\${m}`);
      query = query.ilike("content", `%${escaped}%`);
      if (agent) query = query.eq("agent_label", agent);
      
      const { data, error } = await query;
      if (error) {
        return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
      }
      return NextResponse.json({ success: true, data: data ?? [] });
    }
  } else {
    // No search term
    if (agent) {
      query = query.eq("agent_label", agent);
    }
    const { data, error } = await query;

    if (error) {
      logger.error('memory_api', 'GET /api/memory failed', { message: error.message });
      return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
    }

    const res: ApiResponse<MemoryEntry[]> = { success: true, data: data ?? [] };
    return NextResponse.json(res);
  }
}
