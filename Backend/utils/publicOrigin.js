const DEFAULT_PUBLIC_ORIGIN = "https://tamilakanews.online";

const trimTrailingSlash = (value) => String(value || "").replace(/\/+$/, "");

const normalizeOrigin = (value) => {
  const raw = trimTrailingSlash(value);
  if (!raw) return "";

  try {
    return new URL(raw).origin;
  } catch (error) {
    return "";
  }
};

const getFirstHeaderValue = (value) => String(value || "").split(",")[0].trim();

const isLocalHost = (host) =>
  /^(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i.test(String(host || "").trim());

export const resolvePublicOrigin = (req) => {
  const configuredOrigin = normalizeOrigin(
    process.env.PUBLIC_ORIGIN ||
      process.env.UPLOADS_PUBLIC_ORIGIN ||
      process.env.BACKEND_PUBLIC_ORIGIN ||
      process.env.USER_SITE_ORIGIN ||
      DEFAULT_PUBLIC_ORIGIN
  );

  const host =
    getFirstHeaderValue(req?.get?.("x-forwarded-host")) ||
    getFirstHeaderValue(req?.get?.("host"));

  if (!host) {
    return configuredOrigin;
  }

  if (isLocalHost(host)) {
    const forwardedProto = getFirstHeaderValue(req?.get?.("x-forwarded-proto"));
    const protocol = forwardedProto || req?.protocol || "http";
    return `${protocol}://${host}`;
  }

  return configuredOrigin;
};

export const buildPublicUrl = (req, pathValue = "") => {
  const origin = resolvePublicOrigin(req);
  const normalizedPath = String(pathValue || "").startsWith("/")
    ? String(pathValue || "")
    : `/${String(pathValue || "").replace(/^\/+/, "")}`;

  return `${origin}${normalizedPath}`;
};
