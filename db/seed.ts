import { PrismaClient } from "@prisma/client";
import crypto from "crypto";
const prisma = new PrismaClient();
function hash(pw: string) { return crypto.createHash("sha256").update(pw).digest("hex"); }
// Idempotent synthetic demo fixtures: 15 docs / 6 types / 1 dup / dosage conflict / relative date / labs x2 providers / 2 hospitals / 1 gap.
const DOCS: { fileName: string; docType: string; text: string; date: string }[] = [
  { fileName: "lab_hba1c_citylab_mar.pdf", docType: "LAB_REPORT", text: "CityLab HbA1c 7.8% on 10 March 2024. History of diabetes for 5 years.", date: "2024-03-10" },
  { fileName: "rx_metformin_500mg_mar.pdf", docType: "PRESCRIPTION", text: "Prescription: Metformin 500 mg once daily. 12 March 2024.", date: "2024-03-12" },
  { fileName: "note_consult_cityhospital_mar.pdf", docType: "CLINICAL_NOTE", text: "Consult: Type 2 diabetes review. History of diabetes for 5 years. March 2024.", date: "2024-03-15" },
  { fileName: "discharge_cityhospital_apr.pdf", docType: "DISCHARGE_SUMMARY", text: "Discharge summary City Hospital April 2024. Follow up two weeks after discharge.", date: "2024-04-02" },
  { fileName: "imaging_chest_xray_apr.pdf", docType: "IMAGING_REPORT", text: "Chest X-ray: no acute infiltrate. April 2024.", date: "2024-04-10" },
  { fileName: "lab_lipid_citylab_may.pdf", docType: "LAB_REPORT", text: "Lipid panel LDL 142 mg/dL. May 2024.", date: "2024-05-05" },
  { fileName: "rx_metformin_1000mg_jun.pdf", docType: "PRESCRIPTION", text: "Prescription: Metformin 1000 mg once daily. 02 June 2024.", date: "2024-06-02" },
  { fileName: "lab_hba1c_regional_jun.pdf", docType: "LAB_REPORT", text: "Regional Labs HbA1c 8.1% June 2024.", date: "2024-06-01" },
  { fileName: "note_followup_jun.pdf", docType: "CLINICAL_NOTE", text: "Follow-up: medication adherence discussed. June 2024.", date: "2024-06-10" },
  { fileName: "discharge_regional_oct.pdf", docType: "DISCHARGE_SUMMARY", text: "Discharge summary Regional Medical Center. Hospitalization for observation. October 2024.", date: "2024-10-05" },
  { fileName: "imaging_abdominal_us_oct.pdf", docType: "IMAGING_REPORT", text: "Abdominal ultrasound: fatty liver. October 2024.", date: "2024-10-06" },
  { fileName: "lab_cbc_oct.pdf", docType: "LAB_REPORT", text: "CBC normal. October 2024.", date: "2024-10-07" },
  { fileName: "rx_statin_oct.pdf", docType: "PRESCRIPTION", text: "Prescription: Atorvastatin 20 mg daily. October 2024.", date: "2024-10-08" },
  { fileName: "note_cardiology_nov.pdf", docType: "CLINICAL_NOTE", text: "Cardiology consult November 2024.", date: "2024-11-02" },
  { fileName: "lab_hba1c_citylab_nov.pdf", docType: "LAB_REPORT", text: "CityLab HbA1c 7.4% November 2024.", date: "2024-11-20" },
];
async function main() {
  const patient = await prisma.user.upsert({ where: { email: "patient@demo.medcare" }, update: {}, create: { email: "patient@demo.medcare", passwordHash: hash("demo1234"), role: "PATIENT" } });
  const doctor = await prisma.user.upsert({ where: { email: "doctor@demo.medcare" }, update: {}, create: { email: "doctor@demo.medcare", passwordHash: hash("demo1234"), role: "DOCTOR" } });
  const pp = await prisma.patientProfile.upsert({ where: { userId: patient.id }, update: {}, create: { userId: patient.id, fullName: "Aarav Sharma (demo)" } });
  const dp = await prisma.doctorProfile.upsert({ where: { userId: doctor.id }, update: {}, create: { userId: doctor.id, fullName: "Dr. Meera Rao (demo)", specialty: "Internal Medicine" } });
  await prisma.patientDoctor.upsert({ where: { patientId_doctorId: { patientId: pp.id, doctorId: dp.id } }, update: {}, create: { patientId: pp.id, doctorId: dp.id } });
  // Clean slate for idempotency (synthetic only).
  await prisma.eventRelationship.deleteMany({ where: { patientId: pp.id } });
  await prisma.evidenceItem.deleteMany({ where: { event: { patientId: pp.id } } });
  await prisma.clinicalEvent.deleteMany({ where: { patientId: pp.id } });
  await prisma.documentPage.deleteMany({ where: { document: { patientId: pp.id } } });
  await prisma.document.deleteMany({ where: { patientId: pp.id } });
  await prisma.conflict.deleteMany({ where: { patientId: pp.id } });
  await prisma.timelineGap.deleteMany({ where: { patientId: pp.id } });
  await prisma.clinicalEpisode.deleteMany({ where: { patientId: pp.id } });
  await prisma.patientStateSnapshot.deleteMany({ where: { patientId: pp.id } });
  const seen = new Set<string>();
  let created = 0;
  for (const d of DOCS) {
    const h = crypto.createHash("sha256").update(d.fileName + d.text).digest("hex");
    if (seen.has(h)) continue; // 1 exact duplicate skipped
    seen.add(h);
    const doc = await prisma.document.create({ data: { patientId: pp.id, fileName: d.fileName, mimeType: "application/pdf", sizeBytes: d.text.length, storageKey: `seed/${d.fileName}`, sha256: h, docType: d.docType, status: "PROCESSED" } });
    await prisma.documentPage.create({ data: { documentId: doc.id, pageNumber: 1, textExcerpt: d.text.slice(0, 500) } });
    created++;
  }
  // Duplicate of doc #1 (hash-identical) — skipped by seed to mirror upload dedupe.
  console.log(`Seed: ${created} documents (1 duplicate skipped).`);
  const { mockProviders } = await import("../ai/mockProvider");
  const { aiExtractionSchema } = await import("../lib/validation");
  const docs = await prisma.document.findMany({ where: { patientId: pp.id } });
  for (const doc of docs) {
    const src = DOCS.find((d) => d.fileName === doc.fileName);
    const text = src?.text ?? doc.fileName;
    try {
      const { saveOriginal } = await import("../lib/storage");
      await saveOriginal(Buffer.from(text, "utf-8"), doc.storageKey);
    } catch { /* local fs may be unavailable in some envs */ }
    await prisma.document.update({ where: { id: doc.id }, data: { status: "EXTRACTING" } });
    const raw = await mockProviders.extraction.extract(doc.id, doc.fileName, text);
    const parsed = aiExtractionSchema.safeParse(raw);
    if (!parsed.success) { await prisma.document.update({ where: { id: doc.id }, data: { status: "FAILED", failureReason: "seed validation" } }); continue; }
    for (const e of parsed.data.events) {
      const toDate = (s: string | null | undefined) => { if (!s) return null; const d = new Date(s); return isNaN(d.getTime()) ? null : d; };
      const row = await prisma.clinicalEvent.create({ data: { patientId: pp.id, eventType: e.event_type, title: e.title, description: e.description ?? "", eventDate: toDate(e.event_date), datePrecision: e.date_precision, sourceDocumentId: doc.id, sourcePage: e.source_page, evidenceStatus: e.evidence_status, confidence: e.confidence, evidenceQuote: e.evidence_quote, extractedEntities: (e.extracted_entities ?? {}) as object, metadata: {} } });
      await prisma.evidenceItem.create({ data: { eventId: row.id, documentId: doc.id, page: e.source_page, quote: e.evidence_quote } });
    }
    await prisma.document.update({ where: { id: doc.id }, data: { status: "PROCESSED", docType: parsed.data.document_type } });
  }
  const { ConflictService } = await import("../services/ConflictService");
  await ConflictService.detectMedicationDosageConflicts(pp.id);
  await ConflictService.detectGaps(pp.id);
  const { EpisodeService } = await import("../services/EpisodeService");
  const n = await EpisodeService.rebuild(pp.id);
  const counts = { docs: await prisma.document.count({ where: { patientId: pp.id } }), events: await prisma.clinicalEvent.count({ where: { patientId: pp.id } }), episodes: n, rels: await prisma.eventRelationship.count({ where: { patientId: pp.id } }), conflicts: await prisma.conflict.count({ where: { patientId: pp.id } }), gaps: await prisma.timelineGap.count({ where: { patientId: pp.id } }), evidence: await prisma.evidenceItem.count({ where: { event: { patientId: pp.id } } }) };
  console.log("Seed complete:", counts);
  await prisma.auditLog.create({ data: { actorId: patient.id, actorRole: "PATIENT", action: "SIGNUP", targetType: "Seed", targetId: pp.id, meta: counts as object } });
}
main().finally(() => prisma.$disconnect());