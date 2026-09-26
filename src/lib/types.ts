export interface TextSegment {
  id: number;
  text: string;
  langCode: string;
  langName: string;
  confidence: number;
}

export interface SegregateRequest {
  text: string;
}

export interface SegregateResponse {
  segments: TextSegment[];
  detectedLanguages: { code: string; name: string; count: number }[];
  demoMode: boolean;
}

export interface UnifyRequest {
  /** Preferred: already-segregated segments from /api/segregate */
  segments?: { id?: number; text: string; langCode?: string }[];
  /** Fallback: raw paragraph (server will split + detect first) */
  text?: string;
  targetLang: string;
}

export interface UnifyResponse {
  unifiedText: string;
  targetLang: string;
  targetLangName: string;
  translations: {
    id: number;
    originalText: string;
    sourceLang: string;
    sourceLangName: string;
    translatedText: string;
    wasTranslated: boolean;
  }[];
  demoMode: boolean;
}

export interface HistoryEntry {
  id: string;
  createdAt: string;
  inputPreview: string;
  inputLength: number;
  targetLang: string;
  targetLangName: string;
  segmentCount: number;
  detectedLanguages: string[];
  unifiedPreview: string;
  unifiedText: string;
}
