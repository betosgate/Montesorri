#!/usr/bin/env node
/**
 * V2 Material Library PDF Generator
 * Generates ~35 reusable material PDFs shared across all 2,700 lessons.
 * Usage: node scripts/generate-lesson-pdfs-v2.js [--force]
 */
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN = 36;
const CONTENT_W = PAGE_WIDTH - 2 * MARGIN;

const COLORS = {
  units: '#CC3333', tens: '#3366CC', hundreds: '#339933', thousands: '#DAA520',
  bead: { 1:'#CC3333',2:'#339933',3:'#FF69B4',4:'#DAA520',5:'#87CEEB',6:'#9370DB',7:'#888888',8:'#8B4513',9:'#191970',10:'#DAA520' },
  vowel: '#FF6B6B', consonant: '#4A90D9',
  continent: { 'North America':'#E8943A','South America':'#E87CA0','Europe':'#CC3333','Asia':'#DAA520','Africa':'#339933','Australia':'#8B4513','Antarctica':'#E8E8E8' },
  background: '#FFF8F0', border: '#D4C5A9', cutLine: '#999999',
  text: '#2C2C2C', textLight: '#666666', accent: '#8B7355', headerBg: '#F5EDE0',
};
const FONT = { title:24, subtitle:16, label:18, body:14, small:11, tiny:9 };

