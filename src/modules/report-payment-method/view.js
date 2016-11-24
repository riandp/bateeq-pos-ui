import {inject, Lazy} from 'aurelia-framework';
import {Router} from 'aurelia-router';
import {Service} from './service';


@inject(Router, Service)
export class View {
    constructor(router, service) {
        this.router = router;
        this.service = service;
    }

    activate(params) {
        var id = params.id;
        // this.service.getAll()
        //     .then(data => {
        //         this.data = data;
        //         this.totalQuantity = 0;
        //     })
    }


    print() {
        window.print();
    }

}