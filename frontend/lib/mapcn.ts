const styleUrl = process.env.NEXT_PUBLIC_MAPCN_STYLE_URL;
const accessToken = process.env.NEXT_PUBLIC_MAPCN_ACCESS_TOKEN;

function withAccessToken(url: string, token?: string) {
  if (!token || url.includes("access_token=")) {
    return url;
  }

  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}access_token=${encodeURIComponent(token)}`;
}

export function getMapcnStyleUrl() {
  if (!styleUrl) {
    return undefined;
  }

  return withAccessToken(styleUrl, accessToken);
}

export function getMapcnStyles() {
  const url = getMapcnStyleUrl();
  if (!url) {
    return undefined;
  }

  return {
    dark: url,
    light: url
  };
}

export function hasMapcnStyleOverride() {
  return Boolean(styleUrl);
}