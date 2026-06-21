import { mkdir } from "node:fs/promises";
import { _electron as electron } from "playwright";
import electronPath from "electron";

await mkdir("reports", { recursive: true });

const app = await electron.launch({
  executablePath: electronPath,
  args: ["."],
  cwd: process.cwd()
});

try {
  const page = await app.firstWindow();
  await page.waitForSelector("#viewport", { timeout: 10_000 });
  await page.waitForTimeout(1500);
  const metrics = await page.evaluate(() => {
    const canvas = document.querySelector("#viewport");
    const rect = canvas.getBoundingClientRect();
    const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
    const sample = {
      width: canvas.width,
      height: canvas.height,
      cssWidth: rect.width,
      cssHeight: rect.height,
      hasWebgl: Boolean(gl),
      nonZeroPixels: 0,
      colorSum: 0,
      toolbarText: document.querySelector(".brand")?.textContent || ""
    };
    if (!gl) return sample;
    const pixels = new Uint8Array(4 * 80 * 80);
    gl.readPixels(
      Math.max(0, Math.floor(canvas.width / 2 - 40)),
      Math.max(0, Math.floor(canvas.height / 2 - 40)),
      80,
      80,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      pixels
    );
    for (let i = 0; i < pixels.length; i += 4) {
      if (pixels[i] || pixels[i + 1] || pixels[i + 2] || pixels[i + 3]) {
        sample.nonZeroPixels += 1;
      }
      sample.colorSum += pixels[i] + pixels[i + 1] + pixels[i + 2];
    }
    return sample;
  });

  await page.screenshot({ path: "reports/visual_smoke.png", fullPage: true });

  if (!metrics.hasWebgl) {
    throw new Error("Canvas did not expose a WebGL context.");
  }
  if (metrics.cssWidth < 500 || metrics.cssHeight < 500) {
    throw new Error(`Viewport too small: ${metrics.cssWidth}x${metrics.cssHeight}`);
  }
  if (metrics.nonZeroPixels < 200 || metrics.colorSum === 0) {
    throw new Error(`Canvas appears blank: ${JSON.stringify(metrics)}`);
  }
  if (!metrics.toolbarText.includes("Model 3D Print")) {
    throw new Error("Toolbar brand text missing.");
  }
  console.log(JSON.stringify(metrics, null, 2));
} finally {
  await app.close();
}

