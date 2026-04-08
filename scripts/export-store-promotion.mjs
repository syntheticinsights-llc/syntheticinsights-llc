import process from 'node:process';
import {
  DEFAULT_BASE_URL,
  DEFAULT_OUTPUT_DIR,
  exportStorePromotion,
} from './store-promotion-export-lib.mjs';

function printHelp() {
  console.log(`用法:
  npm run store-promotion:export -- [options]

选项:
  --base-url <url>      页面根地址，默认 ${DEFAULT_BASE_URL}
  --output-dir <path>   输出目录，默认 ${DEFAULT_OUTPUT_DIR}
  --lang <codes>        语言，支持重复传入或逗号分隔
  --platform <codes>    平台，支持重复传入或逗号分隔
  --slide <keys>        画板，支持重复传入或逗号分隔
  --help                显示帮助
`);
}

function readMultiValue(args, name) {
  const values = [];

  for (let index = 0; index < args.length; index += 1) {
    if (args[index] !== name) {
      continue;
    }

    const nextValue = args[index + 1];

    if (!nextValue || nextValue.startsWith('--')) {
      throw new Error(`${name} 缺少值`);
    }

    values.push(
      ...nextValue
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    );
  }

  return values;
}

function readSingleValue(args, name, fallback) {
  const index = args.indexOf(name);

  if (index === -1) {
    return fallback;
  }

  const nextValue = args[index + 1];

  if (!nextValue || nextValue.startsWith('--')) {
    throw new Error(`${name} 缺少值`);
  }

  return nextValue;
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help')) {
    printHelp();
    return;
  }

  const baseUrl = readSingleValue(args, '--base-url', DEFAULT_BASE_URL);
  const outputDir = readSingleValue(args, '--output-dir', DEFAULT_OUTPUT_DIR);
  const requestedLanguages = readMultiValue(args, '--lang');
  const requestedPlatforms = readMultiValue(args, '--platform');
  const requestedSlides = readMultiValue(args, '--slide');
  const result = await exportStorePromotion({
    baseUrl,
    outputDir,
    languages: requestedLanguages,
    platforms: requestedPlatforms,
    slides: requestedSlides,
    onProgress(progress) {
      console.log(
        `[${progress.done}/${progress.total}] ${progress.platform}/${progress.language}/${progress.slide} -> ${progress.filePath}`,
      );
    },
  });

  console.log(`导出完成: ${result.outputDir}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
