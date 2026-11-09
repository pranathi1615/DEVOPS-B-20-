const PDFDocument = require('pdfkit');

const generatePDFReport = (title, subtitle, tableHeaders, tableRows, summaryStats = null) => {
  const doc = new PDFDocument({ margin: 40, size: 'A4' });

  // Header banner
  doc.rect(0, 0, doc.page.width, 45).fill('#0F2942');
  doc.fontSize(16).fillColor('#FFFFFF').text('ONLINE EXAMINATION INVIGILATION SYSTEM', 40, 15, { align: 'left' });
  doc.fontSize(10).fillColor('#93C5FD').text('Official Academic Record & Examination Report', 40, 32, { align: 'left' });

  doc.moveDown(3);

  // Report Title
  doc.fontSize(15).fillColor('#1E293B').text(title, 40, 65, { bold: true });
  if (subtitle) {
    doc.fontSize(9).fillColor('#64748B').text(subtitle, 40, 83);
  }
  doc.fontSize(8).fillColor('#94A3B8').text(`Generated on: ${new Date().toLocaleString()}`, 40, 97);

  let currentY = 115;

  // Render Summary Stats if available
  if (summaryStats && Object.keys(summaryStats).length > 0) {
    doc.rect(40, currentY, doc.page.width - 80, 40).fillAndStroke('#F8FAFC', '#E2E8F0');
    let statX = 50;
    const statEntries = Object.entries(summaryStats);
    const spacing = (doc.page.width - 100) / statEntries.length;

    statEntries.forEach(([key, val]) => {
      doc.fontSize(8).fillColor('#64748B').text(key.toUpperCase(), statX, currentY + 8);
      doc.fontSize(11).fillColor('#0F2942').text(String(val), statX, currentY + 20, { bold: true });
      statX += spacing;
    });

    currentY += 55;
  }

  // Draw Table Headers
  const colWidth = (doc.page.width - 80) / tableHeaders.length;
  doc.rect(40, currentY, doc.page.width - 80, 20).fill('#1E3A8A');
  doc.fontSize(8).fillColor('#FFFFFF');

  tableHeaders.forEach((header, i) => {
    doc.text(header, 45 + (i * colWidth), currentY + 6, { width: colWidth - 8, align: 'left', lineBreak: false });
  });

  currentY += 22;

  // Draw Rows
  doc.fontSize(7.5).fillColor('#334155');

  tableRows.forEach((row, rowIndex) => {
    // Check if near page bottom
    if (currentY > doc.page.height - 60) {
      doc.addPage();
      currentY = 40;
      // re-draw header on new page
      doc.rect(40, currentY, doc.page.width - 80, 20).fill('#1E3A8A');
      doc.fontSize(8).fillColor('#FFFFFF');
      tableHeaders.forEach((header, i) => {
        doc.text(header, 45 + (i * colWidth), currentY + 6, { width: colWidth - 8, align: 'left', lineBreak: false });
      });
      currentY += 22;
      doc.fontSize(7.5).fillColor('#334155');
    }

    if (rowIndex % 2 === 1) {
      doc.rect(40, currentY - 2, doc.page.width - 80, 18).fill('#F1F5F9');
    }

    row.forEach((cell, i) => {
      doc.fillColor('#1E293B').text(String(cell || '-'), 45 + (i * colWidth), currentY + 3, {
        width: colWidth - 8,
        align: 'left',
        lineBreak: false
      });
    });

    currentY += 18;
  });

  // Footer
  const totalPages = doc.bufferedPageRange().count;
  doc.fontSize(7).fillColor('#94A3B8').text(
    'Online Examination Invigilation and Session Monitoring System • Confidential Document',
    40,
    doc.page.height - 25,
    { align: 'center', width: doc.page.width - 80 }
  );

  return doc;
};

module.exports = { generatePDFReport };
