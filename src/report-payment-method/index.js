export class Index {
  configureRouter(config, router) {
    config.map([
      {route:['', '/list'],       moduleId:'./list',          name:'list',        nav:false,      title:'Report Payment Method'},
    ]);

    this.router = router;
  }
}