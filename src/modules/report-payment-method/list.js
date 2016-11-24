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

        var getData = [];
        getData.push(this.service.getStore());
        Promise.all(getData)
        .then(results => { 
            this.Stores = results[0];
        })  
        
        this.totalQty = 0;
        this.totalCash = 0;
        this.totalTempDebit = 0;
        this.totalTempCredit = 0;
        this.totalTempCreditVisa = 0;
        this.totalTempCreditMaster = 0;
        this.unique = [];
        this.arrTotalTempDebit = [];
        this.arrTotalTempCredit = [];
        this.arrTotalTempCreditMaster = [];
        this.arrTotalTempCreditVisa = [];
        this.subtotalArrTotal = 0;
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
            var e = document.getElementById("ddlShift");
            var strUser = e.options[e.selectedIndex].text;
            for(var d = datefrom; d <= dateto; d.setDate(d.getDate() + 1)) {
                var date = new Date(d);
                var fromString = this.getStringDate(date) + 'T00:00:00'; 
                var toString = this.getStringDate(date) + 'T23:59:59';

                getData.push(this.service.getAllSalesByFilter(this.data.filter.storeId, fromString, toString, strUser));
            }
            Promise.all(getData)
                .then(salesPerDays => {   
                    this.data.results = [];
                    for(var salesPerDay of salesPerDays)
                    { 
                        if(salesPerDay.length != 0)
                        { 
                            var totalSubTotal = 0;
                                
                            var tanggalRowSpan = 0;
                            var result = {};
                            result.items = [];
                            for(var data of salesPerDay)
                            {   
                                var itemRowSpan = 0;
                                var itemData = {};
                                itemData.details = [];
                                result.tanggal = new Date(data.date);
                                
                                itemData.nomorPembayaran = data.code;
                                itemData.isVoid = data.isVoid;
                                itemData.voucherNominal = parseInt(data.salesDetail.voucher.value);
                                if(data.salesDetail.cashAmount!=0 && data.salesDetail.cardAmount == 0)
                                    itemData.cashNominal = parseInt(data.grandTotal)-parseInt(data.salesDetail.voucher.value);
                                else
                                    itemData.cashNominal = parseInt(data.salesDetail.cashAmount); 
                                if(data.salesDetail.card && data.salesDetail.card == "Debit") {
                                    itemData.debitNominal = parseInt(data.salesDetail.cardAmount); 
                                    itemData.creditNominal = 0; 
                                }
                                else {
                                    itemData.debitNominal = 0; 
                                    itemData.creditNominal = parseInt(data.salesDetail.cardAmount); 
                                }

                                if(data.salesDetail.bank.name != null)
                                    itemData.bank = data.salesDetail.bank.name;
                                else
                                    itemData.bank = "Cash";
                                if(data.salesDetail.cardType.name == "Mastercard")
                                {
                                    itemData.debitNominalLainnya = 0;
                                    itemData.creditMasterNominal = parseInt(data.salesDetail.cardAmount);
                                    itemData.creditVisaNominal = 0;
                                    itemData.creditNominalLainnya = 0;
                                    
                                }   
                                else if(data.salesDetail.cardType.name == "Visa")
                                {
                                    itemData.debitNominalLainnya = 0;
                                    itemData.creditMasterNominal = 0;
                                    itemData.creditVisaNominal = parseInt(data.salesDetail.cardAmount);
                                    itemData.creditNominalLainnya = 0;
                                    
                                }
                                else if(data.salesDetail.cardType.name != "Visa" && data.salesDetail.cardType.name != "Mastercard")
                                {
                                    if(data.salesDetail.card == "Debit")
                                    {
                                        itemData.creditNominalLainnya = 0;
                                        itemData.debitNominalLainnya = parseInt(data.salesDetail.cardAmount);
                                        itemData.creditMasterNominal = 0;
                                        itemData.creditVisaNominal = 0;
                                    }
                                    else{
                                        itemData.creditNominalLainnya = parseInt(data.salesDetail.cardAmount);
                                        itemData.debitNominalLainnya = 0;
                                        itemData.creditMasterNominal = 0;
                                        itemData.creditVisaNominal = 0;
                                    }
                                }
                                itemRowSpan++;
                                tanggalRowSpan++;

                                itemData.itemRowSpan = itemRowSpan; 
                                totalSubTotal += parseInt(itemData.subTotal);
                                
                                result.items.push(itemData);
                            }
                            result.totalSubTotal = totalSubTotal;
                            
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

        this.totalTempDebit = 0;
        this.totalTempCredit = 0;
        this.totalTempCreditVisa = 0;
        this.totalTempCreditMaster = 0;
        this.subtotalArrTotal = 0;
        
        this.arrTotalTempDebit = [];
        this.arrTotalTempCredit = [];
        this.arrTotalTempCreditMaster = [];
        this.arrTotalTempCreditVisa = [];
        
        this.totalTempDebit = 0;
        this.totalTempCredit = 0;
        this.totalTempCreditVisa = 0;
        this.totalTempCreditMaster = 0;

        this.totalCash = 0;
        console.log(JSON.stringify(this.data.results));
        var months = ['January','February','March','April','May','June','July','August','September','October','November','December'];

        this.reportHTML = "Payment Summary";
        this.reportHTML += "    <table class='table table-fixed'>";
        this.reportHTML += "        <thead>";
        this.reportHTML += "            <tr style='background-color:#282828; color:#ffffff;'>";
        this.reportHTML += "                <th>Tanggal</th>";
        this.reportHTML += "                <th>Total Transaksi</th>";
        this.reportHTML += "                <th>Cash (nominal)</th>";
        this.reportHTML += "                <th>Debit Card (nominal)</th>";
        this.reportHTML += "                <th>Credit Card (nominal)</th>";
        this.reportHTML += "                <th>Voucher (nominal)</th>";
        this.reportHTML += "                <th>Total Omset (in hand)</th>";
        this.reportHTML += "            </tr>";
        this.reportHTML += "        </thead>";
        this.reportHTML += "        <tbody>";

            var totalTransaksi = 0;
        var totalTotalTransaksi = 0;
        
        for(var data of this.data.results) {
            var isTanggalRowSpan = false;
            var tempCash = 0;
            var tempDebit = 0;
            var tempCredit = 0;
            var tempVoucher = 0;
                for(var item of data.items){
                    if(!item.isVoid)
                    {
                    totalTransaksi ++;
                    tempCash+=item.cashNominal;
                    tempDebit+=item.debitNominal;
                    tempCredit+=item.creditNominal;
                    tempVoucher+=item.voucherNominal;
                }
                }
            for(var item of data.items) {
                if(!item.isVoid)
                    {
                        totalTotalTransaksi++;
                var isItemRowSpan = false;
                    this.reportHTML += "        <tr>";
                    
                         if(!isTanggalRowSpan)
                        this.reportHTML += "        <td width='300px' rowspan='" + data.tanggalRowSpan + "'>" + data.tanggal.getDate() + " " + months[data.tanggal.getMonth()] + " " + data.tanggal.getFullYear()+"</td>";
                        
                         if(!isTanggalRowSpan)
                        this.reportHTML += "        <td rowspan='" + data.tanggalRowSpan + "'>" + totalTransaksi +"</td>";
                    
                        
                         if(!isTanggalRowSpan)
                        this.reportHTML += "            <td rowspan='" + data.tanggalRowSpan + "'>" + tempCash +"</td>";
                        
                         if(!isTanggalRowSpan)
                        this.reportHTML += "            <td rowspan='" + data.tanggalRowSpan + "'>" + tempDebit +"</td>";
                        
                         if(!isTanggalRowSpan)
                        this.reportHTML += "            <td rowspan='" + data.tanggalRowSpan + "'>" + tempCredit +"</td>"; 
                        
                        
                         if(!isTanggalRowSpan)
                        this.reportHTML += "            <td rowspan='" + data.tanggalRowSpan + "'>" + tempVoucher +"</td>";
                        var totalOmset = tempCash+tempCredit+tempDebit+tempVoucher;
                         if(!isTanggalRowSpan)
                        this.reportHTML += "            <td rowspan='" + data.tanggalRowSpan + "'>"+totalOmset+"</td>";
                    this.reportHTML += "        </tr>";
                    isTanggalRowSpan = true;
                    }
                    isItemRowSpan = true;
                
                    this.reportHTML += "<tr></tr>";
                    
        }
                        
        
                    this.reportHTML += "<tr></tr>";
        } 
            this.reportHTML += "        <td>Total</td>";
            var totalCash = 0;
            var totalDebit = 0;
            var totalCredit = 0;
            var totalVoucher = 0;
            for(var data of this.data.results) {
                
                    for(var item of data.items) {
                        if(!item.isVoid)
                        {
                        totalCash += item.cashNominal;
                        totalDebit += item.debitNominal;
                        totalCredit += item.creditNominal;
                        totalVoucher += item.voucherNominal;
                    }    
                    }
            }
            this.totalCash = totalCash;
            var totalTotalOmset = totalCash+totalCredit+totalDebit+totalVoucher;
            this.reportHTML += "        <td style='background-color:#48cbe2;'>"+totalTotalTransaksi+"</td>";
            this.reportHTML += "        <td style='background-color:#48cbe2;'>"+totalCash.toLocaleString()+"</td>";
            this.reportHTML += "        <td style='background-color:#48cbe2;'>"+totalDebit.toLocaleString()+"</td>";
            this.reportHTML += "        <td style='background-color:#48cbe2;'>"+totalCredit.toLocaleString()+"</td>";
            this.reportHTML += "        <td style='background-color:#48cbe2;'>"+totalVoucher.toLocaleString()+"</td>";
            this.reportHTML += "        <td style='background-color:#48cbe2;'>"+totalTotalOmset.toLocaleString()+"</td>";
            
        this.reportHTML += "        </tbody>";
        this.reportHTML += "    </table>";

        this.reportHTMLDetail = "Payment Details - Card";
        this.reportHTMLDetail += "    <table class='table table-fixed'>";
        this.reportHTMLDetail += "        <thead>";
        
        this.reportHTMLDetail += "            <tr style='background-color:#282828; color:#ffffff;'>";
        this.reportHTMLDetail += "                <th>Tanggal</th>";
        this.reportHTMLDetail += "                <th>Bank</th>";
        this.reportHTMLDetail += "                <th>Debit Card (nominal)</th>";
        this.reportHTMLDetail += "                <th>Credit Card (nominal)</th>";
        this.reportHTMLDetail += "                <th>Credit Visa (nominal)</th>";
        this.reportHTMLDetail += "                <th>Credit Master (nominal)</th>";
        this.reportHTMLDetail += "            </tr>";
        this.reportHTMLDetail += "        </thead>";
        this.reportHTMLDetail += "        <tbody>";

        
        var i = 0;
        var k = 0;
        var tempBank = [];
        for(var data of this.data.results)
        {
            for(var item of data.items)
            {
                tempBank[k] = item.bank;
                   k++;
            }
        }
        var unique = tempBank.filter((v, i, a) => a.indexOf(v) === i); 
        this.unique = unique;
        this.unique.sort();
        for(var j = 0; j < unique.length; j++)
        {
            var totalTempDebit = 0;
            var totalTempCredit = 0;
            var totalTempCreditMaster = 0;
            var totalTempCreditVisa = 0;
    
                for(var data of this.data.results) {
                    var isTanggalRowSpan = false;
                        var tempDebit = 0;
                        var tempCredit = 0;
                        var tempCreditMaster = 0;
                        var tempCreditVisa = 0;
                        var isItemRowSpan = 0;

                    for(var item of data.items){
                        if(!item.isVoid)
                        {
                        if(item.bank == unique[j] && item.bank != "Cash"){
                            tempDebit+=item.debitNominalLainnya;
                            tempCredit+=item.creditNominalLainnya;
                            tempCreditMaster+=item.creditMasterNominal;
                            tempCreditVisa+=item.creditVisaNominal;
                            }
                        }
                    }
                                
                    for(var item of data.items) {
                            if(item.bank == unique[j] && item.bank != "Cash" && !item.isVoid){
                                
                            this.reportHTML += "        <tr>";
                                if(!isTanggalRowSpan)
                                this.reportHTMLDetail += "        <td width='300px' rowspan='" + data.tanggalRowSpan + "'>" + data.tanggal.getDate() + " " + months[data.tanggal.getMonth()] + " " + data.tanggal.getFullYear()+"</td>";
                                
                                if(!isTanggalRowSpan)
                                this.reportHTMLDetail += "        <td rowspan='" + data.tanggalRowSpan + "'>"  + item.bank +"</td>"; 
                                
                                if(!isTanggalRowSpan)
                                this.reportHTMLDetail += "            <td rowspan='" +  data.tanggalRowSpan  + "'>" + tempDebit.toLocaleString() +"</td>";
                                
                                if(!isTanggalRowSpan)
                                this.reportHTMLDetail += "            <td rowspan='" +  data.tanggalRowSpan  + "'>" + tempCredit.toLocaleString() +"</td>"; 
                                
                                if(!isTanggalRowSpan)
                                this.reportHTMLDetail += "            <td rowspan='" +  data.tanggalRowSpan  + "'>" + tempCreditVisa.toLocaleString() +"</td>"; 
                                
                                if(!isTanggalRowSpan)
                                this.reportHTMLDetail += "            <td rowspan='" +  data.tanggalRowSpan  + "'>" + tempCreditMaster.toLocaleString() +"</td>";
                            
                            isItemRowSpan++;

                                if(!isTanggalRowSpan)
                                {
                                    totalTempDebit+=tempDebit;
                                    totalTempCredit+=tempCredit;
                                    totalTempCreditMaster+=tempCreditMaster;
                                    totalTempCreditVisa+=tempCreditVisa;
                                    
                    this.reportHTMLDetail += "<tr></tr>";
                                    
                                }
                                
                            isTanggalRowSpan = true;

                    this.reportHTMLDetail += "<tr></tr>";
                            }
                            
                    this.reportHTMLDetail += "<tr></tr>";
                            
                    }
                    this.reportHTMLDetail += "<tr></tr>";
                }
            if(unique[j]!="Cash"){    
                this.reportHTMLDetail += "        <td>Total</td>";
                
                this.reportHTMLDetail += "        <td></td>";
                this.reportHTMLDetail += "<td style='background-color:#48cbe2;'>"+totalTempDebit+"</td>";
                this.reportHTMLDetail += "<td style='background-color:#48cbe2;'>"+totalTempCredit+"</td>";
                this.reportHTMLDetail += "<td style='background-color:#48cbe2;'>"+totalTempCreditVisa+"</td>";
                this.reportHTMLDetail += "<td style='background-color:#48cbe2;'>"+totalTempCreditMaster+"</td>";

                this.arrTotalTempDebit[j] = totalTempDebit;
                this.totalTempDebit = totalTempDebit;
                this.arrTotalTempCredit[j] = totalTempCredit;
                this.totalTempCredit = totalTempCredit;
                this.arrTotalTempCreditVisa[j] = totalTempCreditVisa;
                this.totalTempCreditVisa = totalTempCreditVisa;
                this.arrTotalTempCreditMaster[j] = totalTempCreditMaster;
                this.totalTempCreditMaster = totalTempCreditMaster;

                this.subtotalArrTotal += this.arrTotalTempDebit[j]+this.arrTotalTempCredit[j]+this.arrTotalTempCreditMaster[j]+this.arrTotalTempCreditVisa[j];
            }
            if(unique[j]=="Cash"){
                var index = unique.indexOf("Cash");
                if (index >= 0) {
                unique.splice( index, 1 );
                }   
            }
            
            
            
            
        } 
        this.subtotalArrTotal+=(this.totalCash+this.data.filter.store.salesCapital);
            
        this.reportHTMLDetail += "        </tbody>";
        this.reportHTMLDetail += "    </table>";


        
         
    }
}
