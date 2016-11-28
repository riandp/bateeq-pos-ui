import {inject, Lazy} from 'aurelia-framework';
import {Router} from 'aurelia-router';
import {Service} from './service';


@inject(Router, Service)
export class List {
    data = [];
    constructor(router, service) {
        this.router = router;
        this.service = service;
    }

    activate() {
        //getAllSalesByVoidTrue
        this.service.search('')
            .then(data => {
                
                this.data = data;
                for(var i of this.data) {
                    i._updatedDate = this.getStringDate(new Date(i._updatedDate));
                }
            })
    }

    view(data) {
        this.router.navigateToRoute('view', { id: data._id });
    }
    
    create() {
        this.router.navigateToRoute('create');
    }

    getStringDate(date) { 
        var dd = date.getDate();
        var mm = date.getMonth()+1; //January is 0! 
        var yyyy = date.getFullYear();
        if(dd<10){
            dd='0'+dd
        } 
        if(mm<10){
            mm='0'+mm
        } 
        date = yyyy+'-'+mm+'-'+dd;
        return date; 
    }
}