// ── Utilities ──
function drawCutLine(doc, x, y, w, h, r=8) {
  doc.save().roundedRect(x,y,w,h,r).dash(5,{space:3}).strokeColor(COLORS.cutLine).lineWidth(1).stroke().undash().restore();
}
function drawHeader(doc, title, subtitle, badge) {
  doc.save();
  doc.rect(MARGIN,MARGIN,CONTENT_W,50).fillColor(COLORS.headerBg).fill();
  doc.fillColor(COLORS.text).font('Helvetica-Bold').fontSize(FONT.subtitle).text(title,MARGIN+10,MARGIN+8,{width:CONTENT_W-130});
  const bc = badge==='Cut-Outs'?'#CC6633':badge==='Control / Answer Key'?'#339933':'#8B7355';
  const bx = MARGIN+CONTENT_W-125;
  doc.roundedRect(bx,MARGIN+12,120,26,4).fillColor(bc).fill();
  doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(FONT.small).text(badge,bx,MARGIN+18,{width:120,align:'center'});
  if(subtitle){doc.fillColor(COLORS.textLight).font('Helvetica').fontSize(FONT.small).text(subtitle,MARGIN+10,MARGIN+32,{width:CONTENT_W-140});}
  doc.restore();
  return MARGIN+60;
}
function drawFooter(doc, label) {
  doc.save().fillColor(COLORS.textLight).font('Helvetica').fontSize(FONT.tiny)
    .text(`Montessori Homeschool • Print on US Letter (8.5 × 11") • ${label}`,MARGIN,PAGE_HEIGHT-MARGIN+10,{width:CONTENT_W,align:'center'}).restore();
}
function savePdf(doc, filePath) {
  return new Promise((resolve, reject) => {
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);
    doc.end();
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
}
function newDoc(title, subject) {
  return new PDFDocument({ size:'letter', margin:MARGIN, info:{ Title:title, Author:'Montessori Homeschool', Subject:subject }});
}

// ── GENERATOR FUNCTIONS ──
// Each returns a promise, writes PDF(s) to outputDir

async function generateNumberRods(dir) {
  const doc = newDoc('Number Rods','Math');
  let y = drawHeader(doc,'Number Rods (1-10)','Red/blue alternating segments — cut and arrange','Cut-Outs');
  doc.fillColor(COLORS.textLight).font('Helvetica').fontSize(FONT.body).text('Cut along dashed lines. Each rod has alternating red and blue segments.',MARGIN,y+5,{width:CONTENT_W});
  y+=35;
  const maxW = CONTENT_W-60;
  for(let n=1;n<=10;n++){
    const rodW = (n/10)*maxW;
    const rodH = 38;
    const segW = rodW/n;
    drawCutLine(doc,MARGIN+20,y,rodW+10,rodH);
    for(let s=0;s<n;s++){
      const color = s%2===0?'#CC3333':'#4A90D9';
      doc.rect(MARGIN+25+s*segW,y+4,segW-1,rodH-8).fillColor(color).fill();
    }
    doc.fillColor(COLORS.text).font('Helvetica-Bold').fontSize(FONT.body).text(String(n),MARGIN+rodW+38,y+10);
    y+=rodH+8;
  }
  drawFooter(doc,'Number Rods — print on cardstock, cut along dashed lines');
  // Page 2: Base mat
  doc.addPage();
  y = drawHeader(doc,'Number Rod Base Mat','Place rods from shortest to longest','Base Sheet');
  doc.fillColor(COLORS.textLight).font('Helvetica').fontSize(FONT.body).text('Place each rod on its matching outline.',MARGIN,y+5,{width:CONTENT_W});
  y+=30;
  for(let n=1;n<=10;n++){
    const rodW=(n/10)*maxW;
    doc.roundedRect(MARGIN+20,y,rodW+10,36,4).dash(3,{space:3}).strokeColor('#D4C5A9').lineWidth(1).stroke().undash();
    doc.fillColor('#E8E0D4').font('Helvetica').fontSize(FONT.small).text(String(n),MARGIN+rodW+38,y+10);
    y+=42;
  }
  drawFooter(doc,'Base mat — print on cardstock');
  const fp = path.join(dir,'number-rods.pdf');
  await savePdf(doc,fp);
  return [fp];
}

async function generateNumberCards(dir) {
  // 1-10 cards
  const doc = newDoc('Number Cards 1-10','Math');
  let y = drawHeader(doc,'Number Cards (1-10)','Color-coded cut-out number tiles','Cut-Outs');
  doc.fillColor(COLORS.textLight).font('Helvetica').fontSize(FONT.body).text('Cut along dashed lines. Place on number line or use for counting.',MARGIN,y+5,{width:CONTENT_W});
  y+=35;
  const cw=80,ch=60,cols=5;
  for(let i=0;i<10;i++){
    const c=i%cols,r=Math.floor(i/cols);
    const x=MARGIN+c*(cw+15)+(CONTENT_W-cols*(cw+15))/2, yy=y+r*(ch+15);
    drawCutLine(doc,x,yy,cw,ch);
    doc.fillColor(COLORS.units).font('Helvetica-Bold').fontSize(30).text(String(i+1),x,yy+14,{width:cw,align:'center'});
  }
  y+=2*(ch+15)+20;
  // Base grid
  doc.fillColor(COLORS.accent).font('Helvetica-Bold').fontSize(FONT.body).text('Number Line Base:',MARGIN,y);
  y+=20;
  for(let i=0;i<10;i++){
    const x=MARGIN+i*(cw/1.6+4);
    doc.roundedRect(x,y,cw/1.6,ch-10,4).strokeColor(COLORS.border).lineWidth(1).stroke();
    doc.fillColor('#E8E0D4').font('Helvetica').fontSize(FONT.title).text(String(i+1),x,y+10,{width:cw/1.6,align:'center'});
  }
  drawFooter(doc,'Number cards — print on cardstock');
  const fp1 = path.join(dir,'number-cards-1-10.pdf');
  await savePdf(doc,fp1);

  // Teens
  const doc2 = newDoc('Teen Number Cards','Math');
  y = drawHeader(doc2,'Teen Number Cards (11-19)','Cut-out tiles for teen board work','Cut-Outs');
  doc2.fillColor(COLORS.textLight).font('Helvetica').fontSize(FONT.body).text('Cut along dashed lines.',MARGIN,y+5,{width:CONTENT_W});
  y+=35;
  for(let i=11;i<=19;i++){
    const idx=i-11,c=idx%cols,r=Math.floor(idx/cols);
    const x=MARGIN+c*(cw+15)+(CONTENT_W-cols*(cw+15))/2,yy=y+r*(ch+15);
    drawCutLine(doc2,x,yy,cw,ch);
    doc2.fillColor(COLORS.tens).font('Helvetica-Bold').fontSize(28).text(String(i),x,yy+16,{width:cw,align:'center'});
  }
  drawFooter(doc2,'Teen cards — use with Seguin board');
  const fp2 = path.join(dir,'number-cards-teens.pdf');
  await savePdf(doc2,fp2);

  // Place value
  const doc3 = newDoc('Place Value Cards','Math');
  y = drawHeader(doc3,'Place Value Cards','Units (red), Tens (blue), Hundreds (green), Thousands (gold)','Cut-Outs');
  y+=10;
  const sections=[
    {label:'Units',vals:[1,2,3,4,5,6,7,8,9],color:COLORS.units,w:55},
    {label:'Tens',vals:[10,20,30,40,50,60,70,80,90],color:COLORS.tens,w:70},
    {label:'Hundreds',vals:[100,200,300,400,500,600,700,800,900],color:COLORS.hundreds,w:90},
    {label:'Thousands',vals:[1000,2000,3000],color:COLORS.thousands,w:110},
  ];
  for(const s of sections){
    if(y>PAGE_HEIGHT-130){doc3.addPage();y=drawHeader(doc3,'Place Value Cards (cont.)','','Cut-Outs');y+=10;}
    doc3.fillColor(s.color).font('Helvetica-Bold').fontSize(FONT.body).text(s.label,MARGIN,y);y+=18;
    const nc=Math.floor(CONTENT_W/(s.w+8));
    for(let i=0;i<s.vals.length;i++){
      const c=i%nc,r=Math.floor(i/nc);
      const x=MARGIN+c*(s.w+8),yy=y+r*48;
      drawCutLine(doc3,x,yy,s.w,38);
      doc3.fillColor(s.color).font('Helvetica-Bold').fontSize(FONT.label).text(String(s.vals[i]),x,yy+8,{width:s.w,align:'center'});
    }
    y+=Math.ceil(s.vals.length/nc)*48+15;
  }
  drawFooter(doc3,'Stack cards to build multi-digit numbers');
  const fp3 = path.join(dir,'place-value-cards.pdf');
  await savePdf(doc3,fp3);

  // Stamp game
  const doc4 = newDoc('Stamp Game','Math');
  y = drawHeader(doc4,'Stamp Game Pieces','Color-coded stamps for operations','Cut-Outs');
  doc4.fillColor(COLORS.textLight).font('Helvetica').fontSize(FONT.body).text('Cut out stamps. Use for addition, subtraction, multiplication, division.',MARGIN,y+5,{width:CONTENT_W});
  y+=35;
  const stamps=[{l:'1',c:COLORS.units,d:'Units'},{l:'10',c:COLORS.tens,d:'Tens'},{l:'100',c:COLORS.hundreds,d:'Hundreds'},{l:'1000',c:COLORS.thousands,d:'Thousands'}];
  const ss=42,sc=9;
  for(const st of stamps){
    doc4.fillColor(st.c).font('Helvetica-Bold').fontSize(FONT.body).text(st.d+' Stamps',MARGIN,y);y+=18;
    for(let i=0;i<18;i++){
      const c=i%sc,r=Math.floor(i/sc);
      const x=MARGIN+c*(ss+5),yy=y+r*(ss+5);
      drawCutLine(doc4,x,yy,ss,ss,4);
      doc4.roundedRect(x+4,yy+4,ss-8,ss-8,3).fillColor(st.c).fill();
      doc4.fillColor('#FFF').font('Helvetica-Bold').fontSize(st.l.length>2?9:12).text(st.l,x,yy+ss/2-6,{width:ss,align:'center'});
    }
    y+=2*(ss+5)+15;
    if(y>PAGE_HEIGHT-120){doc4.addPage();y=drawHeader(doc4,'Stamp Game (cont.)','','Cut-Outs');y+=10;}
  }
  drawFooter(doc4,'Stamp game pieces — cut along dashed lines');
  const fp4 = path.join(dir,'stamp-game.pdf');
  await savePdf(doc4,fp4);
  return [fp1,fp2,fp3,fp4];
}

async function generateBeadBars(dir) {
  const doc = newDoc('Bead Bars','Math');
  let y = drawHeader(doc,'Bead Bars (1-10)','Montessori color-coded bead representations','Cut-Outs');
  doc.fillColor(COLORS.textLight).font('Helvetica').fontSize(FONT.body).text('Cut along dashed lines. Each bar shows quantity with colored beads.',MARGIN,y+5,{width:CONTENT_W});
  y+=35;
  const beadSz=14;
  for(let n=1;n<=10;n++){
    const barW=Math.min(n*(beadSz+4)+50,CONTENT_W-40),barH=48;
    drawCutLine(doc,MARGIN+10,y,barW,barH);
    doc.fillColor(COLORS.bead[n]).font('Helvetica-Bold').fontSize(FONT.label).text(String(n),MARGIN+15,y+12,{width:30});
    for(let b=0;b<n;b++){
      const bx=MARGIN+50+b*(beadSz+3),by=y+barH/2;
      doc.circle(bx+beadSz/2,by,beadSz/2-1).fillColor(COLORS.bead[n]).fill();
      doc.circle(bx+beadSz/2-2,by-2,3).fillColor('#FFFFFF').fillOpacity(0.4).fill().fillOpacity(1);
    }
    y+=barH+8;
  }
  drawFooter(doc,'Bead bars: 1=red,2=green,3=pink,4=yellow,5=lt blue,6=purple,7=gray,8=brown,9=dk blue,10=gold');
  // Page 2: skip counting chains reference
  doc.addPage();
  y = drawHeader(doc,'Skip Counting Chains','Reference chart for bead chain counting','Base Sheet');
  doc.fillColor(COLORS.textLight).font('Helvetica').fontSize(FONT.body).text('Use this chart when working with bead chains.',MARGIN,y+5,{width:CONTENT_W});
  y+=30;
  for(let n=2;n<=10;n++){
    doc.fillColor(COLORS.bead[n]).font('Helvetica-Bold').fontSize(FONT.body).text(`${n}s chain:`,MARGIN+10,y);
    let nums=[];for(let i=n;i<=n*n;i+=n)nums.push(i);
    doc.fillColor(COLORS.text).font('Helvetica').fontSize(FONT.small).text(nums.join(', '),MARGIN+100,y,{width:CONTENT_W-120});
    y+=22;
  }
  drawFooter(doc,'Skip counting reference');
  const fp=path.join(dir,'bead-bars.pdf');
  await savePdf(doc,fp);
  return [fp];
}

async function generateNumeralCards(dir) {
  const doc = newDoc('Numeral Cards','Math');
  let y = drawHeader(doc,'Traceable Numeral Cards (0-9)','Large digits with stroke-direction guides','Cut-Outs');
  doc.fillColor(COLORS.textLight).font('Helvetica').fontSize(FONT.body).text('Cut cards. Trace numerals with finger, then pencil. Arrows show stroke direction.',MARGIN,y+5,{width:CONTENT_W});
  y+=35;
  const cw=100,ch=130,cols=4;
  for(let d=0;d<=9;d++){
    const c=d%cols,r=Math.floor(d/cols);
    const x=MARGIN+c*(cw+15)+(CONTENT_W-cols*(cw+15))/2, yy=y+r*(ch+15);
    if(yy+ch>PAGE_HEIGHT-50){doc.addPage();y=drawHeader(doc,'Numeral Cards (cont.)','','Cut-Outs');y+=10;continue;}
    drawCutLine(doc,x,yy,cw,ch);
    // Dotted numeral for tracing
    doc.save();
    doc.fillColor('#E0D0C0').font('Helvetica-Bold').fontSize(72).text(String(d),x,yy+15,{width:cw,align:'center'});
    doc.restore();
    // Solid outline
    doc.fillColor(COLORS.units).font('Helvetica-Bold').fontSize(72).fillOpacity(0.2).text(String(d),x,yy+15,{width:cw,align:'center'}).fillOpacity(1);
    // Label
    doc.fillColor(COLORS.text).font('Helvetica').fontSize(FONT.small).text(String(d),x,yy+ch-20,{width:cw,align:'center'});
  }
  drawFooter(doc,'Trace numerals with finger first, then pencil');
  const fp=path.join(dir,'numeral-cards.pdf');
  await savePdf(doc,fp);
  return [fp];
}

async function generateSeguinBoard(dir) {
  const doc = newDoc('Seguin Boards','Math');
  // Teen board
  let y = drawHeader(doc,'Teen Board (Seguin Board A)','Slide digit cards over the zeros to make 11-19','Base Sheet');
  doc.fillColor(COLORS.textLight).font('Helvetica').fontSize(FONT.body).text('Print board. Cut digit cards from page 2. Slide card over right zero.',MARGIN,y+5,{width:CONTENT_W});
  y+=35;
  const cellW=120,cellH=55;
  for(let i=0;i<9;i++){
    const r=Math.floor(i/3),c=i%3;
    const x=MARGIN+c*(cellW+20)+(CONTENT_W-3*(cellW+20))/2,yy=y+r*(cellH+15);
    doc.roundedRect(x,yy,cellW,cellH,6).strokeColor(COLORS.border).lineWidth(1.5).stroke();
    doc.fillColor(COLORS.tens).font('Helvetica-Bold').fontSize(36).text('10',x+5,yy+8,{width:cellW-10,align:'center'});
  }
  drawFooter(doc,'Teen Board — place digit card over the 0');
  // Ten board
  doc.addPage();
  y = drawHeader(doc,'Ten Board (Seguin Board B)','Shows 10, 20, 30... 90','Base Sheet');
  doc.fillColor(COLORS.textLight).font('Helvetica').fontSize(FONT.body).text('Slide digit cards over zeros to build multiples of ten.',MARGIN,y+5,{width:CONTENT_W});
  y+=35;
  const tens=[10,20,30,40,50,60,70,80,90];
  for(let i=0;i<9;i++){
    const r=Math.floor(i/3),c=i%3;
    const x=MARGIN+c*(cellW+20)+(CONTENT_W-3*(cellW+20))/2,yy=y+r*(cellH+15);
    doc.roundedRect(x,yy,cellW,cellH,6).strokeColor(COLORS.border).lineWidth(1.5).stroke();
    doc.fillColor(COLORS.tens).font('Helvetica-Bold').fontSize(36).text(String(tens[i]),x+5,yy+8,{width:cellW-10,align:'center'});
  }
  drawFooter(doc,'Ten Board — slide digit cards to build numbers');
  // Digit cards
  doc.addPage();
  y = drawHeader(doc,'Digit Overlay Cards','Cut these and slide over board zeros','Cut-Outs');
  y+=10;
  // Two sets of 1-9
  for(let set=0;set<2;set++){
    doc.fillColor(COLORS.accent).font('Helvetica-Bold').fontSize(FONT.body).text(`Set ${set+1}:`,MARGIN,y);y+=18;
    for(let d=1;d<=9;d++){
      const c=(d-1)%9,x=MARGIN+c*55;
      drawCutLine(doc,x,y,48,48);
      doc.fillColor(COLORS.units).font('Helvetica-Bold').fontSize(28).text(String(d),x,y+10,{width:48,align:'center'});
    }
    y+=65;
  }
  drawFooter(doc,'Cut digit cards — slide over board');
  const fp=path.join(dir,'seguin-board.pdf');
  await savePdf(doc,fp);
  return [fp];
}

async function generateHundredBoard(dir) {
  const doc = newDoc('Hundred Board','Math');
  let y = drawHeader(doc,'Hundred Board (1-100)','Blank grid — place number tiles in correct squares','Base Sheet');
  doc.fillColor(COLORS.textLight).font('Helvetica').fontSize(FONT.body).text('Place cut-out number tiles on matching squares.',MARGIN,y+5,{width:CONTENT_W});
  y+=30;
  const cs=Math.min((CONTENT_W-20)/10,50),gw=cs*10,ox=MARGIN+(CONTENT_W-gw)/2;
  for(let r=0;r<10;r++){
    for(let c=0;c<10;c++){
      const x=ox+c*cs,yy=y+r*cs;
      doc.rect(x,yy,cs,cs).strokeColor(COLORS.border).lineWidth(0.5).stroke();
      doc.fillColor('#E8E0D4').font('Helvetica').fontSize(8).text(String(r*10+c+1),x,yy+cs/2-4,{width:cs,align:'center'});
    }
  }
  drawFooter(doc,'Hundred Board base — print on cardstock');
  // Tiles page
  doc.addPage();
  y = drawHeader(doc,'Hundred Board Tiles','100 cut-out number tiles','Cut-Outs');
  y+=5;
  const ts=Math.min((CONTENT_W-10)/10,48),tw=ts*10,tx=MARGIN+(CONTENT_W-tw)/2;
  for(let r=0;r<10;r++){
    for(let c=0;c<10;c++){
      const x=tx+c*ts,yy=y+r*ts;
      drawCutLine(doc,x,yy,ts-1,ts-1,2);
      doc.fillColor(COLORS.units).font('Helvetica-Bold').fontSize(12).text(String(r*10+c+1),x,yy+ts/2-6,{width:ts,align:'center'});
    }
  }
  drawFooter(doc,'Cut tiles — place on hundred board');
  const fp=path.join(dir,'hundred-board.pdf');
  await savePdf(doc,fp);
  return [fp];
}

async function generateStripBoard(dir) {
  const doc = newDoc('Strip Board','Math');
  // Addition board header row (1-18)
  let y = drawHeader(doc,'Addition Strip Board','Board with strips for memorizing addition facts','Base Sheet');
  doc.fillColor(COLORS.textLight).font('Helvetica').fontSize(FONT.body).text('Place blue and red strips to show addition facts.',MARGIN,y+5,{width:CONTENT_W});
  y+=30;
  const sw=28,sh=28;
  // Header 1-18
  for(let i=1;i<=18;i++){
    const x=MARGIN+(i-1)*sw;
    doc.rect(x,y,sw,sh).fillColor(i<=9?'#F0F8FF':'#FFF0F0').fill().strokeColor(COLORS.border).lineWidth(0.5).stroke();
    doc.fillColor(COLORS.text).font('Helvetica-Bold').fontSize(9).text(String(i),x,y+8,{width:sw,align:'center'});
  }
  y+=sh+5;
  // Grid rows
  for(let r=0;r<10;r++){
    for(let c=0;c<18;c++){
      const x=MARGIN+c*sw;
      doc.rect(x,y,sw,sh).strokeColor('#E0E0E0').lineWidth(0.3).stroke();
    }
    y+=sh;
  }
  drawFooter(doc,'Addition Strip Board — place strips to show facts');
  // Strips page
  doc.addPage();
  y = drawHeader(doc,'Addition Strips','Blue strips (1-9) and Red strips (1-9)','Cut-Outs');
  y+=10;
  doc.fillColor(COLORS.textLight).font('Helvetica').fontSize(FONT.body).text('Cut strips. Blue = first addend, Red = second addend.',MARGIN,y,{width:CONTENT_W});
  y+=25;
  // Blue strips
  doc.fillColor('#4A90D9').font('Helvetica-Bold').fontSize(FONT.body).text('Blue Strips:',MARGIN,y);y+=18;
  for(let n=1;n<=9;n++){
    const w=n*sw;
    drawCutLine(doc,MARGIN,y,w+4,sh);
    for(let s=0;s<n;s++){
      doc.rect(MARGIN+2+s*sw,y+2,sw-1,sh-4).fillColor('#4A90D9').fill();
      doc.fillColor('#FFF').font('Helvetica-Bold').fontSize(9).text(String(s+1),MARGIN+2+s*sw,y+8,{width:sw-1,align:'center'});
    }
    y+=sh+6;
  }
  // Red strips
  if(y>PAGE_HEIGHT-200){doc.addPage();y=drawHeader(doc,'Addition Strips (cont.)','Red strips','Cut-Outs');y+=10;}
  doc.fillColor('#CC3333').font('Helvetica-Bold').fontSize(FONT.body).text('Red Strips:',MARGIN,y);y+=18;
  for(let n=1;n<=9;n++){
    const w=n*sw;
    if(y+sh+6>PAGE_HEIGHT-40){doc.addPage();y=drawHeader(doc,'Red Strips (cont.)','','Cut-Outs');y+=10;}
    drawCutLine(doc,MARGIN,y,w+4,sh);
    for(let s=0;s<n;s++){
      doc.rect(MARGIN+2+s*sw,y+2,sw-1,sh-4).fillColor('#CC3333').fill();
      doc.fillColor('#FFF').font('Helvetica-Bold').fontSize(9).text(String(s+1),MARGIN+2+s*sw,y+8,{width:sw-1,align:'center'});
    }
    y+=sh+6;
  }
  drawFooter(doc,'Cut strips — combine blue+red to find sums');
  const fp=path.join(dir,'strip-board.pdf');
  await savePdf(doc,fp);
  return [fp];
}

async function generateFractionCircles(dir) {
  const doc = newDoc('Fraction Circles','Math');
  let y = drawHeader(doc,'Fraction Circles','Whole through tenths — cut wedges along dashed lines','Cut-Outs');
  doc.fillColor(COLORS.textLight).font('Helvetica').fontSize(FONT.body).text('Cut each circle into labeled wedge pieces.',MARGIN,y+5,{width:CONTENT_W});
  y+=30;
  const divs=[1,2,3,4,5,6,8,10];
  const labels=['Whole','Halves','Thirds','Fourths','Fifths','Sixths','Eighths','Tenths'];
  const fColors=['#CC3333','#3366CC','#339933','#DAA520','#FF69B4','#9370DB','#87CEEB','#E8943A'];
  const radius=55, cols=4;
  for(let i=0;i<divs.length;i++){
    const c=i%cols,r=Math.floor(i/cols);
    const cx=MARGIN+c*(radius*2+30)+radius+15;
    const cy=y+r*(radius*2+50)+radius;
    if(cy+radius+20>PAGE_HEIGHT-40){doc.addPage();y=drawHeader(doc,'Fraction Circles (cont.)','','Cut-Outs');y+=10;continue;}
    // Label
    doc.fillColor(COLORS.text).font('Helvetica-Bold').fontSize(FONT.small).text(labels[i],cx-radius,cy-radius-14,{width:radius*2,align:'center'});
    const n=divs[i];
    for(let w=0;w<n;w++){
      const a1=(w/n)*Math.PI*2-Math.PI/2;
      const a2=((w+1)/n)*Math.PI*2-Math.PI/2;
      const mx=cx+Math.cos(a1)*radius,my=cy+Math.sin(a1)*radius;
      const ex=cx+Math.cos(a2)*radius,ey=cy+Math.sin(a2)*radius;
      // Draw wedge
      doc.save();
      doc.moveTo(cx,cy).lineTo(mx,my);
      // Arc approximation with line segments
      const steps=12;
      for(let s=1;s<=steps;s++){
        const a=a1+(a2-a1)*(s/steps);
        doc.lineTo(cx+Math.cos(a)*radius,cy+Math.sin(a)*radius);
      }
      doc.lineTo(cx,cy).fillColor(fColors[i]).fillOpacity(0.3).fill().fillOpacity(1);
      doc.restore();
      // Wedge border
      doc.save().moveTo(cx,cy).lineTo(mx,my).dash(3,{space:2}).strokeColor(COLORS.cutLine).lineWidth(1).stroke().undash().restore();
      doc.save().moveTo(cx,cy).lineTo(ex,ey).dash(3,{space:2}).strokeColor(COLORS.cutLine).lineWidth(1).stroke().undash().restore();
      // Label in wedge
      if(n>1){
        const midA=(a1+a2)/2;
        const lx=cx+Math.cos(midA)*radius*0.55;
        const ly=cy+Math.sin(midA)*radius*0.55;
        doc.fillColor(COLORS.text).font('Helvetica').fontSize(n<=4?10:7).text(`1/${n}`,lx-12,ly-5,{width:24,align:'center'});
      }
    }
    // Circle outline
    doc.circle(cx,cy,radius).strokeColor(COLORS.cutLine).dash(3,{space:2}).lineWidth(1).stroke().undash();
  }
  drawFooter(doc,'Fraction circles — cut wedges to explore fractions');
  const fp=path.join(dir,'fraction-circles.pdf');
  await savePdf(doc,fp);
  return [fp];
}

async function generateOperationBoard(dir) {
  const doc = newDoc('Operation Board','Math');
  let y = drawHeader(doc,'Multiplication Board','10×10 grid for multiplication facts','Base Sheet');
  doc.fillColor(COLORS.textLight).font('Helvetica').fontSize(FONT.body).text('Use a bead or token to mark products on the grid.',MARGIN,y+5,{width:CONTENT_W});
  y+=30;
  const cs=Math.min((CONTENT_W-30)/11,45);
  const ox=MARGIN+15;
  // Header row
  doc.fillColor(COLORS.accent).font('Helvetica-Bold').fontSize(10).text('×',ox,y+cs/2-5,{width:cs,align:'center'});
  for(let c=1;c<=10;c++){
    const x=ox+c*cs;
    doc.rect(x,y,cs,cs).fillColor('#F5EDE0').fill().strokeColor(COLORS.border).lineWidth(0.5).stroke();
    doc.fillColor(COLORS.text).font('Helvetica-Bold').fontSize(10).text(String(c),x,y+cs/2-5,{width:cs,align:'center'});
  }
  y+=cs;
  for(let r=1;r<=10;r++){
    doc.rect(ox,y,cs,cs).fillColor('#F5EDE0').fill().strokeColor(COLORS.border).lineWidth(0.5).stroke();
    doc.fillColor(COLORS.text).font('Helvetica-Bold').fontSize(10).text(String(r),ox,y+cs/2-5,{width:cs,align:'center'});
    for(let c=1;c<=10;c++){
      const x=ox+c*cs;
      doc.rect(x,y,cs,cs).strokeColor(COLORS.border).lineWidth(0.3).stroke();
      doc.fillColor('#E0D8CC').font('Helvetica').fontSize(8).text(String(r*c),x,y+cs/2-4,{width:cs,align:'center'});
    }
    y+=cs;
  }
  drawFooter(doc,'Multiplication board — find products at row/column intersections');
  // Recording sheet
  doc.addPage();
  y = drawHeader(doc,'Multiplication Recording Sheet','Write your multiplication facts here','Base Sheet');
  y+=10;
  for(let table=2;table<=10;table++){
    if(y>PAGE_HEIGHT-100){doc.addPage();y=drawHeader(doc,'Recording Sheet (cont.)','','Base Sheet');y+=10;}
    doc.fillColor(COLORS.bead[table]).font('Helvetica-Bold').fontSize(FONT.body).text(`${table}× Table:`,MARGIN,y);y+=16;
    let line='';
    for(let i=1;i<=10;i++)line+=`${table}×${i}=___ `;
    doc.fillColor(COLORS.text).font('Helvetica').fontSize(FONT.small).text(line.trim(),MARGIN+10,y,{width:CONTENT_W-20});
    y+=20;
  }
  drawFooter(doc,'Fill in products — self-check with multiplication board');
  const fp=path.join(dir,'operation-board.pdf');
  await savePdf(doc,fp);
  return [fp];
}

async function generateClockFace(dir) {
  const doc = newDoc('Clock Face','Math');
  let y = drawHeader(doc,'Clock Face with Moveable Hands','Cut out hands and attach with brad/split pin','Cut-Outs');
  y+=10;
  // Large clock
  const cx=PAGE_WIDTH/2,cy=y+180,cr=160;
  doc.circle(cx,cy,cr).strokeColor(COLORS.text).lineWidth(2).stroke();
  doc.circle(cx,cy,cr-5).strokeColor(COLORS.border).lineWidth(0.5).stroke();
  // Hour numbers
  for(let h=1;h<=12;h++){
    const a=(h/12)*Math.PI*2-Math.PI/2;
    const nx=cx+Math.cos(a)*(cr-25),ny=cy+Math.sin(a)*(cr-25);
    doc.fillColor(COLORS.text).font('Helvetica-Bold').fontSize(20).text(String(h),nx-12,ny-10,{width:24,align:'center'});
  }
  // Minute marks
  for(let m=0;m<60;m++){
    const a=(m/60)*Math.PI*2-Math.PI/2;
    const inner=m%5===0?cr-40:cr-12;
    const x1=cx+Math.cos(a)*inner,y1=cy+Math.sin(a)*inner;
    const x2=cx+Math.cos(a)*(cr-8),y2=cy+Math.sin(a)*(cr-8);
    doc.moveTo(x1,y1).lineTo(x2,y2).strokeColor(COLORS.text).lineWidth(m%5===0?1.5:0.5).stroke();
  }
  // Center dot
  doc.circle(cx,cy,4).fillColor(COLORS.text).fill();
  y=cy+cr+20;
  // Cut-out hands
  doc.fillColor(COLORS.accent).font('Helvetica-Bold').fontSize(FONT.body).text('Cut-Out Hands (attach with brad at center dot):',MARGIN,y);y+=20;
  // Hour hand
  drawCutLine(doc,MARGIN+50,y,150,30);
  doc.rect(MARGIN+55,y+8,140,14).fillColor('#2C2C2C').fill();
  doc.fillColor(COLORS.text).font('Helvetica').fontSize(FONT.small).text('HOUR',MARGIN+55,y+9,{width:140,align:'center'});
  y+=45;
  // Minute hand
  drawCutLine(doc,MARGIN+30,y,190,25);
  doc.rect(MARGIN+35,y+6,180,13).fillColor('#666666').fill();
  doc.fillColor('#FFF').font('Helvetica').fontSize(FONT.small).text('MINUTE',MARGIN+35,y+7,{width:180,align:'center'});
  drawFooter(doc,'Cut hands, attach at center with brad/split pin');
  // Page 2: Practice clocks
  doc.addPage();
  y = drawHeader(doc,'Practice Clocks','Write the time shown or draw hands for given time','Base Sheet');
  y+=10;
  const pcr=60,pcc=4,pcRows=2;
  for(let r=0;r<pcRows;r++){
    for(let c=0;c<pcc;c++){
      const px=MARGIN+c*(pcr*2+30)+pcr+15;
      const py=y+r*(pcr*2+50)+pcr;
      doc.circle(px,py,pcr).strokeColor(COLORS.text).lineWidth(1).stroke();
      for(let h=1;h<=12;h++){
        const a=(h/12)*Math.PI*2-Math.PI/2;
        const nx=px+Math.cos(a)*(pcr-12),ny=py+Math.sin(a)*(pcr-12);
        doc.fillColor(COLORS.text).font('Helvetica-Bold').fontSize(10).text(String(h),nx-6,ny-5,{width:12,align:'center'});
      }
      doc.circle(px,py,2).fillColor(COLORS.text).fill();
      // Write line below
      doc.fillColor(COLORS.textLight).font('Helvetica').fontSize(FONT.small).text('Time: ________',px-pcr,py+pcr+5,{width:pcr*2,align:'center'});
    }
  }
  drawFooter(doc,'Practice clocks — draw hands or write the time');
  const fp=path.join(dir,'clock-face.pdf');
  await savePdf(doc,fp);
  return [fp];
}

async function generateSpindleBox(dir) {
  const doc = newDoc('Spindle Box','Math');
  let y = drawHeader(doc,'Spindle Box','Compartments 0-9 for counting practice','Base Sheet');
  doc.fillColor(COLORS.textLight).font('Helvetica').fontSize(FONT.body).text('Place the correct number of objects (sticks, straws, pencils) in each compartment.',MARGIN,y+5,{width:CONTENT_W});
  y+=35;
  const cw=CONTENT_W/5-4,ch=110;
  for(let d=0;d<=9;d++){
    const c=d%5,r=Math.floor(d/5);
    const x=MARGIN+c*(cw+4),yy=y+r*(ch+15);
    doc.rect(x,yy,cw,ch).strokeColor(COLORS.text).lineWidth(1.5).stroke();
    doc.fillColor(COLORS.units).font('Helvetica-Bold').fontSize(30).text(String(d),x,yy+5,{width:cw,align:'center'});
    // Dot pattern showing quantity
    const dotR=4,dotY=yy+50;
    const dotsPerRow=Math.min(d,5);
    const rows=Math.ceil(d/5);
    for(let i=0;i<d;i++){
      const dc=i%5,dr=Math.floor(i/5);
      doc.circle(x+cw/2+(dc-Math.min(d-1,4)/2)*12,dotY+dr*12,dotR).fillColor('#E0D0C0').fill();
    }
  }
  drawFooter(doc,'Spindle Box — count objects into each compartment');
  const fp=path.join(dir,'spindle-box.pdf');
  await savePdf(doc,fp);
  return [fp];
}

// ── LANGUAGE GENERATORS ──

async function generateLetterCards(dir) {
  const vowels = new Set(['a','e','i','o','u']);
  const doc = newDoc('Letter Cards','Language');
  let y = drawHeader(doc,'Moveable Alphabet Letter Cards','Vowels (pink) / Consonants (blue) — Montessori standard','Cut-Outs');
  doc.fillColor(COLORS.textLight).font('Helvetica').fontSize(FONT.body).text('Cut along dashed lines. Multiple copies of common letters included.',MARGIN,y+5,{width:CONTENT_W});
  y+=35;
  // Full alphabet with frequency-based multiples
  const freq={a:5,e:5,i:4,o:4,u:3,s:3,t:3,r:3,n:3,l:2,c:2,d:2,m:2,p:2,b:1,f:1,g:1,h:1,j:1,k:1,q:1,v:1,w:1,x:1,y:1,z:1};
  const letters=[];
  for(const[l,ct]of Object.entries(freq))for(let i=0;i<ct;i++)letters.push(l);
  const cw=52,ch=62,cols=Math.floor(CONTENT_W/(cw+6));
  for(let i=0;i<letters.length;i++){
    const c=i%cols,r=Math.floor(i/cols);
    const x=MARGIN+c*(cw+6),yy=y+r*(ch+6);
    if(yy+ch>PAGE_HEIGHT-50){doc.addPage();y=drawHeader(doc,'Letter Cards (cont.)','','Cut-Outs');y+=10;i--;continue;}
    drawCutLine(doc,x,yy,cw,ch);
    const isV=vowels.has(letters[i]);
    const color=isV?COLORS.vowel:COLORS.consonant;
    doc.roundedRect(x+3,yy+3,cw-6,ch-18,3).fillColor(color+'15').fill();
    doc.fillColor(color).font('Helvetica-Bold').fontSize(28).text(letters[i],x,yy+8,{width:cw,align:'center'});
    doc.fillColor(color).font('Helvetica').fontSize(FONT.small).text(letters[i].toUpperCase(),x,yy+ch-16,{width:cw,align:'center'});
  }
  drawFooter(doc,'Pink=vowels, Blue=consonants — print on cardstock');
  const fp1=path.join(dir,'letter-cards.pdf');
  await savePdf(doc,fp1);

  // Phonogram cards
  const doc2 = newDoc('Phonogram Cards','Language');
  y = drawHeader(doc2,'Phonogram Cards','Double-letter sounds: sh, ch, th, ck, etc.','Cut-Outs');
  doc2.fillColor(COLORS.textLight).font('Helvetica').fontSize(FONT.body).text('Cut along dashed lines. Green background = phonograms (Montessori standard).',MARGIN,y+5,{width:CONTENT_W});
  y+=35;
  const phonograms=['sh','ch','th','ck','qu','ee','oo','ai','oa','ie','ou','ow','ar','or','er','ir','ur','aw','oi','oy','ng','nk','wh','ph'];
  const pw=65,ph2=55;
  const pcols=Math.floor(CONTENT_W/(pw+8));
  for(let i=0;i<phonograms.length;i++){
    const c=i%pcols,r=Math.floor(i/pcols);
    const x=MARGIN+c*(pw+8),yy=y+r*(ph2+8);
    if(yy+ph2>PAGE_HEIGHT-50){doc2.addPage();y=drawHeader(doc2,'Phonogram Cards (cont.)','','Cut-Outs');y+=10;i--;continue;}
    drawCutLine(doc2,x,yy,pw,ph2);
    doc2.roundedRect(x+3,yy+3,pw-6,ph2-6,3).fillColor('#339933'+'20').fill();
    doc2.fillColor('#339933').font('Helvetica-Bold').fontSize(24).text(phonograms[i],x,yy+12,{width:pw,align:'center'});
  }
  drawFooter(doc2,'Phonogram cards — green = digraphs/blends');
  const fp2=path.join(dir,'phonogram-cards.pdf');
  await savePdf(doc2,fp2);
  return [fp1,fp2];
}

async function generateWordCards(dir) {
  const doc = newDoc('Word Cards','Language');
  const sets=[
    {title:'CVC Words (Set 1)',words:['cat','hat','bat','mat','sat','rat','can','fan','man','pan','ran','van','cap','map','nap','tap','bag','rag','tag','wag','dam','ham','jam','yam','bad','dad','had','mad','sad','pad']},
    {title:'CVC Words (Set 2)',words:['bed','fed','led','red','hen','men','pen','ten','bet','get','jet','met','net','pet','set','wet','beg','leg','peg','big','dig','fig','jig','pig','wig','bin','din','fin','pin','tin']},
    {title:'Phonogram Words',words:['ship','chip','thin','that','this','shop','chat','chop','shed','them','then','when','what','whip','much','such','rich','each','fish','dish','wish','rush','bush','push']},
    {title:'Blend Words',words:['stop','step','skip','spin','snap','snip','swim','sled','slip','flag','flat','flap','grab','grip','grin','drop','drum','draw','trip','trap','tram','clip','clap','crab','frog','from','free','tree','prop','pram']},
    {title:'Sight Words',words:['the','and','was','are','you','his','her','they','have','said','come','some','what','when','were','there','their','would','could','should']},
  ];
  let pageNum=0;
  for(const set of sets){
    if(pageNum>0)doc.addPage();
    pageNum++;
    let y=drawHeader(doc,set.title,`${set.words.length} word cards`,'Cut-Outs');
    y+=10;
    const ww=85,wh=40,wcols=Math.floor(CONTENT_W/(ww+6));
    for(let i=0;i<set.words.length;i++){
      const c=i%wcols,r=Math.floor(i/wcols);
      const x=MARGIN+c*(ww+6),yy=y+r*(wh+6);
      if(yy+wh>PAGE_HEIGHT-50){doc.addPage();y=drawHeader(doc,set.title+' (cont.)','','Cut-Outs');y+=10;i--;continue;}
      drawCutLine(doc,x,yy,ww,wh);
      doc.fillColor(COLORS.text).font('Helvetica-Bold').fontSize(FONT.label).text(set.words[i],x,yy+10,{width:ww,align:'center'});
    }
    drawFooter(doc,`Word cards — ${set.title}`);
  }
  const fp=path.join(dir,'word-cards.pdf');
  await savePdf(doc,fp);
  return [fp];
}

async function generateHandwritingPractice(dir) {
  const doc = newDoc('Handwriting Practice','Language');
  // Page 1: Letter formation
  let y = drawHeader(doc,'Letter Formation Guide','Montessori-style letter models with guidelines','Base Sheet');
  y+=10;
  const lh=35,cols2=13;
  // Draw 4-line guides
  function draw4Lines(doc,startY,count){
    for(let i=0;i<count;i++){
      const ly=startY+i*lh;
      doc.moveTo(MARGIN,ly).lineTo(MARGIN+CONTENT_W,ly).strokeColor('#D4C5A9').lineWidth(0.5).stroke();
      doc.moveTo(MARGIN,ly+lh*0.25).lineTo(MARGIN+CONTENT_W,ly+lh*0.25).strokeColor('#E8E0D4').lineWidth(0.3).stroke(); // dotted midline
      doc.moveTo(MARGIN,ly+lh*0.5).lineTo(MARGIN+CONTENT_W,ly+lh*0.5).dash(2,{space:2}).strokeColor('#CC3333').lineWidth(0.5).stroke().undash();
      doc.moveTo(MARGIN,ly+lh*0.75).lineTo(MARGIN+CONTENT_W,ly+lh*0.75).strokeColor('#E8E0D4').lineWidth(0.3).stroke();
    }
  }
  doc.fillColor(COLORS.text).font('Helvetica').fontSize(FONT.body).text('Trace each letter. Red dashed line = middle. Write letters between the solid lines.',MARGIN,y,{width:CONTENT_W});
  y+=25;
  // Model letters row
  const alphabet='abcdefghijklmnopqrstuvwxyz';
  const cellW=CONTENT_W/13;
  for(let i=0;i<26;i++){
    const c=i%13,r=Math.floor(i/13);
    const x=MARGIN+c*cellW,yy=y+r*(lh+15);
    doc.fillColor('#E0D0C0').font('Helvetica').fontSize(22).text(alphabet[i],x+cellW/2-7,yy+3);
  }
  y+=2*(lh+15)+10;
  // Practice lines
  doc.fillColor(COLORS.accent).font('Helvetica-Bold').fontSize(FONT.body).text('Practice Lines:',MARGIN,y);y+=18;
  draw4Lines(doc,y,Math.floor((PAGE_HEIGHT-y-40)/lh));
  drawFooter(doc,'Handwriting practice — letter formation');

  // Page 2: CVC word practice
  doc.addPage();
  y = drawHeader(doc,'CVC Word Writing Practice','Write each word on the line','Base Sheet');
  y+=10;
  const words=['cat','dog','sun','hat','bug','red','big','run','sit','hop'];
  for(const w of words){
    doc.fillColor(COLORS.text).font('Helvetica-Bold').fontSize(FONT.label).text(w,MARGIN+10,y);
    doc.moveTo(MARGIN+80,y+18).lineTo(MARGIN+CONTENT_W-20,y+18).strokeColor(COLORS.border).lineWidth(0.5).stroke();
    y+=30;
  }
  drawFooter(doc,'CVC word practice — copy each word');

  // Page 3: Sentence writing
  doc.addPage();
  y = drawHeader(doc,'Sentence Writing Practice','Write sentences on the ruled lines','Base Sheet');
  y+=10;
  doc.fillColor(COLORS.text).font('Helvetica').fontSize(FONT.body).text('Copy each sentence, then write your own:',MARGIN,y,{width:CONTENT_W});y+=22;
  const sentences=['The cat sat on the mat.','I can see the big red sun.','My dog can run and jump.'];
  for(const s of sentences){
    doc.fillColor(COLORS.accent).font('Helvetica').fontSize(FONT.body).text(s,MARGIN+10,y);y+=18;
    draw4Lines(doc,y,2);y+=2*lh+10;
  }
  doc.fillColor(COLORS.accent).font('Helvetica-Bold').fontSize(FONT.body).text('Now write your own sentences:',MARGIN,y);y+=18;
  draw4Lines(doc,y,Math.floor((PAGE_HEIGHT-y-40)/lh));
  drawFooter(doc,'Sentence writing — ruled lines');
  const fp=path.join(dir,'handwriting-practice.pdf');
  await savePdf(doc,fp);
  return [fp];
}

async function generateGrammarSymbols(dir) {
  const doc = newDoc('Grammar Symbols','Language');
  let y = drawHeader(doc,'Montessori Grammar Symbols','Cut-out symbols for sentence analysis','Cut-Outs');
  doc.fillColor(COLORS.textLight).font('Helvetica').fontSize(FONT.body).text('Cut symbols. Place above words in sentences to identify parts of speech.',MARGIN,y+5,{width:CONTENT_W});
  y+=35;
  const symbols=[
    {name:'Noun',shape:'triangle',color:'#2C2C2C',size:50,desc:'Person, place, or thing'},
    {name:'Article',shape:'triangle',color:'#87CEEB',size:35,desc:'a, an, the'},
    {name:'Adjective',shape:'triangle',color:'#191970',size:42,desc:'Describes a noun'},
    {name:'Verb',shape:'circle',color:'#CC3333',size:45,desc:'Action or state of being'},
    {name:'Adverb',shape:'circle',color:'#E8943A',size:35,desc:'Describes a verb'},
    {name:'Preposition',shape:'crescent',color:'#FF69B4',size:40,desc:'Shows position/relationship'},
  ];
  const symCols=3,symW=CONTENT_W/symCols;
  for(let i=0;i<symbols.length;i++){
    const c=i%symCols,r=Math.floor(i/symCols);
    const cx=MARGIN+c*symW+symW/2;
    const sy=y+r*140;
    const s=symbols[i];
    drawCutLine(doc,MARGIN+c*symW+10,sy,symW-20,120);
    // Draw shape
    const shapeY=sy+45;
    if(s.shape==='triangle'){
      doc.save();
      const h=s.size*0.866;
      doc.moveTo(cx,shapeY-h/2).lineTo(cx-s.size/2,shapeY+h/2).lineTo(cx+s.size/2,shapeY+h/2).closePath().fillColor(s.color).fill();
      doc.restore();
    } else if(s.shape==='circle'){
      doc.circle(cx,shapeY,s.size/2).fillColor(s.color).fill();
    } else { // crescent
      doc.save();
      doc.circle(cx-5,shapeY,s.size/2).fillColor(s.color).fill();
      doc.circle(cx+8,shapeY,s.size/2-5).fillColor('#FFFFFF').fill();
      doc.restore();
    }
    doc.fillColor(COLORS.text).font('Helvetica-Bold').fontSize(FONT.body).text(s.name,MARGIN+c*symW+10,sy+80,{width:symW-20,align:'center'});
    doc.fillColor(COLORS.textLight).font('Helvetica').fontSize(FONT.small).text(s.desc,MARGIN+c*symW+10,sy+98,{width:symW-20,align:'center'});
  }
  y+=2*140+10;
  // Key
  if(y>PAGE_HEIGHT-80){doc.addPage();y=MARGIN+10;}
  doc.fillColor(COLORS.accent).font('Helvetica-Bold').fontSize(FONT.body).text('Symbol Key:',MARGIN,y);y+=16;
  doc.fillColor(COLORS.text).font('Helvetica').fontSize(FONT.small)
    .text('Large black triangle = Noun | Small light blue triangle = Article | Medium dark blue triangle = Adjective',MARGIN+10,y,{width:CONTENT_W-20});y+=14;
  doc.text('Large red circle = Verb | Small orange circle = Adverb | Pink crescent = Preposition',MARGIN+10,y,{width:CONTENT_W-20});
  drawFooter(doc,'Grammar symbols — cut and place above words');
  // Page 2: Sentence strips
  doc.addPage();
  y = drawHeader(doc,'Sentence Strips for Analysis','Place grammar symbols above each word','Base Sheet');
  y+=10;
  const sentences2=['The big dog ran fast.','A red ball is on the table.','She quickly ate the warm soup.','The small cat sat under a tree.','My new friend plays with the ball.','A tall boy ran to the old house.','The happy bird sang a pretty song.','He slowly walked across the long bridge.','A bright star shines in the dark sky.','The little fish swam through the deep water.'];
  for(const s of sentences2){
    if(y>PAGE_HEIGHT-60){doc.addPage();y=drawHeader(doc,'Sentence Strips (cont.)','','Base Sheet');y+=10;}
    // Symbol space above
    doc.rect(MARGIN,y,CONTENT_W,25).strokeColor('#E8E0D4').lineWidth(0.3).stroke();
    doc.fillColor('#F5F0E8').font('Helvetica').fontSize(7).text('(place symbols here)',MARGIN+5,y+8);
    y+=25;
    // Sentence
    doc.rect(MARGIN,y,CONTENT_W,28).strokeColor(COLORS.border).lineWidth(0.5).stroke();
    doc.fillColor(COLORS.text).font('Helvetica').fontSize(FONT.body).text(s,MARGIN+10,y+6,{width:CONTENT_W-20});
    y+=38;
  }
  drawFooter(doc,'Place grammar symbol cards above each word');
  const fp=path.join(dir,'grammar-symbols.pdf');
  await savePdf(doc,fp);
  return [fp];
}

async function generatePhonemicAwareness(dir) {
  const doc = newDoc('Phonemic Awareness','Language');
  const sounds=['s','m','a','t','p','r','i','o'];
  let pageNum=0;
  for(let si=0;si<sounds.length;si+=2){
    if(pageNum>0)doc.addPage();
    pageNum++;
    let y = drawHeader(doc,`I Spy Sound Mat: "${sounds[si]}" and "${sounds[si+1]}"`,`Find objects that start with the "${sounds[si]}" or "${sounds[si+1]}" sound`,'Base Sheet');
    y+=10;
    for(let j=0;j<2;j++){
      const snd=sounds[si+j];
      doc.fillColor(COLORS.accent).font('Helvetica-Bold').fontSize(FONT.label).text(`"${snd}" — ${snd.toUpperCase()}${snd}`,MARGIN+10,y);y+=22;
      // Sorting mat with boxes
      const boxW=CONTENT_W/3-10,boxH=80;
      for(let b=0;b<3;b++){
        const x=MARGIN+b*(boxW+10);
        doc.roundedRect(x,y,boxW,boxH,6).strokeColor(COLORS.border).lineWidth(1).stroke();
        doc.fillColor('#E8E0D4').font('Helvetica').fontSize(FONT.small).text(`"${snd}" word ${b+1}`,x+5,y+boxH/2-5,{width:boxW-10,align:'center'});
      }
      y+=boxH+20;
    }
    doc.fillColor(COLORS.textLight).font('Helvetica').fontSize(FONT.small).text('Draw or write objects you find that start with each sound in the boxes above.',MARGIN,y,{width:CONTENT_W});
    drawFooter(doc,'I Spy sound sorting mat — find objects that begin with each sound');
  }
  const fp=path.join(dir,'phonemic-awareness.pdf');
  await savePdf(doc,fp);
  return [fp];
}

async function generateWritingTemplates(dir) {
  const doc = newDoc('Writing Templates','Language');
  // Five senses chart
  let y = drawHeader(doc,'Five Senses Chart','Record what you observe with each sense','Base Sheet');
  y+=10;
  const senses=['See','Hear','Touch','Smell','Taste'];
  const icons=['eye','ear','hand','nose','mouth'];
  const colW=CONTENT_W/5;
  // Headers
  for(let i=0;i<5;i++){
    const x=MARGIN+i*colW;
    doc.rect(x,y,colW-2,35).fillColor(['#4A90D9','#9370DB','#339933','#E8943A','#CC3333'][i]).fill();
    doc.fillColor('#FFF').font('Helvetica-Bold').fontSize(FONT.body).text(senses[i],x,y+10,{width:colW-2,align:'center'});
  }
  y+=35;
  // Lined cells for writing
  const cellH=180;
  for(let i=0;i<5;i++){
    const x=MARGIN+i*colW;
    doc.rect(x,y,colW-2,cellH).strokeColor(COLORS.border).lineWidth(0.5).stroke();
    // Lines inside
    for(let l=1;l<9;l++){
      doc.moveTo(x+3,y+l*20).lineTo(x+colW-5,y+l*20).strokeColor('#E8E0D4').lineWidth(0.3).stroke();
    }
  }
  drawFooter(doc,'Five Senses Chart — record observations');
  // Story planner
  doc.addPage();
  y = drawHeader(doc,'Story Planning Organizer','Plan your story before writing','Base Sheet');
  y+=10;
  const sections2=[
    {label:'Title:',h:35},{label:'Characters (Who?):',h:60},{label:'Setting (Where/When?):',h:60},
    {label:'Beginning:',h:80},{label:'Middle:',h:80},{label:'End:',h:80},
  ];
  for(const s of sections2){
    doc.fillColor(COLORS.accent).font('Helvetica-Bold').fontSize(FONT.body).text(s.label,MARGIN+10,y);y+=18;
    doc.roundedRect(MARGIN+10,y,CONTENT_W-20,s.h,4).strokeColor(COLORS.border).lineWidth(0.5).stroke();
    for(let l=1;l<Math.floor(s.h/18);l++){
      doc.moveTo(MARGIN+15,y+l*18).lineTo(MARGIN+CONTENT_W-15,y+l*18).strokeColor('#E8E0D4').lineWidth(0.3).stroke();
    }
    y+=s.h+10;
    if(y>PAGE_HEIGHT-60){doc.addPage();y=drawHeader(doc,'Story Planner (cont.)','','Base Sheet');y+=10;}
  }
  drawFooter(doc,'Story planning organizer');
  // Book report template
  doc.addPage();
  y = drawHeader(doc,'My Book Report','Fill in after reading a book','Base Sheet');
  y+=10;
  const fields=['Book Title:','Author:','Main Character:','Setting:','What happened in the story:','My favorite part:','I would give this book ___ out of 5 stars because:'];
  for(const f of fields){
    doc.fillColor(COLORS.accent).font('Helvetica-Bold').fontSize(FONT.body).text(f,MARGIN+10,y);y+=18;
    const h=f.includes('happened')||f.includes('because')?80:35;
    doc.roundedRect(MARGIN+10,y,CONTENT_W-20,h,4).strokeColor(COLORS.border).lineWidth(0.5).stroke();
    for(let l=1;l<Math.floor(h/18);l++){
      doc.moveTo(MARGIN+15,y+l*18).lineTo(MARGIN+CONTENT_W-15,y+l*18).strokeColor('#E8E0D4').lineWidth(0.3).stroke();
    }
    y+=h+12;
    if(y>PAGE_HEIGHT-60){doc.addPage();y=drawHeader(doc,'Book Report (cont.)','','Base Sheet');y+=10;}
  }
  drawFooter(doc,'Book report template');
  // Letter writing
  doc.addPage();
  y = drawHeader(doc,'Letter Writing Template','Write a friendly letter','Base Sheet');
  y+=10;
  const parts=['Date: ____________','Dear ____________,','','(Write your letter here)','','','','','','','','Your friend,','____________'];
  for(const p of parts){
    if(p===''){
      doc.moveTo(MARGIN+20,y).lineTo(MARGIN+CONTENT_W-20,y).strokeColor('#E8E0D4').lineWidth(0.3).stroke();
      y+=20;
    } else {
      doc.fillColor(COLORS.text).font('Helvetica').fontSize(FONT.body).text(p,MARGIN+20,y,{width:CONTENT_W-40});
      y+=20;
    }
  }
  drawFooter(doc,'Friendly letter template');
  const fp=path.join(dir,'writing-templates.pdf');
  await savePdf(doc,fp);
  return [fp];
}

async function generateReadingPractice(dir) {
  const doc = newDoc('Reading Practice','Language');
  // CVC word lists by vowel
  let y = drawHeader(doc,'CVC Word Lists by Vowel','Read across each row','Base Sheet');
  y+=10;
  const vowelWords={
    'Short A':['bat','cat','hat','mat','rat','sat','bag','rag','tag','can','fan','man','pan','ran','cap','map','nap','tap'],
    'Short E':['bed','fed','red','hen','men','pen','ten','bet','get','jet','met','net','pet','set','wet','beg','leg','peg'],
    'Short I':['big','dig','fig','pig','wig','bin','din','fin','pin','tin','win','bit','fit','hit','kit','lit','sit','dip','hip','lip','rip','sip','tip','zip'],
    'Short O':['bog','dog','fog','hog','jog','log','cob','job','mob','rob','cot','dot','got','hot','lot','not','pot','box','fox'],
    'Short U':['bug','dug','hug','jug','mug','rug','tug','bud','mud','bun','fun','gun','nun','run','sun','bus','cup','cut','but','gut','hut','nut','put'],
  };
  for(const[label,words]of Object.entries(vowelWords)){
    if(y>PAGE_HEIGHT-80){doc.addPage();y=drawHeader(doc,'CVC Words (cont.)','','Base Sheet');y+=10;}
    doc.fillColor(COLORS.vowel).font('Helvetica-Bold').fontSize(FONT.body).text(label+':',MARGIN,y);y+=16;
    doc.fillColor(COLORS.text).font('Helvetica').fontSize(FONT.body).text(words.join('   '),MARGIN+10,y,{width:CONTENT_W-20});
    y+=Math.ceil(words.length/8)*18+10;
  }
  drawFooter(doc,'CVC word lists — read aloud for fluency practice');
  // Phonetic sentences
  doc.addPage();
  y = drawHeader(doc,'Phonetic Reading Sentences','Progressive difficulty — read aloud','Base Sheet');
  y+=10;
  const sentenceSets=[
    {level:'Level 1 (CVC)',items:['The cat sat.','A big red hen.','The dog ran fast.','I can see the sun.','The bug is on the rug.']},
    {level:'Level 2 (Blends)',items:['The frog can swim and jump.','She has a pretty dress.','The clock struck twelve.','Stop and smell the fresh bread.','The small snail crept up the tree.']},
    {level:'Level 3 (Phonograms)',items:['The ship sailed through the night.','She found a bright shiny shell.','The children played in the thick snow.','Each bird sang a cheerful song at dawn.','The knight fought bravely through the storm.']},
  ];
  for(const set of sentenceSets){
    doc.fillColor(COLORS.accent).font('Helvetica-Bold').fontSize(FONT.body).text(set.level,MARGIN,y);y+=18;
    for(const s of set.items){
      doc.fillColor(COLORS.text).font('Helvetica').fontSize(FONT.label).text(s,MARGIN+15,y,{width:CONTENT_W-30});
      y+=28;
    }
    y+=10;
  }
  drawFooter(doc,'Phonetic reading sentences — progressive difficulty');
  const fp=path.join(dir,'reading-practice.pdf');
  await savePdf(doc,fp);
  return [fp];
}

async function generateEssayTemplates(dir) {
  const doc = newDoc('Essay Templates','Language');
  // Paragraph organizer
  let y = drawHeader(doc,'Paragraph Organizer','Plan before you write','Base Sheet');
  y+=10;
  doc.fillColor(COLORS.accent).font('Helvetica-Bold').fontSize(FONT.body).text('Topic:',MARGIN+10,y);
  doc.roundedRect(MARGIN+70,y-3,CONTENT_W-80,22,3).strokeColor(COLORS.border).lineWidth(0.5).stroke();y+=30;
  const paras=['Topic Sentence (main idea):','Detail 1 (supporting evidence):','Detail 2 (supporting evidence):','Detail 3 (supporting evidence):','Conclusion (restate + so what?):'];
  for(const p of paras){
    doc.fillColor(COLORS.accent).font('Helvetica-Bold').fontSize(FONT.body).text(p,MARGIN+10,y);y+=18;
    doc.roundedRect(MARGIN+10,y,CONTENT_W-20,55,4).strokeColor(COLORS.border).lineWidth(0.5).stroke();
    for(let l=1;l<3;l++)doc.moveTo(MARGIN+15,y+l*18).lineTo(MARGIN+CONTENT_W-15,y+l*18).strokeColor('#E8E0D4').lineWidth(0.3).stroke();
    y+=65;
  }
  drawFooter(doc,'Paragraph organizer');
  // 5-paragraph essay outline
  doc.addPage();
  y = drawHeader(doc,'Five-Paragraph Essay Outline','Structure your argument','Base Sheet');
  y+=10;
  const essayParts=['I. Introduction (hook + thesis):','II. Body Paragraph 1 (strongest point):','III. Body Paragraph 2 (supporting point):','IV. Body Paragraph 3 (additional evidence):','V. Conclusion (restate thesis + call to action):'];
  for(const p of essayParts){
    doc.fillColor(COLORS.accent).font('Helvetica-Bold').fontSize(FONT.body).text(p,MARGIN+10,y);y+=18;
    doc.roundedRect(MARGIN+10,y,CONTENT_W-20,80,4).strokeColor(COLORS.border).lineWidth(0.5).stroke();
    for(let l=1;l<4;l++)doc.moveTo(MARGIN+15,y+l*18).lineTo(MARGIN+CONTENT_W-15,y+l*18).strokeColor('#E8E0D4').lineWidth(0.3).stroke();
    y+=90;
    if(y>PAGE_HEIGHT-100){doc.addPage();y=drawHeader(doc,'Essay Outline (cont.)','','Base Sheet');y+=10;}
  }
  drawFooter(doc,'Five-paragraph essay outline');
  // Research notes
  doc.addPage();
  y = drawHeader(doc,'Research Notes Template','Organize your research findings','Base Sheet');
  y+=10;
  doc.fillColor(COLORS.accent).font('Helvetica-Bold').fontSize(FONT.body).text('Research Topic:',MARGIN+10,y);
  doc.roundedRect(MARGIN+130,y-3,CONTENT_W-140,22,3).strokeColor(COLORS.border).lineWidth(0.5).stroke();y+=35;
  for(let src=1;src<=3;src++){
    doc.fillColor(COLORS.accent).font('Helvetica-Bold').fontSize(FONT.body).text(`Source ${src}:`,MARGIN+10,y);
    doc.roundedRect(MARGIN+80,y-3,CONTENT_W-90,22,3).strokeColor(COLORS.border).lineWidth(0.5).stroke();y+=28;
    doc.fillColor(COLORS.textLight).font('Helvetica').fontSize(FONT.small).text('Key facts from this source:',MARGIN+20,y);y+=16;
    for(let l=0;l<4;l++){
      doc.fillColor(COLORS.text).font('Helvetica').fontSize(FONT.small).text(`${l+1}.`,MARGIN+25,y);
      doc.moveTo(MARGIN+40,y+12).lineTo(MARGIN+CONTENT_W-20,y+12).strokeColor('#E8E0D4').lineWidth(0.3).stroke();
      y+=20;
    }
    y+=10;
  }
  drawFooter(doc,'Research notes template');
  const fp=path.join(dir,'essay-templates.pdf');
  await savePdf(doc,fp);
  return [fp];
}

// ── SENSORIAL GENERATORS ──

async function generateColorTablets(dir) {
  const doc = newDoc('Color Tablets','Sensorial');
  let y = drawHeader(doc,'Color Tablets — Matching Pairs','Box 1 (primary) + Box 2 (secondary) + Box 3 (grading)','Cut-Outs');
  doc.fillColor(COLORS.textLight).font('Helvetica').fontSize(FONT.body).text('Cut cards. Match each color to its pair. Two cards per color.',MARGIN,y+5,{width:CONTENT_W});
  y+=35;
  const allColors=[
    {name:'Red',hex:'#CC3333'},{name:'Yellow',hex:'#DAA520'},{name:'Blue',hex:'#3366CC'},
    {name:'Orange',hex:'#E8943A'},{name:'Green',hex:'#339933'},{name:'Purple',hex:'#9370DB'},
    {name:'Pink',hex:'#FF69B4'},{name:'Brown',hex:'#8B4513'},{name:'Black',hex:'#2C2C2C'},
    {name:'White',hex:'#F5F5F5'},{name:'Gray',hex:'#999999'},
  ];
  const cw=75,ch=55,cols=Math.floor(CONTENT_W/(cw+8));
  const pairs=[];
  for(const c of allColors){pairs.push(c,c);}
  for(let i=0;i<pairs.length;i++){
    const c=i%cols,r=Math.floor(i/cols);
    const x=MARGIN+c*(cw+8),yy=y+r*(ch+8);
    if(yy+ch>PAGE_HEIGHT-50){doc.addPage();y=drawHeader(doc,'Color Tablets (cont.)','','Cut-Outs');y+=10;i--;continue;}
    drawCutLine(doc,x,yy,cw,ch);
    doc.roundedRect(x+6,yy+6,cw-12,ch-22,4).fillColor(pairs[i].hex).fill();
    if(pairs[i].hex==='#F5F5F5')doc.roundedRect(x+6,yy+6,cw-12,ch-22,4).strokeColor('#CCC').lineWidth(0.5).stroke();
    doc.fillColor(COLORS.text).font('Helvetica').fontSize(FONT.small).text(pairs[i].name,x,yy+ch-15,{width:cw,align:'center'});
  }
  drawFooter(doc,'Color tablets — find matching pairs');
  const fp=path.join(dir,'color-tablets.pdf');
  await savePdf(doc,fp);
  return [fp];
}

async function generateCylinderBlocks(dir) {
  const doc = newDoc('Cylinder Blocks','Sensorial');
  const blocks=[
    {name:'Block 1',desc:'Diameter varies (large to small), height constant',vary:'diameter'},
    {name:'Block 2',desc:'Height varies (tall to short), diameter constant',vary:'height'},
    {name:'Block 3',desc:'Both diameter and height vary (large/tall to small/short)',vary:'both'},
    {name:'Block 4',desc:'Diameter increases as height decreases',vary:'inverse'},
  ];
  for(let b=0;b<blocks.length;b++){
    if(b>0)doc.addPage();
    let y = drawHeader(doc,`Knobbed Cylinders — ${blocks[b].name}`,blocks[b].desc,'Base Sheet');
    y+=10;
    doc.fillColor(COLORS.textLight).font('Helvetica').fontSize(FONT.body).text('Match each cylinder to its hole. Order from left to right.',MARGIN,y,{width:CONTENT_W});
    y+=25;
    // Draw 10 holes
    const spacing=CONTENT_W/10;
    for(let i=0;i<10;i++){
      let d,h2;
      const t=(i+1)/10; // 0.1 to 1.0
      if(blocks[b].vary==='diameter'){d=15+t*30;h2=40;}
      else if(blocks[b].vary==='height'){d=25;h2=15+t*40;}
      else if(blocks[b].vary==='both'){d=15+t*30;h2=15+t*40;}
      else{d=15+(1-t)*30;h2=15+t*40;} // inverse
      const cx=MARGIN+i*spacing+spacing/2;
      doc.circle(cx,y+60,d/2).strokeColor(COLORS.text).lineWidth(1).stroke();
      doc.fillColor('#E8E0D4').font('Helvetica').fontSize(8).text(String(i+1),cx-6,y+58,{width:12,align:'center'});
    }
    y+=130;
    // Cut-out cylinders
    doc.fillColor(COLORS.accent).font('Helvetica-Bold').fontSize(FONT.body).text('Cut-Out Cylinders:',MARGIN,y);y+=20;
    for(let i=0;i<10;i++){
      let d;
      const t=(i+1)/10;
      if(blocks[b].vary==='diameter'||blocks[b].vary==='both')d=15+t*30;
      else if(blocks[b].vary==='inverse')d=15+(1-t)*30;
      else d=25;
      const cx=MARGIN+i*spacing+spacing/2;
      drawCutLine(doc,cx-d/2-3,y,d+6,d+6,d/2);
      doc.circle(cx,y+d/2+3,d/2).fillColor('#DEB887').fill();
      doc.circle(cx,y+d/2+3,3).fillColor('#8B7355').fill(); // knob
    }
    drawFooter(doc,`Cylinder ${blocks[b].name} — match cylinders to holes`);
  }
  const fp=path.join(dir,'cylinder-blocks.pdf');
  await savePdf(doc,fp);
  return [fp];
}

async function generateGeometryShapes(dir) {
  const doc = newDoc('Geometry Shapes','Sensorial');
  // Constructive triangles
  let y = drawHeader(doc,'Constructive Triangles','Cut triangles — combine to make new shapes','Cut-Outs');
  y+=10;
  doc.fillColor(COLORS.textLight).font('Helvetica').fontSize(FONT.body).text('Cut along dashed lines. Combine triangles to form rectangles, hexagons, and other shapes.',MARGIN,y,{width:CONTENT_W});
  y+=25;
  // 12 right triangles of various sizes
  const triSz=[60,60,60,60,80,80,80,80,100,100,100,100];
  const triColors=['#CC3333','#3366CC','#339933','#DAA520','#CC3333','#3366CC','#339933','#DAA520','#CC3333','#3366CC','#339933','#DAA520'];
  const tcols=4;
  for(let i=0;i<12;i++){
    const c=i%tcols,r=Math.floor(i/tcols);
    const s=triSz[i];
    const x=MARGIN+c*(CONTENT_W/tcols)+10,yy=y+r*(110);
    if(yy+s>PAGE_HEIGHT-50){doc.addPage();y=drawHeader(doc,'Constructive Triangles (cont.)','','Cut-Outs');y+=10;i--;continue;}
    doc.save();
    doc.moveTo(x,yy+s).lineTo(x+s,yy+s).lineTo(x,yy).closePath()
      .dash(4,{space:3}).strokeColor(COLORS.cutLine).lineWidth(1).stroke().undash();
    doc.moveTo(x,yy+s).lineTo(x+s,yy+s).lineTo(x,yy).closePath()
      .fillColor(triColors[i]).fillOpacity(0.25).fill().fillOpacity(1);
    doc.restore();
  }
  drawFooter(doc,'Constructive triangles — combine to make polygons');
  // Geometric cabinet shapes
  doc.addPage();
  y = drawHeader(doc,'Geometric Cabinet Shapes','Match each shape to its frame','Cut-Outs');
  y+=10;
  const shapes=[
    {name:'Circle',draw:(d,cx,cy,s)=>{d.circle(cx,cy,s/2);}},
    {name:'Square',draw:(d,cx,cy,s)=>{d.rect(cx-s/2,cy-s/2,s,s);}},
    {name:'Rectangle',draw:(d,cx,cy,s)=>{d.rect(cx-s/2,cy-s/3,s,s*2/3);}},
    {name:'Triangle',draw:(d,cx,cy,s)=>{d.moveTo(cx,cy-s/2).lineTo(cx-s/2,cy+s/2).lineTo(cx+s/2,cy+s/2).closePath();}},
    {name:'Pentagon',draw:(d,cx,cy,s)=>{const pts=[];for(let i=0;i<5;i++){const a=(i/5)*Math.PI*2-Math.PI/2;pts.push([cx+Math.cos(a)*s/2,cy+Math.sin(a)*s/2]);}d.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<5;i++)d.lineTo(pts[i][0],pts[i][1]);d.closePath();}},
    {name:'Hexagon',draw:(d,cx,cy,s)=>{const pts=[];for(let i=0;i<6;i++){const a=(i/6)*Math.PI*2-Math.PI/2;pts.push([cx+Math.cos(a)*s/2,cy+Math.sin(a)*s/2]);}d.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<6;i++)d.lineTo(pts[i][0],pts[i][1]);d.closePath();}},
    {name:'Oval',draw:(d,cx,cy,s)=>{d.ellipse(cx,cy,s/2,s/3);}},
    {name:'Trapezoid',draw:(d,cx,cy,s)=>{d.moveTo(cx-s/4,cy-s/3).lineTo(cx+s/4,cy-s/3).lineTo(cx+s/2,cy+s/3).lineTo(cx-s/2,cy+s/3).closePath();}},
  ];
  const scols=4,shSz=70;
  for(let i=0;i<shapes.length;i++){
    const c=i%scols,r=Math.floor(i/scols);
    const cx=MARGIN+c*(CONTENT_W/scols)+CONTENT_W/scols/2;
    const cy=y+r*120+50;
    if(cy+50>PAGE_HEIGHT-50){doc.addPage();y=drawHeader(doc,'Geometric Shapes (cont.)','','Cut-Outs');y+=10;i--;continue;}
    drawCutLine(doc,cx-shSz/2-10,cy-shSz/2-10,shSz+20,shSz+35);
    doc.save();
    shapes[i].draw(doc,cx,cy,shSz);
    doc.fillColor('#4A90D9'+'30').fill();
    shapes[i].draw(doc,cx,cy,shSz);
    doc.strokeColor(COLORS.text).lineWidth(1).stroke();
    doc.restore();
    doc.fillColor(COLORS.text).font('Helvetica').fontSize(FONT.small).text(shapes[i].name,cx-shSz/2-10,cy+shSz/2+5,{width:shSz+20,align:'center'});
  }
  drawFooter(doc,'Geometric shapes — cut and match to frames');
  const fp=path.join(dir,'geometry-shapes.pdf');
  await savePdf(doc,fp);
  return [fp];
}

