const puppeteer = require('puppeteer-core');
const dotenv = require('dotenv').config();
const { timeout, log, fail } = require('./utils');

try {
  if (dotenv.error) {
    throw dotenv.error;
  }
} catch (error) {
  if (error.errno === -2) {
    fail('Berkas .env tidak ditemukan! Silakan salin dari .env.example.');
    process.exit();
  }

  fail(`${error.message}.`);
  process.exit();
}

const inputOpts = { delay: Number(process.env.INPUT_DELAY) };

(async () => {
  log('Buka browser...');
  const browser = await puppeteer.launch({
    headless: !(process.env.DEBUG_MODE === 'true'),
    executablePath: process.env.EXECUTABLE_PATH,
    timeout: timeout(5),
  });

  try {
    const page = (await browser.pages())[0];
    await page.setViewport({
      width: Number(process.env.VIEWPORT_WIDTH),
      height: Number(process.env.VIEWPORT_HEIGHT),
    });

    // Buka halaman login
    log('Buka halaman login...');
    await page.goto('https://www.indihome.co.id/verifikasi-layanan/cek-email/');
    await page.waitForSelector('.verifikasi-jaringan-box [name="email"]', { timeout: timeout(5) });

    // Input email
    log('Input email...');
    await page.type(
      '.verifikasi-jaringan-box [name="email"]',
      process.env.USERNAME + String.fromCharCode(13),
      inputOpts);
    await page.waitForSelector('.verifikasi-jaringan-box [name="password"]', { timeout: timeout(5) });

    // Input password
    log('Input password...');
    await page.keyboard.type(
      process.env.PASSWORD + String.fromCharCode(13),
      inputOpts);
    await page.waitForNavigation({ timeout: timeout(5) });

    // Halaman beranda
    log('Masuk halaman beranda, klik menu user...');
    // await Promise.all([
      await page.click('span.nav-user', { delay: 632 });
      await page.waitForFunction('document.querySelector("#mySidenav").offsetWidth > 300');
      // await page.waitForSelector('#mySidenav .sidenav-link a');
    // ]);
    log('Sidenav terbuka, klik status langganan...');
    // log(await page.$eval('#mySidenav .sidenav-link a', el => el.outerHTML));
    await Promise.all([
      page.waitForNavigation({ timeout: timeout(5) }),
      page.click('#mySidenav .sidenav-link a', { delay: 217 }),
    ]);

    // Halaman status langganan
    log('Masuk halaman status langganan, ambil data...');
    await page.on('response', async (res) => {
      if (res.request().resourceType() === 'xhr') {
        try {
          const { data } = await res.json();

          log('Data berhasil diambil!', 'greenBright');

          delete data.packageName;
          delete data.menitQuota;
          delete data.menitUsage;
          delete data.channel;
          delete data.history;
          delete data.history2;
          console.log(data);

          if (Number(data.quota) != Number(process.env.QUOTA)) {
            log('Maaf, datanya ngaco. Silakan ulangi 10 menit lagi.', 'yellow');
          }

          log('Tutup browser...')
          await browser.close();
          log('Selesai 🎉');
        } catch (error) {
          await browser.close();
          fail(error.message);
        }
      }
    });
  } catch (error) {
    await browser.close();
    fail(error.message);
  }
})();
