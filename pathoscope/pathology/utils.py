from django.core.files.base import ContentFile
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib import colors
from io import BytesIO
from datetime import datetime


def generate_pathology_report_pdf(case, user):
    """
    Generate a PDF report for a pathology case
    """
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    styles = getSampleStyleSheet()
    story = []
    
    # Title
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=18,
        textColor=colors.HexColor('#1a1a1a'),
        spaceAfter=30,
    )
    story.append(Paragraph("PATHOLOGY REPORT", title_style))
    story.append(Spacer(1, 0.2*inch))
    
    # Patient Information
    patient_data = [
        ['Patient Name:', case.patient.username],
        ['Patient ID:', str(case.patient.id)],
        ['Accession Number:', case.accession_number],
        ['Test Name:', case.test_order.test_name if case.test_order else 'N/A'],
        ['Date:', case.finalized_date.strftime('%Y-%m-%d %H:%M') if case.finalized_date else 'N/A'],
    ]
    
    patient_table = Table(patient_data, colWidths=[2*inch, 4*inch])
    patient_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f0f0f0')),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ('GRID', (0, 0), (-1, -1), 1, colors.grey),
    ]))
    
    story.append(patient_table)
    story.append(Spacer(1, 0.3*inch))
    
    # Diagnosis Section
    story.append(Paragraph("<b>PATHOLOGICAL DIAGNOSIS:</b>", styles['Heading2']))
    story.append(Spacer(1, 0.1*inch))
    
    diagnosis_text = case.pathologist_notes if case.pathologist_notes else "No diagnosis provided"
    story.append(Paragraph(diagnosis_text, styles['BodyText']))
    story.append(Spacer(1, 0.2*inch))
    
    # ICD Code
    if case.icd_code:
        story.append(Paragraph(f"<b>ICD-10 Code:</b> {case.icd_code}", styles['Normal']))
        if case.icd_description:
            story.append(Paragraph(f"<b>Description:</b> {case.icd_description}", styles['Normal']))
        story.append(Spacer(1, 0.2*inch))
    
    # Signature
    story.append(Spacer(1, 0.5*inch))
    story.append(Paragraph(f"<b>Pathologist:</b> Dr. {user.username}", styles['Normal']))
    story.append(Paragraph(f"<b>Date Signed:</b> {datetime.now().strftime('%Y-%m-%d %H:%M')}", styles['Normal']))
    
    # Build PDF
    doc.build(story)
    
    # Get PDF data
    pdf_data = buffer.getvalue()
    buffer.close()
    
    # Create Django file
    filename = f"pathology_report_{case.accession_number}.pdf"
    return ContentFile(pdf_data, name=filename)