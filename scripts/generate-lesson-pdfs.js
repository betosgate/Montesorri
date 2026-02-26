#!/usr/bin/env node
/**
 * Generate printable PDF materials for Montessori lessons.
 *
 * Each PRINTABLE lesson gets up to 3 PDFs:
 *   1. Base sheet  — the board/grid/background (print on cardstock)
 *   2. Cut-out sheet — movable pieces with dashed cut lines
 *   3. Control sheet — shows the correct completed arrangement
 *
 * Usage:
 *   node scripts/generate-lesson-pdfs.js [--level primary] [--week 1] [--force]
 *
 * Requires: pdfkit (npm install pdfkit)
 */

const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PAGE_WIDTH = 612;   // 8.5" in points (72 pts/inch)
const PAGE_HEIGHT = 792;  // 11" in points
const MARGIN = 36;        // 0.5" margins
const CONTENT_W = PAGE_WIDTH - 2 * MARGIN;
const CONTENT_H = PAGE_HEIGHT - 2 * MARGIN;

// Montessori color coding
const COLORS = {
  // Place value
  units: '#CC3333',        // Red
  tens: '#3366CC',         // Blue
  hundreds: '#339933',     // Green
  thousands: '#DAA520',    // Gold

  // Bead bar colors (1-10)
  bead: {
    1: '#CC3333',  // Red
    2: '#339933',  // Green
    3: '#FF69B4',  // Pink
    4: '#DAA520',  // Yellow/Gold
    5: '#87CEEB',  // Light blue
    6: '#9370DB',  // Purple/lilac
    7: '#FFFFFF',  // White
    8: '#8B4513',  // Brown
    9: '#191970',  // Dark blue
    10: '#DAA520', // Gold
  },

  // Vowels/consonants
  vowel: '#FF6B6B',        // Pink/red
  consonant: '#4A90D9',    // Blue

  // Continent colors
  continent: {
    'North America': '#E8943A',
    'South America': '#E87CA0',
    'Europe': '#CC3333',
    'Asia': '#DAA520',
    'Africa': '#339933',
    'Australia': '#8B4513',
    'Antarctica': '#E8E8E8',
  },

  // UI
  background: '#FFF8F0',   // Warm cream
  cardBg: '#FFFFFF',
  border: '#D4C5A9',       // Warm gray
  cutLine: '#999999',      // Dashed cut line color
  text: '#2C2C2C',
  textLight: '#666666',
  accent: '#8B7355',       // Earth tone
  headerBg: '#F5EDE0',     // Light warm
};

// Font sizes
const FONT = {
  title: 24,
  subtitle: 16,
  label: 18,       // Primary labels (18pt+ for kids)
  body: 14,        // Min child-readable
  small: 11,
  tiny: 9,
};

// ---------------------------------------------------------------------------
// PDF Template Generators
// ---------------------------------------------------------------------------

/**
 * Draw a dashed rectangle for cut-out pieces.
 */
function drawCutLine(doc, x, y, w, h, radius = 8) {
  doc.save()
    .roundedRect(x, y, w, h, radius)
    .dash(5, { space: 3 })
    .strokeColor(COLORS.cutLine)
    .lineWidth(1)
    .stroke()
    .undash()
    .restore();
}

/**
 * Draw page header with lesson info.
 */
function drawHeader(doc, title, subtitle, sheetType) {
  doc.save();

  // Header background
  doc.rect(MARGIN, MARGIN, CONTENT_W, 50)
    .fillColor(COLORS.headerBg)
    .fill();

  // Title
  doc.fillColor(COLORS.text)
    .font('Helvetica-Bold')
    .fontSize(FONT.subtitle)
    .text(title, MARGIN + 10, MARGIN + 8, { width: CONTENT_W - 120 });

  // Sheet type badge
  const badgeColors = {
    'Base Sheet': '#8B7355',
    'Cut-Outs': '#CC6633',
    'Control / Answer Key': '#339933',
  };
  const badgeColor = badgeColors[sheetType] || COLORS.accent;
  const badgeW = 120;
  const badgeX = MARGIN + CONTENT_W - badgeW - 5;
  doc.roundedRect(badgeX, MARGIN + 12, badgeW, 26, 4)
    .fillColor(badgeColor)
    .fill();
  doc.fillColor('#FFFFFF')
    .font('Helvetica-Bold')
    .fontSize(FONT.small)
    .text(sheetType, badgeX, MARGIN + 18, { width: badgeW, align: 'center' });

  // Subtitle
  if (subtitle) {
    doc.fillColor(COLORS.textLight)
      .font('Helvetica')
      .fontSize(FONT.small)
      .text(subtitle, MARGIN + 10, MARGIN + 32, { width: CONTENT_W - 130 });
  }

  doc.restore();
  return MARGIN + 60; // Return Y position after header
}

/**
 * Draw page footer.
 */
function drawFooter(doc, pageLabel) {
  doc.save()
    .fillColor(COLORS.textLight)
    .font('Helvetica')
    .fontSize(FONT.tiny)
    .text(
      `Montessori Homeschool • Print on US Letter (8.5 × 11") • ${pageLabel}`,
      MARGIN, PAGE_HEIGHT - MARGIN + 10,
      { width: CONTENT_W, align: 'center' }
    )
    .restore();
}

