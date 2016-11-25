import {inject, Lazy} from 'aurelia-framework';
import {Router} from 'aurelia-router';
import {Service} from './service';


@inject(Router, Service)
export class Create { 
    
    constructor(router, service) {
        this.router = router;
        this.service = service;
        this.data = { items: [] }; 
    } 
    
    activate(params) {    
        
    }
     
    list() {
        this.router.navigateToRoute('list');
    }
     
    save() {
        console.log(JSON.stringify(this.data));
        this.service.create(this.data)
            .then(result => {
                this.list();
            })
            .catch(e => {
                console.log(e);
                this.error = e;
            })
    }

    voidSales() {
        console.log(JSON.stringify(this.data));
        for(var i = 0; i < this.data.items.length; i++)
        {
        this.service.voidSales(this.data.items[i])
            .then(result => {
                this.list();
            })
            .catch(e => {
                console.log(e);
                this.error = e;
            })
        }
        // this.service.createTransferIn(this.data)
        //     .then(result => {
        //         this.list();
        //     })
        //     .catch(e => {
        //         console.log(e);
        //         this.error = e;
        //     })
    }
}
