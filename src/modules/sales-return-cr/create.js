import {inject, Lazy} from 'aurelia-framework';
import {Router} from 'aurelia-router';
import {Service} from './service';


@inject(Router, Service)
export class Create {
    
    constructor(router, service) {
        this.router = router;
        this.service = service; 
        this.data = { items: [], salesDetail: { cardType:{}, bank:{}, voucher:{} } };
    }

    activate(params) {

    }

    list() {
        this.router.navigateToRoute('list');
    }
    
    detail(data) {
        this.router.navigateToRoute('view', { id: data });
    }

    save() { 
        //console.log(JSON.stringify(this.data));
        this.service.create(this.data)
            .then(result => {
                //console.log(result);
                //this.detail(result);
                this.list();
            })
            .catch(e => {
                this.error = e;
            })
    } 
}
 