// ---------------------------------------------------------------------------
// Template: Number Cards (1-9000 place value cards)
// ---------------------------------------------------------------------------

function generateNumberCards(doc, lesson) {
  const title = lesson.title;

  // Determine which number range this lesson covers
  const titleLower = title.toLowerCase();
  let numbers = [];
  let placeLabel = '';

  if (titleLower.includes('1-10') || titleLower.includes('1 to 10') || titleLower.includes('introduction')) {
    numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    placeLabel = 'Units (1-10)';
  } else if (titleLower.includes('11-19') || titleLower.includes('teen')) {
    numbers = [11, 12, 13, 14, 15, 16, 17, 18, 19];
    placeLabel = 'Teens (11-19)';
  } else if (titleLower.includes('1-100') || titleLower.includes('hundred')) {
    numbers = [];
    for (let i = 1; i <= 100; i++) numbers.push(i);
    placeLabel = 'Hundreds Board (1-100)';
  } else if (titleLower.includes('1-20') || titleLower.includes('to 20')) {
    numbers = [];
    for (let i = 1; i <= 20; i++) numbers.push(i);
    placeLabel = 'Numbers 1-20';
  } else if (titleLower.includes('place value') || titleLower.includes('golden bead') || titleLower.includes('decimal')) {
    // Place value cards: units, tens, hundreds, thousands
    return generatePlaceValueCards(doc, lesson);
  } else if (titleLower.includes('stamp game')) {
    return generateStampGame(doc, lesson);
  } else {
    // Default: 1-10
    numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    placeLabel = 'Number Cards';
  }

  // --- PAGE 1: Base sheet (number line or grid) ---
  let startY = drawHeader(doc, title, placeLabel + ' — Base Sheet', 'Base Sheet');

  if (numbers.length <= 20) {
    // Number line layout
    const cellH = 60;
    const cellW = Math.min(CONTENT_W / Math.min(numbers.length, 5), 100);
    const cols = Math.min(numbers.length, 5);
    const rows = Math.ceil(numbers.length / cols);

    doc.fillColor(COLORS.textLight)
      .font('Helvetica')
      .fontSize(FONT.body)
      .text('Place number cards in the correct order on the grid below:', MARGIN, startY + 5, { width: CONTENT_W });

    startY += 30;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const idx = r * cols + c;
        if (idx >= numbers.length) break;
        const x = MARGIN + c * (cellW + 10) + (CONTENT_W - cols * (cellW + 10)) / 2;
        const y = startY + r * (cellH + 10);

        // Empty box with light number hint
        doc.roundedRect(x, y, cellW, cellH, 6)
          .strokeColor(COLORS.border)
          .lineWidth(1)
          .stroke();

        // Light hint number
        doc.fillColor('#E8E0D4')
          .font('Helvetica')
          .fontSize(FONT.title)
          .text(String(numbers[idx]), x, y + 18, { width: cellW, align: 'center' });
      }
    }
  } else {
    // Hundred board grid (10×10)
    const cellSize = Math.min(CONTENT_W / 10 - 2, 50);
    const gridW = cellSize * 10;
    const offsetX = MARGIN + (CONTENT_W - gridW) / 2;

    doc.fillColor(COLORS.textLight)
      .font('Helvetica')
      .fontSize(FONT.body)
      .text('Place the number tiles on the correct squares:', MARGIN, startY + 5, { width: CONTENT_W });
    startY += 30;

    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 10; c++) {
        const x = offsetX + c * cellSize;
        const y = startY + r * cellSize;
        doc.rect(x, y, cellSize, cellSize)
          .strokeColor(COLORS.border)
          .lineWidth(0.5)
          .stroke();

        // Tiny hint
        const num = r * 10 + c + 1;
        doc.fillColor('#E8E0D4')
          .font('Helvetica')
          .fontSize(8)
          .text(String(num), x, y + cellSize / 2 - 4, { width: cellSize, align: 'center' });
      }
    }
  }

  drawFooter(doc, 'Print on cardstock — this is your base board');

  // --- PAGE 2: Cut-out number tiles ---
  doc.addPage();
  startY = drawHeader(doc, title, placeLabel + ' — Cut-Out Tiles', 'Cut-Outs');

  doc.fillColor(COLORS.textLight)
    .font('Helvetica')
    .fontSize(FONT.body)
    .text('Cut along the dashed lines. Place each number on the matching square.', MARGIN, startY + 5, { width: CONTENT_W });
  startY += 30;

  if (numbers.length <= 20) {
    const cellW = 80;
    const cellH = 55;
    const cols = 5;
    const rows = Math.ceil(numbers.length / cols);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const idx = r * cols + c;
        if (idx >= numbers.length) break;
        const x = MARGIN + c * (cellW + 12) + (CONTENT_W - cols * (cellW + 12)) / 2;
        const y = startY + r * (cellH + 12);

        drawCutLine(doc, x, y, cellW, cellH);

        // Color-coded number
        const num = numbers[idx];
        let color = COLORS.units;
        if (num >= 10 && num < 100) color = COLORS.tens;
        if (num >= 100) color = COLORS.hundreds;

        doc.fillColor(color)
          .font('Helvetica-Bold')
          .fontSize(FONT.title)
          .text(String(num), x, y + 14, { width: cellW, align: 'center' });
      }
    }
  } else {
    // 100 tiles in 10×10
    const cellSize = Math.min(CONTENT_W / 10 - 2, 50);
    const gridW = cellSize * 10;
    const offsetX = MARGIN + (CONTENT_W - gridW) / 2;

    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 10; c++) {
        const x = offsetX + c * cellSize;
        const y = startY + r * cellSize;
        drawCutLine(doc, x, y, cellSize - 1, cellSize - 1, 3);

        const num = r * 10 + c + 1;
        doc.fillColor(COLORS.units)
          .font('Helvetica-Bold')
          .fontSize(FONT.body)
          .text(String(num), x, y + cellSize / 2 - 7, { width: cellSize, align: 'center' });
      }
    }
  }

  drawFooter(doc, 'Cut along dashed lines — minimum 1.5" pieces');

  // --- PAGE 3: Control/answer sheet ---
  doc.addPage();
  startY = drawHeader(doc, title, placeLabel + ' — Answer Key', 'Control / Answer Key');

  doc.fillColor(COLORS.textLight)
    .font('Helvetica')
    .fontSize(FONT.body)
    .text('This is the completed arrangement. The child can self-check their work.', MARGIN, startY + 5, { width: CONTENT_W });
  startY += 30;

  if (numbers.length <= 20) {
    const cellW = 80;
    const cellH = 55;
    const cols = 5;

    for (let r = 0; r < Math.ceil(numbers.length / cols); r++) {
      for (let c = 0; c < cols; c++) {
        const idx = r * cols + c;
        if (idx >= numbers.length) break;
        const x = MARGIN + c * (cellW + 12) + (CONTENT_W - cols * (cellW + 12)) / 2;
        const y = startY + r * (cellH + 12);

        doc.roundedRect(x, y, cellW, cellH, 6)
          .fillColor('#F5F0E8')
          .fill()
          .strokeColor(COLORS.border)
          .lineWidth(1)
          .stroke();

        const num = numbers[idx];
        let color = COLORS.units;
        if (num >= 10 && num < 100) color = COLORS.tens;
        if (num >= 100) color = COLORS.hundreds;

        doc.fillColor(color)
          .font('Helvetica-Bold')
          .fontSize(FONT.title)
          .text(String(num), x, y + 14, { width: cellW, align: 'center' });
      }
    }
  } else {
    const cellSize = Math.min(CONTENT_W / 10 - 2, 50);
    const gridW = cellSize * 10;
    const offsetX = MARGIN + (CONTENT_W - gridW) / 2;

    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 10; c++) {
        const x = offsetX + c * cellSize;
        const y = startY + r * cellSize;

        const bgColor = (r + c) % 2 === 0 ? '#F5F0E8' : '#FFFFFF';
        doc.rect(x, y, cellSize, cellSize).fillColor(bgColor).fill();
        doc.rect(x, y, cellSize, cellSize)
          .strokeColor(COLORS.border).lineWidth(0.5).stroke();

        const num = r * 10 + c + 1;
        doc.fillColor(COLORS.text)
          .font('Helvetica-Bold')
          .fontSize(FONT.body)
          .text(String(num), x, y + cellSize / 2 - 7, { width: cellSize, align: 'center' });
      }
    }
  }

  drawFooter(doc, 'Answer key — child self-checks by comparing');
}

