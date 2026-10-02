const axios = require('axios');
const cheerio = require('cheerio');
const ExcelJS = require('exceljs');
const mongoose = require('mongoose');
require('dotenv').config();
const GovernmentExpenditure = require('../models/GovernmentExpenditure');

const args = process.argv.slice(2);
const budgetPeriod = args.find((argument) => !argument.startsWith('--')) || '2025-26';
const dryRun = args.includes('--dry-run');
const limitArgument = args.find((argument) => argument.startsWith('--limit='));
const workbookLimit = limitArgument ? Number(limitArgument.split('=')[1]) : Infinity;
const skipArgument = args.find((argument) => argument.startsWith('--skip='));
const defaultSkippedNumbersByPeriod = {
  '2025-26': [63],
  '2021-22': [37, 38, 66, 74, 79, 83],
  '2022-23': [39, 40, 67, 75, 80, 84],
  '2023-24': [39, 40, 67, 75, 80, 84]
};
const defaultSkippedNumbers = defaultSkippedNumbersByPeriod[budgetPeriod] || [];
const skippedWorkbookNumbers = new Set(
  skipArgument
    ? skipArgument.split('=')[1].split(',').filter(Boolean).map(Number)
    : defaultSkippedNumbers
);
const budgetRoot = `https://www.indiabudget.gov.in/budget${budgetPeriod}/`;
const categories = {
  actuals: 'Actual',
  'budget estimates': 'Budget Estimate',
  'revised estimates': 'Revised Estimate'
};

function cellText(value) {
  if (value && typeof value === 'object' && Array.isArray(value.richText)) {
    return value.richText.map((part) => part.text || '').join('');
  }
  if (value && typeof value === 'object' && typeof value.text === 'string') return value.text;
  return value === undefined || value === null ? '' : String(value);
}

function normalizeYear(year) {
  const match = year.match(/^(\d{4})-(\d{4})$/);
  return match ? `${match[1]}-${match[2].slice(-2)}` : '';
}

function departmentFromRows(rows) {
  for (const row of rows.slice(0, 12)) {
    for (const cell of row || []) {
      const text = cellText(cell);
      if (!text.includes('Demand No.')) continue;
      const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
      const demandLine = lines.findIndex((line) => /^Demand No\./i.test(line));
      if (demandLine >= 0 && lines[demandLine + 1]) return lines[demandLine + 1];
      const department = lines.find((line) => /^Department\b/i.test(line));
      if (department) return department;
      const ministry = lines.find((line) => /^Ministry\b/i.test(line));
      if (ministry) return ministry;
    }
  }
  return '';
}

function valueAt(row, index) {
  const value = row?.[index];
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value.replace(/,/g, '').trim());
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

