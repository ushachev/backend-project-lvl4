export default (app) => ({
  assetPath(filename) {
    return `/assets/${filename}`;
  },
  route(name) {
    return app.reverse(name);
  },
});
