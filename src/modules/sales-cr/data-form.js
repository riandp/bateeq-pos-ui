import {inject, bindable, BindingEngine} from 'aurelia-framework';
import {Router} from 'aurelia-router';
import {Service} from './service';
 
@inject(Router, Service, BindingEngine)
export class DataForm {
    @bindable data = {};
    @bindable error = {};
        
    //storeApiUri = require('../host').master + '/stores';
    finishedGoodsApiUri = require('../../host').master + '/finishedgoods';
    voucherApiUri = '';
    
    constructor(router, service, bindingEngine) { 
        this.router = router;
        this.service = service;  
        this.bindingEngine = bindingEngine; 
        
        this.isCard = false;
        this.isCash = false;
        this.data.storeId = "";
        var getData = [];
        getData.push(this.service.getBank());
        getData.push(this.service.getCardType());
        Promise.all(getData)
            .then(results => { 
                this.Banks = results[0]; 
                this.CardTypes = results[1];
            })          
    }

    attached() {    
        this.data.datePicker = this.getStringDate(new Date());
        this.data.date = new Date();
        this.data.shift = 0;
        this.data.discount = 0;
        this.data.totalProduct = 0;
        this.data.subTotal = 0;
        this.data.totalDiscount = 0;
        this.data.total = 0;
        this.data.grandTotal = 0;
        this.data.salesDetail.voucher.value = 0; 
        this.data.salesDetail.cashAmount = 0;
        this.data.salesDetail.cardAmount = 0;
        this.data.salesDetail.refund = 0;
        this.bindingEngine.collectionObserver(this.data.items)
            .subscribe(splices => {
                var index = splices[0].index;
                var item = this.data.items[index];
                if(item)
                {
                    this.bindingEngine.propertyObserver(item, "itemId").subscribe((newValue, oldValue) => {
                        item.price = parseInt(item.item.domesticSale);
                        item.quantity = 1 + parseInt(item.quantity);
                        this.refreshPromo(index);
                    });
                    this.bindingEngine.propertyObserver(item, "quantity").subscribe((newValue, oldValue) => {
                        this.refreshPromo(index);
                    });
                }
            });
        this.bindingEngine.propertyObserver(this.data, "storeId").subscribe((newValue, oldValue) => {
            var today = new Date();
            for(var shift of this.data.store.shifts) { 
                var dateFrom = new Date(this.getUTCStringDate(today) + "T" + this.getUTCStringTime(new Date(shift.dateFrom)));
                var dateTo = new Date(this.getUTCStringDate(today) + "T" + this.getUTCStringTime(new Date(shift.dateTo)));
                if( dateFrom < today && today < dateTo ) { 
                    this.data.shift = shift.shift;
                }
            }
            this.refreshPromo(-1);
        });
        this.bindingEngine.propertyObserver(this.data, "date").subscribe((newValue, oldValue) => {
            this.refreshPromo(-1);
        });
            
    }  
    
    storeChanged(e) {
        var store = e.detail;
        if (store)
            this.data.storeId = store._id;
    }
    
    addItem() {           
        var item = {};
        item.itemId = '';
        item.item = {};
        item.item.domesticSale = 0;
        item.quantity = 0;
        item.price = 0;
        item.discount1 = 0;
        item.discount2 = 0;
        item.discountNominal = 0;
        item.specialDiscount = 0;
        item.margin = 0;
        item.total = 0;
        this.data.items.push(item); 
        this.sumRow(item);
    } 
    
    removeItem(item) { 
        var itemIndex = this.data.items.indexOf(item);
        this.data.items.splice(itemIndex, 1);
        this.sumTotal(); 
        this.refreshPromo(-1);
    }
    
    sumRow(item) {
        var itemIndex = this.data.items.indexOf(item);
        var itemDetail = this.data.items[itemIndex]
        itemDetail.total = 0;
        if(parseInt(itemDetail.quantity) > 0) {
            //Price
            itemDetail.total = parseInt(itemDetail.quantity) * parseInt(itemDetail.price);
            //Diskon
            itemDetail.total = (itemDetail.total * (1 - (parseInt(itemDetail.discount1) / 100)) * (1 - (parseInt(itemDetail.discount2) / 100))) - parseInt(itemDetail.discountNominal);
            //Spesial Diskon 
            itemDetail.total = itemDetail.total * (1 - (parseInt(itemDetail.specialDiscount) / 100));
            //Margin
            itemDetail.total = itemDetail.total * (1 - (parseInt(itemDetail.margin) / 100));
        } 
        this.sumTotal(); 
    }
    
    sumTotal() {
        this.data.totalProduct = 0;
        this.data.subTotal = 0;
        this.data.totalDiscount = 0;
        this.data.total = 0;
        for(var item of this.data.items){
            this.data.subTotal = parseInt(this.data.subTotal) + parseInt(item.total);
            this.data.totalProduct = parseInt(this.data.totalProduct) + parseInt(item.quantity);
        }
        this.data.totalDiscount = parseInt(this.data.subTotal) * parseInt(this.data.discount) / 100;
        this.data.total = parseInt(this.data.subTotal) - parseInt(this.data.totalDiscount);
        this.data.grandTotal = this.data.total;
        this.refreshDetail();
    }
    
