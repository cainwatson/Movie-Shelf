angular.module('movie-shelf')
  .component('login', {
    bindings: {
      authenticated: '<',
      changeAuth: '<',
      userid: '<',
    },
    controller: function controller(checkAuth) {
      this.onClick = () => {
        checkAuth.check(this.changeAuth);
      };
    },

    templateUrl: '/templates/login.html',
  });
