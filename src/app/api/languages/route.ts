import { SUPPORTED_LANGUAGES } from "@/lib/languages";

export async function GET(): Promise<Response> {
  return Response.json({ languages: SUPPORTED_LANGUAGES });
}
