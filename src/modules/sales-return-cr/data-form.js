import {inject, bindable, BindingEngine} from 'aurelia-framework';
import {Router} from 'aurelia-router';
import {Service} from './service';
import {Session} from '../../utils/session';
 
@inject(Router, Service, BindingEngine, Session)
export class DataForm {
    @bindable data = {};
    @bindable error = {};
         
    salesApiUri = require('../../host').sales + '/docs/sales';
    
    constructor(router, service, bindingEngine, session) { 
        this.router = router;
        this.service = service;  
        this.bindingEngine = bindingEngine; 
        this.session = session; 
         
        this.stores = session.stores; 
        
        var getData = [];
        getData.push(this.service.getBank());
        getData.push(this.service.getCardType());
        Promise.all(getData)
            .then(results => { 
                this.Banks = results[0]; 
                this.CardTypes = results[1];
            })          
    }
    
    onEnterProduct(e, item, returnItem) {
        var itemIndex = this.data.items.indexOf(item);  
        var returnItemIndex = this.data.items[itemIndex].returnItems.indexOf(returnItem);  
        if(e.which == 13) {
            this.service.getProductByCode(returnItem.itemCode)
                .then(results => {   
                    if(results.length > 0) 
                    {
                        var resultItem = results[0];
                        if(resultItem) 
                        {
                            var isAny = false;
                            for(var dataItem of item.returnItems) { 
                                if(dataItem.itemId == resultItem._id) {
                                    isAny = true;
                                    dataItem.itemCode = resultItem.code;
                                    dataItem.quantity = parseInt(dataItem.quantity) + 1;
                                    break;
                                }
                            } 
                            if(!isAny) {
                                returnItem.itemCodeReadonly = true;
                                returnItem.itemCode = resultItem.code;
                                returnItem.item = resultItem;
                                returnItem.itemId = resultItem._id;
                                returnItem.quantity = parseInt(returnItem.quantity) + 1;
                            } 
                        } 
                        this.error.items[itemIndex].returnItems[returnItemIndex].itemCode = "";
                        this.rearrangeItemDetail(item, true);
                    }  
                    else {
                        returnItem.itemCode = "";
                        this.error.items[itemIndex].returnItems[returnItemIndex].itemCode = "Barcode not found"; 
                    }
                }) 
                .catch(e => {
                    //reject(e);
                    this.error.items[itemIndex].returnItems[returnItemIndex].itemCode = "Barcode not found"; 
                })
        }
        else { 
            if(!returnItem.itemCodeReadonly)
                returnItem.itemCode = returnItem.itemCode + e.key;
        }
        e.preventDefault(); // prevent the default action (scroll / move caret)
    }
    
