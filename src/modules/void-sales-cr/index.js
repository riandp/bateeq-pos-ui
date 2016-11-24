export class Index {
  configureRouter(config, router) {
    config.map([
        {route:['', '/list'],       moduleId:'./list',          name:'list',        nav:false,      title:'Void Sales'},
        {route:'view/:id',          moduleId:'./view',          name:'view',        nav:false,      title:'View:Void Sales'},
        {route:'edit/:id',          moduleId:'./edit',          name:'edit',        nav:false,      title:'Edit:Void Sales'},
        {route:'create',            moduleId:'./create',        name:'create',      nav:false,      title:'Create:Void Sales'}
    ]);

    this.router = router;
  }
}