const puppeteer = require('puppeteer-core');
const fs = require('fs');

// 设置 Chrome 路径（使用系统自带的）
const executablePath = '/usr/bin/google-chrome'; // Ubuntu 默认路径

async function main() {
  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-extensions',
      '--disable-features=VizDisplayCompositor',
      '--ignore-certificate-errors',
      '--disable-web-security',
      '--allow-running-insecure-content'
    ]
  });

  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

  try {
    await page.goto(TARGET_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.waitForSelector(SELECTOR, { timeout: 10000 });
    const content = await page.$eval(SELECTOR, el => el.innerText.trim());

    console.log('当前内容:', content);

    let lastContent = '';
    if (fs.existsSync(CACHE_FILE)) {
      lastContent = fs.readFileSync(CACHE_FILE, 'utf8');
    }

    if (content !== lastContent) {
      console.log('内容发生变化！发送通知...');
      await sendToServerChan(content);
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
