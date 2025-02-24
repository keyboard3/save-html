import { getHTMLWithOptions } from "../content/exports";

console.log("background script running...");

browser.action.onClicked.addListener((tab) => {
    console.log("tab", tab);
    getHTMLWithOptions({
        includeInlineStyles: true,
        includeExternalStyles: true,
        includeStyleTags: true,
        convertImagesToBase64: true,
        imageQuality: 0.8,
        maxImageSize: 1024,
    }).then((html) => {
        console.log("html", html);
    });
});
