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
      bodySizeLimit: '2mb',
    },
  },
  webpack: (config) => {
    const srcPath = path.resolve(__dirname, "./src");
    
    // Normalize paths to prevent casing issues on Windows
    const normalizePath = (p) => path.normalize(p).replace(/\\/g, '/');
    
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": normalizePath(srcPath),
      "components": normalizePath(path.resolve(srcPath, "components")),
      "app": normalizePath(path.resolve(srcPath, "app")),
      "hooks": normalizePath(path.resolve(srcPath, "hooks", "index.js")),
      "utils": normalizePath(path.resolve(srcPath, "utils")),
      "configs": normalizePath(path.resolve(srcPath, "configs")),
      "constants": normalizePath(path.resolve(srcPath, "constants")),
      "styles": normalizePath(path.resolve(srcPath, "styles")),
      "i18n": normalizePath(path.resolve(srcPath, "i18n")),
      "middleware": normalizePath(path.resolve(srcPath, "middleware")),
      "assets": normalizePath(path.resolve(srcPath, "assets")),
    };
    
    // Fix casing issues in module resolution
    config.resolve.modules = [
      path.resolve(__dirname, 'node_modules'),
      'node_modules',
    ];
    
    // Handle SVG imports with ?react query
    // Find the existing rule for SVG files and exclude them from default handling
    const fileLoaderRule = config.module.rules.find((rule) =>
      rule.test?.test?.('.svg')
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
          loader: '@svgr/webpack',
          options: {
            typescript: false,
            dimensions: false,
            svgo: false,
            ref: false,
            svgProps: {
              focusable: '{false}',
            },
          },
        },
      ],
    });
    
    // Ensure proper module resolution with index files
    config.resolve.mainFields = ["browser", "module", "main"];
    config.resolve.extensions = [
      ".js",
      ".jsx",
      ".json",
      ".ts",
      ".tsx",
    ];
    config.resolve.extensionAlias = {
      ".js": [".js", ".jsx"],
      ".jsx": [".jsx", ".js"],
    };
    
    return config;
  },
};

module.exports = nextConfig;

