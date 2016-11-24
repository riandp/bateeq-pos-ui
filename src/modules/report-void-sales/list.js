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
        if(dateto < datefrom)
            this.error.filter.dateTo = "Date To must bigger than from";
        else{ 
            var getData = [];

            var ddlStore = document.getElementById("ddlStore");
            var textDdlStore = ddlStore.options[ddlStore.selectedIndex].text;
             var ddlShift = document.getElementById("ddlShift");
            var textDdlShift = ddlShift.options[ddlShift.selectedIndex].text;
            
            for(var d = datefrom; d <= dateto; d.setDate(d.getDate() + 1)) {
                var date = new Date(d);
                var fromString = this.getStringDate(date) + 'T00:00:00'; 
                var toString = this.getStringDate(date) + 'T23:59:59';
                if(textDdlStore=="semua" && textDdlShift!="semua")
                {
                getData.push(this.service.getAllSalesAllStore("storeName=null", fromString, toString, textDdlShift, "typeAllStore=true"));
                }
                else if(textDdlShift=="semua" && textDdlStore!="semua")
                {
                getData.push(this.service.getAllSalesAllShift(textDdlStore, fromString, toString, "storeShift=null", "typeAllStore=false", "typeAllShift=true"));
                }
                else if(textDdlStore=="semua" && textDdlShift=="semua")
                {
                getData.push(this.service.getAllSalesAllStoreAllShift("storeName=null", fromString, toString, "storeShift=null", "typeAllStore=true","typeAllShift=true", "typeAllStoreAllShift=true"));
                
                }
                else if(textDdlStore!="semua" && textDdlShift!="semua")
                {
                getData.push(this.service.getAllSalesAllStoreAllShiftNoStoreNoShift(textDdlStore, fromString, toString, textDdlShift, "typeAllStore=false","typeAllShift=false", "typeAllStoreAllShift=false", "typeNoStoreNoShift=true"));
                }
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
                                itemData.isVoid = data.isVoid;
                                itemData.nomorPembayaran = data.code;
                                itemData.Toko = data.store.name;
                                itemData.grandTotal = data.grandTotal;
                                itemData._createdBy = data._createdBy;
                                itemData.shift = data.shift;
                                itemData._updatedBy = data._updatedBy;
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

        this.reportHTML = "";
        this.reportHTML += "    <table class='table table-fixed'>";
        this.reportHTML += "        <thead>";
        this.reportHTML += "            <tr style='background-color:#282828; color:#ffffff;'>";
        this.reportHTML += "                <th>Tanggal</th>";
        this.reportHTML += "                <th>Nomor Transaksi</th>";
        this.reportHTML += "                <th>Toko</th>";
        this.reportHTML += "                <th>Grand Total</th>";
        this.reportHTML += "                <th>Kasir</th>";
        this.reportHTML += "                <th>Shift</th>";
        this.reportHTML += "                <th>Di Void oleh</th>";
        this.reportHTML += "            </tr>";
        this.reportHTML += "        </thead>";
        this.reportHTML += "        <tbody>";

        
        for(var data of this.data.results) {
            var isTanggalRowSpan = false;
            
            for(var item of data.items) {
                var isItemRowSpan = false;
                    if(item.isVoid){
                    this.reportHTML += "        <tr>";
                    
                        this.reportHTML += "        <td width='300px' rowspan='" + data.tanggalRowSpan + "'>" + data.tanggal.getDate() + " " + months[data.tanggal.getMonth()] + " " + data.tanggal.getFullYear()+"</td>";
                        
                        this.reportHTML += "            <td rowspan='" + data.tanggalRowSpan + "'>" + item.nomorPembayaran +"</td>";
                        
                        this.reportHTML += "            <td rowspan='" + data.tanggalRowSpan + "'>" + item.Toko +"</td>"; 
                        
                        this.reportHTML += "            <td rowspan='" + data.tanggalRowSpan + "'>" + item.grandTotal +"</td>";
                        
                        
                        this.reportHTML += "            <td rowspan='" + data.tanggalRowSpan + "'>" + item._createdBy +"</td>";
                        
                        this.reportHTML += "            <td rowspan='" + data.tanggalRowSpan + "'>" + item.shift +"</td>";
                        
                        this.reportHTML += "            <td rowspan='" + data.tanggalRowSpan + "'>" + item._updatedBy +"</td>";

                    this.reportHTML += "        </tr>";
                    }
                    isTanggalRowSpan = true;
                    isItemRowSpan = true;
                
                    
        }
        } 
            
         
    }
}