    attached() {    
        this.data.storeId = this.stores[0]._id;
        this.data.store = this.stores[0];
        this.getShift();
        
        this.itemReturs = [];
        this.isCard = false;
        this.isCash = false;
        this.data.datePicker = this.getStringDate(new Date());
        this.data.date = new Date(); 
        this.data.totalProduct = 0;
        this.data.subTotal = 0;
        this.data.totalDiscount = 0;
        this.data.total = 0;
        this.data.grandTotal = 0; 
        this.data.salesDetail.cashAmount = 0;
        this.data.salesDetail.cardAmount = 0;
        this.data.salesDetail.refund = 0;
        this.data.salesDetail.voucher.value = 0; 
        
        this.bindingEngine.collectionObserver(this.data.items)
            .subscribe(splices => {
                var index = splices[0].index;
                var item = this.data.items[index];
                if(item) { 
                    this.bindingEngine.propertyObserver(item, "itemId").subscribe((newValue, oldValue) => {
                        item.item = {}; 
                        item.quantityPurchase = 0;
                        item.quantity = 0;
                        item.price = 0;
                        item.discount1 = 0;
                        item.discount2 = 0;
                        item.discountNominal = 0;
                        item.specialDiscount = 0;
                        item.margin = 0; 
                        for(var itemReturn of this.itemReturs) {
                            if(itemReturn.itemId == item.itemId)
                            {    
                                //item.itemId = itemReturn.itemId;
                                item.item = itemReturn.item; 
                                item.quantityPurchase = parseInt(itemReturn.quantity);  
                                item.quantity = parseInt(itemReturn.quantity); 
                                item.price = parseInt(itemReturn.price);
                                item.discount1 = parseInt(itemReturn.discount1);
                                item.discount2 = parseInt(itemReturn.discount2);
                                item.discountNominal = parseInt(itemReturn.discountNominal);
                                item.specialDiscount = parseInt(itemReturn.specialDiscount);
                                item.margin = parseInt(itemReturn.margin);  
                                item.promoId = itemReturn.promoId;
                                item.promo = itemReturn.promo;
                                break;
                            }
                        } 
                        this.sumRow(item)
                        this.refreshPromo(index, -1);
                        this.addItemDetail(index)
                    }); 
                    
                    this.bindingEngine.collectionObserver(item.returnItems)
                        .subscribe(returnSplices => {
                            var returnIndex = returnSplices[0].index;
                            var returnItem = item.returnItems[returnIndex];
                            if(returnItem) { 
                                this.bindingEngine.propertyObserver(returnItem, "itemId").subscribe((newValue, oldValue) => {
                                    returnItem.price = parseInt(returnItem.item.domesticSale);
                                    //returnItem.quantity = 1 + parseInt(returnItem.quantity); 
                                    this.sumRow(returnItem)
                                    this.refreshPromo(index, returnIndex);
                                });
                                this.bindingEngine.propertyObserver(returnItem, "quantity").subscribe((newValue, oldValue) => {
                                    this.refreshPromo(index, returnIndex);
                                });
                            }
                        }); 
                }
            });
            
        this.bindingEngine.propertyObserver(this.data, "reference").subscribe((newValue, oldValue) => {
            this.itemReturs = [];
            for(var item of this.data.sales.items) {
                this.itemReturs.push(item);
            }
            while(this.data.items.length > 0) {
                var item = this.data.items[0];
                this.removeItem(item); 
            } 
            this.addItem();
        });
        this.bindingEngine.propertyObserver(this.data, "storeId").subscribe((newValue, oldValue) => {
            for(var store of this.stores) {
                if(store._id.toString() === this.data.storeId.toString()) {
                    this.data.store = store;
                    break;
                }
            } 
            this.getShift();
            this.refreshPromo(-1, -1);
        });
        this.bindingEngine.propertyObserver(this.data, "date").subscribe((newValue, oldValue) => {
            this.refreshPromo(-1, -1);
        });
    }  
    
    getShift() {
        var today = new Date();
        for(var shift of this.data.store.shifts) { 
            var dateFrom = new Date(this.getUTCStringDate(today) + "T" + this.getUTCStringTime(new Date(shift.dateFrom)));
            var dateTo = new Date(this.getUTCStringDate(today) + "T" + this.getUTCStringTime(new Date(shift.dateTo)));
            if( dateFrom < today && today < dateTo ) { 
                this.data.shift = shift.shift;
            }
        }
    }
    
    storeChanged(e) {
        var store = e.detail;
        if (store)
            this.data.storeId = store._id;
    } 
    
    salesChanged(e) {
        var sales = e.detail;
        if (sales) {
            this.data.reference = sales._id;
            this.data.salesId = sales._id;
        }
    }
    
    addItem() {           
        var item = {};
        item.itemId = '';
        item.item = {};
        item.item.domesticSale = 0;
        item.quantityPurchase = 0;
        item.quantity = 0;
        item.price = 0;
        item.discount1 = 0;
        item.discount2 = 0;
        item.discountNominal = 0;
        item.specialDiscount = 0;
        item.margin = 0;
        item.total = 0;
        item.returnItems = [];
        item.itemReturn = {};
        
        var errorItem = {}; 
        errorItem.returnItems = [];
        this.data.items.push(item);
        this.error.items.push(errorItem); 
        this.sumRow(item)
    } 
    
    removeItem(item) { 
        var itemIndex = this.data.items.indexOf(item);
        this.data.items.splice(itemIndex, 1); 
        this.error.items.splice(itemIndex, 1);
        this.sumTotal(); 
    }
    
