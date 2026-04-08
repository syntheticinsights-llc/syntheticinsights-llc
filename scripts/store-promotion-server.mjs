import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import process from 'node:process';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import {
  DEFAULT_OUTPUT_DIR,
  EXPORT_ROOT_FOLDER_NAME,
  exportStorePromotion,
} from './store-promotion-export-lib.mjs';

const HOST = '127.0.0.1';
const DEFAULT_PORT = 8000;
const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const MIME_TYPES = {
  '.command': 'text/plain; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

let activeExport = null;
let activeJobId = 0;
let activeExportState = null;
const execFileAsync = promisify(execFile);

function readArgValue(name) {
  const index = process.argv.indexOf(name);

  if (index === -1) {
    return null;
  }

  const nextValue = process.argv[index + 1];

  if (!nextValue || nextValue.startsWith('--')) {
    throw new Error(`${name} 缺少值`);
  }

  return nextValue;
}

function getPort() {
  const port = Number(readArgValue('--port') ?? process.env.PORT ?? DEFAULT_PORT);

  if (!Number.isInteger(port) || port <= 0) {
    throw new Error(`非法端口: ${process.env.PORT}`);
  }

  return port;
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  response.end(JSON.stringify(payload));
}

function sendText(response, statusCode, body) {
  response.writeHead(statusCode, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  response.end(body);
}

async function readJsonBody(request) {
  const chunks = [];

  for await (const chunk of request) {
    chunks.push(chunk);
  }

  const rawBody = Buffer.concat(chunks).toString('utf8').trim();

  if (!rawBody) {
    return {};
  }

  return JSON.parse(rawBody);
}

function buildStaticPath(urlPathname) {
  const normalizedPath = decodeURIComponent(urlPathname === '/' ? '/index.html' : urlPathname);
  const filePath = path.normalize(path.join(ROOT_DIR, normalizedPath));

  if (!filePath.startsWith(ROOT_DIR)) {
    throw new Error('非法路径');
  }

  return filePath;
}

async function handleStatic(response, url) {
  let filePath;

  try {
    filePath = buildStaticPath(url.pathname);
  } catch {
    sendText(response, 403, 'Forbidden');
    return;
  }

  try {
    const stats = await fs.stat(filePath);
    const finalPath = stats.isDirectory() ? path.join(filePath, 'index.html') : filePath;
    const buffer = await fs.readFile(finalPath);
    const ext = path.extname(finalPath);

    response.writeHead(200, {
      'Content-Type': MIME_TYPES[ext] ?? 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    response.end(buffer);
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      sendText(response, 404, 'Not Found');
      return;
    }

    sendText(response, 500, 'Static file error');
  }
}

function normalizeExportRequest(payload) {
  const languages = payload.mode === 'all'
    ? []
    : [payload.language].filter(Boolean);
  const platforms = Array.isArray(payload.platforms)
    ? payload.platforms.filter(Boolean)
    : [];

  if (platforms.length === 0) {
    throw new Error('请至少选择一个导出平台');
  }

  if (payload.mode !== 'all' && languages.length === 0) {
    throw new Error('缺少导出语言');
  }

  return {
    languages,
    platforms,
    outputDir: payload.outputDir || DEFAULT_OUTPUT_DIR,
  };
}

async function pickDirectory() {
  if (process.platform !== 'darwin') {
    throw new Error('当前仅支持 macOS 原生目录选择');
  }

  const { stdout } = await execFileAsync('osascript', [
    '-e',
    `POSIX path of (choose folder with prompt "选择 ${EXPORT_ROOT_FOLDER_NAME} 导出目录")`,
  ]);
  const selectedPath = stdout.trim().replace(/\/$/, '');

  if (!selectedPath) {
    throw new Error('未选择目录');
  }

  return {
    parentDir: selectedPath,
    outputDir: path.join(selectedPath, EXPORT_ROOT_FOLDER_NAME),
  };
}

async function handleExportRequest(request, response) {
  if (activeExport) {
    sendJson(response, 409, {
      error: '已有导出任务在执行',
      jobId: activeJobId,
    });
    return;
  }

  let payload;

  try {
    payload = await readJsonBody(request);
  } catch {
    sendJson(response, 400, { error: '请求体不是合法 JSON' });
    return;
  }

  let exportRequest;

  try {
    exportRequest = normalizeExportRequest(payload);
  } catch (error) {
    sendJson(response, 400, { error: error instanceof Error ? error.message : '导出参数错误' });
    return;
  }

  activeJobId += 1;
  const jobId = activeJobId;
  activeExportState = {
    jobId,
    status: 'running',
    done: 0,
    total: 0,
    outputDir: exportRequest.outputDir,
    languages: [],
    platforms: exportRequest.platforms,
    slides: [],
    error: null,
  };

  activeExport = exportStorePromotion({
    baseUrl: `http://${HOST}:${getPort()}/store_promotion/`,
    outputDir: exportRequest.outputDir,
    languages: exportRequest.languages,
    platforms: exportRequest.platforms,
    onStart(progress) {
      activeExportState = {
        ...activeExportState,
        total: progress.total,
        languages: progress.languages,
        platforms: progress.platforms,
        slides: progress.slides,
      };
    },
    onProgress(progress) {
      activeExportState = {
        ...activeExportState,
        done: progress.done,
        total: progress.total,
      };
    },
  });

  try {
    const result = await activeExport;
    activeExportState = {
      ...activeExportState,
      status: 'completed',
      done: result.total,
      total: result.total,
      outputDir: result.outputDir,
      languages: result.languages,
      platforms: result.platforms,
      slides: result.slides,
      error: null,
    };

    sendJson(response, 200, {
      jobId,
      outputDir: result.outputDir,
      total: result.total,
      languages: result.languages,
      platforms: result.platforms,
      slides: result.slides,
    });
  } catch (error) {
    activeExportState = {
      ...activeExportState,
      status: 'failed',
      error: error instanceof Error ? error.message : '导出失败',
    };
    sendJson(response, 500, {
      jobId,
      error: error instanceof Error ? error.message : '导出失败',
    });
  } finally {
    activeExport = null;
  }
}

async function handlePickDirectory(response) {
  try {
    const result = await pickDirectory();

    sendJson(response, 200, result);
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 1) {
      sendJson(response, 400, { error: '已取消选择目录' });
      return;
    }

    sendJson(response, 500, {
      error: error instanceof Error ? error.message : '目录选择失败',
    });
  }
}

async function handleRequest(request, response) {
  const url = new URL(request.url ?? '/', `http://${HOST}:${getPort()}`);

  if (request.method === 'GET' && url.pathname === '/api/store-promotion/health') {
    sendJson(response, 200, {
      ok: true,
      outputDir: DEFAULT_OUTPUT_DIR,
      busy: activeExport != null,
    });
    return;
  }

  if (request.method === 'GET' && url.pathname === '/api/store-promotion/export-status') {
    sendJson(response, 200, {
      busy: activeExport != null,
      ...(activeExportState ?? {
        jobId: null,
        status: 'idle',
        done: 0,
        total: 0,
        outputDir: null,
        languages: [],
        platforms: [],
        slides: [],
        error: null,
      }),
    });
    return;
  }

  if (request.method === 'POST' && url.pathname === '/api/store-promotion/export') {
    await handleExportRequest(request, response);
    return;
  }

  if (request.method === 'POST' && url.pathname === '/api/store-promotion/pick-directory') {
    await handlePickDirectory(response);
    return;
  }

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    sendText(response, 405, 'Method Not Allowed');
    return;
  }

  await handleStatic(response, url);
}

function startServer() {
  const port = getPort();
  const server = http.createServer((request, response) => {
    handleRequest(request, response).catch((error) => {
      sendJson(response, 500, {
        error: error instanceof Error ? error.message : 'Server error',
      });
    });
  });

  server.listen(port, HOST, () => {
    console.log(`Store Promotion server running at http://${HOST}:${port}/store_promotion/`);
  });
}

startServer();
