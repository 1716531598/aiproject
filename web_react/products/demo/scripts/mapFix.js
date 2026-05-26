const fs = require('fs');
const { spawnSync } = require('child_process');

// 执行 eslint 命令并获取 JSON 格式的输出

const command = 'eslint --fix ./src';
const eslintOutput = spawnSync(command, {
  stdio: ['pipe', 'pipe', 'pipe'],
  shell: true,
});

const _errInfo = eslintOutput.stdout.toString('utf-8');

const outputLines = _errInfo
  .split('\n')
  ?.filter((item) => item !== '' && !item?.includes('problems ('));

const errorObjects = [];
let currentFilePath = '';

for (const errorInfo of outputLines) {
  if (!errorInfo.startsWith(' ')) {
    // This is a new file path
    currentFilePath = errorInfo;
  } else {
    // This is an error line
    const [, lineNumber, ruleId] = errorInfo
      .trim()
      .match(/(\d+:\d+)\s+error\s+(.+)/);

    if (currentFilePath) {
      const errorObject = {
        filePath: currentFilePath,
        line: lineNumber?.split(':')?.[0],
      };
      if (ruleId.includes('array-callback-return')) {
        errorObjects.push(errorObject);
      }
    }
  }
}

// 遍历 ESLint 报告中的每个错误
errorObjects.forEach((issue) => {
  // 获取错误所在文件的路径和行号
  const filePath = issue.filePath;
  const lineNumber = issue.line;

  // 读取文件内容
  const fileContent = fs.readFileSync(filePath, 'utf-8').split('\n');

  // 获取错误所在行的内容
  const originalLine = fileContent[lineNumber - 1];

  // 替换 .map 为 .forEach
  const modifiedLine = originalLine.replace(
    /\.(map)\(/,
    (match, p1) => `.${p1 === 'map' ? 'forEach' : p1}(`,
  );

  // 更新文件内容
  fileContent[lineNumber - 1] = modifiedLine;

  // 将更新后的内容写回文件
  fs.writeFileSync(filePath, fileContent.join('\n'), 'utf-8');

  console.log(
    `Fixed issue in ${filePath} at line ${lineNumber}: ${originalLine}`,
  );
});

console.log('Done.');