async function recordsFromWorkbook(fileUrl, sourcePage, workbookNumber) {
  let response;
  let requestError;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      response = await axios.get(fileUrl, { responseType: 'arraybuffer', timeout: 45000 });
      break;
    } catch (error) {
      requestError = error;
      if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, attempt * 700));
    }
  }
  if (!response) throw requestError;
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(response.data);
  const sheet = workbook.worksheets[0];
  if (!sheet) throw new Error('Workbook has no worksheet');

  const rows = [];
  sheet.eachRow({ includeEmpty: false }, (row) => { rows[row.number - 1] = row.values; });
  const department = departmentFromRows(rows);
  if (!department) throw new Error('Department name not found in demand header');

  const headerIndex = rows.findIndex((row) => row?.some((cell) => /^(Actuals|Budget Estimates|Revised Estimates)\s+\d{4}-\d{4}$/i.test(cellText(cell).trim())));
  if (headerIndex < 0) throw new Error('Estimate-type header row not found');

  const headerRow = rows[headerIndex];
  const columnHeaders = rows.slice(headerIndex + 1, headerIndex + 4).find((row) => row?.some((cell) => String(cell || '').trim().toLowerCase() === 'total'));
  if (!columnHeaders) throw new Error('Revenue/capital/total column headings not found');

  const groups = [];
  const seenGroups = new Set();
  headerRow.forEach((cell, index) => {
    const match = cellText(cell).trim().match(/^(Actuals|Budget Estimates|Revised Estimates)\s+(\d{4}-\d{4})$/i);
    if (match) {
      const key = match[1].toLowerCase();
      const financialYear = normalizeYear(match[2]);
      const groupKey = `${key}:${financialYear}`;
      if (categories[key] && financialYear && !seenGroups.has(groupKey)) {
        seenGroups.add(groupKey);
        groups.push({ index, estimateType: categories[key], financialYear });
      }
    }
  });
  if (!groups.length) throw new Error('No supported estimate columns found');

  const totals = groups.map((group, index) => {
    const nextStart = groups[index + 1]?.index ?? columnHeaders.length;
    let totalColumn = -1;
    for (let column = group.index; column < nextStart; column += 1) {
      if (cellText(columnHeaders[column]).trim().toLowerCase() === 'total') totalColumn = column;
    }
    return { ...group, totalColumn };
  }).filter((group) => group.totalColumn >= 0);
  if (!totals.length) throw new Error('Could not map estimate types to Total columns');

  const netRow = rows.slice(headerIndex + 2).find((row) => row?.some((cell) => cellText(cell).trim().toLowerCase() === 'net'));
  if (!netRow) throw new Error('Department net-total row not found');

  return totals.flatMap((total) => {
    const amount = valueAt(netRow, total.totalColumn);
    if (amount === undefined) return [];
    return [{
      financialYear: total.financialYear,
      governmentLevel: 'Union Government',
      department,
      category: 'Department net allocation',
      estimateType: total.estimateType,
      amount,
      unit: 'INR crore',
      source: `Union Budget ${budgetPeriod} Detailed Demands for Grants`,
      sourceUrl: fileUrl,
      dataStatus: 'Verified official',
      notes: `Net department total from official workbook ${workbookNumber}; original source list: ${sourcePage}`
    }];
  });
}

function pdfLines(items) {
  const lines = [];
  for (const item of items.filter((entry) => entry.str.trim()).sort((first, second) => second.transform[5] - first.transform[5] || first.transform[4] - second.transform[4])) {
    const y = item.transform[5];
    let line = lines.find((candidate) => Math.abs(candidate.y - y) < 3);
    if (!line) {
      line = { y, items: [] };
      lines.push(line);
    }
    line.items.push({ text: item.str.trim(), x: item.transform[4] });
  }
  return lines.map((line) => ({ ...line, items: line.items.sort((first, second) => first.x - second.x) }));
}

