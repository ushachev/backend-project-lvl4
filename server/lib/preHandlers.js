export function requiredSignedIn(request, reply, done) {
  if (!request.signedIn) {
    request.flash('danger', 'доступ запрещён, пожалалуйста авторизуйтесь');
    reply.redirect(this.reverse('root'));
  }
  done();
}

export function requiredSignedOut(request, reply, done) {
  if (request.signedIn) {
    request.flash('info', 'для этого действия необходимо выйти из аккаунта');
    reply.redirect(this.reverse('root'));
  }
  done();
}
