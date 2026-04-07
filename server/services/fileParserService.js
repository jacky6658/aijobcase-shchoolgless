/**
 * 檔案解析服務 - 從 PDF/Word/PPT/Excel 提取文字
 */

async function parsePDF(buffer) {
  const pdfParse = require('pdf-parse');
  const result = await pdfParse(buffer);
  return { text: result.text, pageCount: result.numpages };
}

async function parseDocx(buffer) {
  const mammoth = require('mammoth');
  const result = await mammoth.extractRawText({ buffer });
  return { text: result.value };
}

async function parsePptx(buffer) {
  // PPTX 是 OpenXML ZIP 格式，用 adm-zip 解壓取文字
  try {
    const AdmZip = require('adm-zip');
    const zip = new AdmZip(buffer);
    const entries = zip.getEntries();
    let text = '';
    let slideCount = 0;

    for (const entry of entries) {
      if (entry.entryName.match(/ppt\/slides\/slide\d+\.xml/)) {
        slideCount++;
        const content = entry.getData().toString('utf-8');
        // Extract text from XML tags <a:t>...</a:t>
        const matches = content.match(/<a:t>([^<]*)<\/a:t>/g);
        if (matches) {
          const slideText = matches.map(m => m.replace(/<\/?a:t>/g, '')).join(' ');
          text += `\n[Slide ${slideCount}] ${slideText}`;
        }
      }
    }

    return { text: text.trim(), slideCount };
  } catch (err) {
    throw new Error(`PPT 解析失敗: ${err.message}`);
  }
}

async function parseXlsx(buffer) {
  const XLSX = require('xlsx');
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  let text = '';
  const sheetNames = workbook.SheetNames;

  for (const name of sheetNames) {
    const sheet = workbook.Sheets[name];
    const csv = XLSX.utils.sheet_to_csv(sheet);
    text += `\n[Sheet: ${name}]\n${csv}`;
  }

  return { text: text.trim(), sheetNames };
}

/**
 * 根據 MIME type 分派解析器
 */
async function parseFile(buffer, mimetype, filename) {
  const ext = filename?.split('.').pop()?.toLowerCase();

  if (mimetype === 'application/pdf' || ext === 'pdf') {
    return { ...await parsePDF(buffer), type: 'PDF' };
  }
  if (mimetype.includes('wordprocessingml') || ext === 'docx') {
    return { ...await parseDocx(buffer), type: 'DOCX' };
  }
  if (mimetype.includes('presentationml') || ext === 'pptx') {
    return { ...await parsePptx(buffer), type: 'PPTX' };
  }
  if (mimetype.includes('spreadsheetml') || mimetype.includes('ms-excel') || ext === 'xlsx' || ext === 'xls') {
    return { ...await parseXlsx(buffer), type: 'XLSX' };
  }

  throw new Error(`不支援的檔案格式: ${mimetype}`);
}

module.exports = { parseFile, parsePDF, parseDocx, parsePptx, parseXlsx };