    addItemDetail(index) {
        var item = {};
        item.itemCode = ''; 
        item.itemCodeFocus = true;
        item.itemCodeReadonly = false;
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
        
        var errorItem = {};
        errorItem.itemCode = '';
        this.data.items[index].returnItems.push(item);
        this.error.items[index].returnItems.push(errorItem);
        this.sumRow(item)
    }

    removeItemDetail(index, item) {
        var itemIndex = this.data.items[index].returnItems.indexOf(item);
        this.data.items[index].returnItems.splice(itemIndex, 1);
        this.error.items[index].returnItems.splice(itemIndex, 1);
        this.sumTotal(); 
        this.refreshPromo(index, -1); 
    }
    
    rearrangeItemDetail(item, isAdd) {  
        var itemIndex = this.data.items.indexOf(item);  
        for(var i = 0; i < item.returnItems.length; ) {
            var returnItem = item.returnItems[i];
            if(returnItem.itemId == '') {
                this.removeItemDetail(itemIndex, returnItem);
            }
            else
                i++;
        } 
        if(isAdd)
            this.addItemDetail(itemIndex);
    }
     
    sumRow(item) { 
        item.total = 0;
        if(parseInt(item.quantity) > 0) {
            //Price
            item.total = parseInt(item.quantity) * parseInt(item.price);
            //Diskon
            item.total = (item.total * (1 - (parseInt(item.discount1) / 100)) * (1 - (parseInt(item.discount2) / 100))) - parseInt(item.discountNominal);
            //Spesial Diskon 
            item.total = item.total * (1 - (parseInt(item.specialDiscount) / 100));
            //Margin
            item.total = item.total * (1 - (parseInt(item.margin) / 100));
        } 
        this.sumTotal(); 
    }
    
