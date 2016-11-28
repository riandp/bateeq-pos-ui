import {Aurelia, inject} from 'aurelia-framework';
import {Session} from './utils/session';

@inject(Session)
export class App {
  constructor(session) {
    this.session = session;
  }

  configureRouter(config, router) {
    config.title = ''; 
    config.map([
      { route: ['', 'Welcome'], name: 'welcome', moduleId: './welcome', nav: false, title: 'Home' },
      { route: 'sales', name: 'sales', moduleId: './modules/sales-cr/index', nav: true, title: 'Penjualan', settings: { group:"transaction", roles:["admin"] } },
      { route: 'salesReturn', name: 'salesReturn', moduleId: './modules/sales-return-cr/index', nav: true, title: 'Retur Penjualan', settings: { group:"transaction", roles:["admin"] } },
      { route: 'void-sales', name: 'void-sales', moduleId: './modules/void-sales-cr/index', nav: true, title: 'Void Penjualan',settings: { group:"transaction", roles:["admin"] } }, 
      { route: 'report-sales-payment', name: 'report-sales-payment', moduleId: './modules/report-sales-payment/index', nav: true, title: 'Laporan Penjualan - Omset',settings: { group:"transaction", roles:["admin"] } },
      { route: 'report-sales-return', name: 'report-sales-return', moduleId: './modules/report-sales-return/index', nav: true, title: 'Laporan Retur Penjualan',settings: { group:"transaction", roles:["admin"] } },
      { route: 'report-payment-method', name: 'report-payment-method', moduleId: './modules/report-payment-method/index', nav: true, title: 'Laporan Penjualan - Metode Payment',settings: { group:"transaction", roles:["admin"] } },
      { route: 'report-void-sales', name: 'report-void-sales', moduleId: './modules/report-void-sales/index', nav: true, title: 'Laporan Void Penjualan',settings: { group:"transaction", roles:["admin"] } }
    ]);
    
    var routes = [];
    if (!this.session.isAuthenticated)
      routes = [
        { route: ['', 'login'], name: 'login', moduleId: './login', nav: false, title: 'login' }
      ]
    else {
      routes = routes.filter(route => {
        if (route.settings && route.settings.roles)
          return route.settings.roles.find(role => {
            return this.session.roles.indexOf(role) != -1;
          }) != undefined;
        else
          return true;
      });
    }

    config.map(routes);
    this.router = router;
  }
}

