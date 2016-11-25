import {inject, Lazy} from 'aurelia-framework';
import {Router} from 'aurelia-router';
import {Service} from './service';


@inject(Router, Service)
export class Create {
    
    constructor(router, service) {
        this.router = router;
        this.service = service; 
        this.data = { items: [], salesDetail: { cardType:{}, bank:{}, voucher:{} } };
        this.error = { items: [] };
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
        //remove itemId yang kosong
        for(var i = 0; i < this.data.items.length; ) {
            var item = this.data.items[i];
            if(item.itemId == '') {
                var itemIndex = this.data.items.indexOf(item);
                this.data.items.splice(itemIndex, 1);
            }
            else{
                i++;
                for(var j = 0; j < item.returnItems.length; ) {
                    var returnItem = item.returnItems[j];
                    if(returnItem.itemId == '') {
                        var returnItemIndex = item.returnItems.indexOf(returnItem);
                        item.returnItems.splice(returnItemIndex, 1);
                    }
                    else{
                        j++; 
                    }
                }  
            }
        } 
        this.service.create(this.data)
            .then(response => {
                //this.detail(response.headers.get('Id'));
                this.list();
            })
            .catch(e => {
                this.error = e;
            })
    } 
}
 