interface GlobalConfig {
  localSyncTime: number;
  configs: Config[];
}

type TranslateService = "google" | "bing";

interface Config {
  match: string | string[];
  enable: boolean;
}

interface SaveHTMLOptions {
  includeInlineStyles?: boolean;
  includeExternalStyles?: boolean;
  includeStyleTags?: boolean;
  convertImagesToBase64?: boolean;
  imageQuality?: number;
  maxImageSize?: number;
}
