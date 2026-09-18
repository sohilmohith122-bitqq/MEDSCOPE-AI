import { AIExtraction } from "@/lib/validation";
import { ClassificationProvider, ExtractionProvider, EmbeddingProvider, ChatProvider } from "@/ai/providers";
// Deterministic MockProvider: zero API keys, drives every phase incl. demo.
function hashStr(s: string): number { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; }
export class MockClassificationProvider implements ClassificationProvider {
  async classify(fileName: string, textHint: string) {
    const n = fileName.toLowerCase() + " " + textHint.toLowerCase();
    if (n.includes("lab")) return { document_type: "LAB_REPORT" as const, confidence: 0.94 };
    if (n.includes("prescript") || n.includes("rx")) return { document_type: "PRESCRIPTION" as const, confidence: 0.93 };
    if (n.includes("discharge")) return { document_type: "DISCHARGE_SUMMARY" as const, confidence: 0.96 };
    if (n.includes("imaging") || n.includes("xray") || n.includes("mri") || n.includes("ct ")) return { document_type: "IMAGING_REPORT" as const, confidence: 0.92 };
    if (n.includes("note") || n.includes("consult")) return { document_type: "CLINICAL_NOTE" as const, confidence: 0.88 };
    return { document_type: "OTHER" as const, confidence: 0.6 };
  }
}
export class MockExtractionProvider implements ExtractionProvider {
  async extract(documentId: string, fileName: string, text: string): Promise<AIExtraction> {
    const lower = (fileName + " " + text).toLowerCase();
    void documentId;
    // Deterministic rules covering the full synthetic demo corpus.
    // Temporal fidelity (I4): EXACT only when day+month+year present,
    // MONTH for month+year, APPROXIMATE for duration history, RELATIVE stays RELATIVE.
    const events: AIExtraction["events"] = [];
    const push = (e: AIExtraction["events"][number]) => events.push(e);
    const q = (fallback: string) => (text.slice(0, 180).trim() || fallback);
    if (lower.includes("metformin 500")) push({ event_type: "MEDICATION", title: "Metformin 500 mg daily", description: "Documented medication order.", event_date: "2024-03-12", date_precision: "EXACT", evidence_status: "DOCUMENTED", confidence: 0.95, evidence_quote: q("Prescription: Metformin 500 mg once daily. 12 March 2024."), source_page: 1, extracted_entities: { medication: "Metformin", dose: "500 mg" } });
    if (lower.includes("metformin 1000")) push({ event_type: "MEDICATION", title: "Metformin 1000 mg daily", description: "Documented medication order (conflicts with 500 mg record).", event_date: "2024-06-02", date_precision: "EXACT", evidence_status: "CONFLICTING", confidence: 0.9, evidence_quote: q("Prescription: Metformin 1000 mg once daily. 02 June 2024."), source_page: 1, extracted_entities: { medication: "Metformin", dose: "1000 mg" } });
    if (lower.includes("atorvastatin")) push({ event_type: "MEDICATION", title: "Atorvastatin 20 mg daily", description: "Documented statin order.", event_date: "2024-10-01", date_precision: "MONTH", evidence_status: "DOCUMENTED", confidence: 0.92, evidence_quote: q("Prescription: Atorvastatin 20 mg daily. October 2024."), source_page: 1, extracted_entities: { medication: "Atorvastatin", dose: "20 mg" } });
    if (lower.includes("hba1c 7.8") || (lower.includes("hba1c") && lower.includes("10 march"))) push({ event_type: "LAB", title: "HbA1c 7.8% (CityLab)", description: "Glycated hemoglobin lab value.", event_date: "2024-03-10", date_precision: "EXACT", evidence_status: "DOCUMENTED", confidence: 0.97, evidence_quote: q("CityLab HbA1c 7.8% on 10 March 2024."), source_page: 1, extracted_entities: { test: "HbA1c", value: "7.8", unit: "%", provider: "CityLab" } });
    if (lower.includes("hba1c 8.1") || (lower.includes("hba1c") && lower.includes("june"))) push({ event_type: "LAB", title: "HbA1c 8.1% (Regional Labs)", description: "Glycated hemoglobin lab value.", event_date: "2024-06-01", date_precision: "MONTH", evidence_status: "DOCUMENTED", confidence: 0.96, evidence_quote: q("Regional Labs HbA1c 8.1% June 2024."), source_page: 1, extracted_entities: { test: "HbA1c", value: "8.1", unit: "%", provider: "Regional Labs" } });
    if (lower.includes("hba1c 7.4") || (lower.includes("hba1c") && lower.includes("november"))) push({ event_type: "LAB", title: "HbA1c 7.4% (CityLab)", description: "Glycated hemoglobin lab value.", event_date: "2024-11-01", date_precision: "MONTH", evidence_status: "DOCUMENTED", confidence: 0.96, evidence_quote: q("CityLab HbA1c 7.4% November 2024."), source_page: 1, extracted_entities: { test: "HbA1c", value: "7.4", unit: "%", provider: "CityLab" } });
    if (lower.includes("ldl") || lower.includes("lipid")) push({ event_type: "LAB", title: "LDL 142 mg/dL (abnormal)", description: "Lipid panel result.", event_date: "2024-05-01", date_precision: "MONTH", evidence_status: "DOCUMENTED", confidence: 0.94, evidence_quote: q("Lipid panel LDL 142 mg/dL. May 2024."), source_page: 1, extracted_entities: { test: "LDL", value: "142", unit: "mg/dL", flag: "high" } });
    if (lower.includes("cbc")) push({ event_type: "LAB", title: "CBC normal", description: "Complete blood count within range.", event_date: "2024-10-01", date_precision: "MONTH", evidence_status: "DOCUMENTED", confidence: 0.9, evidence_quote: q("CBC normal. October 2024."), source_page: 1, extracted_entities: { test: "CBC", value: "normal" } });
    if (lower.includes("two weeks after discharge")) push({ event_type: "CONSULTATION", title: "Follow-up visit (relative date)", description: "Follow-up anchored to discharge; kept RELATIVE — never upgraded.", event_date: null, date_precision: "RELATIVE", evidence_status: "UNCERTAIN", confidence: 0.62, evidence_quote: "Follow up two weeks after discharge.", source_page: 4, extracted_entities: { anchor: "discharge" } });
    if (lower.includes("diabetes") && lower.includes("5 years")) push({ event_type: "DIAGNOSIS", title: "Type 2 diabetes mellitus", description: "History of diabetes for 5 years.", event_date: null, date_precision: "APPROXIMATE", evidence_status: "DOCUMENTED", confidence: 0.8, evidence_quote: "History of diabetes for 5 years.", source_page: 1, extracted_entities: { condition: "Type 2 diabetes" } });
    if (lower.includes("cardiology consult")) {
      push({ event_type: "CONSULTATION", title: "Cardiology consult", description: "Specialist consultation.", event_date: "2024-11-01", date_precision: "MONTH", evidence_status: "DOCUMENTED", confidence: 0.88, evidence_quote: q("Cardiology consult November 2024."), source_page: 1, extracted_entities: { specialty: "Cardiology" } });
      push({ event_type: "DIAGNOSIS", title: "Hyperlipidemia (referenced)", description: "Referenced in cardiology context; verify against lipid panel.", event_date: "2024-11-01", date_precision: "MONTH", evidence_status: "DERIVED", confidence: 0.55, evidence_quote: q("Cardiology consult November 2024."), source_page: 1, extracted_entities: { condition: "Hyperlipidemia" } });
    }
    if (lower.includes("adherence") || lower.includes("follow-up: medication")) push({ event_type: "CONSULTATION", title: "Medication adherence review", description: "Follow-up: adherence discussed.", event_date: "2024-06-01", date_precision: "MONTH", evidence_status: "DOCUMENTED", confidence: 0.85, evidence_quote: q("Follow-up: medication adherence discussed. June 2024."), source_page: 1, extracted_entities: {} });
    if (lower.includes("type 2 diabetes review")) push({ event_type: "CONSULTATION", title: "Diabetes review visit", description: "Consult for diabetes review.", event_date: "2024-03-01", date_precision: "MONTH", evidence_status: "DOCUMENTED", confidence: 0.86, evidence_quote: q("Consult: Type 2 diabetes review. March 2024."), source_page: 1, extracted_entities: {} });
    if (lower.includes("chest x-ray") || lower.includes("chest xray")) push({ event_type: "IMAGING", title: "Chest X-ray: no acute infiltrate", description: "Imaging finding.", event_date: "2024-04-01", date_precision: "MONTH", evidence_status: "DOCUMENTED", confidence: 0.91, evidence_quote: q("Chest X-ray: no acute infiltrate. April 2024."), source_page: 1, extracted_entities: { modality: "X-ray", site: "chest" } });
    if (lower.includes("abdominal ultrasound") || lower.includes("fatty liver")) push({ event_type: "IMAGING", title: "Abdominal ultrasound: fatty liver", description: "Imaging finding.", event_date: "2024-10-01", date_precision: "MONTH", evidence_status: "DOCUMENTED", confidence: 0.91, evidence_quote: q("Abdominal ultrasound: fatty liver. October 2024."), source_page: 1, extracted_entities: { modality: "Ultrasound", site: "abdomen" } });
    if (lower.includes("discharge summary") && lower.includes("city hospital")) push({ event_type: "HOSPITALIZATION", title: "Hospitalization (City Hospital)", description: "Inpatient stay per discharge summary.", event_date: "2024-04-01", date_precision: "MONTH", evidence_status: "DOCUMENTED", confidence: 0.9, evidence_quote: q("Discharge summary City Hospital April 2024."), source_page: 1, extracted_entities: { hospital: "City Hospital" } });
    if (lower.includes("discharge summary") && lower.includes("regional")) push({ event_type: "HOSPITALIZATION", title: "Hospitalization for observation (Regional Medical Center)", description: "Inpatient stay per discharge summary.", event_date: "2024-10-01", date_precision: "MONTH", evidence_status: "DOCUMENTED", confidence: 0.9, evidence_quote: q("Discharge summary Regional Medical Center. October 2024."), source_page: 1, extracted_entities: { hospital: "Regional Medical Center" } });
    if (events.length === 0) push({ event_type: "CONSULTATION", title: `Review of ${fileName}`, description: "Document reviewed; no codable entities with sufficient evidence.", event_date: null, date_precision: "UNKNOWN", evidence_status: "UNCERTAIN", confidence: 0.4, evidence_quote: q(fileName), source_page: 1, extracted_entities: {} });
    const classifier = new MockClassificationProvider();
    const { document_type } = await classifier.classify(fileName, text);
    return { events, relationships: [], document_type };
  }
}
export class MockEmbeddingProvider implements EmbeddingProvider {
  async embed(texts: string[]) {
    // Deterministic pseudo-embeddings (16-dim) from string hash — good enough for retrieval ranking in demo.
    return texts.map((t) => { const h = hashStr(t); const v: number[] = []; for (let i = 0; i < 16; i++) v.push(((h >> (i % 8)) & 255) / 255); return v; });
  }
}
export class MockChatProvider implements ChatProvider {
  async answer(question: string, context: string) {
    void question;
    const lines = context.split("\n").slice(0, 12).join("\n");
    return { text: `Based on the documented records:\n${lines}\n\nThe available records do not establish anything beyond what is cited.`, citations: [] };
  }
}
export const mockProviders = { classification: new MockClassificationProvider(), extraction: new MockExtractionProvider(), embedding: new MockEmbeddingProvider(), chat: new MockChatProvider() };