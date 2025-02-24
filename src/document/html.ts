export async function getHTMLWithOptions({
  includeInlineStyles = true,
  includeExternalStyles = true,
  includeStyleTags = true,
  convertImagesToBase64 = false,
  imageQuality = 0.8,
  maxImageSize = 1024,
}: SaveHTMLOptions = {}): Promise<string> {
  try {
    // 克隆整个文档
    const clonedDoc = document.documentElement.cloneNode(true) as HTMLElement;

    // 处理 Shadow DOM
    const originalHosts = document.documentElement.querySelectorAll("*");
    originalHosts.forEach((originalHost, index) => {
      const shadowRoot = originalHost.shadowRoot;
      if (shadowRoot) {
        // 在克隆文档中找到对应的宿主元素
        const clonedHost = clonedDoc.querySelectorAll("*")[index];
        const shadowContainer = document.createElement("template");
        shadowContainer.setAttribute("shadowroot", "open");

        // 复制样式表
        Array.from(shadowRoot.styleSheets).forEach((sheet) => {
          const style = document.createElement("style");
          try {
            style.textContent = Array.from(sheet.cssRules)
              .map((rule) => rule.cssText)
              .join("\n");
            shadowContainer.content.appendChild(style);
          } catch (e) {
            console.warn("无法复制样式表:", e);
          }
        });

        // 复制内容
        const wrapper = document.createElement("div");
        wrapper.innerHTML = shadowRoot.innerHTML;
        while (wrapper.firstChild) {
          shadowContainer.content.appendChild(wrapper.firstChild);
        }

        clonedHost.appendChild(shadowContainer);
      }
    });

    // 移除所有 script 标签
    const scripts = clonedDoc.getElementsByTagName("script");
    while (scripts.length > 0) {
      scripts[0].parentNode?.removeChild(scripts[0]);
    }

    // 处理图片
    if (convertImagesToBase64) {
      await processImages(clonedDoc, imageQuality, maxImageSize);
    }

    // 收集样式
    let styles = "";
    if (includeStyleTags || includeExternalStyles) {
      styles = getAllStyles();
    }
    const html = buildHTML(clonedDoc, styles);
    return html;
  } catch (error) {
    console.error("保存 HTML 时出错:", error);
    throw error;
  }
}

function buildHTML(
  clonedDoc: HTMLElement,
  styles: string,
): string {
  // 构建完整的 HTML
  const html = `<!DOCTYPE html>
<html ${
    Array.from(document.documentElement.attributes)
      .map((attr) => `${attr.name}="${attr.value}"`)
      .join(" ")
  }>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${document.title}</title>
    <script>
    // Declarative Shadow DOM polyfill
    (function() {
      if (!HTMLTemplateElement.prototype.hasOwnProperty('shadowRoot')) {
        document.addEventListener('DOMContentLoaded', () => {
          document.querySelectorAll('template[shadowroot]').forEach(template => {
            const mode = template.getAttribute('shadowroot');
            const shadowRoot = template.parentElement.attachShadow({ mode });
            shadowRoot.appendChild(template.content);
            template.remove();
          });
        });
      }
    })();
    </script>
    <style>
        ${styles}
    </style>
    ${
    Array.from(document.getElementsByTagName("link"))
      .map((link) => link.outerHTML)
      .join("\n")
  }
</head>
<body>
    ${clonedDoc.innerHTML}
</body>
</html>`;

  return html;
}

// 将图片转换为 base64
async function convertImageToBase64(
  imgElement: HTMLImageElement,
  quality: number = 0.8,
  maxSize: number = 1024,
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();
      img.crossOrigin = "anonymous";

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        const base64 = canvas.toDataURL("image/png", quality);
        const size = Math.round(
          (base64.length - "data:image/png;base64,".length) * 3 / 4 / 1024,
        );

        resolve(size > maxSize ? imgElement.src : base64);
      };

      img.onerror = () => resolve(imgElement.src);
      img.src = imgElement.src;
    } catch (error) {
      console.error("转换图片失败:", error);
      resolve(imgElement.src);
    }
  });
}

// 处理所有图片
async function processImages(
  element: Element,
  quality: number,
  maxSize: number,
): Promise<void> {
  const images = element.getElementsByTagName("img");
  for (let img of Array.from(images)) {
    if (img.src.startsWith("data:")) continue;
    try {
      const base64 = await convertImageToBase64(img, quality, maxSize);
      img.src = base64;
    } catch (error) {
      console.warn(`处理图片失败: ${img.src}`, error);
    }
  }
}

// 获取所有样式
function getAllStyles(): string {
  let styles = "";

  // 获取内联样式表
  Array.from(document.getElementsByTagName("style")).forEach((style) => {
    styles += style.innerHTML + "\n";
  });

  // 获取外部样式表
  Array.from(document.styleSheets).forEach((sheet) => {
    try {
      const rules = sheet.cssRules || sheet.rules;
      for (let rule of Array.from(rules)) {
        styles += rule.cssText + "\n";
      }
    } catch (e) {
      if (sheet.href) {
        styles += `@import url("${sheet.href}");\n`;
      }
    }
  });

  return styles;
}
