export function requireSignedIn(request, reply, done) {
  if (!request.signedIn) {
    request.flash('danger', request.t('flash.preHandlers.requireSigned.in'));
    reply.redirect(this.reverse('root'));
  }
  done();
}

export function requireSignedOut(request, reply, done) {
  if (request.signedIn) {
    request.flash('info', request.t('flash.preHandlers.requireSigned.out'));
    reply.redirect(this.reverse('root'));
  }
  done();
}
