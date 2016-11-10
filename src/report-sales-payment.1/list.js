import {inject, Lazy, BindingEngine} from 'aurelia-framework';
import {Router} from 'aurelia-router';
import {Service} from './service';


@inject(Router, Service, BindingEngine)
export class List {
    
    storeApiUri = require('../host').master + '/stores';
    
    constructor(router, service, bindingEngine) {
        this.router = router;
        this.service = service;
        this.bindingEngine = bindingEngine; 
        
        this.data = { filter: {}, results: [] };
        this.error = { filter: {}, results: [] };
        this.dateFromPicker = this.getStringDate(new Date());
        this.dateToPicker = this.getStringDate(new Date());
        this.setDateFrom();
        this.setDateTo();
        this.isFilter = false;
        this.reportHTML = ""
        
        this.totalQty = 0;
        this.totalOmsetBruto = 0;
        this.totalOmsetNetto = 0;
        this.targetPerMonth = 0;
        this.sisaTargetNominal = 0;
        this.sisaTargetPercentage = 0;
    }

    activate() { 
    }


     
    attached() { 
        this.bindingEngine.propertyObserver(this.data.filter, "storeId").subscribe((newValue, oldValue) => {
            this.targetPerMonth = 0;
            if(this.data.filter.store)
                if(this.data.filter.store.salesTarget)
                    this.targetPerMonth = this.data.filter.store.salesTarget;
        }); 
    }

    
    salesChanged(e) {
        var sales = e.detail;
        if (sales)
            this.data.salesId = sales._id;
    }
    