async function generateGradedSeries(dir) {
  const doc = newDoc('Graded Series','Sensorial');
  const series=[
    {name:'Pink Tower',color:'#FFB6C1',dim:'size (cubes)'},
    {name:'Brown Stair',color:'#8B6914',dim:'width (prisms)'},
    {name:'Red Rods',color:'#CC3333',dim:'length (rods)'},
  ];
  for(let s=0;s<series.length;s++){
    if(s>0)doc.addPage();
    const sr=series[s];
    let y = drawHeader(doc,`${sr.name} — Cut-Out Pieces`,`Sort by ${sr.dim} from smallest to largest`,'Cut-Outs');
    y+=10;
    const maxW=CONTENT_W-60,unitH=38;
    for(let i=1;i<=10;i++){
      const w=(i/10)*maxW;
      drawCutLine(doc,MARGIN+20,y,w,unitH);
      doc.roundedRect(MARGIN+22,y+2,w-4,unitH-4,3).fillColor(sr.color).fill();
      doc.fillColor('#FFF').font('Helvetica-Bold').fontSize(FONT.label).text(String(i),MARGIN+22,y+8,{width:w-4,align:'center'});
      y+=unitH+6;
      if(y>PAGE_HEIGHT-60){doc.addPage();y=drawHeader(doc,`${sr.name} (cont.)`,'',' Cut-Outs');y+=10;}
    }
    drawFooter(doc,`${sr.name} — arrange smallest to largest`);
  }
  const fp=path.join(dir,'graded-series.pdf');
  await savePdf(doc,fp);
  return [fp];
}

