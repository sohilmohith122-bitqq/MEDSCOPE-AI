"""Build docs/MEDSCOPE-AI-Guide.pdf from the content parts.

Usage:  python docs/build_pdf.py
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate

from pdf_common import OUT, footer
from pdf_part_a import part_a
from pdf_part_b import part_b
from pdf_part_c import part_c
from pdf_part_d import part_d


def build():
    doc = SimpleDocTemplate(
        OUT,
        pagesize=A4,
        leftMargin=15 * mm,
        rightMargin=15 * mm,
        topMargin=16 * mm,
        bottomMargin=20 * mm,
        title="MEDSCOPE-AI Project Guide",
        author="MEDSCOPE-AI",
        subject="Medical Document Intelligence & Patient Timeline Platform",
    )
    story = part_a() + part_b() + part_c() + part_d()
    doc.build(story, onFirstPage=footer, onLaterPages=footer)
    print("Wrote %s (%d bytes)" % (OUT, os.path.getsize(OUT)))


if __name__ == "__main__":
    build()