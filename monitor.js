const puppeteer = require('puppeteer');
const fs = require('fs');

// 配置参数（从环境变量读取）
const TARGET_URL = process.env.TARGET_URL || 'https://t.10jqka.com.cn/lgt/user_page/?userid=749804795#/';
const SELECTOR = process.env.SELECTOR || '.all_list-count';
const SEND_KEY = process.env.SEND_KEY;

// 本地缓存文件路径
const CACHE_FILE = './last-content.txt';

async function main() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // 设置用户代理，避免被识别为机器人
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

  try {
    // 访问目标页面
    await page.goto(TARGET_URL, { waitUntil: 'networkidle2' });

    // 等待元素出现（最多等10秒）
    await page.waitForSelector(SELECTOR, { timeout: 10000 });

    // 获取文本内容
    const content = await page.$eval(SELECTOR, el => el.innerText.trim());

    console.log('当前内容:', content);

    // 读取上次内容
    let lastContent = '';
    if (fs.existsSync(CACHE_FILE)) {
      lastContent = fs.readFileSync(CACHE_FILE, 'utf8');
    }

    // 如果内容变化，发送通知
    if (content !== lastContent) {
      console.log('内容发生变化！发送通知...');
      await sendToServerChan(content);
      
      // 更新缓存
      fs.writeFileSync(CACHE_FILE, content);
    } else {
      console.log('内容未变化，不发送通知。');
    }
  } catch (error) {
    console.error('执行失败:', error.message);
  } finally {
    await browser.close();
  }
}

async function sendToServerChan(content) {
  const url = `https://sctapi.ftqq.com/${SEND_KEY}.send`;
  const data = {
    title: '网页内容更新提醒',
    desp: `URL: ${TARGET_URL}\n旧内容: ${lastContent}\n新内容: ${content}\n时间: ${new Date().toLocaleString()}`
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });

  console.log('通知已发送:', await res.text());
}

main();