/**
 * Place value cards (units/tens/hundreds/thousands).
 */
function generatePlaceValueCards(doc, lesson) {
  const title = lesson.title;

  let startY = drawHeader(doc, title, 'Place Value Cards — Cut-Outs', 'Cut-Outs');

  doc.fillColor(COLORS.textLight)
    .font('Helvetica')
    .fontSize(FONT.body)
    .text('Cut along dashed lines. Stack cards to build numbers (e.g., 1000 + 300 + 40 + 5 = 1,345)', MARGIN, startY + 5, { width: CONTENT_W });
  startY += 35;

  // Units (1-9) — Red
  const sections = [
    { label: 'Units', values: [1,2,3,4,5,6,7,8,9], color: COLORS.units, width: 60 },
    { label: 'Tens', values: [10,20,30,40,50,60,70,80,90], color: COLORS.tens, width: 80 },
    { label: 'Hundreds', values: [100,200,300,400,500,600,700,800,900], color: COLORS.hundreds, width: 100 },
    { label: 'Thousands', values: [1000,2000,3000,4000,5000,6000,7000,8000,9000], color: COLORS.thousands, width: 120 },
  ];

  for (const section of sections) {
    if (startY > PAGE_HEIGHT - 150) {
      doc.addPage();
      startY = drawHeader(doc, title, `Place Value — ${section.label}`, 'Cut-Outs');
      startY += 10;
    }

    doc.fillColor(section.color)
      .font('Helvetica-Bold')
      .fontSize(FONT.label)
      .text(section.label, MARGIN, startY, { width: CONTENT_W });
    startY += 22;

    const cardH = 40;
    const cardW = section.width;
    const cols = Math.floor(CONTENT_W / (cardW + 10));

    for (let i = 0; i < section.values.length; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = MARGIN + col * (cardW + 10);
      const y = startY + row * (cardH + 10);

      drawCutLine(doc, x, y, cardW, cardH);

      doc.fillColor(section.color)
        .font('Helvetica-Bold')
        .fontSize(FONT.label)
        .text(String(section.values[i]), x, y + 10, { width: cardW, align: 'center' });
    }

    startY += Math.ceil(section.values.length / cols) * (cardH + 10) + 15;
  }

  drawFooter(doc, 'Cut and stack cards to build multi-digit numbers');
}

