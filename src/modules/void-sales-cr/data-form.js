import {inject, bindable, BindingEngine} from 'aurelia-framework';
import {Router} from 'aurelia-router';
import {Service} from './service';
 
@inject(Router, Service, BindingEngine)
export class DataForm { 
    @bindable data = {};
    @bindable error = {};
    storageApiUri = require('../../host').inventory + '/storages';
    variantApiUri = require('../../host').core + '/articles/variants';
        storeApiUri = require('../../host').master + '/stores';
    finishedGoodsApiUri = require('../../host').master + '/finishedgoods';

    
    constructor(router, service, bindingEngine) { 
        this.router = router;
        this.service = service;
        this.bindingEngine = bindingEngine; 
        
        this.salesApiUri = require('../../host').sales + '/docs/salesvoids';
        //this.salesApiUri = require('../../host').sales + '/docs/sales'+'/storename=null/'+this.dateFromPicker+'/'+ this.dateToPicker+'/shift=null/typeAllStore=true/typeAllShift=true/typeAllStoreAllShift=true';
        

        this.isCard = false;
        this.isCash = false;
        this.data.storeId = "";
        
        this.data = { filter: {}, results: [] };
        this.error = { filter: {}, results: [] };
        this.dateFromPicker = this.getStringDate(new Date());
        this.dateToPicker = this.getStringDate(new Date());
        this.setDateFrom();
        this.setDateTo();

        var getDataStore = [];
        getDataStore.push(this.service.getStore());
        Promise.all(getDataStore)
            .then(results => { 
                this.Stores = results[0];
            })   
        var getDataTrans = [];
        getDataTrans.push(this.service.getTrans());
        Promise.all(getDataTrans)
            .then(results => { 
                this.Trans = results[0];
            })  
    }
     
    attached() {    
        this.bindingEngine.collectionObserver(this.data.items)
            .subscribe(splices => {
                var index = splices[0].index;
                var item = this.data.items[index];
                if(item)
                {
                    this.bindingEngine.propertyObserver(item, "salesId").subscribe((newValue, oldValue) => {
                        
                        //ambil service lagi
                        //item.sales = result service
                        this.service.getById(item.salesId)
                        .then(dataSales=>
                            {
                                item.code = dataSales.code;
                                item.storeName = dataSales.store.name;
                                item.grandTotal = dataSales.grandTotal;
                                item._createdBy = dataSales._createdBy;
                                item.date = dataSales.date;

                            }
                        )
                    });
                }
            });
    }

    setTextbox()
    {
        // this.bindingEngine.collectionObserver(this.data.items)
        //     .subscribe(splices => {
        //         var index = splices[0].index;
        //         var item = this.data.items[index];
        //         if(item)
        //         {
        //             this.bindingEngine.propertyObserver(item, "salesId").subscribe((newValue, oldValue) => {
        //                 item.storeName = item.sales.store.name;
        //                 item.grandTotal = item.sales.grandTotal;
        //                 item._createdBy = item.sales._createdBy;
        //                 item.date = item.sales.date;
        //             });
        //         }
        //     });
    }

    setCombobox()
    {
       //this.salesApiUri = this.storeApiUri;
        // var ddlStore = document.getElementById("ddlStore");
        // var textDdlStore = ddlStore.options[ddlStore.selectedIndex].text;
        // alert(textDdlStore);
        // if(textDdlStore=="Semua")
        // {
               
        // var getDataTrans = [];
        // getDataTrans.push(this.service.getTrans());
        // Promise.all(getDataTrans)
        //     .then(results => { 
        //         this.Trans = results[0];
        //     })
        // }
        // else{
        var getDataTrans = [];
        
        // var datefrom = new Date(this.data.filter.dateFrom);
        // var dateto = new Date(this.data.filter.dateTo);
        this.salesApiUri = require('../../host').sales + '/docs/salesvoids';
        
        //this.salesApiUri = require('../../host').sales + '/docs/sales'+'/storename=null/'+this.dateFromPicker+'/'+ this.dateToPicker+'/shift=null/typeAllStore=true/typeAllShift=true/typeAllStoreAllShift=true';
        alert(this.salesApiUri);
        //getDataTrans.push(this.service.getAllSalesAllStoreAllShift("storename=null", datefrom, dateto, "shift=null", "typeAllStore=true", "typeAllShift=true", "typeAllStoreAllShift=true"));
        //getDataTrans.push(this.service.getTransByStoreName(textDdlStore, true));
        
        // Promise.all(getDataTrans)
        //     .then(results => { 
        //         this.Trans = results[0];
        //     })
        //}  
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

    setDateFrom() { 
        this.data.filter.dateFrom = this.dateFromPicker + 'T00:00:00';        
    }
    
    setDateTo() { 
        this.data.filter.dateTo = this.dateToPicker + 'T23:59:59';        
    } 
    
    addItem() {
        var item = {};
        this.data.items.push(item);  
    } 
    
    removeItem(item) { 
        var itemIndex = this.data.items.indexOf(item);
        this.data.items.splice(itemIndex, 1);
    }
    
}
