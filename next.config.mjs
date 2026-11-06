// Static export so the app can be hosted on GitHub Pages.
const isProd = process.env.NODE_ENV === 'production';
const repo = 'freelancer-financial-assistant';

export default {
  output: 'export',
  trailingSlash: true,
  basePath: isProd ? `/${repo}` : '',
  assetPrefix: isProd ? `/${repo}/` : '',
  images: { unoptimized: true },
};