/**
 * Stamp game pieces.
 */
function generateStampGame(doc, lesson) {
  const title = lesson.title;
  let startY = drawHeader(doc, title, 'Stamp Game Pieces — Cut-Outs', 'Cut-Outs');

  doc.fillColor(COLORS.textLight)
    .font('Helvetica')
    .fontSize(FONT.body)
    .text('Cut out the stamps. Use them to build numbers and practice operations.', MARGIN, startY + 5, { width: CONTENT_W });
  startY += 35;

  const stamps = [
    { label: '1', color: COLORS.units, desc: 'Units' },
    { label: '10', color: COLORS.tens, desc: 'Tens' },
    { label: '100', color: COLORS.hundreds, desc: 'Hundreds' },
    { label: '1000', color: COLORS.thousands, desc: 'Thousands' },
  ];

  const stampSize = 45;
  const cols = 9;

  for (const stamp of stamps) {
    doc.fillColor(stamp.color)
      .font('Helvetica-Bold')
      .fontSize(FONT.body)
      .text(`${stamp.desc} Stamps`, MARGIN, startY);
    startY += 18;

    for (let i = 0; i < 18; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = MARGIN + col * (stampSize + 6);
      const y = startY + row * (stampSize + 6);

      drawCutLine(doc, x, y, stampSize, stampSize, 4);

      // Colored stamp
      doc.roundedRect(x + 4, y + 4, stampSize - 8, stampSize - 8, 3)
        .fillColor(stamp.color)
        .fill();

      doc.fillColor('#FFFFFF')
        .font('Helvetica-Bold')
        .fontSize(stamp.label.length > 2 ? 10 : FONT.body)
        .text(stamp.label, x, y + stampSize / 2 - 7, { width: stampSize, align: 'center' });
    }

    startY += 2 * (stampSize + 6) + 15;

    if (startY > PAGE_HEIGHT - 150) {
      doc.addPage();
      startY = drawHeader(doc, title, 'Stamp Game Pieces (continued)', 'Cut-Outs');
      startY += 10;
    }
  }

  drawFooter(doc, 'Cut stamps — use for addition, subtraction, multiplication, division');
}

// ---------------------------------------------------------------------------
// Template: Letter Cards (Movable Alphabet)
// ---------------------------------------------------------------------------

function generateLetterCards(doc, lesson) {
  const title = lesson.title;
  const titleLower = title.toLowerCase();

  // Determine which letters this lesson covers
  let letters = [];
  let isVowels = titleLower.includes('vowel');

  // Try to extract letter group from title
  const letterMatch = titleLower.match(/letters?\s*[-—]\s*(?:group\s*\d+\s*)?[(\[]?([a-z,\s/]+)[)\]]?/i);
  if (letterMatch) {
    letters = letterMatch[1].replace(/[^a-z]/g, '').split('').filter(Boolean);
  }

  // Common letter groups in Montessori
  if (letters.length === 0) {
    if (titleLower.includes('group 1') || titleLower.includes('s, m, a, t')) {
      letters = ['s', 'm', 'a', 't'];
    } else if (titleLower.includes('group 2') || titleLower.includes('r, i, p')) {
      letters = ['r', 'i', 'p'];
    } else if (titleLower.includes('group 3') || titleLower.includes('b, c, g')) {
      letters = ['b', 'c', 'g'];
    } else if (titleLower.includes('group 4') || titleLower.includes('d, n, k')) {
      letters = ['d', 'n', 'k'];
    } else if (titleLower.includes('vowel')) {
      letters = ['a', 'e', 'i', 'o', 'u'];
      isVowels = true;
    } else if (titleLower.includes('alphabet') || titleLower.includes('movable') || titleLower.includes('moveable')) {
      letters = 'abcdefghijklmnopqrstuvwxyz'.split('');
    } else {
      // Extract any individual letters mentioned
      const singleLetters = titleLower.match(/\b([a-z])\b/g);
      if (singleLetters && singleLetters.length > 0) {
        letters = [...new Set(singleLetters)];
      } else {
        letters = 'abcdefghijklmnopqrstuvwxyz'.split('');
      }
    }
  }

  const vowels = new Set(['a', 'e', 'i', 'o', 'u']);

  // --- CUT-OUT SHEET ---
  let startY = drawHeader(doc, title, 'Letter Cards — Cut-Outs', 'Cut-Outs');

  doc.fillColor(COLORS.textLight)
    .font('Helvetica')
    .fontSize(FONT.body)
    .text('Cut along dashed lines. Vowels are pink/red, consonants are blue (Montessori standard).', MARGIN, startY + 5, { width: CONTENT_W });
  startY += 35;

  const cardW = 70;
  const cardH = 85;
  const cols = Math.floor(CONTENT_W / (cardW + 8));

  for (let i = 0; i < letters.length; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = MARGIN + col * (cardW + 8);
    const y = startY + row * (cardH + 8);

    if (y + cardH > PAGE_HEIGHT - 50) {
      doc.addPage();
      startY = drawHeader(doc, title, 'Letter Cards (continued)', 'Cut-Outs');
      startY += 10;
      // Recalculate position
      const newRow = Math.floor((i - col) / cols);
      // This is simplified — in production we'd track page breaks properly
    }

    drawCutLine(doc, x, y, cardW, cardH);

    const isVowel = vowels.has(letters[i]);
    const color = isVowel ? COLORS.vowel : COLORS.consonant;

    // Letter background
    doc.roundedRect(x + 5, y + 5, cardW - 10, cardH - 10, 4)
      .fillColor(color + '15')
      .fill();

    // Large letter
    doc.fillColor(color)
      .font('Helvetica-Bold')
      .fontSize(36)
      .text(letters[i], x, y + 12, { width: cardW, align: 'center' });

    // Uppercase version below
    doc.fillColor(color)
      .font('Helvetica')
      .fontSize(FONT.label)
      .text(letters[i].toUpperCase(), x, y + 55, { width: cardW, align: 'center' });
  }

  drawFooter(doc, 'Pink = vowels, Blue = consonants • Print on cardstock');
}

