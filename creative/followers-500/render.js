const path = require("path");
const { spawn } = require("child_process");
const { chromium } = require(path.join(process.env.NPM_ROOT, "playwright"));

const FFMPEG = process.env.FFMPEG;
const FPS = 30;

async function open(browser, H) {
  const page = await browser.newPage({ viewport: { width: 1080, height: H }, deviceScaleFactor: 1 });
  await page.goto("file://" + path.join(__dirname, "index.html") + "?h=" + H);
  await page.evaluate(() => document.fonts.ready);
  const ok = await page.evaluate(() => document.fonts.check('900 40px "NSJ"') && document.fonts.check('500 40px "NSJ"'));
  if (!ok) throw new Error("font not loaded");
  return page;
}

async function stills(browser, H, times) {
  const page = await open(browser, H);
  for (const t of times) {
    await page.evaluate(t => render(t), t);
    await page.screenshot({ path: `still-${H}-${String(t).replace(".", "_")}.png` });
  }
  await page.close();
}

async function video(browser, H, out) {
  const page = await open(browser, H);
  const dur = await page.evaluate(() => window.DURATION);
  const frames = Math.round(dur * FPS);
  const ff = spawn(FFMPEG, [
    "-y", "-hide_banner", "-loglevel", "error",
    "-f", "image2pipe", "-framerate", String(FPS), "-i", "-",
    "-i", path.join(__dirname, "music.wav"),
    "-shortest",
    "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-pix_fmt", "yuv420p",
    "-r", String(FPS), "-c:a", "aac", "-b:a", "192k",
    "-movflags", "+faststart", out,
  ], { stdio: ["pipe", "inherit", "inherit"] });
  for (let i = 0; i < frames; i++) {
    await page.evaluate(t => render(t), i / FPS);
    const buf = await page.screenshot({ type: "png" });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once("drain", r));
  }
  ff.stdin.end();
  await new Promise((res, rej) => ff.on("close", c => c === 0 ? res() : rej(new Error("ffmpeg " + c))));
  await page.close();
  console.log("wrote", out, frames, "frames");
}

(async () => {
  const browser = await chromium.launch();
  const mode = process.argv[2];
  if (mode === "stills") {
    for (const H of [1920, 1350]) await stills(browser, H, [0.94, 2.81, 7.03, 11.44, 14.06]);
  } else {
    await video(browser, 1920, "followers-500_9x16.mp4");
    await video(browser, 1350, "followers-500_4x5.mp4");
  }
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
