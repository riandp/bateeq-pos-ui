export class App {
  configureRouter(config, router) {
    config.title = 'Aurelia';
    config.map([
      { route: ['', 'welcome'], name: 'welcome', moduleId: './welcome', nav: true, title: 'Welcome' },
      // { route: 'users',         name: 'users',        moduleId: './users',        nav: true, title: 'Github Users' },
      // { route: 'child-router',  name: 'child-router', moduleId: './child-router', nav: true, title: 'Child Router' },
      { route: 'sales', name: 'sales', moduleId: './sales-cr/index', nav: true, title: 'sales' },
      { route: 'salesReturn', name: 'salesReturn', moduleId: './sales-return-cr/index', nav: true, title: 'sales return' },
      { route: 'report-sales-payment', name: 'report-sales-payment', moduleId: './report-sales-payment/index', nav: true, title: 'report sales payment' }
    ]);

    this.router = router;
  }
}
