import { z } from "zod";
import { DatePrecision, DocumentType, EventType, EvidenceStatus, RelationshipType, SharePermission, ShareScope } from "@/lib/enums";
export const uploadMetaSchema = z.object({
  fileName: z.string().min(1).max(255),
  mimeType: z.enum(["application/pdf", "image/jpeg", "image/png", "image/jpg"]),
  sizeBytes: z.number().int().positive().max(15 * 1024 * 1024),
});
export const aiExtractionSchema = z.object({
  events: z.array(
    z.object({
      event_type: z.enum(EventType),
      title: z.string().min(1),
      description: z.string().default(""),
      event_date: z.string().nullable(),
      event_date_start: z.string().nullable().optional(),
      event_date_end: z.string().nullable().optional(),
      date_precision: z.enum(DatePrecision),
      evidence_status: z.enum(EvidenceStatus),
      confidence: z.number().min(0).max(1),
      evidence_quote: z.string().min(1),
      source_page: z.number().int().min(1),
      extracted_entities: z.record(z.unknown()).default({}),
    })
  ),
  relationships: z.array(
    z.object({
      from_title: z.string().min(1),
      to_title: z.string().min(1),
      type: z.enum(RelationshipType),
      evidence_quote: z.string().min(1),
      derived_rule: z.string().optional(),
    })
  ).default([]),
  document_type: z.enum(DocumentType),
});
export type AIExtraction = z.infer<typeof aiExtractionSchema>;
export const shareCreateSchema = z.object({
  scopes: z.array(z.enum(ShareScope)).min(1),
  permission: z.enum(SharePermission),
  expiresIn: z.enum(["1h", "24h", "7d", "custom"]),
  expiresAt: z.string().datetime().optional(),
  documentIds: z.array(z.string()).default([]),
  doctorId: z.string().optional(),
});
export const emergencyRequestSchema = z.object({
  patientId: z.string().min(1),
  reason: z.string().min(10).max(1000),
  otp: z.string().min(4).max(10),
  confirm: z.literal(true),
});
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});