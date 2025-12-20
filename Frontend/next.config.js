const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [],
  },
  // Suppress params enumeration warning in Next.js 15
  // This is a known issue when serializing props in client components
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  webpack: (config) => {
    const srcPath = path.resolve(__dirname, "./src");

    // Normalize paths to prevent casing issues on Windows
    const normalizePath = (p) => path.normalize(p).replace(/\\/g, "/");

    // Normalize casing for the project root path
    const projectRoot = path.resolve(__dirname).replace(/\\/g, "/");
    const normalizedRoot = projectRoot.replace(/frontend/i, "Frontend");

    config.resolve.alias = {
      ...config.resolve.alias,
      "@": normalizePath(srcPath),
      components: normalizePath(path.resolve(srcPath, "components")),
      app: normalizePath(path.resolve(srcPath, "app")),
      hooks: normalizePath(path.resolve(srcPath, "hooks", "index.js")),
      utils: normalizePath(path.resolve(srcPath, "utils")),
      configs: normalizePath(path.resolve(srcPath, "configs")),
      constants: normalizePath(path.resolve(srcPath, "constants")),
      styles: normalizePath(path.resolve(srcPath, "styles")),
      i18n: normalizePath(path.resolve(srcPath, "i18n")),
      middleware: normalizePath(path.resolve(srcPath, "middleware")),
      assets: normalizePath(path.resolve(srcPath, "assets")),
    };

    // Fix casing issues in module resolution
    config.resolve.modules = [
      path.resolve(__dirname, "node_modules"),
      "node_modules",
    ];

    // Add a plugin to normalize path casing and prevent case-sensitivity issues
    const NormalizePathPlugin = {
      apply: (compiler) => {
        compiler.hooks.normalModuleFactory.tap("NormalizePathPlugin", (nmf) => {
          nmf.hooks.beforeResolve.tap("NormalizePathPlugin", (data) => {
            if (data.context) {
              // Normalize the context path to use consistent casing (Frontend)
              const contextPath = data.context.replace(/\\/g, "/");
              const normalizedContext = contextPath.replace(
                /\/frontend\//i,
                "/Frontend/",
              );
              if (normalizedContext !== contextPath) {
                data.context = normalizedContext;
              }
            }
            // Also normalize the request path if it contains the directory name
            if (data.request) {
              const requestPath = data.request.replace(/\\/g, "/");
              const normalizedRequest = requestPath.replace(
                /\/frontend\//i,
                "/Frontend/",
              );
              if (normalizedRequest !== requestPath) {
                data.request = normalizedRequest;
              }
            }
          });

          // Also normalize paths in the afterResolve hook
          nmf.hooks.afterResolve.tap("NormalizePathPlugin", (data) => {
            if (data.resource) {
              const resourcePath = data.resource.replace(/\\/g, "/");
              const normalizedResource = resourcePath.replace(
                /\/frontend\//i,
                "/Frontend/",
              );
              if (normalizedResource !== resourcePath) {
                data.resource = normalizedResource;
              }
            }
          });
        });
      },
    };

    if (!config.plugins) {
      config.plugins = [];
    }
    config.plugins.push(NormalizePathPlugin);

    // Ensure symlinks are resolved to prevent case-sensitivity issues
    config.resolve.symlinks = true;

    // Handle SVG imports with ?react query
    // Find the existing rule for SVG files and exclude them from default handling
    const fileLoaderRule = config.module.rules.find((rule) =>
      rule.test?.test?.(".svg"),
    );

    if (fileLoaderRule) {
      fileLoaderRule.exclude = /\.svg$/i;
    }

    // Add SVGR loader for SVG files imported with ?react
    config.module.rules.push({
      test: /\.svg$/i,
      issuer: { and: [/\.[jt]sx?$/] },
      use: [
        {
          loader: "@svgr/webpack",
          options: {
            typescript: false,
            dimensions: false,
            svgo: false,
            ref: false,
            svgProps: {
              focusable: "{false}",
            },
          },
        },
      ],
    });

    // Ensure proper module resolution with index files
    config.resolve.mainFields = ["browser", "module", "main"];
    config.resolve.extensions = [".js", ".jsx", ".json", ".ts", ".tsx"];
    config.resolve.extensionAlias = {
      ".js": [".js", ".jsx"],
      ".jsx": [".jsx", ".js"],
    };

    // Suppress case-sensitivity warnings for known Next.js modules
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      {
        module: /node_modules\/next\//,
        message:
          /There are multiple modules with names that only differ in casing/,
      },
    ];

    return config;
  },
};

module.exports = nextConfig;
