export default (app) => ({
  route(name) {
    return app.reverse(name);
  },
});