    sumTotal() {
        this.data.totalProduct = 0; 
        this.data.subTotalRetur = 0;
        this.data.subTotal = 0;
        this.data.grandTotal = 0;
        this.data.total = 0;
        //this.data.totalDiscount = 0;
        
        for(var item of this.data.items){
            this.data.subTotalRetur = parseInt(this.data.subTotalRetur) + parseInt(item.total); 
            for(var returnItem of item.returnItems) {
                this.data.subTotal = parseInt(this.data.subTotal) + parseInt(returnItem.total);
                this.data.totalProduct = parseInt(this.data.totalProduct) + parseInt(returnItem.quantity);
            } 
        }
        //this.data.totalDiscount = parseInt(this.data.subTotal) * parseInt(this.data.discount) / 100;
        var payment = parseInt(this.data.subTotal) - parseInt(this.data.subTotalRetur);
        if(payment < 0)
            payment = 0; 
        this.data.total = payment;
        this.data.grandTotal = this.data.total;
        this.refreshDetail();
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
    
    refreshDetail() {
        this.data.total = 0;
        this.data.total = parseInt(this.data.grandTotal) - parseInt(this.data.salesDetail.voucher.value);
        if(this.data.total < 0)
            this.data.total = 0;
        this.data.sisaBayar = this.data.total;

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
        
        this.data.sisaBayar = this.data.total - this.data.salesDetail.cashAmount - this.data.salesDetail.cardAmount;
        if(this.data.sisaBayar < 0)
            this.data.sisaBayar = 0;
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
    
    refreshVoucher() {
        this.data.salesDetail.cashAmount = 0;
        this.refreshDetail();
    }
    
    refreshPromo(indexItem, indexReturnItem) {
        var getPromoes = [];
        var storeId = this.data.storeId;
        var date = this.data.date;  
        for(var item of this.data.items) {
            if ( indexItem == -1 || indexItem == this.data.items.indexOf(item) )
            {
                var itemId = item.itemId;
                var quantity = item.quantity;
                var promo = item.promo;
                var ro = '';
                if(item.item) {
                    if(item.item.article)
                        ro = item.item.article.realizationOrder;
                }
                
                for(var returnItem of item.returnItems) {
                    if ( indexReturnItem == -1 || indexReturnItem == item.returnItems.indexOf(returnItem) )
                    {
                        var returnItemId = returnItem.itemId;
                        var returnQuantity = returnItem.quantity;
                        var returnRo = '';
                        if(returnItem.item) {
                            if(returnItem.item.article)
                                returnRo = returnItem.item.article.realizationOrder;
                        }
                        returnItem.discount1 = 0;
                        returnItem.discount2 = 0;
                        returnItem.discountNominal = 0;
                        returnItem.price = parseInt(returnItem.item.domesticSale);
                        returnItem.promoId = '';
                        returnItem.promo = {};
                        var isGetPromo = true;
                        if(ro == returnRo) {
                            isGetPromo = false;
                        }  
                        else if(promo.reward && promo.reward.type == "special-price") {
                            for(var criterion of promo.criteria.criterions) {
                                if(returnItemId == criterion.itemId) {
                                    isGetPromo = false;
                                    break;
                                }
                            }
                        } 
                        if(isGetPromo) {
                            if(storeId && returnItemId)
                                getPromoes.push(this.service.getPromoByStoreDatetimeItemQuantity(storeId, date, returnItemId, returnQuantity));
                        }
                        else  {
                            //langsung copy promo aja
                            returnItem.price = parseInt(item.price);
                            returnItem.discount1 = parseInt(item.discount1);
                            returnItem.discount2 = parseInt(item.discount2);
                            returnItem.discountNominal = parseInt(item.discountNominal);
                            returnItem.specialDiscount = parseInt(item.specialDiscount).toString();
                            returnItem.margin = parseInt(item.margin);
                            returnItem.promoId = item.promoId;
                            returnItem.promo = item.promo;
                            this.sumRow(returnItem);
                            getPromoes.push(Promise.resolve(null)); 
                        } 
                    }
                } 
            }
        }
        
        Promise.all(getPromoes)
            .then(results => {   
                var resultIndex = 0;
                for(var item of this.data.items) {
                    var index = this.data.items.indexOf(item); 
                    if ( indexItem == -1 || indexItem == index )
                    {
                        for(var returnItem of item.returnItems) 
                        {
                            var returnIndex = item.returnItems.indexOf(returnItem);
                            if ( indexReturnItem == -1 || indexReturnItem == returnIndex ) 
                            {  
                                if(results[resultIndex]) 
                                { 
                                    var promoResult = results[resultIndex][0];
                                    if(promoResult) 
                                    {
                                        returnItem.promoId = promoResult._id;
                                        returnItem.promo = promoResult;
                                        if(promoResult.reward.type == "discount-product") {
                                            for(var reward of promo.reward.rewards) {
                                                if(reward.unit == "percentage") {
                                                    returnItem.discount1 = reward.discount1;
                                                    returnItem.discount2 = reward.discount2;
                                                }
                                                else if(reward.unit == "nominal") {
                                                    returnItem.discountNominal = reward.nominal;
                                                }
                                            }
                                        }
                                        if(promoResult.reward.type == "special-price") {
                                            //cek quantity
                                            var quantityPaket = 0;
                                            for(var item2 of this.data.items) {
                                                for(var returnItem2 of item2.returnItems) {
                                                    if(returnItem.promoId == returnItem2.promoId) {
                                                        quantityPaket = parseInt(quantityPaket) + parseInt(returnItem2.quantity)
                                                    }
                                                }
                                            }
                                            
                                            //change price
                                            for(var item2 of this.data.items) {
                                                for(var returnItem2 of item2.returnItems) {
                                                    if(returnItem.promoId == returnItem2.promoId) {
                                                        for(var reward of promoResult.reward.rewards) {
                                                            if(parseInt(quantityPaket) == 1)
                                                                returnItem2.price = parseInt(reward.quantity1);
                                                            else if(parseInt(quantityPaket) == 2)
                                                                returnItem2.price = parseInt(reward.quantity2);
                                                            else if(parseInt(quantityPaket) == 3)
                                                                returnItem2.price = parseInt(reward.quantity3);
                                                            else if(parseInt(quantityPaket) == 4)
                                                                returnItem2.price = parseInt(reward.quantity4);
                                                            else if(parseInt(quantityPaket) >= 5)
                                                                returnItem2.price = parseInt(reward.quantity5);
                                                        }  
                                                        this.sumRow(returnItem2);
                                                    }
                                                } 
                                            }
                                        }
                                    } 
                                } 
                                this.sumRow(returnItem);
                                resultIndex += 1; 
                            }
                        } 
                    }
                } 
            }) 
    }
}
 