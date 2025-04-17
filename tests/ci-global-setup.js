// CI环境的全局设置
const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * CI环境的全局设置
 * @param {import('@playwright/test').FullConfig} config
 */
async function globalSetup(config) {
  console.log('===== CI环境全局设置开始 =====');
  
  // 输出系统信息
  console.log('操作系统:', os.platform(), os.release());
  console.log('CPU架构:', os.arch());
  console.log('可用内存:', Math.round(os.freemem() / 1024 / 1024) + 'MB');
  console.log('总内存:', Math.round(os.totalmem() / 1024 / 1024) + 'MB');
  console.log('CPU:', os.cpus().length, '核心');
  
  // 输出环境变量
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('CI:', process.env.CI);
  
  // 设置Electron专用环境变量
  process.env.ELECTRON_ENABLE_LOGGING = 'true';
  process.env.ELECTRON_ENABLE_STACK_DUMPING = 'true';
  process.env.ELECTRON_NO_ATTACH_CONSOLE = 'true';
  
  // 检查测试目录和文件
  const testDir = path.resolve(__dirname);
  console.log('测试目录:', testDir);
  
  const files = fs.readdirSync(testDir);
  const specFiles = files.filter(f => f.endsWith('.spec.js'));
  console.log('测试文件:', specFiles);
  
  // 为所有测试创建必要的目录和文件
  ensureMockDirectories();
  
  console.log('===== CI环境全局设置完成 =====');
}

function ensureMockDirectories() {
  const dirs = [
    path.resolve(__dirname, 'mock-data'),
    path.resolve(__dirname, 'test-data')
  ];
  
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`创建目录: ${dir}`);
    } else {
      console.log(`目录已存在: ${dir}`);
    }
  }
}

module.exports = globalSetup; 