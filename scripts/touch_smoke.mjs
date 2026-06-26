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
  await page.locator("#touchMaterialBar [data-material='plain']").click();
  await page.locator("#touchWorkspaceToggle").click();
  await page.locator("#touchWorkspaceX").fill("21");
  await page.locator("#touchApplyWorkspace").click();
  await page.locator("[data-touch-move='up']").click();
  await page.waitForTimeout(250);
  const cursorAfterLayerMove = await page.locator("#cursorState").textContent();
  await page.locator("[data-touch-move='right']").click();
  await page.waitForTimeout(250);
  const twoFingerGestureDispatched = await page.evaluate(() => {
    const canvas = document.querySelector("#viewport");
    const rect = canvas.getBoundingClientRect();
    const startX = rect.left + rect.width / 2;
    const startY = rect.top + rect.height / 2;
    function send(type, pointerId, x, y) {
      canvas.dispatchEvent(new PointerEvent(type, {
        bubbles: true,
        cancelable: true,
        pointerId,
        pointerType: "touch",
        button: 0,
        buttons: type === "pointerup" ? 0 : 1,
        clientX: x,
        clientY: y
      }));
    }
    send("pointerdown", 101, startX - 45, startY);
    send("pointerdown", 102, startX + 45, startY);
    send("pointermove", 101, startX - 65, startY - 44);
    send("pointermove", 102, startX + 65, startY - 44);
    send("pointerup", 101, startX - 65, startY - 44);
    send("pointerup", 102, startX + 65, startY - 44);
    return true;
  });

  const metrics = await page.evaluate(({ cursorAfterLayerMove, twoFingerGestureDispatched }) => {
    const touchHud = document.querySelector(".touch-hud");
    const touchShapeBar = document.querySelector("#touchShapeBar");
    const touchMaterialBar = document.querySelector("#touchMaterialBar");
    const selectedShape = document.querySelector("#touchShapeBar [data-shape='frame_cube']");
    const selectedMaterial = document.querySelector("#touchMaterialBar [data-material='plain']");
    return {
      touchHudDisplay: getComputedStyle(touchHud).display,
      touchShapeBarBottom: getComputedStyle(touchShapeBar).bottom,
      touchShapeButtons: touchShapeBar.querySelectorAll("[data-shape]").length,
      touchShapeImageButtons: touchShapeBar.querySelectorAll("img, .touch-shape-glyph").length,
      touchMaterialButtons: touchMaterialBar.querySelectorAll("[data-material]").length,
      selectedShapeActive: selectedShape.classList.contains("selected"),
      selectedMaterialActive: selectedMaterial.classList.contains("selected"),
      touchWorkspacePanelHidden: document.querySelector("#touchWorkspacePanel").hidden,
      workspaceX: document.querySelector("#workspaceX").value,
      cursorState: document.querySelector("#cursorState")?.textContent || "",
      cursorAfterLayerMove,
      twoFingerGestureDispatched,
      modeState: document.querySelector("#modeState")?.textContent || "",
      leftPanelDisplay: getComputedStyle(document.querySelector(".left-panel")).display,
      rightPanelDisplay: getComputedStyle(document.querySelector(".right-panel")).display
    };
  }, { cursorAfterLayerMove, twoFingerGestureDispatched });

  if (metrics.touchHudDisplay === "none") {
    throw new Error(`Touch HUD did not appear at tablet width: ${JSON.stringify(metrics)}`);
  }
  if (metrics.touchShapeButtons !== 13) {
    throw new Error(`Touch shape bar did not render all shapes: ${JSON.stringify(metrics)}`);
  }
  if (metrics.touchShapeImageButtons !== 13) {
    throw new Error(`Touch shape bar did not render icon controls: ${JSON.stringify(metrics)}`);
  }
  if (metrics.touchMaterialButtons !== 6 || !metrics.selectedMaterialActive) {
    throw new Error(`Touch material bar did not update active material: ${JSON.stringify(metrics)}`);
  }
  if (!metrics.touchWorkspacePanelHidden || metrics.workspaceX !== "21") {
    throw new Error(`Touch workspace controls did not resize workspace: ${JSON.stringify(metrics)}`);
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
  if (!metrics.twoFingerGestureDispatched) {
    throw new Error(`Two-finger gesture did not dispatch: ${JSON.stringify(metrics)}`);
  }
  if (metrics.leftPanelDisplay !== "none" || metrics.rightPanelDisplay !== "none") {
    throw new Error(`Side panels did not collapse at tablet width: ${JSON.stringify(metrics)}`);
  }

  console.log(JSON.stringify(metrics, null, 2));
} finally {
  await app.close();
}
