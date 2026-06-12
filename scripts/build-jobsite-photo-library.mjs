import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const PROJECT_ROOT = process.cwd();
const CSV_PATH =
  process.argv[2] ?? '/Users/lisongjin/.codex/attachments/e216d2b4-1f9d-4c8d-98c3-edd00d5670d0/pasted-text.txt';
const OUT_ROOT = path.join(PROJECT_ROOT, 'public/jobsite-photos');
const IMAGE_DIR = path.join(OUT_ROOT, 'images');
const THUMB_DIR = path.join(OUT_ROOT, 'thumbs');
const INDEX_PATH = path.join(OUT_ROOT, 'jobsite-photo-index.json');
const GROUPS_PATH = path.join(OUT_ROOT, 'jobsite-photo-groups.json');
const REPORT_JSON_PATH = path.join(OUT_ROOT, 'processing-report.json');
const REPORT_MD_PATH = path.join(OUT_ROOT, 'processing-report.md');
const PAGE_PATH = path.join(OUT_ROOT, 'index.html');
const STANDALONE_PAGE_PATH = path.join(OUT_ROOT, 'index-standalone.html');
const IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'heic']);

function parseCsvLine(line) {
  const fields = [];
  let current = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const nextChar = line[index + 1];

    if (char === '"' && inQuotes && nextChar === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      fields.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  fields.push(current);
  return fields;
}

function readReviewRows() {
  const text = readFileSync(CSV_PATH, 'utf8').trim();
  const [headerLine, ...lines] = text.split(/\r?\n/);
  const headers = parseCsvLine(headerLine);

  return lines
    .filter(Boolean)
    .map((line) => {
      const values = parseCsvLine(line);
      return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? '']));
    });
}

function safeName(value) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72);
}

function makeOutputName(row, index) {
  const sourcePath = row['原始路径'];
  const originalBase = path.basename(sourcePath, path.extname(sourcePath));
  const datePart = (row['拍摄时间'] || row['月份'] || 'unknown').replace(/[^0-9]/g, '').slice(0, 14) || 'unknown';
  return `${String(index + 1).padStart(4, '0')}-${datePart}-${safeName(originalBase)}.jpg`;
}

function runSips(source, destination, maxSize) {
  const result = spawnSync(
    'sips',
    ['-Z', String(maxSize), '--setProperty', 'format', 'jpeg', '--setProperty', 'formatOptions', '82', source, '--out', destination],
    { encoding: 'utf8' },
  );

  if (result.status !== 0) {
    throw new Error((result.stderr || result.stdout || 'sips failed').trim());
  }
}

function fileSizeMB(filePath) {
  return Number((statSync(filePath).size / 1024 / 1024).toFixed(2));
}

function folderSizeBytes(dirPath) {
  const result = spawnSync('du', ['-sk', dirPath], { encoding: 'utf8' });
  if (result.status !== 0) return 0;
  return Number(result.stdout.trim().split(/\s+/)[0] ?? 0) * 1024;
}

mkdirSync(IMAGE_DIR, { recursive: true });
mkdirSync(THUMB_DIR, { recursive: true });

const rows = readReviewRows();
const usableRows = rows.filter((row) => row['审核状态'] !== 'reject');
const skippedRows = rows.filter((row) => row['审核状态'] === 'reject');
const photos = [];
const missing = [];
const failed = [];