function departmentFromPdf(items) {
  for (const item of items) {
    const match = item.str.trim().match(/^No\.\s*\d+\s*\/\s*(.+)$/i);
    if (match) return match[1].trim();
  }

  const demandHeading = items.find((item) => /DEMAND NO\./i.test(item.str));
  if (!demandHeading) return '';
  const headingY = demandHeading.transform[5];
  const nextLine = items
    .filter((item) => item.transform[5] < headingY && headingY - item.transform[5] < 25 && !/^\s*\(/.test(item.str))
    .sort((first, second) => second.transform[5] - first.transform[5])[0];
  return nextLine?.str.trim() || '';
}

function pdfGroups(lines) {
  const header = lines.find((line) => line.items.some((item) => /^(Actual|Budget|Revised)\b/i.test(item.text)));
  if (!header) return [];
  const markers = header.items.filter((item) => /^(Actual|Budget|Revised)\b/i.test(item.text));

  return markers.flatMap((marker, index) => {
    const nextMarker = markers[index + 1];
    const groupItems = header.items.filter((item) => item.x >= marker.x && (!nextMarker || item.x < nextMarker.x));
    const periodMatch = groupItems.map((item) => item.text).join(' ').match(/(\d{4})\s*-\s*(\d{4})/);
    if (!periodMatch) return [];
    const estimateType = /^(Actual)/i.test(marker.text)
      ? 'Actual'
      : /^(Revised)/i.test(marker.text) ? 'Revised Estimate' : 'Budget Estimate';

    return [{ x: marker.x, endX: nextMarker?.x ?? Infinity, estimateType, financialYear: normalizeYear(`${periodMatch[1]}-${periodMatch[2]}`) }];
  });
}

function numberFromPdfText(text) {
  const normalized = String(text || '').replace(/,/g, '').trim();
  if (!/^-?(?:\d+\.?\d*|\.\d+)$/.test(normalized)) return undefined;
  const amount = Number(normalized);
  return Number.isFinite(amount) ? amount : undefined;
}

async function recordsFromPdf(fileUrl, sourcePage, workbookNumber) {
  const response = await axios.get(fileUrl, { responseType: 'arraybuffer', timeout: 45000 });
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const document = await pdfjs.getDocument({ data: new Uint8Array(response.data), disableFontFace: true, useSystemFonts: true }).promise;
  try {
    const page = await document.getPage(1);
    const items = (await page.getTextContent()).items;
    const department = departmentFromPdf(items);
    if (!department) throw new Error('Department title not found in PDF header');

    const lines = pdfLines(items);
    const groups = pdfGroups(lines);
    if (!groups.length) throw new Error('Fiscal-year estimate headers not found in PDF');

    const netRows = lines.filter((line) => line.items.some((item) => item.text.toLowerCase() === 'net'));
    let netValues;
    for (const line of netRows) {
      const values = groups.map((group) => {
        const groupValues = line.items
          .filter((item) => item.x >= group.x && item.x < group.endX)
          .map((item) => numberFromPdfText(item.text))
          .filter((amount) => amount !== undefined);
        return groupValues.at(-1);
      });
      if (values.some((amount) => amount !== undefined)) {
        netValues = values;
        break;
      }
    }
    if (!netValues) throw new Error('Net-total row not found in PDF');

    return groups.flatMap((group, index) => {
      const amount = netValues[index];
      if (amount === undefined) return [];
      return [{
        financialYear: group.financialYear,
        governmentLevel: 'Union Government',
        department,
        category: 'Department net allocation',
        estimateType: group.estimateType,
        amount,
        unit: 'INR crore',
        source: `Union Budget ${budgetPeriod} Detailed Demands for Grants`,
        sourceUrl: fileUrl,
        dataStatus: 'Verified official',
        notes: `Net department total extracted from official PDF workbook ${workbookNumber}; original source list: ${sourcePage}`
      }];
    });
  } finally {
    await document.cleanup();
  }
}

async function main() {
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI is required to import official budget data');

  const indexUrl = new URL('index.php', budgetRoot).href;
  const page = await axios.get(indexUrl, { timeout: 30000 });
  let sourcePage = indexUrl;
  const collectSources = (html) => {
    const $ = cheerio.load(html);
    const spreadsheets = new Set();
    const pdfs = new Set();
    $('a[href]').each((_, anchor) => {
      const href = $(anchor).attr('href');
      if (/^doc\/eb\/sbe\d+\.xlsx$/i.test(href || '')) spreadsheets.add(new URL(href, budgetRoot).href);
      if (/^doc\/eb\/sbe\d+\.pdf$/i.test(href || '')) pdfs.add(new URL(href, budgetRoot).href);
    });
    return { spreadsheets, pdfs };
  };
  let { spreadsheets: spreadsheetUrls, pdfs: pdfUrls } = collectSources(page.data);
  let preferPdf = false;
  if (!spreadsheetUrls.size && !pdfUrls.size) {
    sourcePage = new URL('expenditure_budget.php', budgetRoot).href;
    const legacyPage = await axios.get(sourcePage, { timeout: 30000 });
    ({ spreadsheets: spreadsheetUrls, pdfs: pdfUrls } = collectSources(legacyPage.data));
    preferPdf = true;
  }
  const workbookUrls = preferPdf ? pdfUrls : spreadsheetUrls.size ? spreadsheetUrls : pdfUrls;
  if (!workbookUrls.size) throw new Error(`No Detailed Demand files found on ${sourcePage}`);

  const records = [];
  const failures = [];
  const skippedWorkbooks = [...workbookUrls].filter((url) => skippedWorkbookNumbers.has(Number(url.match(/sbe(\d+)\.(?:xlsx|pdf)/i)?.[1] || 0)));
  const sortedWorkbookUrls = [...workbookUrls].filter((url) => !skippedWorkbookNumbers.has(Number(url.match(/sbe(\d+)\.(?:xlsx|pdf)/i)?.[1] || 0))).sort((first, second) => {
    const firstNumber = Number(first.match(/sbe(\d+)\.(?:xlsx|pdf)/i)?.[1] || 0);
    const secondNumber = Number(second.match(/sbe(\d+)\.(?:xlsx|pdf)/i)?.[1] || 0);
    return firstNumber - secondNumber;
  }).slice(0, workbookLimit);
  for (const fileUrl of sortedWorkbookUrls) {
    const workbookNumber = Number(fileUrl.match(/sbe(\d+)\.(?:xlsx|pdf)/i)?.[1] || 0);
    try {
      records.push(...await (fileUrl.toLowerCase().endsWith('.xlsx')
        ? recordsFromWorkbook(fileUrl, sourcePage, workbookNumber)
        : recordsFromPdf(fileUrl, sourcePage, workbookNumber)));
    } catch (error) {
      failures.push({ fileUrl, message: error.message });
    }
  }

  const currentBudgetYear = budgetPeriod.slice(0, 4);
  const canonicalRecords = records.filter((record) =>
    record.estimateType !== 'Budget Estimate' || record.financialYear.startsWith(`${currentBudgetYear}-`)
  );

  if (!canonicalRecords.length) {
    console.error(JSON.stringify(failures.slice(0, 5), null, 2));
    throw new Error(`No valid department totals found. Failed files: ${failures.length}`);
  }

  if (dryRun) {
    const estimateTypes = canonicalRecords.reduce((totals, record) => {
      totals[record.estimateType] = (totals[record.estimateType] || 0) + 1;
      return totals;
    }, {});
    const keyedRecords = new Map();
    canonicalRecords.forEach((record) => {
      const key = [record.financialYear, record.governmentLevel, record.department, record.category, record.estimateType, record.sourceUrl].join('|');
      const entries = keyedRecords.get(key) || [];
      entries.push(record);
      keyedRecords.set(key, entries);
    });
    const overlaps = [...keyedRecords.values()].filter((entries) => entries.length > 1);
    console.log(JSON.stringify({
      budgetPeriod,
      sourcePage,
      officialWorkbooks: workbookUrls.size,
      processedWorkbooks: sortedWorkbookUrls.length,
      skippedWorkbooks,
      sourceRows: records.length,
      canonicalRows: canonicalRecords.length,
      estimateTypes,
      overlappingKeys: overlaps.length,
      overlapExamples: overlaps.slice(0, 10).map((entries) => entries.map(({ department, financialYear, estimateType, amount, sourceUrl }) => ({ department, financialYear, estimateType, amount, sourceUrl }))),
      sample: canonicalRecords.slice(0, 5),
      failedWorkbooks: failures
    }, null, 2));
    return;
  }

  if (failures.length) {
    throw new Error(`Refusing partial import: ${failures.length} of ${workbookUrls.size} workbooks failed. Run again after the official source is available.`);
  }

  await mongoose.connect(process.env.MONGO_URI);
  await GovernmentExpenditure.syncIndexes();
  await GovernmentExpenditure.deleteMany({
    governmentLevel: 'Union Government',
    source: `Union Budget ${budgetPeriod} Detailed Demands for Grants`
  });
  const operations = canonicalRecords.map((record) => ({
    updateOne: {
      filter: {
        financialYear: record.financialYear,
        governmentLevel: record.governmentLevel,
        department: record.department,
        category: record.category,
        estimateType: record.estimateType
      },
      update: { $set: record },
      upsert: true
    }
  }));
  const result = await GovernmentExpenditure.bulkWrite(operations, { ordered: false });
  console.log(JSON.stringify({
    budgetPeriod,
    sourcePage,
    officialWorkbooks: workbookUrls.size,
    processedWorkbooks: sortedWorkbookUrls.length,
    skippedWorkbooks,
    sourceRows: records.length,
    importedRows: canonicalRecords.length,
    inserted: result.upsertedCount,
    updated: result.modifiedCount,
    failedWorkbooks: failures
  }, null, 2));
  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error.message);
  if (mongoose.connection.readyState) await mongoose.disconnect();
  process.exitCode = 1;
});