// ── GEOGRAPHY / CULTURE GENERATORS ──

async function generatePuzzleMap(dir) {
  const doc = newDoc('Puzzle Maps','Geography');
  // World map with continents
  let y = drawHeader(doc,'World Puzzle Map','Color-coded continents — cut and place on base','Cut-Outs');
  y+=10;
  doc.fillColor(COLORS.textLight).font('Helvetica').fontSize(FONT.body).text('Cut out each continent. Place on the base map (next page) in the correct location.',MARGIN,y,{width:CONTENT_W});
  y+=25;
  // Simplified continent outlines as labeled colored shapes
  const continents=[
    {name:'North America',color:'#E8943A',x:80,y:y+20,w:140,h:120},
    {name:'South America',color:'#E87CA0',x:130,y:y+150,w:100,h:140},
    {name:'Europe',color:'#CC3333',x:270,y:y+10,w:90,h:80},
    {name:'Africa',color:'#339933',x:270,y:y+100,w:110,h:140},
    {name:'Asia',color:'#DAA520',x:370,y:y+10,w:160,h:130},
    {name:'Australia',color:'#8B4513',x:430,y:y+160,w:90,h:70},
    {name:'Antarctica',color:'#E8E8E8',x:180,y:y+310,w:200,h:40},
  ];
  for(const c of continents){
    drawCutLine(doc,c.x,c.y,c.w,c.h);
    doc.roundedRect(c.x+3,c.y+3,c.w-6,c.h-6,8).fillColor(c.color).fill();
    doc.fillColor(c.color==='#DAA520'||c.color==='#E8E8E8'?'#333':'#FFF').font('Helvetica-Bold').fontSize(c.name.length>8?9:11).text(c.name,c.x+3,c.y+c.h/2-6,{width:c.w-6,align:'center'});
  }
  drawFooter(doc,'World puzzle map — cut continents');
  // Base map
  doc.addPage();
  y = drawHeader(doc,'World Map — Base','Place continents in correct positions','Base Sheet');
  y+=10;
  // Ocean
  doc.rect(MARGIN,y,CONTENT_W,400).fillColor('#D6EAF8').fill().strokeColor(COLORS.border).lineWidth(1).stroke();
  doc.fillColor('#B0D4F1').font('Helvetica').fontSize(FONT.small);
  doc.text('Atlantic Ocean',MARGIN+190,y+100);
  doc.text('Pacific Ocean',MARGIN+30,y+120);
  doc.text('Pacific Ocean',MARGIN+420,y+120);
  doc.text('Indian Ocean',MARGIN+340,y+200);
  doc.text('Arctic Ocean',MARGIN+230,y+10);
  doc.text('Southern Ocean',MARGIN+200,y+350);
  // Dotted outlines for continent placement
  for(const c of continents){
    doc.roundedRect(c.x,c.y,c.w,c.h,8).dash(4,{space:3}).strokeColor(c.color+'80').lineWidth(1).stroke().undash();
  }
  drawFooter(doc,'World base map — match continents to outlines');
  // Land and water forms
  doc.addPage();
  y = drawHeader(doc,'Land and Water Forms','12 matching pairs — island/lake, peninsula/gulf, etc.','Base Sheet');
  y+=10;
  const forms=[
    ['Island','Lake'],['Peninsula','Gulf'],['Isthmus','Strait'],
    ['Cape','Bay'],['Archipelago','System of Lakes'],['Continent','Ocean'],
  ];
  const fColW=CONTENT_W/2-10,fRowH=85;
  for(let i=0;i<forms.length;i++){
    const fy=y+i*fRowH;
    if(fy+fRowH>PAGE_HEIGHT-50){doc.addPage();y=drawHeader(doc,'Land/Water Forms (cont.)','','Base Sheet');y+=10;i--;continue;}
    for(let j=0;j<2;j++){
      const fx=MARGIN+j*(fColW+20);
      doc.roundedRect(fx,fy,fColW,fRowH-10,6).strokeColor(COLORS.border).lineWidth(1).stroke();
      // Land portion (brown) and water portion (blue)
      const landColor=j===0?'#DEB887':'#B0D4F1';
      const waterColor=j===0?'#B0D4F1':'#DEB887';
      doc.roundedRect(fx+5,fy+5,fColW-10,40,4).fillColor(landColor).fill();
      doc.roundedRect(fx+5,fy+25,(fColW-10)/2,20,4).fillColor(waterColor).fill();
      doc.fillColor(COLORS.text).font('Helvetica-Bold').fontSize(FONT.body).text(forms[i][j],fx,fy+fRowH-25,{width:fColW,align:'center'});
    }
  }
  drawFooter(doc,'Land/water forms — land is brown, water is blue');
  const fp=path.join(dir,'puzzle-map.pdf');
  await savePdf(doc,fp);
  return [fp];
}