usableRows.forEach((row, index) => {
  const sourcePath = row['原始路径'];
  const extension = path.extname(sourcePath).slice(1).toLowerCase();

  if (!existsSync(sourcePath)) {
    missing.push(row);
    return;
  }

  if (!IMAGE_EXTENSIONS.has(extension)) {
    failed.push({ ...row, error: `不支持的图片格式：${extension || '无扩展名'}` });
    return;
  }

  const outputName = makeOutputName(row, index);
  const imagePath = path.join(IMAGE_DIR, outputName);
  const thumbPath = path.join(THUMB_DIR, outputName);

  try {
    if (!existsSync(imagePath)) runSips(sourcePath, imagePath, 1600);
    if (!existsSync(thumbPath)) runSips(sourcePath, thumbPath, 420);

    photos.push({
      id: outputName.replace(/\.jpg$/, ''),
      status: row['审核状态'],
      type: row['类型'],
      month: row['月份'],
      shotAt: row['拍摄时间'],
      originalSizeMB: Number(row['大小MB'] || 0),
      originalPath: sourcePath,
      image: `images/${outputName}`,
      thumb: `thumbs/${outputName}`,
      imageSizeMB: fileSizeMB(imagePath),
      thumbSizeMB: fileSizeMB(thumbPath),
      fileName: path.basename(sourcePath),
    });
  } catch (error) {
    failed.push({ ...row, error: error.message });
  }

  if ((index + 1) % 100 === 0) {
    console.log(`processed ${index + 1}/${usableRows.length}`);
  }
});

const generatedAt = new Date().toISOString();
const summary = {
  generatedAt,
  sourceCsv: CSV_PATH,
  totalRows: rows.length,
  usableCandidates: usableRows.length,
  rejectedRows: skippedRows.length,
  processed: photos.length,
  missing: missing.length,
  failed: failed.length,
  outputSizeMB: Number((folderSizeBytes(OUT_ROOT) / 1024 / 1024).toFixed(2)),
};

const index = {
  summary,
  months: [...new Set(photos.map((photo) => photo.month))].sort(),
  photos,
};

writeFileSync(INDEX_PATH, `${JSON.stringify(index, null, 2)}\n`);

const groups = Object.entries(
  photos.reduce((acc, photo) => {
    const day = photo.shotAt ? photo.shotAt.slice(0, 10) : '未知日期';
    acc[day] ??= [];
    acc[day].push(photo);
    return acc;
  }, {}),
)
  .map(([day, groupPhotos]) => ({
    id: day.replace(/[^0-9A-Za-z_-]+/g, '-'),
    day,
    month: day === '未知日期' ? '未知日期' : day.slice(0, 7),
    count: groupPhotos.length,
    cover: groupPhotos[0]?.thumb ?? '',
    firstShotAt: groupPhotos[0]?.shotAt ?? '',
    lastShotAt: groupPhotos[groupPhotos.length - 1]?.shotAt ?? '',
    photos: groupPhotos.map((photo) => photo.id),
  }))
  .sort((a, b) => {
    if (a.day === '未知日期') return 1;
    if (b.day === '未知日期') return -1;
    return b.day.localeCompare(a.day);
  });

writeFileSync(
  GROUPS_PATH,
  `${JSON.stringify(
    {
      summary: {
        ...summary,
        groupCount: groups.length,
      },
      groups,
    },
    null,
    2,
  )}\n`,
);
writeFileSync(
  REPORT_JSON_PATH,
  `${JSON.stringify(
    {
      summary,
      rejected: skippedRows,
      missing,
      failed,
    },
    null,
    2,
  )}\n`,
);
writeFileSync(
  REPORT_MD_PATH,
  [
    '# 工地照片素材库处理报告',
    '',
    `- 生成时间：${generatedAt}`,
    `- 清单总行数：${summary.totalRows}`,
    `- 可用候选：${summary.usableCandidates}`,
    `- 已排除：${summary.rejectedRows}`,
    `- 成功处理：${summary.processed}`,
    `- 缺失文件：${summary.missing}`,
    `- 处理失败：${summary.failed}`,
    `- 输出目录大小：${summary.outputSizeMB} MB`,
    '',
    '原始 OPPO 互联文件夹只读使用，脚本不会删除、改名或移动原始照片。',
    '',
  ].join('\n'),
);

if (existsSync(PAGE_PATH)) {
  const pageHtml = readFileSync(PAGE_PATH, 'utf8');
  const standaloneHtml = pageHtml.replace(
    'window.__JOBSITE_PHOTO_INDEX__ = null;',
    `window.__JOBSITE_PHOTO_INDEX__ = ${JSON.stringify(index)};`,
  );
  writeFileSync(STANDALONE_PAGE_PATH, standaloneHtml);
}

console.log(JSON.stringify(summary, null, 2));
