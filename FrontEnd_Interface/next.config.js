const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [],
  },
  webpack: (config) => {
    const srcPath = path.resolve(__dirname, "./src");
    
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": srcPath,
      "components": path.resolve(srcPath, "components"),
      "app": path.resolve(srcPath, "app"),
      "hooks": path.resolve(srcPath, "hooks", "index.js"),
      "utils": path.resolve(srcPath, "utils"),
      "configs": path.resolve(srcPath, "configs"),
      "constants": path.resolve(srcPath, "constants"),
      "styles": path.resolve(srcPath, "styles"),
      "i18n": path.resolve(srcPath, "i18n"),
      "middleware": path.resolve(srcPath, "middleware"),
      "assets": path.resolve(srcPath, "assets"),
    };
    
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

