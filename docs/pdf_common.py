"""Generate MEDSCOPE-AI project guide PDF (docs/MEDSCOPE-AI-Guide.pdf). Part 1: setup + helpers."""
import os
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import Table, TableStyle, Paragraph

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "MEDSCOPE-AI-Guide.pdf")

TEAL = colors.HexColor("#0e9fa4")
TEAL_D = colors.HexColor("#0a6568")
INK = colors.HexColor("#1a2233")
MUT = colors.HexColor("#5b6478")
BG = colors.HexColor("#f2f7f8")
WARN_BG = colors.HexColor("#fff7e6")
WARN_BD = colors.HexColor("#d97706")

styles = getSampleStyleSheet()
s_title = ParagraphStyle("Title2", parent=styles["Title"], fontSize=30, leading=34,
                         textColor=TEAL_D, spaceAfter=4)
s_sub = ParagraphStyle("Sub2", parent=styles["Normal"], fontSize=12, leading=17,
                       textColor=MUT, spaceAfter=2)
s_h1 = ParagraphStyle("H1", parent=styles["Heading1"], fontSize=16, leading=20,
                      textColor=colors.white, backColor=TEAL, borderPadding=(5, 8, 5),
                      spaceBefore=14, spaceAfter=8, keepWithNext=True)
s_h2 = ParagraphStyle("H2", parent=styles["Heading2"], fontSize=12.5, leading=16,
                      textColor=TEAL_D, spaceBefore=10, spaceAfter=5, keepWithNext=True)
s_p = ParagraphStyle("P", parent=styles["Normal"], fontSize=9.5, leading=14.5,
                     textColor=INK, spaceAfter=5)
s_bul = ParagraphStyle("Bul", parent=s_p, leftIndent=16, bulletIndent=6, spaceAfter=3)
s_code = ParagraphStyle("Code", parent=styles["Code"], fontName="Courier", fontSize=8.2,
                        leading=12, textColor=INK, backColor=colors.HexColor("#eef2f4"),
                        borderPadding=(5, 6, 5), spaceAfter=6)
s_cell = ParagraphStyle("Cell", parent=styles["Normal"], fontSize=8.4, leading=11.5, textColor=INK)
s_cellH = ParagraphStyle("CellH", parent=s_cell, textColor=colors.white, fontName="Helvetica-Bold")
s_cap = ParagraphStyle("Cap", parent=styles["Normal"], fontSize=8, leading=11,
                       textColor=MUT, alignment=1, spaceAfter=8)
s_toc = ParagraphStyle("TOC", parent=styles["Normal"], fontSize=10, leading=16, textColor=INK)


def h1(t): return Paragraph(t, s_h1)
def h2(t): return Paragraph(t, s_h2)
def p(t): return Paragraph(t, s_p)
def b(t): return Paragraph(t, s_bul, bulletText="\u2022")
def code(t): return Paragraph(t.replace("\n", "<br/>").replace("  ", "&nbsp;&nbsp;"), s_code)
def warn(t):
    box = Table([[Paragraph(t, ParagraphStyle("W", parent=s_p, textColor=colors.HexColor("#92400e")))]],
                colWidths=[170 * mm])
    box.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), WARN_BG),
        ("BOX", (0, 0), (-1, -1), 1, WARN_BD),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
    ]))
    return box


def mktable(headers, rows, widths=None):
    data = [[Paragraph("<b>%s</b>" % c, s_cellH) for c in headers]]
    for r in rows:
        data.append([Paragraph(str(c), s_cell) for c in r])
    t = Table(data, colWidths=widths, repeatRows=1)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), TEAL),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, BG]),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#c8d3d8")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
    ]))
    return t


def footer(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(TEAL)
    canvas.setLineWidth(1.2)
    canvas.line(15 * mm, 12 * mm, 195 * mm, 12 * mm)
    canvas.setFont("Helvetica", 7.5)
    canvas.setFillColor(MUT)
    canvas.drawString(15 * mm, 8.5 * mm, "MEDSCOPE-AI -- Project Guide (synthetic demo; not medical advice)")
    canvas.drawRightString(195 * mm, 8.5 * mm, "Page %d" % doc.page)
    canvas.restoreState()