async function generateFlagCards(dir) {
  const doc = newDoc('Flag Cards','Geography');
  let y = drawHeader(doc,'World Flag Cards','30 flags from all continents','Cut-Outs');
  y+=10;
  // Simplified flag representations using colored rectangles/shapes
  const flags=[
    {name:'USA',stripes:[['#CC3333',6],['#FFFFFF',5]],canton:'#3366CC'},
    {name:'Canada',colors:['#CC3333','#FFFFFF','#CC3333'],vertical:true},
    {name:'Mexico',colors:['#339933','#FFFFFF','#CC3333'],vertical:true},
    {name:'Brazil',bg:'#339933',diamond:'#DAA520'},
    {name:'Argentina',colors:['#87CEEB','#FFFFFF','#87CEEB']},
    {name:'France',colors:['#3366CC','#FFFFFF','#CC3333'],vertical:true},
    {name:'Germany',colors:['#2C2C2C','#CC3333','#DAA520']},
    {name:'UK',bg:'#3366CC',cross:'#CC3333'},
    {name:'Italy',colors:['#339933','#FFFFFF','#CC3333'],vertical:true},
    {name:'Spain',colors:['#CC3333','#DAA520','#CC3333']},
    {name:'Egypt',colors:['#CC3333','#FFFFFF','#2C2C2C']},
    {name:'South Africa',colors:['#CC3333','#FFFFFF','#3366CC'],ychevron:'#339933'},
    {name:'Kenya',colors:['#2C2C2C','#CC3333','#339933']},
    {name:'Nigeria',colors:['#339933','#FFFFFF','#339933'],vertical:true},
    {name:'China',bg:'#CC3333',star:'#DAA520'},
    {name:'Japan',bg:'#FFFFFF',circle:'#CC3333'},
    {name:'India',colors:['#E8943A','#FFFFFF','#339933']},
    {name:'S. Korea',bg:'#FFFFFF',circle2:['#CC3333','#3366CC']},
    {name:'Australia',bg:'#3366CC',canton2:'#3366CC'},
    {name:'N. Zealand',bg:'#3366CC'},
    {name:'Russia',colors:['#FFFFFF','#3366CC','#CC3333']},
    {name:'Turkey',bg:'#CC3333',crescent:'#FFFFFF'},
    {name:'Thailand',colors:['#CC3333','#FFFFFF','#3366CC','#FFFFFF','#CC3333']},
    {name:'Sweden',bg:'#3366CC',cross2:'#DAA520'},
    {name:'Norway',bg:'#CC3333',cross2:'#3366CC'},
    {name:'Colombia',colors:['#DAA520','#3366CC','#CC3333']},
    {name:'Peru',colors:['#CC3333','#FFFFFF','#CC3333'],vertical:true},
    {name:'Chile',bg2:['#FFFFFF','#CC3333'],canton3:'#3366CC'},
    {name:'Indonesia',colors:['#CC3333','#FFFFFF']},
    {name:'Philippines',colors:['#3366CC','#CC3333']},
  ];
  const fw=90,fh=55,fcols=Math.floor(CONTENT_W/(fw+10));
  for(let i=0;i<flags.length;i++){
    const c=i%fcols,r=Math.floor(i/fcols);
    const x=MARGIN+c*(fw+10),yy=y+r*(fh+25);
    if(yy+fh+20>PAGE_HEIGHT-50){doc.addPage();y=drawHeader(doc,'Flag Cards (cont.)','','Cut-Outs');y+=10;i--;continue;}
    drawCutLine(doc,x,yy,fw,fh+20);
    const f=flags[i];
    // Draw simplified flag
    if(f.colors){
      const n=f.colors.length;
      if(f.vertical){
        for(let s=0;s<n;s++)doc.rect(x+4+s*((fw-8)/n),yy+4,(fw-8)/n,fh-8).fillColor(f.colors[s]).fill();
      } else {
        for(let s=0;s<n;s++)doc.rect(x+4,yy+4+s*((fh-8)/n),fw-8,(fh-8)/n).fillColor(f.colors[s]).fill();
      }
    } else if(f.bg){
      doc.rect(x+4,yy+4,fw-8,fh-8).fillColor(f.bg).fill();
      if(f.circle)doc.circle(x+fw/2,yy+fh/2,12).fillColor(f.circle).fill();
      if(f.star){
        doc.fillColor(f.star).font('Helvetica-Bold').fontSize(16).text('★',x+8,yy+10);
      }
      if(f.diamond){
        const dx=x+fw/2,dy=yy+fh/2;
        doc.moveTo(dx,dy-15).lineTo(dx+25,dy).lineTo(dx,dy+15).lineTo(dx-25,dy).closePath().fillColor(f.diamond).fill();
      }
    } else {
      doc.rect(x+4,yy+4,fw-8,fh-8).fillColor('#E8E8E8').fill();
    }
    doc.rect(x+4,yy+4,fw-8,fh-8).strokeColor(COLORS.border).lineWidth(0.5).stroke();
    doc.fillColor(COLORS.text).font('Helvetica-Bold').fontSize(FONT.small).text(f.name,x,yy+fh+2,{width:fw,align:'center'});
  }
  drawFooter(doc,'World flags — cut cards for matching/identification');
  // Blank flag template for coloring
  doc.addPage();
  y = drawHeader(doc,'Blank Flag Templates','Design your own flag or color a country flag','Base Sheet');
  y+=10;
  for(let i=0;i<8;i++){
    const c=i%2,r=Math.floor(i/2);
    const x=MARGIN+c*(CONTENT_W/2),yy=y+r*150;
    doc.rect(x+10,yy,CONTENT_W/2-30,100).strokeColor(COLORS.border).lineWidth(1).stroke();
    doc.fillColor(COLORS.textLight).font('Helvetica').fontSize(FONT.small).text('Country: ______________',x+10,yy+108);
  }
  drawFooter(doc,'Blank flag templates — color or design');
  const fp=path.join(dir,'flag-cards.pdf');
  await savePdf(doc,fp);
  return [fp];
}