    refreshVoucher() {
        this.data.salesDetail.cashAmount = 0;
        this.refreshDetail();
    }
    
    refreshDetail() {
        this.data.total = 0;
        this.data.total = parseInt(this.data.grandTotal) - parseInt(this.data.salesDetail.voucher.value);
        if(this.data.total < 0)
            this.data.total = 0;

        if(this.isCash && this.isCard) { //partial
            this.data.salesDetail.cardAmount = parseInt(this.data.total) - parseInt(this.data.salesDetail.cashAmount);
            if(parseInt(this.data.salesDetail.cardAmount) < 0)
                this.data.salesDetail.cardAmount = 0;
        }
        else if(this.isCard) //card
            this.data.salesDetail.cardAmount = this.data.total; 
        else if(this.isCash) //cash
            if(parseInt(this.data.salesDetail.cashAmount) < parseInt(this.data.total))
                this.data.salesDetail.cashAmount = this.data.total; 
        
        var refund = parseInt(this.data.salesDetail.cashAmount) + parseInt(this.data.salesDetail.cardAmount) - parseInt(this.data.total);
        if(refund < 0)
            refund = 0;
        this.data.salesDetail.refund = refund;
    }
    
    checkPaymentType() {
        this.isCard = false;
        this.isCash = false;   
        if(this.data.salesDetail.paymentType.toLowerCase() == 'cash'){  
            this.isCash = true;
        }
        else if(this.data.salesDetail.paymentType.toLowerCase() == 'card'){  
            this.isCard = true;
        }
        else if(this.data.salesDetail.paymentType.toLowerCase() == 'partial'){  
            this.isCard = true;
            this.isCash = true;
        } 
        this.data.salesDetail.cashAmount = 0;
        this.data.salesDetail.cardAmount = 0;
        this.refreshDetail(); 
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
     
    getUTCStringDate(date) { 
        var dd = date.getUTCDate();
        var mm = date.getUTCMonth()+1; //January is 0! 
        var yyyy = date.getUTCFullYear();
        if(dd<10){
            dd='0'+dd
        } 
        if(mm<10){
            mm='0'+mm
        } 
        date = yyyy+'-'+mm+'-'+dd;
        return date; 
    }
    
    getUTCStringTime(date) { 
        var hh = date.getUTCHours();
        var mm = date.getUTCMinutes();
        var ss = date.getUTCSeconds();
        if(hh<10){
            hh='0'+hh
        } 
        if(mm<10){
            mm='0'+mm
        } 
        if(ss<10){
            ss='0'+ss
        } 
        date = hh+':'+mm+':'+ss;
        return date; 
    }
    
    setDate() {
        this.data.date = new Date(this.data.datePicker);        
    }
    
    refreshPromo(indexItem) {
        var getPromoes = [];
        var storeId = this.data.storeId;
        var date = this.data.date;
         
        for(var item of this.data.items) {
            if ( indexItem == -1 || indexItem == this.data.items.indexOf(item) )
            {
                var itemId = item.itemId;
                var quantity = item.quantity;
                item.discount1 = 0;
                item.discount2 = 0;
                item.discountNominal = 0;
                item.price = parseInt(item.item.domesticSale);
                item.promoId = '';
                item.promo = {};
                getPromoes.push(this.service.getPromoByStoreDatetimeItemQuantity(storeId, date, itemId, quantity));
            }
        }
        
        Promise.all(getPromoes)
            .then(results => {   
                var resultIndex = 0;
                for(var item of this.data.items) {
                    var index = this.data.items.indexOf(item);
                    if (indexItem == -1 || indexItem == index) {
                        var promo = results[resultIndex][0];
                        if(promo) {
                            item.promoId = promo._id;
                            item.promo = promo;
                            if(promo.reward.type == "discount-product")
                            {
                                for(var reward of promo.reward.rewards) {
                                    if(reward.unit == "percentage") {
                                        item.discount1 = reward.discount1;
                                        item.discount2 = reward.discount2;
                                    }
                                    else if(reward.unit == "nominal") {
                                        item.discountNominal = reward.nominal;
                                    }
                                }
                            }
                            if(promo.reward.type == "special-price") 
                            {
                                //cek quantity
                                var quantityPaket = 0;
                                for(var item2 of this.data.items) {
                                    if(item.promoId == item2.promoId) {
                                        quantityPaket = parseInt(quantityPaket) + parseInt(item2.quantity)
                                    }
                                }
                                
                                //change price
                                for(var item2 of this.data.items) {
                                    if(item.promoId == item2.promoId) {
                                        for(var reward of promo.reward.rewards) {
                                            if(parseInt(quantityPaket) == 1)
                                                item2.price = parseInt(reward.quantity1);
                                            else if(parseInt(quantityPaket) == 2)
                                                item2.price = parseInt(reward.quantity2);
                                            else if(parseInt(quantityPaket) == 3)
                                                item2.price = parseInt(reward.quantity3);
                                            else if(parseInt(quantityPaket) == 4)
                                                item2.price = parseInt(reward.quantity4);
                                            else if(parseInt(quantityPaket) >= 5)
                                                item2.price = parseInt(reward.quantity5);
                                        }  
                                        this.sumRow(item2);
                                    }
                                } 
                            }
                        }
                        this.sumRow(item);
                        resultIndex += 1; 
                    }
                }
            })
    }
}
 