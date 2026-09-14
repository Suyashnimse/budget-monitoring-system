import sys
from pathlib import Path
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer
from reportlab.lib.units import inch


def markdown_to_pdf(md_path: Path, pdf_path: Path):
    text = md_path.read_text(encoding='utf-8')
    lines = text.splitlines()
    doc = SimpleDocTemplate(str(pdf_path), pagesize=letter)
    styles = getSampleStyleSheet()
    story = []

    for line in lines:
        if line.startswith('# '):
            story.append(Paragraph(line[2:], styles['Title']))
        elif line.startswith('## '):
            story.append(Paragraph(line[3:], styles['Heading2']))
        elif line.startswith('### '):
            story.append(Paragraph(line[4:], styles['Heading3']))
        elif line.startswith('- '):
            story.append(Paragraph('• ' + line[2:], styles['BodyText']))
        elif line.strip() == '':
            story.append(Spacer(1, 0.15 * inch))
        else:
            story.append(Paragraph(line, styles['BodyText']))

    doc.build(story)


if __name__ == '__main__':
    if len(sys.argv) != 3:
        print('Usage: python md_to_pdf.py <input.md> <output.pdf>')
        sys.exit(1)

    markdown_to_pdf(Path(sys.argv[1]), Path(sys.argv[2]))