    filter() { 
        this.error = { filter: {}, results: [] };
        var datefrom = new Date(this.data.filter.dateFrom);
        var dateto = new Date(this.data.filter.dateTo);
        
        if(this.data.filter.storeId == undefined || this.data.filter.storeId == '')
            this.error.filter.storeId = "Please choose Store";
        else if(dateto < datefrom)
            this.error.filter.dateTo = "Date To must bigger than from";
        else{ 
            var getData = [];
            for(var d = datefrom; d <= dateto; d.setDate(d.getDate() + 1)) {
                var date = new Date(d);
                var fromString = this.getStringDate(date) + 'T00:00:00'; 
                var toString = this.getStringDate(date) + 'T23:59:59';
                getData.push(this.service.getAllSalesByFilter(this.data.filter.storeId, fromString, toString));
            }
            Promise.all(getData)
                .then(salesPerDays => {   
                    this.data.results = [];
                    for(var salesPerDay of salesPerDays)
                    { 
                        if(salesPerDay.length != 0)
                        { 
                            var totalQty = 0;
                            var totalOmsetBruto = 0;
                            var totalDiscount1Nominal = 0;
                            var totalDiscount1Netto = 0;
                            var totalDiscount2Nominal = 0;
                            var totalDiscount2Netto = 0;
                            var totalDiscountNominal = 0;
                            var totalDiscountNominalNetto = 0;
                            var totalDiscountSpecialNominal = 0;
                            var totalDiscountSpecialNetto = 0;
                            var totalDiscountMarginNominal = 0;
                            var totalDiscountMarginNetto = 0;
                            var totalTotal = 0;
                            var totalSubTotal = 0;
                            var totalDiscountSaleNominal = 0;
                            var totalGrandTotal = 0;
                                
                            var tanggalRowSpan = 0;
                            var result = {};
                            result.items = [];
                            for(var data of salesPerDay)
                            {   
                                var itemRowSpan = 0;
                                var subtotal = 0;
                                var itemData = {};
                                itemData.details = [];
                                result.tanggal = new Date(data.date);
                                for(var item of data.items)
                                {
                                    var detail = {};
                                    detail.barcode = item.item.code;
                                    detail.namaProduk = item.item.name;
                                    detail.size = item.item.size;
                                    detail.harga = item.item.domesticSale;
                                    detail.quantity = item.quantity;
                                    detail.omsetBrutto = parseInt(detail.harga) * parseInt(detail.quantity);
                                    detail.discount1Percentage = item.discount1;
                                    detail.discount1Nominal = parseInt(detail.omsetBrutto) * parseInt(detail.discount1Percentage) / 100;
                                    detail.discount1Netto = parseInt(detail.omsetBrutto) - parseInt(detail.discount1Nominal);
                                    detail.discount2Percentage = item.discount2;
                                    detail.discount2Nominal = parseInt(detail.discount1Netto) * parseInt(detail.discount2Percentage) / 100;
                                    detail.discount2Netto = parseInt(detail.discount1Netto) - parseInt(detail.discount2Nominal);
                                    detail.discountNominal = item.discountNominal;
                                    detail.discountNominalNetto = parseInt(detail.discount2Netto) - parseInt(detail.discountNominal);
                                    detail.discountSpecialPercentage = item.specialDiscount;
                                    detail.discountSpecialNominal = parseInt(detail.discountNominalNetto) * parseInt(detail.discountSpecialPercentage) / 100;
                                    detail.discountSpecialNetto = parseInt(detail.discountNominalNetto) - parseInt(detail.discountSpecialNominal);
                                    detail.discountMarginPercentage = item.margin;
                                    detail.discountMarginNominal = parseInt(detail.discountSpecialNetto) * parseInt(detail.discountMarginPercentage) / 100;
                                    detail.discountMarginNetto = parseInt(detail.discountSpecialNetto) - parseInt(detail.discountMarginNominal);
                                    detail.total = parseInt(detail.discountMarginNetto);
                                    
                                    subtotal = parseInt(subtotal) + parseInt(detail.total); 
                                    itemData.details.push(detail);
                                    
                                    totalQty += parseInt(detail.quantity);
                                    totalOmsetBruto += parseInt(detail.omsetBrutto);
                                    totalDiscount1Nominal += parseInt(detail.discount1Nominal);
                                    totalDiscount1Netto += parseInt(detail.discount1Netto);
                                    totalDiscount2Nominal += parseInt(detail.discount2Nominal);
                                    totalDiscount2Netto += parseInt(detail.discount2Netto);
                                    totalDiscountNominal += parseInt(detail.discountNominal);
                                    totalDiscountNominalNetto += parseInt(detail.discountNominalNetto);
                                    totalDiscountSpecialNominal += parseInt(detail.discountSpecialNominal);
                                    totalDiscountSpecialNetto += parseInt(detail.discountSpecialNetto);
                                    totalDiscountMarginNominal += parseInt(detail.discountMarginNominal);
                                    totalDiscountMarginNetto += parseInt(detail.discountMarginNetto);
                                    totalTotal += parseInt(detail.total);
                                    
                                    tanggalRowSpan +=1;
                                    itemRowSpan +=1;
                                }
                                itemData.nomorPembayaran = data.code;
                                itemData.subTotal = parseInt(subtotal); 
                                itemData.discountSalePercentage = data.discount;
                                itemData.discountSaleNominal = parseInt(itemData.subTotal) * parseInt(itemData.discountSalePercentage) / 100;
                                itemData.grandTotal = parseInt(itemData.subTotal) - parseInt(itemData.discountSaleNominal);
                                itemData.tipePembayaran = data.salesDetail.paymentType;
                                itemData.card = data.salesDetail.cardType.name ? data.salesDetail.cardType.name : "";
                                itemData.itemRowSpan = itemRowSpan;
                                 
                                totalSubTotal += parseInt(itemData.subTotal);
                                totalDiscountSaleNominal += parseInt(itemData.discountSaleNominal);
                                totalGrandTotal += parseInt(itemData.grandTotal);
                                
                                result.items.push(itemData);
                            }
                            result.totalQty = totalQty;
                            result.totalOmsetBruto = totalOmsetBruto;
                            result.totalDiscount1Nominal = totalDiscount1Nominal;
                            result.totalDiscount1Netto = totalDiscount1Netto;
                            result.totalDiscount2Nominal = totalDiscount2Nominal;
                            result.totalDiscount2Netto = totalDiscount2Netto;
                            result.totalDiscountNominal = totalDiscountNominal;
                            result.totalDiscountNominalNetto = totalDiscountNominalNetto;
                            result.totalDiscountSpecialNominal = totalDiscountSpecialNominal;
                            result.totalDiscountSpecialNetto = totalDiscountSpecialNetto;
                            result.totalDiscountMarginNominal = totalDiscountMarginNominal;
                            result.totalDiscountMarginNetto = totalDiscountMarginNetto;
                            result.totalTotal = totalTotal;
                            result.totalSubTotal = totalSubTotal;
                            result.totalDiscountSaleNominal = totalDiscountSaleNominal;
                            result.totalGrandTotal = totalGrandTotal;
                            
                            result.tanggalRowSpan = tanggalRowSpan;
                            this.data.results.push(result);
                        } 
                    }  
                    this.generateReportHTML();
                    this.isFilter = true; 
                })
        } 
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
    
    generateReportHTML() {
        this.totalQty = 0;
        this.totalOmsetBruto = 0;
        this.totalOmsetNetto = 0;
        
        //console.log(JSON.stringify(this.data.results));
        var months = ['January','February','March','April','May','June','July','August','September','October','November','December'];

        this.reportHTML = "";
        this.reportHTML += "    <table class='table table-fixed'>";
        this.reportHTML += "        <thead>";
        this.reportHTML += "            <tr style='background-color:#282828; color:#ffffff;'>";
        this.reportHTML += "                <th>No Pembayaran</th>";
        this.reportHTML += "                <th>Toko</th>";
        this.reportHTML += "                <th>Grand Total</th>";
        this.reportHTML += "                <th>Kasir</th>";
        this.reportHTML += "                <th>Tanggal Transaksi</th>";
        this.reportHTML += "            </tr>";
        this.reportHTML += "        </thead>";
        this.reportHTML += "        <tbody>"; 
        for(var data of this.data.results) {
            var isTanggalRowSpan = false;
            for(var item of data.items) {
                var isItemRowSpan = false;
                    var totalHarga = 0;
                for(var itemDetail of item.details) {
                    totalHarga += itemDetail.total;
                }    
                for(var itemDetail of item.details) {
                    this.reportHTML += "        <tr>";
                    if(!isItemRowSpan)
                        this.reportHTML += "        <td rowspan='" + item.itemRowSpan + "'>" + item.nomorPembayaran +"</td>";
                    if(!isItemRowSpan)
                       this.reportHTML += "            <td>" + "Toko" +"</td>";
                    if(!isItemRowSpan)
                        this.reportHTML += "            <td style='background-color:#92e045;'>" + totalHarga.toLocaleString() +"</td>";
                    if(!isItemRowSpan)
                        this.reportHTML += "            <td>" + "Kasir" +"</td>";
                    if(!isTanggalRowSpan)
                        this.reportHTML += "        <td width='300px' rowspan='" + data.tanggalRowSpan + "'>" + data.tanggal.getDate() + " " + months[data.tanggal.getMonth()] + " " + data.tanggal.getFullYear()+"</td>";
                    
                    this.reportHTML += "        </tr>";
                    isTanggalRowSpan = true;
                    isItemRowSpan = true;
                }
            } 
            this.totalQty += parseInt(data.totalQty);
            this.totalOmsetBruto += parseInt(data.totalOmsetBruto);
            this.totalOmsetNetto += parseInt(data.totalGrandTotal);
        } 
        this.reportHTML += "        </tbody>";
        this.reportHTML += "    </table>";
         
        this.sisaTargetNominal = parseInt(this.totalOmsetNetto) - parseInt(this.targetPerMonth);
        this.sisaTargetPercentage = parseInt(this.totalOmsetNetto) / parseInt(this.targetPerMonth) * 100; 
    }
}