async function generateMapSkills(dir) {
  const doc = newDoc('Map Skills','Geography');
  // Blank world outline
  let y = drawHeader(doc,'Blank World Map','Label continents and oceans','Base Sheet');
  y+=10;
  doc.rect(MARGIN,y,CONTENT_W,350).fillColor('#F0F8FF').fill().strokeColor(COLORS.border).lineWidth(1).stroke();
  // Simplified continent outlines
  const outlines=[
    {name:'___________',x:80,y:y+30,w:130,h:110},
    {name:'___________',x:120,y:y+160,w:90,h:130},
    {name:'___________',x:260,y:y+20,w:80,h:70},
    {name:'___________',x:260,y:y+100,w:100,h:130},
    {name:'___________',x:360,y:y+20,w:150,h:120},
    {name:'___________',x:420,y:y+160,w:80,h:60},
  ];
  for(const o of outlines){
    doc.roundedRect(o.x,o.y,o.w,o.h,6).strokeColor(COLORS.text).lineWidth(0.5).stroke();
    doc.fillColor(COLORS.textLight).font('Helvetica').fontSize(8).text(o.name,o.x,o.y+o.h/2-4,{width:o.w,align:'center'});
  }
  drawFooter(doc,'Label the continents and oceans');
  // Latitude/Longitude grid
  doc.addPage();
  y = drawHeader(doc,'Latitude and Longitude Grid','Practice plotting coordinates','Base Sheet');
  y+=10;
  const gridSz=400,gridX=MARGIN+(CONTENT_W-gridSz)/2;
  doc.rect(gridX,y,gridSz,gridSz).strokeColor(COLORS.text).lineWidth(1).stroke();
  // Grid lines
  for(let i=1;i<10;i++){
    const pos=i*(gridSz/10);
    doc.moveTo(gridX+pos,y).lineTo(gridX+pos,y+gridSz).strokeColor('#E0E0E0').lineWidth(0.3).stroke();
    doc.moveTo(gridX,y+pos).lineTo(gridX+gridSz,y+pos).strokeColor('#E0E0E0').lineWidth(0.3).stroke();
  }
  // Labels
  doc.fillColor(COLORS.text).font('Helvetica').fontSize(8);
  for(let i=0;i<=10;i++){
    doc.text(String(i*10)+'°',gridX+i*(gridSz/10)-8,y+gridSz+3);
    doc.text(String(90-i*9)+'°',gridX-20,y+i*(gridSz/10)-4);
  }
  doc.fillColor(COLORS.accent).font('Helvetica-Bold').fontSize(FONT.small).text('Longitude →',gridX+gridSz/2-30,y+gridSz+15);
  doc.save().rotate(-90,{origin:[gridX-25,y+gridSz/2]}).text('← Latitude',gridX-25,y+gridSz/2-5).restore();
  drawFooter(doc,'Latitude/Longitude practice grid');
  const fp=path.join(dir,'map-skills.pdf');
  await savePdf(doc,fp);
  return [fp];
}

