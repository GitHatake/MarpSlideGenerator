const fs = require('fs');
const path = require('path');

// 引数から入力ファイルと出力ファイルのパスを取得
const inputFile = process.argv[2] || 'input.json';
const outputFile = process.argv[3] || 'output.md';

// テキスト内の強調記法をHTMLタグに変換
function parseText(text) {
  if (!text) return "";
  let parsed = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  parsed = parsed.replace(/\[\[(.*?)\]\]/g, '<span class="highlight">$1</span>');
  return parsed.replace(/\n/g, '<br>');
}

function generateMarkdown(slideData) {
  // Marp Frontmatter
  let md = `---
marp: true
theme: custom-theme
html: true
paginate: true
size: 16:9
---\n\n`;

  slideData.forEach((slide, index) => {
    if (index > 0) md += `---\n\n`;
    
    // スライドタイプのクラス指定
    md += `<!-- _class: ${slide.type} -->\n\n`;

    // 共通ヘッダー（title, section以外のスライド）
    if (slide.title && slide.type !== 'title' && slide.type !== 'section') {
      md += `<h1>${parseText(slide.title)}</h1>\n`;
    }
    if (slide.subhead) {
      md += `<div class="subhead">${parseText(slide.subhead)}</div>\n\n`;
    }

    // パターン別レイアウト構築
    switch (slide.type) {
      case 'title':
        md += `<div class="title-wrap">\n`;
        md += `  <h1>${parseText(slide.title)}</h1>\n`;
        if (slide.date) md += `  <div class="date">${slide.date}</div>\n`;
        md += `</div>\n`;
        break;

      case 'section':
        md += `<div class="section-wrap">\n`;
        if (slide.sectionNo) md += `<div class="section-no">${slide.sectionNo}</div>\n`;
        md += `  <h1>${parseText(slide.title)}</h1>\n`;
        md += `</div>\n`;
        break;

      case 'agenda':
      case 'content':
        if (slide.twoColumn && slide.columns) {
          md += `<div class="layout-twocol">\n`;
          md += `  <div class="box">\n${slide.columns[0].map(p => `<li>${parseText(p)}</li>`).join('')}\n  </div>\n`;
          md += `  <div class="box">\n${slide.columns[1].map(p => `<li>${parseText(p)}</li>`).join('')}\n  </div>\n`;
          md += `</div>\n`;
        } else if (slide.points || slide.items) {
          const items = slide.points || slide.items;
          md += `<ul class="content-list">\n`;
          items.forEach(p => { md += `  <li>${parseText(p)}</li>\n`; });
          md += `</ul>\n`;
        }
        break;

      case 'compare':
        md += `<div class="layout-compare">\n`;
        md += `  <div class="box left">\n    <div class="box-title">${parseText(slide.leftTitle)}</div>\n    <ul>\n${slide.leftItems.map(p => `<li>${parseText(p)}</li>`).join('')}\n    </ul>\n  </div>\n`;
        md += `  <div class="box right">\n    <div class="box-title">${parseText(slide.rightTitle)}</div>\n    <ul>\n${slide.rightItems.map(p => `<li>${parseText(p)}</li>`).join('')}\n    </ul>\n  </div>\n`;
        md += `</div>\n`;
        break;

      case 'process':
      case 'processList':
      case 'flowChart':
        md += `<div class="layout-process">\n`;
        const steps = slide.steps || (slide.flows && slide.flows[0] ? slide.flows[0].steps : []);
        steps.forEach((step, i) => {
          md += `  <div class="process-step">\n`;
          md += `    <div class="step-num">STEP ${i + 1}</div>\n`;
          md += `    <div class="step-text">${parseText(step)}</div>\n`;
          md += `  </div>\n`;
          if (i < steps.length - 1) md += `  <div class="process-arrow">▶</div>\n`;
        });
        md += `</div>\n`;
        break;

      case 'cards':
      case 'headerCards':
        const cols = slide.columns || 3;
        md += `<div class="layout-cards cols-${cols}">\n`;
        slide.items.forEach(item => {
          md += `  <div class="card">\n`;
          if (typeof item === 'string') {
            md += `    <div class="card-desc">${parseText(item)}</div>\n`;
          } else {
            if (item.title) md += `    <div class="card-header">${parseText(item.title)}</div>\n`;
            if (item.desc) md += `    <div class="card-desc">${parseText(item.desc)}</div>\n`;
          }
          md += `  </div>\n`;
        });
        md += `</div>\n`;
        break;

      case 'timeline':
        md += `<div class="layout-timeline">\n`;
        slide.milestones.forEach(m => {
          md += `  <div class="timeline-item">\n`;
          md += `    <div class="time-date">${m.date}</div>\n`;
          md += `    <div class="time-label">${parseText(m.label)}</div>\n`;
          md += `  </div>\n`;
        });
        md += `</div>\n`;
        break;
        
      case 'closing':
        md += `<div class="closing-wrap">\n`;
        md += `  <h1>ご清聴ありがとうございました</h1>\n`;
        md += `</div>\n`;
        break;
        
      default:
        // その他のタイプ（fallback）
        md += `<pre><code>${JSON.stringify(slide, null, 2)}</code></pre>\n`;
        break;
    }

    // スピーカーノート
    if (slide.notes) {
      md += `\n<!--\n${slide.notes}\n-->\n`;
    }
  });

  return md;
}

const inputPath = path.resolve(process.cwd(), inputFile);
const outputPath = path.resolve(process.cwd(), outputFile);

try {
  if (!fs.existsSync(inputPath)) {
     console.error(`❌ Input file not found: ${inputPath}`);
     process.exit(1);
  }
  const data = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  const markdown = generateMarkdown(data);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, markdown, 'utf8');
  console.log(`✅ Markdown generated at: ${outputPath}`);
} catch (e) {
  console.error("❌ Error:", e.message);
  process.exit(1);
}
