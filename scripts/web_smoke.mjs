import { _electron as electron } from "playwright";
import electronPath from "electron";
import path from "node:path";

const root = process.cwd();
const webDir = path.join(root, "dist", "web");

const app = await electron.launch({
  executablePath: electronPath,
  args: [path.join(root, "scripts", "web_smoke_host.cjs")],
  cwd: root,
  env: {
    ...process.env,
    MODEL3D_WEB_DIR: webDir,
    MODEL3D_WEB_PORT: "4178"
  }
});

try {
  const page = await app.firstWindow();
  const consoleMessages = [];
  const pageErrors = [];
  page.on("console", (message) => consoleMessages.push(`${message.type()}: ${message.text()}`));
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("response", (response) => {
    if (response.status() >= 400) {
      consoleMessages.push(`response ${response.status()}: ${response.url()}`);
    }
  });
  page.on("requestfailed", (request) => {
    consoleMessages.push(`request failed: ${request.url()} ${request.failure()?.errorText || ""}`);
  });
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.waitForSelector("#viewport", { timeout: 10_000 });
  await page.waitForTimeout(1200);
  const debugState = () => JSON.stringify({ consoleMessages, pageErrors }, null, 2);
  const frameButton = page.locator("#touchShapeBar [data-shape='frame_cube']");
  if ((await frameButton.count()) === 0) {
    throw new Error(`Touch shape bar did not initialize:\n${debugState()}`);
  }
  await frameButton.click();
  await page.locator("[data-touch-move='up']").click();

  const metrics = await page.evaluate(() => {
    const canvas = document.querySelector("#viewport");
    const context = canvas.getContext("webgl2") || canvas.getContext("webgl");
    return {
      platform: window.model3d?.platform,
      location: window.location.href,
      hasWebgl: Boolean(context),
      touchHudDisplay: getComputedStyle(document.querySelector(".touch-hud")).display,
      touchShapeButtons: document.querySelectorAll("#touchShapeBar [data-shape]").length,
      cursorState: document.querySelector("#cursorState")?.textContent || "",
      modeState: document.querySelector("#modeState")?.textContent || "",
      leftPanelDisplay: getComputedStyle(document.querySelector(".left-panel")).display
    };
  });

  if (metrics.platform !== "web") throw new Error(`Web adapter did not install: ${JSON.stringify(metrics)}`);
  if (!metrics.location.startsWith("http://127.0.0.1:")) {
    throw new Error(`Web smoke did not load over HTTP: ${JSON.stringify(metrics)}`);
  }
  if (!metrics.hasWebgl) throw new Error(`WebGL did not initialize: ${JSON.stringify(metrics)}`);
  if (metrics.touchHudDisplay === "none") throw new Error(`Touch HUD did not appear: ${JSON.stringify(metrics)}`);
  if (metrics.touchShapeButtons !== 13) throw new Error(`Shape bar mismatch: ${JSON.stringify(metrics)}`);
  if (!metrics.cursorState.includes("0, 0, 1")) throw new Error(`Touch layer move failed: ${JSON.stringify(metrics)}`);
  if (!metrics.modeState.includes("框架方塊")) throw new Error(`Touch shape selection failed: ${JSON.stringify(metrics)}`);
  if (metrics.leftPanelDisplay !== "none") throw new Error(`Tablet layout did not collapse panels: ${JSON.stringify(metrics)}`);

  console.log(JSON.stringify(metrics, null, 2));
} finally {
  await app.close();
}
