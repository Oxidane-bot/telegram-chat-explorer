// CI 环境下的测试设置
const fs = require('fs');
const path = require('path');

// 确保 mock-data 目录存在
const mockDir = path.join(__dirname, 'mock-data');
if (!fs.existsSync(mockDir)) {
  fs.mkdirSync(mockDir, { recursive: true });
  console.log('创建 mock-data 目录成功');
}

// 如有其他 CI 特定的设置，可以在这里添加

console.log('CI 测试环境准备完成'); 