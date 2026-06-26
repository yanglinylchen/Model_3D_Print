(function installWebAdapter() {
  if (window.model3d) return;

  function downloadTextFile({ suggestedName, content, type }) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = suggestedName || "model";
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    return { canceled: false, filePath: anchor.download };
  }

  function pickProjectFile() {
    return new Promise((resolve) => {
      const input = document.createElement("input");
      let resolved = false;
      input.type = "file";
      input.accept = ".m3dp,application/json";
      input.style.display = "none";

      function finish(result) {
        if (resolved) return;
        resolved = true;
        input.remove();
        resolve(result);
      }

      input.addEventListener("change", async () => {
        const file = input.files?.[0];
        if (!file) return finish({ canceled: true });
        finish({
          canceled: false,
          filePath: file.name,
          content: await file.text()
        });
      });
      input.addEventListener("cancel", () => finish({ canceled: true }));
      window.addEventListener(
        "focus",
        () => {
          window.setTimeout(() => {
            if (!input.files?.length) finish({ canceled: true });
          }, 500);
        },
        { once: true }
      );

      document.body.append(input);
      input.click();
    });
  }

  window.model3d = {
    platform: "web",
    openProject: pickProjectFile,
    saveProject: ({ suggestedName, content }) => downloadTextFile({
      suggestedName,
      content,
      type: "application/json;charset=utf-8"
    }),
    exportStl: ({ suggestedName, content }) => downloadTextFile({
      suggestedName,
      content,
      type: "model/stl;charset=utf-8"
    })
  };
})();
