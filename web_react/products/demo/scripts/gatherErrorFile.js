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
    const [, , ruleId] = errorInfo.trim().match(/(\d+:\d+)\s+error\s+(.+)/);

    if (currentFilePath && ruleId.includes('no-param-reassign')) {
      errorObjects.push(currentFilePath);
      currentFilePath = null;
    }
  }
}

console.log('no-param-reassign------error', errorObjects);