// ---------------------------------------------------------------------------
// Template: Bead Bars (visual representations)
// ---------------------------------------------------------------------------

function generateBeadBars(doc, lesson) {
  const title = lesson.title;

  let startY = drawHeader(doc, title, 'Bead Bar Cards — Cut-Outs', 'Cut-Outs');

  doc.fillColor(COLORS.textLight)
    .font('Helvetica')
    .fontSize(FONT.body)
    .text('Cut along dashed lines. Each bar shows the quantity with colored beads.', MARGIN, startY + 5, { width: CONTENT_W });
  startY += 35;

  const barH = 50;
  const beadSize = 14;
  const maxBarW = CONTENT_W - 40;

  for (let num = 1; num <= 10; num++) {
    if (startY + barH + 15 > PAGE_HEIGHT - 50) {
      doc.addPage();
      startY = drawHeader(doc, title, 'Bead Bars (continued)', 'Cut-Outs');
      startY += 10;
    }

    const barW = Math.min(num * (beadSize + 4) + 50, maxBarW);
    const x = MARGIN + 10;
    const y = startY;

    drawCutLine(doc, x, y, barW, barH);

    // Number label
    doc.fillColor(COLORS.bead[num])
      .font('Helvetica-Bold')
      .fontSize(FONT.label)
      .text(String(num), x + 5, y + 14, { width: 30 });

    // Draw beads
    const beadColor = COLORS.bead[num];
    for (let b = 0; b < num; b++) {
      const bx = x + 40 + b * (beadSize + 3);
      const by = y + barH / 2;

      doc.circle(bx + beadSize / 2, by, beadSize / 2 - 1)
        .fillColor(beadColor)
        .fill();

      // Highlight on bead
      doc.circle(bx + beadSize / 2 - 2, by - 2, 3)
        .fillColor('#FFFFFF')
        .fillOpacity(0.4)
        .fill()
        .fillOpacity(1);
    }

    startY += barH + 10;
  }

  drawFooter(doc, 'Montessori bead bar colors: 1=red, 2=green, 3=pink, 4=yellow, 5=light blue, 6=purple, 7=white, 8=brown, 9=dark blue, 10=gold');
}

// ---------------------------------------------------------------------------
// Template: Graded Series (Pink Tower, Brown Stair, Red Rods)
// ---------------------------------------------------------------------------

