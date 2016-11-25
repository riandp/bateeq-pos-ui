import {inject, Lazy} from 'aurelia-framework';
import {Router} from 'aurelia-router';
import {Service} from './service';


@inject(Router, Service)
export class List {
    data = [];
    constructor(router, service) {
        this.router = router;
        this.service = service;
        this.filter = "";
    }

    activate() {
        this.service.search(this.filter)
            .then(data => { 
                this.data = data;
            })
    }

    view(data) {
        this.router.navigateToRoute('view', { id: data._id });
    }
    
    create() {
        this.router.navigateToRoute('create');
    }
    
    filterData() {
        this.service.search(this.filter)
            .then(data => { 
                this.data = data;
            })
    }
}
