"use client";
import { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;
export function DocViewer({ url }: { url: string }) {
  const [pages, setPages] = useState(0);
  return <div className="overflow-auto rounded-xl border bg-white p-2"><Document file={url} onLoadSuccess={(d) => setPages(d.numPages)} loading="Loading original…"><Page pageNumber={1} width={520} /></Document><p className="p-2 text-xs text-slate-500">{pages ? `Page 1 of ${pages} (original immutable)` : ""}</p></div>;
}