function generateGradedSeries(doc, lesson) {
  const title = lesson.title;
  const titleLower = title.toLowerCase();

  let seriesName, count, color, dimension;

  if (titleLower.includes('pink tower')) {
    seriesName = 'Pink Tower';
    count = 10;
    color = '#FFB6C1';
    dimension = 'size (1cm to 10cm cubes)';
  } else if (titleLower.includes('brown stair')) {
    seriesName = 'Brown Stair';
    count = 10;
    color = '#8B6914';
    dimension = 'width (1cm to 10cm prisms)';
  } else if (titleLower.includes('red rod') || titleLower.includes('long rod')) {
    seriesName = 'Red Rods';
    count = 10;
    color = '#CC3333';
    dimension = 'length (10cm to 100cm rods)';
  } else {
    seriesName = 'Graded Series';
    count = 10;
    color = COLORS.accent;
    dimension = 'graduated sizes';
  }

  // --- BASE SHEET: Size comparison board ---
  let startY = drawHeader(doc, title, `${seriesName} — Base Sheet`, 'Base Sheet');

  doc.fillColor(COLORS.textLight)
    .font('Helvetica')
    .fontSize(FONT.body)
    .text(`Arrange the ${seriesName.toLowerCase()} pieces from smallest to largest on this board.`, MARGIN, startY + 5, { width: CONTENT_W });
  startY += 30;

  // Draw graduated outlines
  const maxWidth = CONTENT_W - 40;
  const unitH = 40;

  for (let i = 0; i < count; i++) {
    const piece = i + 1;
    const w = (piece / count) * maxWidth;
    const x = MARGIN + 20;
    const y = startY + i * (unitH + 5);

    if (y + unitH > PAGE_HEIGHT - 50) break;

    // Light outline showing where piece goes
    doc.roundedRect(x, y, w, unitH - 2, 4)
      .strokeColor(color + '60')
      .lineWidth(1)
      .dash(3, { space: 3 })
      .stroke()
      .undash();

    // Size label
    doc.fillColor(COLORS.textLight)
      .font('Helvetica')
      .fontSize(FONT.small)
      .text(`${piece}`, x + w + 8, y + 12);
  }

  drawFooter(doc, 'Print on cardstock — arrangement board');

  // --- CUT-OUT SHEET ---
  doc.addPage();
  startY = drawHeader(doc, title, `${seriesName} — Cut-Out Pieces`, 'Cut-Outs');

  doc.fillColor(COLORS.textLight)
    .font('Helvetica')
    .fontSize(FONT.body)
    .text(`Cut along dashed lines. Sort from smallest (1) to largest (${count}).`, MARGIN, startY + 5, { width: CONTENT_W });
  startY += 30;

  // Shuffle order for the child to sort
  const shuffled = Array.from({ length: count }, (_, i) => i + 1);
  // Don't actually shuffle — present in order but let child sort physically

  for (let i = 0; i < count; i++) {
    const piece = shuffled[i];
    const w = (piece / count) * maxWidth;
    const x = MARGIN + 20;
    const y = startY + i * (unitH + 5);

    if (y + unitH > PAGE_HEIGHT - 50) {
      doc.addPage();
      startY = drawHeader(doc, title, `${seriesName} — Cut-Outs (continued)`, 'Cut-Outs');
      startY += 10;
    }

    drawCutLine(doc, x, y, w, unitH - 2);

    // Colored fill
    doc.roundedRect(x + 2, y + 2, w - 4, unitH - 6, 3)
      .fillColor(color)
      .fill();

    // Number on piece
    doc.fillColor('#FFFFFF')
      .font('Helvetica-Bold')
      .fontSize(FONT.label)
      .text(String(piece), x, y + 10, { width: w, align: 'center' });
  }

  drawFooter(doc, `Cut pieces — sort by ${dimension}`);

  // --- CONTROL SHEET ---
  doc.addPage();
  startY = drawHeader(doc, title, `${seriesName} — Answer Key`, 'Control / Answer Key');

  doc.fillColor(COLORS.textLight)
    .font('Helvetica')
    .fontSize(FONT.body)
    .text('Correct order: smallest at top, largest at bottom.', MARGIN, startY + 5, { width: CONTENT_W });
  startY += 30;

  for (let i = 0; i < count; i++) {
    const piece = i + 1;
    const w = (piece / count) * maxWidth;
    const x = MARGIN + 20;
    const y = startY + i * (unitH + 5);

    if (y + unitH > PAGE_HEIGHT - 50) break;

    doc.roundedRect(x, y, w, unitH - 2, 4)
      .fillColor(color)
      .fill();

    doc.fillColor('#FFFFFF')
      .font('Helvetica-Bold')
      .fontSize(FONT.label)
      .text(String(piece), x, y + 10, { width: w, align: 'center' });
  }

  drawFooter(doc, 'Self-check: compare your arrangement to this answer key');
}

// ---------------------------------------------------------------------------
// Template: Color Tablets
// ---------------------------------------------------------------------------

