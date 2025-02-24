import { getHTMLWithOptions as _getHTMLWithOptions } from "./html";

export async function getHTMLWithOptions(options: SaveHTMLOptions = {}) {
  console.log("============= getHTMLWithOptions =============");
  const html = await _getHTMLWithOptions(options);
  console.log("============= html =============", html);
  // 保存文件
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${document.title}.html`;

  document.body.appendChild(link);
  requestAnimationFrame(() => {
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  });
  return html;
}
