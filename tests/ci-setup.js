// CI 环境下的测试设置
const fs = require('fs');
const path = require('path');

console.log('CI 环境检查开始...');
console.log('Node.js 版本:', process.version);
console.log('当前工作目录:', process.cwd());
console.log('CI 环境变量:', process.env.CI ? 'true' : 'false');
console.log('NODE_ENV:', process.env.NODE_ENV);

// 确保 mock-data 目录存在
const mockDir = path.join(__dirname, 'mock-data');
if (!fs.existsSync(mockDir)) {
  fs.mkdirSync(mockDir, { recursive: true });
  console.log('创建 mock-data 目录成功:', mockDir);
}

// 确保 test-data 目录存在
const testDataDir = path.join(__dirname, 'test-data');
if (!fs.existsSync(testDataDir)) {
  fs.mkdirSync(testDataDir, { recursive: true });
  console.log('创建 test-data 目录成功:', testDataDir);
}

// 检查测试文件是否存在
const testFiles = fs.readdirSync(__dirname).filter(file => file.endsWith('.spec.js'));
console.log('发现测试文件:', testFiles);

// 检查测试模拟数据
let mockDataExists = false;
try {
  if (fs.existsSync(path.join(mockDir, 'simple-chat.json'))) {
    mockDataExists = true;
    console.log('模拟数据已存在');
  } else {
    console.log('模拟数据不存在，将在测试中创建');
  }
} catch (err) {
  console.error('检查模拟数据时出错:', err);
}

// 如有其他 CI 特定的设置，可以在这里添加

console.log('CI 测试环境准备完成'); 