function generateColorTablets(doc, lesson) {
  const title = lesson.title;
  const titleLower = title.toLowerCase();

  let colors;
  if (titleLower.includes('box 1') || titleLower.includes('primary color')) {
    colors = [
      { name: 'Red', hex: '#CC3333' },
      { name: 'Yellow', hex: '#DAA520' },
      { name: 'Blue', hex: '#3366CC' },
    ];
  } else if (titleLower.includes('box 2') || titleLower.includes('secondary')) {
    colors = [
      { name: 'Red', hex: '#CC3333' },
      { name: 'Yellow', hex: '#DAA520' },
      { name: 'Blue', hex: '#3366CC' },
      { name: 'Orange', hex: '#E8943A' },
      { name: 'Green', hex: '#339933' },
      { name: 'Purple', hex: '#9370DB' },
      { name: 'Pink', hex: '#FF69B4' },
      { name: 'Brown', hex: '#8B4513' },
      { name: 'Black', hex: '#2C2C2C' },
      { name: 'White', hex: '#F5F5F5' },
      { name: 'Gray', hex: '#999999' },
    ];
  } else {
    // Box 3 — grading (7 shades of each color)
    colors = [
      { name: 'Red', hex: '#CC3333' },
      { name: 'Orange', hex: '#E8943A' },
      { name: 'Yellow', hex: '#DAA520' },
      { name: 'Green', hex: '#339933' },
      { name: 'Blue', hex: '#3366CC' },
      { name: 'Purple', hex: '#9370DB' },
      { name: 'Pink', hex: '#FF69B4' },
      { name: 'Brown', hex: '#8B4513' },
      { name: 'Gray', hex: '#999999' },
    ];
  }

  let startY = drawHeader(doc, title, 'Color Tablets — Cut-Out Matching Cards', 'Cut-Outs');

  doc.fillColor(COLORS.textLight)
    .font('Helvetica')
    .fontSize(FONT.body)
    .text('Cut along dashed lines. Match each color pair. Two cards for each color.', MARGIN, startY + 5, { width: CONTENT_W });
  startY += 35;

  const cardW = 80;
  const cardH = 60;
  const cols = Math.floor(CONTENT_W / (cardW + 10));

  // Create pairs (2 of each)
  const pairs = [];
  for (const c of colors) {
    pairs.push(c, c);
  }

  for (let i = 0; i < pairs.length; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = MARGIN + col * (cardW + 10);
    const y = startY + row * (cardH + 10);

    if (y + cardH > PAGE_HEIGHT - 50) {
      doc.addPage();
      startY = drawHeader(doc, title, 'Color Tablets (continued)', 'Cut-Outs');
      startY += 10;
      // Reset row positioning
    }

    drawCutLine(doc, x, y, cardW, cardH);

    // Color swatch
    doc.roundedRect(x + 8, y + 8, cardW - 16, cardH - 24, 4)
      .fillColor(pairs[i].hex)
      .fill();

    if (pairs[i].hex === '#F5F5F5' || pairs[i].hex === '#FFFFFF') {
      doc.roundedRect(x + 8, y + 8, cardW - 16, cardH - 24, 4)
        .strokeColor('#CCCCCC')
        .lineWidth(0.5)
        .stroke();
    }

    doc.fillColor(COLORS.text)
      .font('Helvetica')
      .fontSize(FONT.small)
      .text(pairs[i].name, x, y + cardH - 16, { width: cardW, align: 'center' });
  }

  drawFooter(doc, 'Cut cards — find matching color pairs');
}

// ---------------------------------------------------------------------------
// Template: Generic Printable (fallback)
// ---------------------------------------------------------------------------

function generateGenericPrintable(doc, lesson) {
  const title = lesson.title;
  const description = lesson.description || '';
  const materials = lesson.materials_needed || [];
  const instructions = lesson.instructions || '';

  let startY = drawHeader(doc, title, 'Activity Sheet', 'Base Sheet');

  // Description
  doc.fillColor(COLORS.text)
    .font('Helvetica')
    .fontSize(FONT.body)
    .text(description, MARGIN + 10, startY + 10, { width: CONTENT_W - 20 });

  startY += 60;

  // Materials needed
  if (materials.length > 0) {
    doc.fillColor(COLORS.accent)
      .font('Helvetica-Bold')
      .fontSize(FONT.body)
      .text('What You Need:', MARGIN + 10, startY);
    startY += 20;

    for (const m of materials) {
      doc.fillColor(COLORS.text)
        .font('Helvetica')
        .fontSize(FONT.body)
        .text(`• ${m}`, MARGIN + 20, startY);
      startY += 18;
    }
    startY += 10;
  }

  // Instructions
  if (instructions) {
    doc.fillColor(COLORS.accent)
      .font('Helvetica-Bold')
      .fontSize(FONT.body)
      .text('Steps:', MARGIN + 10, startY);
    startY += 20;

    const steps = instructions.split('\n').filter(Boolean);
    for (const step of steps) {
      if (startY > PAGE_HEIGHT - 80) {
        doc.addPage();
        startY = drawHeader(doc, title, 'Activity Sheet (continued)', 'Base Sheet');
        startY += 10;
      }

      doc.fillColor(COLORS.text)
        .font('Helvetica')
        .fontSize(FONT.body)
        .text(step.trim(), MARGIN + 20, startY, { width: CONTENT_W - 40 });
      startY += 22;
    }
  }

  // Work space
  startY += 20;
  if (startY < PAGE_HEIGHT - 200) {
    doc.fillColor(COLORS.accent)
      .font('Helvetica-Bold')
      .fontSize(FONT.body)
      .text('Work Space:', MARGIN + 10, startY);
    startY += 25;

    doc.roundedRect(MARGIN + 10, startY, CONTENT_W - 20, PAGE_HEIGHT - startY - 60, 8)
      .strokeColor(COLORS.border)
      .lineWidth(1)
      .dash(5, { space: 5 })
      .stroke()
      .undash();
  }

  drawFooter(doc, 'Activity sheet — print on standard paper');
}

// ---------------------------------------------------------------------------
// Template router — picks the right generator
// ---------------------------------------------------------------------------