// ── SCIENCE GENERATORS ──

async function generateScienceCards(dir) {
  const doc = newDoc('Science Cards','Science');
  // Life cycle: butterfly
  let y = drawHeader(doc,'Life Cycle — Butterfly','4-stage circular diagram','Base Sheet');
  y+=10;
  const cx=PAGE_WIDTH/2,cy=y+140,cr=110;
  const stages=['Egg','Caterpillar','Chrysalis','Butterfly'];
  const stageColors=['#DAA520','#339933','#8B4513','#E8943A'];
  for(let i=0;i<4;i++){
    const a=(i/4)*Math.PI*2-Math.PI/2;
    const sx=cx+Math.cos(a)*cr,sy=cy+Math.sin(a)*cr;
    doc.circle(sx,sy,30).fillColor(stageColors[i]).fill();
    doc.fillColor('#FFF').font('Helvetica-Bold').fontSize(9).text(stages[i],sx-25,sy-5,{width:50,align:'center'});
    // Arrow to next
    const na=((i+1)/4)*Math.PI*2-Math.PI/2;
    const midA=(a+na)/2;
    const ax=cx+Math.cos(midA)*(cr-15),ay=cy+Math.sin(midA)*(cr-15);
    doc.fillColor(COLORS.accent).font('Helvetica-Bold').fontSize(16).text('→',ax-6,ay-8);
  }
  doc.fillColor(COLORS.text).font('Helvetica-Bold').fontSize(FONT.body).text('Butterfly Life Cycle',cx-80,cy-15,{width:160,align:'center'});
  y=cy+cr+50;
  // Life cycle: frog
  doc.fillColor(COLORS.text).font('Helvetica-Bold').fontSize(FONT.body).text('Frog Life Cycle: Egg → Tadpole → Tadpole with Legs → Froglet → Adult Frog',MARGIN,y,{width:CONTENT_W});y+=20;
  doc.fillColor(COLORS.text).font('Helvetica-Bold').fontSize(FONT.body).text('Bean Plant Life Cycle: Seed → Sprout → Seedling → Young Plant → Mature Plant',MARGIN,y,{width:CONTENT_W});
  drawFooter(doc,'Life cycles — circular diagrams');
  // Parts of a plant
  doc.addPage();
  y = drawHeader(doc,'Parts of a Plant','Label the 6 parts','Base Sheet');
  y+=10;
  const plantX=PAGE_WIDTH/2,plantBase=y+350;
  // Roots
  doc.moveTo(plantX,plantBase).lineTo(plantX-40,plantBase+60).strokeColor('#8B4513').lineWidth(2).stroke();
  doc.moveTo(plantX,plantBase).lineTo(plantX+30,plantBase+50).strokeColor('#8B4513').lineWidth(2).stroke();
  doc.moveTo(plantX,plantBase).lineTo(plantX,plantBase+40).strokeColor('#8B4513').lineWidth(2).stroke();
  // Stem
  doc.moveTo(plantX,plantBase).lineTo(plantX,plantBase-200).strokeColor('#339933').lineWidth(4).stroke();
  // Leaves
  doc.ellipse(plantX-50,plantBase-100,40,15).fillColor('#339933').fill();
  doc.ellipse(plantX+50,plantBase-150,40,15).fillColor('#339933').fill();
  // Flower
  for(let p=0;p<5;p++){
    const pa=(p/5)*Math.PI*2-Math.PI/2;
    doc.ellipse(plantX+Math.cos(pa)*20,plantBase-220+Math.sin(pa)*20,12,8).fillColor('#FF69B4').fill();
  }
  doc.circle(plantX,plantBase-220,8).fillColor('#DAA520').fill();
  // Labels with lines
  const labels=[
    {name:'Flower',x:plantX+80,y:plantBase-230,tx:plantX+10,ty:plantBase-220},
    {name:'Leaf',x:plantX+100,y:plantBase-150,tx:plantX+50,ty:plantBase-150},
    {name:'Stem',x:plantX+80,y:plantBase-100,tx:plantX+2,ty:plantBase-100},
    {name:'Roots',x:plantX+60,y:plantBase+40,tx:plantX+20,ty:plantBase+30},
    {name:'Seed (inside flower)',x:plantX+80,y:plantBase-195,tx:plantX,ty:plantBase-220},
    {name:'Fruit (develops from flower)',x:plantX-160,y:plantBase-240,tx:plantX-10,ty:plantBase-220},
  ];
  for(const l of labels){
    doc.moveTo(l.tx,l.ty).lineTo(l.x,l.y).strokeColor(COLORS.textLight).lineWidth(0.5).stroke();
    doc.fillColor(COLORS.text).font('Helvetica-Bold').fontSize(FONT.small).text(l.name,l.x+5,l.y-5);
  }
  drawFooter(doc,'Parts of a plant — 6 labeled parts');
  // Animal classification
  doc.addPage();
  y = drawHeader(doc,'Animal Classification','Vertebrate vs Invertebrate sorting mat','Base Sheet');
  y+=10;
  doc.rect(MARGIN,y,CONTENT_W/2-5,300).strokeColor('#CC3333').lineWidth(1.5).stroke();
  doc.fillColor('#CC3333').font('Helvetica-Bold').fontSize(FONT.body).text('VERTEBRATES',MARGIN+10,y+5);
  doc.fillColor(COLORS.text).font('Helvetica').fontSize(FONT.small);
  const verts=['Mammals','Birds','Reptiles','Amphibians','Fish'];
  for(let i=0;i<verts.length;i++){
    doc.text(`• ${verts[i]}`,MARGIN+15,y+30+i*20);
    doc.roundedRect(MARGIN+15,y+50+i*35,CONTENT_W/2-40,25,3).strokeColor(COLORS.border).lineWidth(0.5).stroke();
  }
  doc.rect(MARGIN+CONTENT_W/2+5,y,CONTENT_W/2-5,300).strokeColor('#3366CC').lineWidth(1.5).stroke();
  doc.fillColor('#3366CC').font('Helvetica-Bold').fontSize(FONT.body).text('INVERTEBRATES',MARGIN+CONTENT_W/2+15,y+5);
  const inverts=['Insects','Arachnids','Crustaceans','Mollusks','Worms'];
  doc.fillColor(COLORS.text).font('Helvetica').fontSize(FONT.small);
  for(let i=0;i<inverts.length;i++){
    doc.text(`• ${inverts[i]}`,MARGIN+CONTENT_W/2+20,y+30+i*20);
  }
  drawFooter(doc,'Animal classification — sort animals by type');
  const fp=path.join(dir,'science-cards.pdf');
  await savePdf(doc,fp);
  return [fp];
}

async function generateThreePartCards(dir) {
  const doc = newDoc('Three-Part Cards','Science');
  let y = drawHeader(doc,'Three-Part Nomenclature Cards','Image + Label + Control cards for self-checking','Cut-Outs');
  y+=10;
  doc.fillColor(COLORS.textLight).font('Helvetica').fontSize(FONT.body).text('Cut along dashed lines. Match image cards to label cards. Use control cards to self-check.',MARGIN,y,{width:CONTENT_W});
  y+=25;
  const sets=[
    {title:'Parts of a Plant',items:['Root','Stem','Leaf','Flower','Seed','Fruit']},
    {title:'Animal Classes',items:['Mammal','Bird','Reptile','Amphibian','Fish','Insect']},
    {title:'Geometric Solids',items:['Sphere','Cube','Cylinder','Cone','Prism','Pyramid']},
    {title:'Land/Water Forms',items:['Island','Lake','Peninsula','Gulf','Cape','Bay']},
  ];
  for(const set of sets){
    if(y>PAGE_HEIGHT-180){doc.addPage();y=drawHeader(doc,'Three-Part Cards (cont.)','','Cut-Outs');y+=10;}
    doc.fillColor(COLORS.accent).font('Helvetica-Bold').fontSize(FONT.body).text(set.title,MARGIN,y);y+=18;
    const cw3=80,ch3=75,tcols=Math.floor(CONTENT_W/(cw3+6));
    for(let i=0;i<set.items.length;i++){
      const c=i%tcols,r=Math.floor(i/tcols);
      const x=MARGIN+c*(cw3+6),yy=y+r*(ch3+6);
      // Image+Label card (control)
      drawCutLine(doc,x,yy,cw3,ch3);
      doc.roundedRect(x+4,yy+4,cw3-8,ch3-28,3).fillColor('#F5EDE0').fill().strokeColor(COLORS.border).lineWidth(0.5).stroke();
      doc.fillColor(COLORS.textLight).font('Helvetica').fontSize(8).text('[image]',x+4,yy+ch3/2-16,{width:cw3-8,align:'center'});
      doc.fillColor(COLORS.text).font('Helvetica-Bold').fontSize(FONT.small).text(set.items[i],x,yy+ch3-22,{width:cw3,align:'center'});
    }
    y+=Math.ceil(set.items.length/tcols)*(ch3+6)+15;
  }
  drawFooter(doc,'Three-part cards — match, label, self-check');
  const fp=path.join(dir,'three-part-cards.pdf');
  await savePdf(doc,fp);
  return [fp];
}

async function generateLabReport(dir) {
  const doc = newDoc('Lab Report','Science');
  let y = drawHeader(doc,'Scientific Method Lab Report','Record your experiment','Base Sheet');
  y+=10;
  const sections3=[
    {label:'Question: What are we trying to find out?',h:50},
    {label:'Hypothesis: I think... because...',h:50},
    {label:'Materials Needed:',h:60},
    {label:'Procedure (Steps):',h:100},
    {label:'Observations (What happened?):',h:100},
    {label:'Data / Drawing:',h:120},
    {label:'Conclusion: What did we learn?',h:60},
  ];
  for(const s of sections3){
    if(y+s.h+20>PAGE_HEIGHT-40){doc.addPage();y=drawHeader(doc,'Lab Report (cont.)','','Base Sheet');y+=10;}
    doc.fillColor(COLORS.accent).font('Helvetica-Bold').fontSize(FONT.body).text(s.label,MARGIN+10,y);y+=18;
    doc.roundedRect(MARGIN+10,y,CONTENT_W-20,s.h,4).strokeColor(COLORS.border).lineWidth(0.5).stroke();
    for(let l=1;l<Math.floor(s.h/18);l++){
      doc.moveTo(MARGIN+15,y+l*18).lineTo(MARGIN+CONTENT_W-15,y+l*18).strokeColor('#E8E0D4').lineWidth(0.3).stroke();
    }
    y+=s.h+12;
  }
  drawFooter(doc,'Lab report — scientific method');
  const fp=path.join(dir,'lab-report.pdf');
  await savePdf(doc,fp);
  return [fp];
}

// ── REMAINING GENERATORS ──

async function generateCulturalActivitySheets(dir) {
  const doc = newDoc('Cultural Activities','Culture');
  let y = drawHeader(doc,'Cultural Celebration Activity Pages','Explore cultures through activities','Base Sheet');
  y+=10;
  // Pattern/design activity
  doc.fillColor(COLORS.accent).font('Helvetica-Bold').fontSize(FONT.body).text('Design a Rangoli Pattern (India):',MARGIN+10,y);y+=18;
  doc.fillColor(COLORS.textLight).font('Helvetica').fontSize(FONT.small).text('Rangoli are colorful designs made at the entrance of homes during festivals like Diwali. Create your own symmetrical design in the space below.',MARGIN+10,y,{width:CONTENT_W-20});y+=30;
  doc.circle(PAGE_WIDTH/2,y+100,100).strokeColor(COLORS.border).lineWidth(1).stroke();
  doc.moveTo(PAGE_WIDTH/2-100,y+100).lineTo(PAGE_WIDTH/2+100,y+100).strokeColor('#E8E0D4').lineWidth(0.3).stroke();
  doc.moveTo(PAGE_WIDTH/2,y).lineTo(PAGE_WIDTH/2,y+200).strokeColor('#E8E0D4').lineWidth(0.3).stroke();
  y+=220;
  drawFooter(doc,'Cultural activities — explore world traditions');
  // Community helpers
  doc.addPage();
  y = drawHeader(doc,'Community Helpers Matching','Draw a line from helper to their tool','Base Sheet');
  y+=10;
  const helpers=[
    {name:'Firefighter',tool:'Fire Hose'},
    {name:'Doctor',tool:'Stethoscope'},
    {name:'Mail Carrier',tool:'Mail Bag'},
    {name:'Teacher',tool:'Books'},
    {name:'Chef',tool:'Cooking Pot'},
    {name:'Police Officer',tool:'Badge'},
  ];
  const leftX=MARGIN+30,rightX=MARGIN+CONTENT_W-130;
  for(let i=0;i<helpers.length;i++){
    const yy=y+i*50;
    doc.roundedRect(leftX,yy,120,35,4).strokeColor(COLORS.border).lineWidth(1).stroke();
    doc.fillColor(COLORS.text).font('Helvetica-Bold').fontSize(FONT.body).text(helpers[i].name,leftX+5,yy+8,{width:110,align:'center'});
    // Scrambled order for tools
    const ti=(i+3)%helpers.length;
    doc.roundedRect(rightX,yy,120,35,4).strokeColor(COLORS.border).lineWidth(1).stroke();
    doc.fillColor(COLORS.text).font('Helvetica-Bold').fontSize(FONT.body).text(helpers[ti].tool,rightX+5,yy+8,{width:110,align:'center'});
  }
  drawFooter(doc,'Community helpers — draw lines to match');
  const fp=path.join(dir,'cultural-activity-sheets.pdf');
  await savePdf(doc,fp);
  return [fp];
}

async function generateMathReviewSheets(dir) {
  const doc = newDoc('Math Review','Math');
  const quarters=['Q1 (Weeks 1-9)','Q2 (Weeks 10-18)','Q3 (Weeks 19-27)','Q4 (Weeks 28-36)'];
  for(let q=0;q<4;q++){
    if(q>0)doc.addPage();
    let y = drawHeader(doc,`Math Review — ${quarters[q]}`,'Record your work with each material','Base Sheet');
    y+=10;
    const materials=['Number work:','Bead work:','Operations:','Problem solving:','Geometry/Measurement:'];
    for(const m of materials){
      doc.fillColor(COLORS.accent).font('Helvetica-Bold').fontSize(FONT.body).text(m,MARGIN+10,y);y+=18;
      doc.roundedRect(MARGIN+10,y,CONTENT_W-20,65,4).strokeColor(COLORS.border).lineWidth(0.5).stroke();
      for(let l=1;l<3;l++)doc.moveTo(MARGIN+15,y+l*20).lineTo(MARGIN+CONTENT_W-15,y+l*20).strokeColor('#E8E0D4').lineWidth(0.3).stroke();
      y+=75;
      if(y>PAGE_HEIGHT-80){doc.addPage();y=drawHeader(doc,`${quarters[q]} (cont.)`,'',' Base Sheet');y+=10;}
    }
    drawFooter(doc,`Math review — ${quarters[q]}`);
  }
  const fp=path.join(dir,'math-review-sheets.pdf');
  await savePdf(doc,fp);
  return [fp];
}

