import { _electron as electron } from "playwright";
import electronPath from "electron";

const app = await electron.launch({
  executablePath: electronPath,
  args: ["."],
  cwd: process.cwd()
});

try {
  const page = await app.firstWindow();
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForSelector("#viewport", { timeout: 10_000 });
  await page.waitForTimeout(1200);

  await page.locator("#touchShapeBar [data-shape='frame_cube']").click();
  await page.locator("[data-touch-move='up']").click();
  await page.waitForTimeout(250);
  const cursorAfterLayerMove = await page.locator("#cursorState").textContent();
  await page.locator("[data-touch-move='right']").click();
  await page.waitForTimeout(250);

  const metrics = await page.evaluate((cursorAfterLayerMove) => {
    const touchHud = document.querySelector(".touch-hud");
    const touchShapeBar = document.querySelector("#touchShapeBar");
    const selectedShape = document.querySelector("#touchShapeBar [data-shape='frame_cube']");
    return {
      touchHudDisplay: getComputedStyle(touchHud).display,
      touchShapeBarBottom: getComputedStyle(touchShapeBar).bottom,
      touchShapeButtons: touchShapeBar.querySelectorAll("[data-shape]").length,
      selectedShapeActive: selectedShape.classList.contains("selected"),
      cursorState: document.querySelector("#cursorState")?.textContent || "",
      cursorAfterLayerMove,
      modeState: document.querySelector("#modeState")?.textContent || "",
      leftPanelDisplay: getComputedStyle(document.querySelector(".left-panel")).display,
      rightPanelDisplay: getComputedStyle(document.querySelector(".right-panel")).display
    };
  }, cursorAfterLayerMove);

  if (metrics.touchHudDisplay === "none") {
    throw new Error(`Touch HUD did not appear at tablet width: ${JSON.stringify(metrics)}`);
  }
  if (metrics.touchShapeButtons !== 13) {
    throw new Error(`Touch shape bar did not render all shapes: ${JSON.stringify(metrics)}`);
  }
  if (!metrics.selectedShapeActive || !metrics.modeState.includes("框架方塊")) {
    throw new Error(`Touch shape selection did not update active shape: ${JSON.stringify(metrics)}`);
  }
  if (!metrics.cursorAfterLayerMove.includes("0, 0, 1")) {
    throw new Error(`Touch layer button did not move cursor up: ${JSON.stringify(metrics)}`);
  }
  if (metrics.cursorState === metrics.cursorAfterLayerMove) {
    throw new Error(`Screen-relative touch D-pad did not move cursor horizontally: ${JSON.stringify(metrics)}`);
  }
  if (metrics.leftPanelDisplay !== "none" || metrics.rightPanelDisplay !== "none") {
    throw new Error(`Side panels did not collapse at tablet width: ${JSON.stringify(metrics)}`);
  }

  console.log(JSON.stringify(metrics, null, 2));
} finally {
  await app.close();
}
