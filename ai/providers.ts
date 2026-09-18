import { AIExtraction } from "@/lib/validation";
export interface ClassificationResult { document_type: AIExtraction["document_type"]; confidence: number; }
export interface ClassificationProvider { classify(fileName: string, textHint: string): Promise<ClassificationResult>; }
export interface ExtractionProvider { extract(documentId: string, fileName: string, text: string): Promise<AIExtraction>; }
export interface EmbeddingProvider { embed(texts: string[]): Promise<number[][]>; }
export interface ChatProvider { answer(question: string, context: string): Promise<{ text: string; citations: { document: string; page: number }[] }>; }
export function aiProviderKind(): "mock" | "openai" {
  return process.env.AI_PROVIDER === "openai" && process.env.OPENAI_API_KEY ? "openai" : "mock";
}