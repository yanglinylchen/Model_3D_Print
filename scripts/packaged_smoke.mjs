import { access, mkdir } from "node:fs/promises";
import { _electron as electron } from "playwright";

const executablePath = "dist/mac-arm64/Model 3D Print.app/Contents/MacOS/Model 3D Print";
const failedRequests = [];
const pageErrors = [];

await access(executablePath);
await mkdir("reports", { recursive: true });

const app = await electron.launch({
  executablePath,
  args: [],
  cwd: process.cwd()
});

try {
  const page = await app.firstWindow();
  page.on("requestfailed", (request) => {
    failedRequests.push(`${request.url()} ${request.failure()?.errorText || ""}`.trim());
  });
  page.on("pageerror", (error) => {
    pageErrors.push(error.message);
  });

  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForSelector("#viewport", { timeout: 10_000 });
  await page.waitForFunction(() => {
    return document.querySelector("#blockCount")?.textContent?.includes("0 / 10000");
  }, { timeout: 10_000 });
  await page.waitForTimeout(1500);

  const viewport = await page.locator("#viewport").boundingBox();
  await page.mouse.click(viewport.x + viewport.width / 2, viewport.y + viewport.height / 2);
  await page.waitForTimeout(500);
  await page.mouse.click(viewport.x + viewport.width / 2, viewport.y + viewport.height / 2 + 20);
  await page.waitForTimeout(500);
  await page.locator("#selectMode").click();
  await page.waitForTimeout(200);
  await page.mouse.click(viewport.x + viewport.width / 2, viewport.y + viewport.height / 2);
  await page.waitForTimeout(500);

  const metrics = await page.evaluate(() => {
    const canvas = document.querySelector("#viewport");
    const rect = canvas.getBoundingClientRect();
    const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
    const materialButtons = document.querySelectorAll("#materialList [data-material]").length;
    const shapeButtons = document.querySelectorAll("#shapeList [data-shape]").length;
    const sample = {
      width: canvas.width,
      height: canvas.height,
      cssWidth: rect.width,
      cssHeight: rect.height,
      hasWebgl: Boolean(gl),
      materialButtons,
      shapeButtons,
      nonZeroPixels: 0,
      colorSum: 0,
      blockCountText: document.querySelector("#blockCount")?.textContent || "",
      selectionInfo: document.querySelector("#selectionInfo")?.textContent || "",
      activeModeText: document.querySelector(".mode-toggle .active")?.textContent || ""
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

  await page.screenshot({ path: "reports/packaged_smoke.png", fullPage: true });

  if (failedRequests.length) {
    throw new Error(`Packaged app has failed requests: ${failedRequests.join("; ")}`);
  }
  if (pageErrors.length) {
    throw new Error(`Packaged app has page errors: ${pageErrors.join("; ")}`);
  }
  if (!metrics.hasWebgl) {
    throw new Error("Packaged app canvas did not expose a WebGL context.");
  }
  if (metrics.materialButtons !== 4) {
    throw new Error(`Material controls did not render: ${JSON.stringify(metrics)}`);
  }
  if (metrics.shapeButtons !== 7) {
    throw new Error(`Shape controls did not render all shapes: ${JSON.stringify(metrics)}`);
  }
  if (metrics.nonZeroPixels < 200 || metrics.colorSum === 0) {
    throw new Error(`Packaged canvas appears blank: ${JSON.stringify(metrics)}`);
  }
  if (!metrics.blockCountText.includes("2 / 10000")) {
    throw new Error(`Packaged mouse placement did not add a block: ${metrics.blockCountText}`);
  }
  if (metrics.activeModeText !== "選取") {
    throw new Error(`Packaged select mode did not activate: ${JSON.stringify(metrics)}`);
  }
  if (metrics.selectionInfo.includes("尚未選取")) {
    throw new Error(`Packaged select mode did not select a block: ${JSON.stringify(metrics)}`);
  }
  console.log(JSON.stringify(metrics, null, 2));
} finally {
  await app.close();
}
