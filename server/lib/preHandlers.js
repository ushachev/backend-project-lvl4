export default function requireSignedOut(request, reply, done) {
  if (request.isAuthenticated()) {
    request.flash('info', request.t('flash.preHandlers.requireSigned.out'));
    reply.redirect(this.reverse('root'));
  }
  done();
}