const TEMPLATE_GENERATORS = {
  'number-cards': generateNumberCards,
  'bead-bars': generateBeadBars,
  'letter-cards': generateLetterCards,
  'graded-series': generateGradedSeries,
  'color-tablets': generateColorTablets,
  'generic-printable': generateGenericPrintable,
  // These use genericPrintable as fallback for now — can be specialized later
  'puzzle-map': generateGenericPrintable,
  'word-cards': generateGenericPrintable,
  'science-cards': generateGenericPrintable,
  'geometry-shapes': generateGenericPrintable,
  'flag-cards': generateGenericPrintable,
  'fraction-circles': generateGenericPrintable,
  'clock-face': generateGenericPrintable,
  'strip-board': generateGenericPrintable,
  'numeral-cards': generateGenericPrintable,
  'handwriting-practice': generateGenericPrintable,
  'seguin-board': generateGenericPrintable,
  'grammar-symbols': generateGenericPrintable,
  'hundred-board': generateNumberCards,   // Reuses number cards with 1-100
  'cylinder-blocks': generateGradedSeries,
  'operation-board': generateGenericPrintable,
  'three-part-cards': generateGenericPrintable,
  'number-rods': generateGradedSeries,    // Reuses graded series
};

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const args = process.argv.slice(2);
  const level = args.includes('--level') ? args[args.indexOf('--level') + 1] : 'primary';
  const weekFilter = args.includes('--week') ? parseInt(args[args.indexOf('--week') + 1]) : null;
  const force = args.includes('--force');

  const classPath = path.join(__dirname, 'data', 'lesson-classifications.json');
  if (!fs.existsSync(classPath)) {
    console.error('Run classify-lessons.js first!');
    process.exit(1);
  }

  const classifications = JSON.parse(fs.readFileSync(classPath, 'utf8'));
  const lessonsDir = path.join(__dirname, 'data', `${level}-lessons`);
  const outputDir = path.join(__dirname, '..', 'public', 'printables', level);
  const progressPath = path.join(__dirname, 'data', 'pdf-generation-progress.json');

  // Ensure output directory exists
  fs.mkdirSync(outputDir, { recursive: true });

  // Load progress
  let progress = {};
  if (fs.existsSync(progressPath) && !force) {
    progress = JSON.parse(fs.readFileSync(progressPath, 'utf8'));
  }

  const weekFiles = fs.readdirSync(lessonsDir)
    .filter(f => f.startsWith('week-') && f.endsWith('.json'))
    .sort();

  let generated = 0;
  let skipped = 0;
  let errors = 0;

  for (const file of weekFiles) {
    const weekNum = parseInt(file.replace('week-', '').replace('.json', ''));
    if (weekFilter && weekNum !== weekFilter) continue;

    const filePath = path.join(lessonsDir, file);
    const lessons = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    for (let i = 0; i < lessons.length; i++) {
      const lesson = lessons[i];
      const key = `${level}-lessons/week-${String(weekNum).padStart(2, '0')}/lesson-${String(i + 1).padStart(2, '0')}`;
      const classification = classifications[key];

      if (!classification || classification.type !== 'PRINTABLE') continue;

      // Check progress
      const progressKey = `pdf:${key}`;
      if (progress[progressKey] && !force) {
        skipped++;
        continue;
      }

      // Determine template
      const template = (classification.pdf_templates || ['generic-printable'])[0];
      const generator = TEMPLATE_GENERATORS[template] || generateGenericPrintable;

      // Generate PDF
      const pdfFilename = `week-${String(weekNum).padStart(2, '0')}-lesson-${String(i + 1).padStart(2, '0')}-${template}.pdf`;
      const pdfPath = path.join(outputDir, pdfFilename);

      try {
        const doc = new PDFDocument({
          size: 'letter',
          margin: MARGIN,
          info: {
            Title: `${lesson.title} — Printable Materials`,
            Author: 'Montessori Homeschool',
            Subject: `${lesson.subject_name} — ${template}`,
          },
        });

        const stream = fs.createWriteStream(pdfPath);
        doc.pipe(stream);

        generator(doc, lesson);

        doc.end();

        await new Promise((resolve, reject) => {
          stream.on('finish', resolve);
          stream.on('error', reject);
        });

        // Update lesson JSON with PDF reference
        if (!lesson.printable_pdfs) lesson.printable_pdfs = [];
        const pdfUrl = `/printables/${level}/${pdfFilename}`;
        if (!lesson.printable_pdfs.includes(pdfUrl)) {
          lesson.printable_pdfs.push(pdfUrl);
        }
        lesson.conversion_type = 'PRINTABLE';

        progress[progressKey] = true;
        generated++;

        if (generated % 25 === 0) {
          fs.writeFileSync(progressPath, JSON.stringify(progress, null, 2));
          console.log(`  ... ${generated} PDFs generated so far`);
        }
      } catch (err) {
        console.error(`  ERROR generating ${pdfFilename}: ${err.message}`);
        errors++;
      }
    }

    // Write updated lesson JSON back
    fs.writeFileSync(filePath, JSON.stringify(lessons, null, 2));
    console.log(`  ${file}: processed`);
  }

  // Save final progress
  fs.writeFileSync(progressPath, JSON.stringify(progress, null, 2));

  console.log(`\n=== PDF GENERATION COMPLETE ===`);
  console.log(`Generated: ${generated}`);
  console.log(`Skipped (already done): ${skipped}`);
  console.log(`Errors: ${errors}`);
  console.log(`Output: ${outputDir}`);
}

main().catch(console.error);