async function generateWorkLog(dir) {
  const doc = newDoc('Work Log','Practical Life');
  let y = drawHeader(doc,'Independent Work Log','Track your work each day','Base Sheet');
  y+=10;
  doc.fillColor(COLORS.text).font('Helvetica').fontSize(FONT.body).text('Name: _________________    Week of: _________________',MARGIN+10,y);y+=25;
  const days=['Monday','Tuesday','Wednesday','Thursday','Friday'];
  for(const d of days){
    doc.fillColor(COLORS.accent).font('Helvetica-Bold').fontSize(FONT.body).text(d,MARGIN+10,y);y+=16;
    for(let w=1;w<=3;w++){
      doc.fillColor(COLORS.textLight).font('Helvetica').fontSize(FONT.small).text(`Work ${w}: `,MARGIN+20,y);
      doc.roundedRect(MARGIN+70,y-2,CONTENT_W-110,18,3).strokeColor(COLORS.border).lineWidth(0.5).stroke();
      const checkX=MARGIN+CONTENT_W-30;
      doc.rect(checkX,y,14,14).strokeColor(COLORS.border).lineWidth(0.5).stroke();
      doc.fillColor(COLORS.textLight).font('Helvetica').fontSize(7).text('done',checkX,y+15,{width:14,align:'center'});
      y+=22;
    }
    y+=10;
  }
  drawFooter(doc,'Work log — track 3 work choices per day');
  const fp=path.join(dir,'work-log.pdf');
  await savePdf(doc,fp);
  return [fp];
}

async function generateTimeline(dir) {
  const doc = newDoc('Timeline','History');
  let y = drawHeader(doc,'Blank Timeline Strips','Record historical events in chronological order','Base Sheet');
  y+=10;
  // 3 timeline strips
  for(let t=0;t<3;t++){
    if(t>0)y+=20;
    if(y>PAGE_HEIGHT-180){doc.addPage();y=drawHeader(doc,'Timeline Strips (cont.)','','Base Sheet');y+=10;}
    doc.fillColor(COLORS.accent).font('Helvetica-Bold').fontSize(FONT.body).text(`Timeline ${t+1}: ___________________________`,MARGIN+10,y);y+=20;
    // Draw timeline line
    doc.moveTo(MARGIN+20,y+30).lineTo(MARGIN+CONTENT_W-20,y+30).strokeColor(COLORS.text).lineWidth(2).stroke();
    // Tick marks
    const ticks=10;
    for(let i=0;i<=ticks;i++){
      const tx=MARGIN+20+i*((CONTENT_W-40)/ticks);
      doc.moveTo(tx,y+22).lineTo(tx,y+38).strokeColor(COLORS.text).lineWidth(1).stroke();
      // Date label line
      doc.moveTo(tx-15,y+45).lineTo(tx+15,y+45).strokeColor('#E8E0D4').lineWidth(0.3).stroke();
    }
    // Event boxes above
    for(let i=0;i<5;i++){
      const ex=MARGIN+30+i*((CONTENT_W-60)/5);
      doc.roundedRect(ex,y,80,20,3).strokeColor(COLORS.border).lineWidth(0.5).stroke();
    }
    y+=60;
  }
  drawFooter(doc,'Timeline strips — write dates below, events above');
  // Century timeline
  doc.addPage();
  y = drawHeader(doc,'Century Timeline','From ancient times to modern era','Base Sheet');
  y+=10;
  const eras=[
    {name:'Ancient (3000 BCE - 500 CE)',color:'#DAA520'},
    {name:'Medieval (500 - 1500 CE)',color:'#CC3333'},
    {name:'Early Modern (1500 - 1800)',color:'#339933'},
    {name:'Industrial (1800 - 1900)',color:'#8B4513'},
    {name:'Modern (1900 - Present)',color:'#3366CC'},
  ];
  const barH=40;
  for(const era of eras){
    doc.rect(MARGIN+10,y,CONTENT_W-20,barH).fillColor(era.color+'20').fill().strokeColor(era.color).lineWidth(1).stroke();
    doc.fillColor(era.color).font('Helvetica-Bold').fontSize(FONT.body).text(era.name,MARGIN+20,y+12,{width:CONTENT_W-40});
    y+=barH+8;
    // Event lines
    for(let l=0;l<3;l++){
      doc.fillColor(COLORS.textLight).font('Helvetica').fontSize(FONT.small).text('Event: ',MARGIN+30,y);
      doc.moveTo(MARGIN+75,y+12).lineTo(MARGIN+CONTENT_W-30,y+12).strokeColor('#E8E0D4').lineWidth(0.3).stroke();
      y+=18;
    }
    y+=10;
    if(y>PAGE_HEIGHT-80){doc.addPage();y=drawHeader(doc,'Century Timeline (cont.)','','Base Sheet');y+=10;}
  }
  drawFooter(doc,'Century timeline — record events by era');
  const fp=path.join(dir,'timeline.pdf');
  await savePdf(doc,fp);
  return [fp];
}

async function generateGraphPaper(dir) {
  const doc = newDoc('Graph Paper','Math');
  // Coordinate grid
  let y = drawHeader(doc,'Coordinate Grid','Plot points and graph equations','Base Sheet');
  y+=5;
  const gridSz=Math.min(CONTENT_W-40,PAGE_HEIGHT-y-80);
  const gx=MARGIN+(CONTENT_W-gridSz)/2,gy=y+5;
  const gridStep=gridSz/20;
  // Grid lines
  for(let i=0;i<=20;i++){
    const lw=i===10?1.5:0.3;
    const lc=i===10?COLORS.text:'#D0D0D0';
    doc.moveTo(gx+i*gridStep,gy).lineTo(gx+i*gridStep,gy+gridSz).strokeColor(lc).lineWidth(lw).stroke();
    doc.moveTo(gx,gy+i*gridStep).lineTo(gx+gridSz,gy+i*gridStep).strokeColor(lc).lineWidth(lw).stroke();
  }
  // Axis labels
  doc.fillColor(COLORS.text).font('Helvetica').fontSize(7);
  for(let i=-10;i<=10;i+=2){
    doc.text(String(i),gx+(i+10)*gridStep-5,gy+gridSz+3,{width:10,align:'center'});
    if(i!==0)doc.text(String(-i),gx-15,gy+(i+10)*gridStep-4);
  }
  drawFooter(doc,'Coordinate grid — plot points');
  // Standard graph paper
  doc.addPage();
  y = drawHeader(doc,'Graph Paper','Standard grid for math work','Base Sheet');
  y+=5;
  const step2=18;
  const cols3=Math.floor(CONTENT_W/step2);
  const rows3=Math.floor((PAGE_HEIGHT-y-40)/step2);
  for(let r=0;r<=rows3;r++){
    doc.moveTo(MARGIN,y+r*step2).lineTo(MARGIN+cols3*step2,y+r*step2).strokeColor('#C0D0E0').lineWidth(0.3).stroke();
  }
  for(let c=0;c<=cols3;c++){
    doc.moveTo(MARGIN+c*step2,y).lineTo(MARGIN+c*step2,y+rows3*step2).strokeColor('#C0D0E0').lineWidth(0.3).stroke();
  }
  drawFooter(doc,'Graph paper');
  const fp=path.join(dir,'graph-paper.pdf');
  await savePdf(doc,fp);
  return [fp];
}

// ── CLASSIFIER + MAIN ──

function classifyLesson(lesson, levelName, mapping) {
  const title = (lesson.title || '').toLowerCase();
  const subject = lesson.subject_name || '';
  // Normalize: primary_year1 → primary, lower_elementary_year2 → lower_elementary, etc.
  const normalizedLevel = levelName.replace(/-/g, '_').replace(/_year[123]$/, '');

  // Subjects that never need printables
  if (['read_aloud', 'art_music'].includes(subject)) return null;
  if (subject === 'practical_life') {
    // Only primary practical_life gets work-log
    if (normalizedLevel === 'primary') return 'work-log';
    return null;
  }

  const levelClassifier = mapping.level_classifiers[normalizedLevel];
  if (!levelClassifier) return null;

  const subjectClassifier = levelClassifier[subject];
  if (!subjectClassifier) return null;

  // Check keyword overrides
  if (subjectClassifier.keyword_overrides) {
    for (const [pattern, template] of Object.entries(subjectClassifier.keyword_overrides)) {
      const regex = new RegExp(pattern, 'i');
      if (regex.test(title)) return template;
    }
  }

  return subjectClassifier.default_template || null;
}

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes('--force');
  const levelFilter = args.includes('--level') ? args[args.indexOf('--level') + 1] : null;

  console.log('=== V2 Material Library PDF Generator ===\n');

  const mappingPath = path.join(__dirname, 'data', 'material-library-mapping.json');
  const mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));

  const materialsDir = path.join(__dirname, '..', 'public', 'printables', 'materials');

  // Create category directories
  const categories = ['math', 'language', 'sensorial', 'geography', 'science', 'culture', 'practical_life', 'history'];
  for (const cat of categories) {
    fs.mkdirSync(path.join(materialsDir, cat), { recursive: true });
  }

  // Delete old primary printables
  const oldDir = path.join(__dirname, '..', 'public', 'printables', 'primary');
  if (fs.existsSync(oldDir)) {
    console.log('Deleting old generic PDFs from public/printables/primary/...');
    fs.rmSync(oldDir, { recursive: true, force: true });
    console.log('  Deleted.\n');
  }

  // ── Generate all material PDFs ──
  const generators = {
    'math': [
      { name: 'number-rods', fn: generateNumberRods },
      { name: 'number-cards', fn: generateNumberCards },
      { name: 'bead-bars', fn: generateBeadBars },
      { name: 'numeral-cards', fn: generateNumeralCards },
      { name: 'seguin-board', fn: generateSeguinBoard },
      { name: 'hundred-board', fn: generateHundredBoard },
      { name: 'strip-board', fn: generateStripBoard },
      { name: 'fraction-circles', fn: generateFractionCircles },
      { name: 'operation-board', fn: generateOperationBoard },
      { name: 'clock-face', fn: generateClockFace },
      { name: 'spindle-box', fn: generateSpindleBox },
      { name: 'math-review-sheets', fn: generateMathReviewSheets },
      { name: 'graph-paper', fn: generateGraphPaper },
    ],
    'language': [
      { name: 'letter-cards', fn: generateLetterCards },
      { name: 'word-cards', fn: generateWordCards },
      { name: 'handwriting-practice', fn: generateHandwritingPractice },
      { name: 'grammar-symbols', fn: generateGrammarSymbols },
      { name: 'phonemic-awareness', fn: generatePhonemicAwareness },
      { name: 'writing-templates', fn: generateWritingTemplates },
      { name: 'reading-practice', fn: generateReadingPractice },
      { name: 'essay-templates', fn: generateEssayTemplates },
    ],
    'sensorial': [
      { name: 'color-tablets', fn: generateColorTablets },
      { name: 'cylinder-blocks', fn: generateCylinderBlocks },
      { name: 'geometry-shapes', fn: generateGeometryShapes },
      { name: 'graded-series', fn: generateGradedSeries },
    ],
    'geography': [
      { name: 'puzzle-map', fn: generatePuzzleMap },
      { name: 'flag-cards', fn: generateFlagCards },
      { name: 'map-skills', fn: generateMapSkills },
    ],
    'science': [
      { name: 'science-cards', fn: generateScienceCards },
      { name: 'three-part-cards', fn: generateThreePartCards },
      { name: 'lab-report', fn: generateLabReport },
    ],
    'culture': [
      { name: 'cultural-activity-sheets', fn: generateCulturalActivitySheets },
    ],
    'practical_life': [
      { name: 'work-log', fn: generateWorkLog },
    ],
    'history': [
      { name: 'timeline', fn: generateTimeline },
    ],
  };

  let totalPdfs = 0;
  const allFiles = {};

  for (const [category, gens] of Object.entries(generators)) {
    const catDir = path.join(materialsDir, category);
    console.log(`Generating ${category} materials...`);
    for (const gen of gens) {
      try {
        const files = await gen.fn(catDir);
        allFiles[gen.name] = files.map(f => f.replace(path.join(__dirname, '..', 'public'), '').replace(/\\/g, '/'));
        totalPdfs += files.length;
        console.log(`  ✓ ${gen.name} (${files.length} file${files.length>1?'s':''})`);
      } catch (err) {
        console.error(`  ✗ ${gen.name}: ${err.message}`);
      }
    }
  }

  console.log(`\nGenerated ${totalPdfs} PDF files total.\n`);

  // ── Classify lessons and update JSON ──
  const ALL_LEVELS = [
    'primary', 'primary-year1', 'primary-year2',
    'lower-elementary', 'lower-elementary-year2', 'lower-elementary-year3',
    'upper-elementary', 'upper-elementary-year2', 'upper-elementary-year3',
  ];
  const levels = levelFilter ? [levelFilter] : ALL_LEVELS;
  let totalUpdated = 0, totalSkipped = 0;

  for (const level of levels) {
    const lessonsDir = path.join(__dirname, 'data', `${level}-lessons`);
    if (!fs.existsSync(lessonsDir)) { console.log(`Skipping ${level} (no data dir)`); continue; }

    const weekFiles = fs.readdirSync(lessonsDir).filter(f => f.startsWith('week-') && f.endsWith('.json')).sort();
    let levelUpdated = 0;

    for (const file of weekFiles) {
      const filePath = path.join(lessonsDir, file);
      const lessons = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      let modified = false;

      for (const lesson of lessons) {
        const template = classifyLesson(lesson, level, mapping);

        if (!template) {
          // Clear any old printable_pdfs
          if (lesson.printable_pdfs && lesson.printable_pdfs.length > 0) {
            lesson.printable_pdfs = [];
            modified = true;
          }
          totalSkipped++;
          continue;
        }

        // Look up material files
        const materialKey = mapping.template_to_material[template] || template;
        const materialInfo = mapping.materials[materialKey];

        if (!materialInfo) {
          totalSkipped++;
          continue;
        }

        const pdfPaths = materialInfo.files.map(f =>
          `/printables/materials/${materialInfo.category}/${f}`
        );

        // Also check allFiles for actual generated paths
        if (allFiles[materialKey]) {
          lesson.printable_pdfs = allFiles[materialKey];
        } else {
          lesson.printable_pdfs = pdfPaths;
        }

        lesson.printable_template = template;
        modified = true;
        levelUpdated++;
      }

      if (modified) {
        fs.writeFileSync(filePath, JSON.stringify(lessons, null, 2));
      }
    }

    totalUpdated += levelUpdated;
    console.log(`${level}: ${levelUpdated} lessons updated with printable PDF paths`);
  }

  console.log(`\n=== COMPLETE ===`);
  console.log(`PDFs generated: ${totalPdfs}`);
  console.log(`Lessons updated: ${totalUpdated}`);
  console.log(`Lessons skipped (no printable needed): ${totalSkipped}`);
  console.log(`Output: ${materialsDir}`);
}

main().catch(err => { console.error('FATAL:', err); process.exit(1); });
