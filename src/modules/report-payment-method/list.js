import {inject, Lazy, BindingEngine} from 'aurelia-framework';
import {Router} from 'aurelia-router';
import {Service} from './service';


@inject(Router, Service, BindingEngine)
export class List {

    storeApiUri = require('../../host').master + '/stores';

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
            if (this.data.filter.store)
                if (this.data.filter.store.salesTarget)
                    this.targetPerMonth = this.data.filter.store.salesTarget;
        });
    }

    filter() {
        this.error = { filter: {}, results: [] };
        var datefrom = new Date(this.data.filter.dateFrom);
        var dateto = new Date(this.data.filter.dateTo);

        if (this.data.filter.storeId == undefined || this.data.filter.storeId == '')
            this.error.filter.storeId = "Please choose Store";
        else if (dateto < datefrom)
            this.error.filter.dateTo = "Date To must bigger than from";
        else {
            var getData = [];
            var e = document.getElementById("ddlShift");
            var strUser = e.options[e.selectedIndex].text;
            for (var d = datefrom; d <= dateto; d.setDate(d.getDate() + 1)) {
                var date = new Date(d);
                var fromString = this.getStringDate(date) + 'T00:00:00';
                var toString = this.getStringDate(date) + 'T23:59:59';

                getData.push(this.service.getAllSalesByFilter(this.data.filter.storeId, fromString, toString, strUser));
            }
            Promise.all(getData)
                .then(salesPerDays => {
                    this.data.results = [];
                    for (var salesPerDay of salesPerDays) {
                        if (salesPerDay.length != 0) {
                            var totalSubTotal = 0;

                            var tanggalRowSpan = 0;
                            var result = {};
                            result.items = [];
                            for (var data of salesPerDay) {
                                var itemRowSpan = 0;
                                var itemData = {};
                                itemData.details = [];
                                result.tanggal = new Date(data.date);

                                itemData.nomorPembayaran = data.code;
                                itemData.isVoid = data.isVoid;
                                itemData.voucherNominal = parseInt(data.salesDetail.voucher.value);
                                if (data.salesDetail.cashAmount != 0 && data.salesDetail.cardAmount == 0)
                                    itemData.cashNominal = parseInt(data.grandTotal) - parseInt(data.salesDetail.voucher.value);
                                else
                                    itemData.cashNominal = parseInt(data.salesDetail.cashAmount);
                                if (data.salesDetail.card && data.salesDetail.card == "Debit") {
                                    itemData.debitNominal = parseInt(data.salesDetail.cardAmount);
                                    itemData.creditNominal = 0;
                                }
                                else {
                                    itemData.debitNominal = 0;
                                    itemData.creditNominal = parseInt(data.salesDetail.cardAmount);
                                }
                                itemData.cardTypeName = data.salesDetail.card;

                                if (data.salesDetail.bank.name != null) {
                                    itemData.bank = data.salesDetail.bank.name;
                                    itemData.bankCard = data.salesDetail.bankCard.name;
                                }
                                else
                                    itemData.bank = "Cash";

                                if (data.salesDetail.cardType.name == "Mastercard") {
                                    itemData.debitNominalLainnya = 0;
                                    itemData.creditMasterNominal = parseInt(data.salesDetail.cardAmount);
                                    itemData.creditVisaNominal = 0;
                                    itemData.creditNominalLainnya = 0;
                                    itemData.cardTypeName = data.salesDetail.cardType.name;

                                }
                                else if (data.salesDetail.cardType.name == "Visa") {
                                    itemData.debitNominalLainnya = 0;
                                    itemData.creditMasterNominal = 0;
                                    itemData.creditVisaNominal = parseInt(data.salesDetail.cardAmount);
                                    itemData.creditNominalLainnya = 0;
                                    itemData.cardTypeName = data.salesDetail.cardType.name;

                                }
                                else if (data.salesDetail.cardType.name != "Visa" && data.salesDetail.cardType.name != "Mastercard") {
                                    if (data.salesDetail.card == "Debit") {
                                        itemData.creditNominalLainnya = 0;
                                        itemData.debitNominalLainnya = parseInt(data.salesDetail.cardAmount);
                                        itemData.creditMasterNominal = 0;
                                        itemData.creditVisaNominal = 0;
                                    }
                                    else {
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
        var mm = date.getMonth() + 1; //January is 0! 
        var yyyy = date.getFullYear();
        if (dd < 10) {
            dd = '0' + dd
        }
        if (mm < 10) {
            mm = '0' + mm
        }
        date = yyyy + '-' + mm + '-' + dd;
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
        //console.log(JSON.stringify(this.data.results));
        var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

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

        for (var data of this.data.results) {
            var isTanggalRowSpan = false;
            var tempCash = 0;
            var tempDebit = 0;
            var tempCredit = 0;
            var tempVoucher = 0;
            totalTransaksi = 0;
            for (var item of data.items) {
                if (!item.isVoid) {
                    totalTransaksi++;
                    tempCash += item.cashNominal;
                    tempDebit += item.debitNominal;
                    tempCredit += item.creditNominal;
                    tempVoucher += item.voucherNominal;
                }
            }
            for (var item of data.items) {
                if (!item.isVoid) {
                    totalTotalTransaksi++;
                    var isItemRowSpan = false;
                    this.reportHTML += "        <tr>";

                    if (!isTanggalRowSpan)
                        this.reportHTML += "        <td width='300px' rowspan='" + data.tanggalRowSpan + "'>" + data.tanggal.getDate() + " " + months[data.tanggal.getMonth()] + " " + data.tanggal.getFullYear() + "</td>";

                    if (!isTanggalRowSpan)
                        this.reportHTML += "        <td rowspan='" + data.tanggalRowSpan + "'>" + totalTransaksi + "</td>";


                    if (!isTanggalRowSpan)
                        this.reportHTML += "            <td rowspan='" + data.tanggalRowSpan + "'>" + tempCash.toLocaleString() + "</td>";

                    if (!isTanggalRowSpan)
                        this.reportHTML += "            <td rowspan='" + data.tanggalRowSpan + "'>" + tempDebit.toLocaleString() + "</td>";

                    if (!isTanggalRowSpan)
                        this.reportHTML += "            <td rowspan='" + data.tanggalRowSpan + "'>" + tempCredit.toLocaleString() + "</td>";


                    if (!isTanggalRowSpan)
                        this.reportHTML += "            <td rowspan='" + data.tanggalRowSpan + "'>" + tempVoucher.toLocaleString() + "</td>";
                    var totalOmset = tempCash + tempCredit + tempDebit + tempVoucher;
                    if (!isTanggalRowSpan)
                        this.reportHTML += "            <td rowspan='" + data.tanggalRowSpan + "'>" + totalOmset.toLocaleString() + "</td>";
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
        for (var data of this.data.results) {

            for (var item of data.items) {
                if (!item.isVoid) {
                    totalCash += item.cashNominal;
                    totalDebit += item.debitNominal;
                    totalCredit += item.creditNominal;
                    totalVoucher += item.voucherNominal;
                }
            }
        }
        this.totalCash = totalCash;
        var totalTotalOmset = totalCash + totalCredit + totalDebit + totalVoucher;
        this.reportHTML += "        <td style='background-color:#48cbe2;'>" + totalTotalTransaksi + "</td>";
        this.reportHTML += "        <td style='background-color:#48cbe2;'>" + totalCash.toLocaleString() + "</td>";
        this.reportHTML += "        <td style='background-color:#48cbe2;'>" + totalDebit.toLocaleString() + "</td>";
        this.reportHTML += "        <td style='background-color:#48cbe2;'>" + totalCredit.toLocaleString() + "</td>";
        this.reportHTML += "        <td style='background-color:#48cbe2;'>" + totalVoucher.toLocaleString() + "</td>";
        this.reportHTML += "        <td style='background-color:#48cbe2;'>" + totalTotalOmset.toLocaleString() + "</td>";
        this.reportHTML += "        </tbody>";
        this.reportHTML += "    </table>";




        this.reportHTMLDetail = "Payment Details - Card";
        this.reportHTMLDetail += "    <table class='table table-fixed'>";
        this.reportHTMLDetail += "        <thead>";

        this.reportHTMLDetail += "            <tr style='background-color:#282828; color:#ffffff;'>";
        this.reportHTMLDetail += "                <th>Tanggal</th>";
        this.reportHTMLDetail += "                <th>Bank (EDC)</th>";
        this.reportHTMLDetail += "                <th>Bank (Card)</th>";
        this.reportHTMLDetail += "                <th>Debit Card (nominal)</th>";
        this.reportHTMLDetail += "                <th>Credit Card (nominal)</th>";
        this.reportHTMLDetail += "                <th>Credit Visa (nominal)</th>";
        this.reportHTMLDetail += "                <th>Credit Master (nominal)</th>";
        this.reportHTMLDetail += "            </tr>";
        this.reportHTMLDetail += "        </thead>";
        this.reportHTMLDetail += "        <tbody>";

        var jsonResults = [];
        for (var data of this.data.results) {
            for (var item of data.items) {
                var jsonResult = {};
                jsonResult.cardAmountDebit = 0;
                jsonResult.cardAmountCredit = 0;
                jsonResult.cardAmountVisa = 0;
                jsonResult.cardAmountMaster = 0;
                // kalau belum ada data
                if (jsonResults.length == 0) {
                    if (item.bank != "Cash") {
                        jsonResult.tanggal = data.tanggal.getDate() + " " + months[data.tanggal.getMonth()] + " " + data.tanggal.getFullYear();
                        if (item.bank == "")
                            jsonResult.bank = "Tidak Teridentifikasi";
                        else
                            jsonResult.bank = item.bank;
                        if (item.bankCard == "")
                            jsonResult.bankCard = "Tidak Teridentifikasi";
                        else
                            jsonResult.bankCard = item.bankCard;
                        jsonResult.cardTypeName = item.cardTypeName;
                        if (item.cardTypeName == "Debit") {
                            jsonResult.cardAmountDebit = item.debitNominal;
                        }
                        else {
                            if (item.cardTypeName == "Credit")
                                jsonResult.cardAmountCredit = item.creditNominal;
                            if (item.cardTypeName == "Visa")
                                jsonResult.cardAmountVisa = item.creditVisaNominal;
                            else if (item.cardTypeName == "Mastercard")
                                jsonResult.cardAmountMaster = item.creditMasterNominal;
                        }
                        jsonResults.push(jsonResult);
                    }
                }
                else {
                    var isHave = false;
                    // cek apakah data ada yang sama atau tidak
                    // jika ada data yang sama, tambahkan dengan yang sudah ada
                    for (var itemResult of jsonResults) {
                        var a = data.tanggal.getDate() + " " + months[data.tanggal.getMonth()] + " " + data.tanggal.getFullYear();
                        var b = itemResult.tanggal;
                        if (new String(a).valueOf().toLowerCase() == new String(b).valueOf().toLowerCase() && item.cardTypeName == itemResult.cardTypeName && item.bank == itemResult.bank && item.bankCard == itemResult.bankCard && item.bank != "Cash") {
                            itemResult.tanggal = data.tanggal.getDate() + " " + months[data.tanggal.getMonth()] + " " + data.tanggal.getFullYear();
                            if (item.bank == "")
                                itemResult.bank = "Tidak Teridentifikasi";
                            else
                                itemResult.bank = item.bank;
                            if (item.bankCard == "")
                                itemResult.bankCard = "Tidak Teridentifikasi";
                            else
                                itemResult.bankCard = item.bankCard;
                            itemResult.cardTypeName = item.cardTypeName;

                            if (item.cardTypeName == "Debit")
                                itemResult.cardAmountDebit += item.debitNominal;
                            else {
                                if (item.cardTypeName == "Credit")
                                    itemResult.cardAmountCredit += item.creditNominal;
                                else if (item.cardTypeName == "Visa")
                                    itemResult.cardAmountVisa += item.creditVisaNominal;
                                else if (item.cardTypeName == "Mastercard")
                                    itemResult.cardAmountMaster += item.creditMasterNominal;
                            }

                            jsonResult.tanggal = itemResult.tanggal;
                            jsonResult.bank = itemResult.bank;
                            jsonResult.bankCard = itemResult.bankCard;
                            jsonResult.cardTypeName = itemResult.cardTypeName;
                            jsonResult.cardAmountDebit = itemResult.cardAmountDebit;
                            jsonResult.cardAmountCredit = itemResult.cardAmountCredit;
                            jsonResult.cardAmountVisa = itemResult.cardAmountVisa;
                            jsonResult.cardAmountMaster = itemResult.cardAmountMaster;
                            isHave = true;
                            jsonResults.push(jsonResult);

                            var index = jsonResults.indexOf(itemResult.tanggal);
                            //if (jsonResults.indexOf(itemResult.tanggal) >= 0 && jsonResults.indexOf(itemResult.bank) >= 0 && jsonResults.indexOf(itemResult.bankCard) >= 0 && jsonResults.indexOf(itemResult.cardTypeName) >= 0) {
                            jsonResults.splice(index, 1);
                            //}

                            break;
                        }
                    }
                    // jika belum ada data yang sama, buat baru
                    if (!isHave && item.bank != "Cash") {
                        jsonResult.tanggal = data.tanggal.getDate() + " " + months[data.tanggal.getMonth()] + " " + data.tanggal.getFullYear();
                        if (item.bank == "")
                            jsonResult.bank = "Tidak Teridentifikasi";
                        else
                            jsonResult.bank = item.bank;
                        if (item.bankCard == "")
                            jsonResult.bankCard = "Tidak Teridentifikasi";
                        else
                            jsonResult.bankCard = item.bankCard;
                        jsonResult.cardTypeName = item.cardTypeName;

                        if (item.cardTypeName == "Debit")
                            jsonResult.cardAmountDebit = item.debitNominal;
                        else {
                            if (item.cardTypeName == "Credit")
                                jsonResult.cardAmountCredit = item.creditNominal;
                            else if (item.cardTypeName == "Visa")
                                jsonResult.cardAmountVisa = item.creditVisaNominal;
                            else if (item.cardTypeName == "Mastercard")
                                jsonResult.cardAmountMaster = item.creditMasterNominal;
                        }
                        jsonResults.push(jsonResult);

                    }

                }
            }
        }

        var totalCardAmountDebit = 0, totalCardAmountCredit = 0, totalCardAmountVisa = 0, totalCardAmountMaster = 0;
        for (var i = 0; i < jsonResults.length; i++) {
            console.log(jsonResults[i].tanggal);
            console.log(jsonResults[i].bank);
            console.log(jsonResults[i].bankCard);
            console.log(jsonResults[i].cardTypeName);
            console.log(jsonResults[i].cardAmountDebit);
            console.log(jsonResults[i].cardAmountCredit);
            console.log(jsonResults[i].cardAmountVisa);
            console.log(jsonResults[i].cardAmountMaster);
            this.reportHTML += "        <tr>";

            this.reportHTMLDetail += "        <td>" + jsonResults[i].tanggal + "</td>";
            this.reportHTMLDetail += "        <td>" + jsonResults[i].bank + "</td>";
            this.reportHTMLDetail += "        <td>" + jsonResults[i].bankCard + "</td>";
            this.reportHTMLDetail += "        <td>" + jsonResults[i].cardAmountDebit.toLocaleString() + "</td>";
            this.reportHTMLDetail += "        <td>" + jsonResults[i].cardAmountCredit.toLocaleString() + "</td>";
            this.reportHTMLDetail += "        <td>" + jsonResults[i].cardAmountVisa.toLocaleString() + "</td>";
            this.reportHTMLDetail += "        <td>" + jsonResults[i].cardAmountMaster.toLocaleString() + "</td>";

            this.reportHTML += "        </tr>";
            this.reportHTMLDetail += "<tr></tr>";

            totalCardAmountDebit += parseInt(jsonResults[i].cardAmountDebit);
            totalCardAmountCredit += parseInt(jsonResults[i].cardAmountCredit);
            totalCardAmountVisa += jsonResults[i].cardAmountVisa;
            totalCardAmountMaster += jsonResults[i].cardAmountMaster;

        }
        this.reportHTMLDetail += "        <td></td>";
        this.reportHTMLDetail += "        <td></td>";
        this.reportHTMLDetail += "        <td></td>";
        this.reportHTMLDetail += "        <td style='background-color:#48cbe2;'>" + totalCardAmountDebit.toLocaleString() + "</td>";
        this.reportHTMLDetail += "        <td style='background-color:#48cbe2;'>" + totalCardAmountCredit.toLocaleString() + "</td>";
        this.reportHTMLDetail += "        <td style='background-color:#48cbe2;'>" + totalCardAmountVisa.toLocaleString() + "</td>";
        this.reportHTMLDetail += "        <td style='background-color:#48cbe2;'>" + totalCardAmountMaster.toLocaleString() + "</td>";

        var jsonResults2 = [];

        for (var data of jsonResults) {
            var jsonResult2 = {};
            jsonResult2.cardAmountDebit = 0;
            jsonResult2.cardAmountCredit = 0;
            jsonResult2.cardAmountVisa = 0;
            jsonResult2.cardAmountMaster = 0;
            // jika belum ada data, buat data baru
            if (jsonResults2.length == 0) {
                jsonResult2.bank = data.bank;
                jsonResult2.bankCard = data.bankCard;
                jsonResult2.cardTypeName = data.cardTypeName;
                if (data.cardTypeName == "Debit") {
                    jsonResult2.cardAmountDebit = data.cardAmountDebit;
                }
                else {
                    if (data.cardTypeName == "Credit")
                        jsonResult2.cardAmountCredit = data.cardAmountCredit;
                    if (data.cardTypeName == "Visa")
                        jsonResult2.cardAmountVisa = data.cardAmountVisa;
                    else if (data.cardTypeName == "Mastercard")
                        jsonResult2.cardAmountMaster = data.cardAmountMaster;
                }
                jsonResults2.push(jsonResult2);
            }

            else {
                var isHave = false;
                // cek apakah data ada yang sama atau tidak
                // jika ada data yang sama, tambahkan dengan yang sudah ada
                for (var itemResult of jsonResults2) {
                    if (data.cardTypeName == itemResult.cardTypeName && data.bank == itemResult.bank && data.bankCard == itemResult.bankCard) {
                        itemResult.bank = data.bank;
                        itemResult.bankCard = data.bankCard;
                        itemResult.cardTypeName = data.cardTypeName;

                        if (data.cardTypeName == "Debit")
                            itemResult.cardAmountDebit += data.cardAmountDebit;
                        else {
                            if (data.cardTypeName == "Credit")
                                itemResult.cardAmountCredit += data.cardAmountCredit;
                            else if (data.cardTypeName == "Visa")
                                itemResult.cardAmountVisa += data.cardAmountVisa;
                            else if (item.cardTypeName == "Mastercard")
                                itemResult.cardAmountMaster += data.cardAmountMaster;
                        }

                        jsonResult2.bank = itemResult.bank;
                        jsonResult2.bankCard = itemResult.bankCard;
                        jsonResult2.cardTypeName = itemResult.cardTypeName;
                        jsonResult2.cardAmountDebit = itemResult.cardAmountDebit;
                        jsonResult2.cardAmountCredit = itemResult.cardAmountCredit;
                        jsonResult2.cardAmountVisa = itemResult.cardAmountVisa;
                        jsonResult2.cardAmountMaster = itemResult.cardAmountMaster;
                        isHave = true;
                        jsonResults2.push(jsonResult2);

                        var index = jsonResults2.indexOf(itemResult.cardTypeName);
                        //if (jsonResults.indexOf(itemResult.tanggal) >= 0 && jsonResults.indexOf(itemResult.bank) >= 0 && jsonResults.indexOf(itemResult.bankCard) >= 0 && jsonResults.indexOf(itemResult.cardTypeName) >= 0) {
                        jsonResults2.splice(index, 1);
                        //}

                        break;
                    }
                }
                // jika belum ada data yang sama, buat baru
                if (!isHave) {
                    jsonResult2.bank = data.bank;

                    jsonResult2.bankCard = data.bankCard;
                    jsonResult2.cardTypeName = data.cardTypeName;

                    if (data.cardTypeName == "Debit")
                        jsonResult2.cardAmountDebit = data.cardAmountDebit;
                    else {
                        if (data.cardTypeName == "Credit")
                            jsonResult2.cardAmountCredit = data.cardAmountCredit;
                        else if (data.cardTypeName == "Visa")
                            jsonResult2.cardAmountVisa = data.cardAmountVisa;
                        else if (data.cardTypeName == "Mastercard")
                            jsonResult2.cardAmountMaster = data.cardAmountMaster;
                    }
                    jsonResults2.push(jsonResult2);

                }

            }

        }

        var totalTempDebit = 0;
        var totalTempCredit = 0;
        var totalTempCreditMaster = 0;
        var totalTempCreditVisa = 0;
        this.jsonResults2 = jsonResults2;
        for (var i = 0; i < jsonResults2.length; i++) {
            console.log(jsonResults2[i].bank);
            console.log(jsonResults2[i].bankCard);
            console.log(jsonResults2[i].cardTypeName);
            console.log(jsonResults2[i].cardAmountDebit);
            console.log(jsonResults2[i].cardAmountCredit);
            console.log(jsonResults2[i].cardAmountVisa);
            console.log(jsonResults2[i].cardAmountMaster);



            // totalTempDebit += jsonResults2[i].cardAmountDebit;
            // totalTempCredit += jsonResults2[i].cardAmountCredit;
            // totalTempCreditMaster += jsonResults2[i].cardAmountMaster;
            // totalTempCreditVisa += jsonResults2[i].cardAmountVisa;


            this.arrTotalTempDebit[i] = jsonResults2[i].cardAmountDebit;
            this.arrTotalTempCredit[i] = jsonResults2[i].cardAmountCredit;
            this.arrTotalTempCreditVisa[i] = jsonResults2[i].cardAmountVisa;
            this.arrTotalTempCreditMaster[i] = jsonResults2[i].cardAmountMaster;

            this.subtotalArrTotal += this.arrTotalTempDebit[i] + this.arrTotalTempCredit[i] + this.arrTotalTempCreditMaster[i] + this.arrTotalTempCreditVisa[i];
            
            // this.reportHTMLDetail += "<tr></tr>";
            // this.reportHTMLDetail += "        <td></td>";
            // this.reportHTMLDetail += "        <td>" + jsonResults2[i].bank + "</td>";
            // this.reportHTMLDetail += "        <td>" + jsonResults2[i].bankCard + "</td>";
            // this.reportHTMLDetail += "        <td>" + jsonResults2[i].cardAmountDebit.toLocaleString() + "</td>";
            // this.reportHTMLDetail += "        <td>" + jsonResults2[i].cardAmountCredit.toLocaleString() + "</td>";
            // this.reportHTMLDetail += "        <td>" + jsonResults2[i].cardAmountVisa.toLocaleString() + "</td>";
            // this.reportHTMLDetail += "        <td>" + jsonResults2[i].cardAmountMaster.toLocaleString() + "</td>";
        }
        this.subtotalArrTotal += (this.totalCash + this.data.filter.store.salesCapital);




        // var i = 0;
        // var k = 0;
        // var tempBank = [];
        // var tempBankCard = [];
        // for (var data of this.data.results) {
        //     for (var item of data.items) {

        //         tempBank[k] = item.bank;
        //         tempBankCard[k] = item.bankCard;
        //         k++;
        //     }
        // }
        // var unique = tempBank.filter((v, i, a) => a.indexOf(v) === i);
        // this.unique = unique;
        // this.unique.sort();

        // var unique2 = tempBankCard.filter((v, i, a) => a.indexOf(v) === i);
        // this.unique2 = unique2;
        // this.unique2.sort();
        // for (var x = 0; x < unique.length; x++) {
        //     var totalTempDebit = 0;
        //     var totalTempCredit = 0;
        //     var totalTempCreditMaster = 0;
        //     var totalTempCreditVisa = 0;

        //     var tempDebit = 0;
        //     var tempCredit = 0;
        //     var tempCreditMaster = 0;
        //     var tempCreditVisa = 0;

        //     for (var y = 0; y < unique2.length; y++) {
        //         for (var z = 0; z < jsonResults.length; z++) {
        //             if (jsonResults[z].bank == unique[x] && jsonResults[z].bankCard == unique2[y]) {
        //                 tempDebit += jsonResults[z].cardAmountDebit;
        //                 tempCredit += jsonResults[z].cardAmountCredit;
        //                 tempCreditMaster += jsonResults[z].cardAmountMaster;
        //                 tempCreditVisa += jsonResults[z].cardAmountVisa;

        //                 totalTempDebit += tempDebit;
        //                 totalTempCredit += tempCredit;
        //                 totalTempCreditMaster += tempCreditMaster;
        //                 totalTempCreditVisa += tempCreditVisa;

        //                 this.arrTotalTempDebit[z] = totalTempDebit;
        //                 this.totalTempDebit = totalTempDebit;
        //                 this.arrTotalTempCredit[z] = totalTempCredit;
        //                 this.totalTempCredit = totalTempCredit;
        //                 this.arrTotalTempCreditVisa[z] = totalTempCreditVisa;
        //                 this.totalTempCreditVisa = totalTempCreditVisa;
        //                 this.arrTotalTempCreditMaster[z] = totalTempCreditMaster;
        //                 this.totalTempCreditMaster = totalTempCreditMaster;

        //                 this.subtotalArrTotal += this.arrTotalTempDebit[z] + this.arrTotalTempCredit[z] + this.arrTotalTempCreditMaster[z] + this.arrTotalTempCreditVisa[z];


        //             }

        //         }
        //     }
        //     if (unique[x] == "Cash") {
        //         var index = unique.indexOf("Cash");
        //         if (index >= 0) {
        //             unique.splice(index, 1);
        //         }
        //     }
        // }

        // this.subtotalArrTotal += (this.totalCash + this.data.filter.store.salesCapital);


        // var i = 0;
        // var k = 0;
        // var tempBank = [];
        // var tempBankCard = [];
        // for (var data of this.data.results) {
        //     for (var item of data.items) {

        //         tempBank[k] = item.bank;
        //         tempBankCard[k] = item.bankCard;
        //         k++;
        //     }
        // }
        // var unique = tempBank.filter((v, i, a) => a.indexOf(v) === i);
        // this.unique = unique;
        // this.unique.sort();

        // var unique2 = tempBankCard.filter((v, i, a) => a.indexOf(v) === i);
        // this.unique2 = unique2;
        // this.unique2.sort();
        // for (var j = 0; j < unique.length; j++) {
        //     var totalTempDebit = 0;
        //     var totalTempCredit = 0;
        //     var totalTempCreditMaster = 0;
        //     var totalTempCreditVisa = 0;

        //     for (var data of this.data.results) {
        //         var isTanggalRowSpan = false;
        //         var tempDebit = 0;
        //         var tempCredit = 0;
        //         var tempCreditMaster = 0;
        //         var tempCreditVisa = 0;
        //         var isItemRowSpan = 0;

        //         for (var item of data.items) {
        //             if (!item.isVoid) {
        //                 if (item.bank == unique[j] && item.bank != "Cash") {
        //                     tempDebit += item.debitNominalLainnya;
        //                     tempCredit += item.creditNominalLainnya;
        //                     tempCreditMaster += item.creditMasterNominal;
        //                     tempCreditVisa += item.creditVisaNominal;
        //                 }
        //             }
        //         }

        //         for (var item of data.items) {
        //             if (item.bank == unique[j] && item.bank != "Cash" && !item.isVoid) {

        //                 this.reportHTML += "        <tr>";
        //                 if (!isTanggalRowSpan)
        //                     this.reportHTMLDetail += "        <td width='300px' rowspan='" + data.tanggalRowSpan + "'>" + data.tanggal.getDate() + " " + months[data.tanggal.getMonth()] + " " + data.tanggal.getFullYear() + "</td>";

        //                 if (!isTanggalRowSpan) {
        //                     this.reportHTMLDetail += "        <td rowspan='" + data.tanggalRowSpan + "'>" + item.bank + "</td>";
        //                     this.reportHTMLDetail += "        <td rowspan='" + data.tanggalRowSpan + "'>" + item.bankCard + "</td>";

        //                 }
        //                 if (!isTanggalRowSpan)
        //                     this.reportHTMLDetail += "            <td rowspan='" + data.tanggalRowSpan + "'>" + tempDebit.toLocaleString() + "</td>";

        //                 if (!isTanggalRowSpan)
        //                     this.reportHTMLDetail += "            <td rowspan='" + data.tanggalRowSpan + "'>" + tempCredit.toLocaleString() + "</td>";

        //                 if (!isTanggalRowSpan)
        //                     this.reportHTMLDetail += "            <td rowspan='" + data.tanggalRowSpan + "'>" + tempCreditVisa.toLocaleString() + "</td>";

        //                 if (!isTanggalRowSpan)
        //                     this.reportHTMLDetail += "            <td rowspan='" + data.tanggalRowSpan + "'>" + tempCreditMaster.toLocaleString() + "</td>";

        //                 this.reportHTML += "        </tr>";
        //                 isItemRowSpan++;

        //                 if (!isTanggalRowSpan) {
        //                     totalTempDebit += tempDebit;
        //                     totalTempCredit += tempCredit;
        //                     totalTempCreditMaster += tempCreditMaster;
        //                     totalTempCreditVisa += tempCreditVisa;

        //                     this.reportHTMLDetail += "<tr></tr>";

        //                 }

        //                 isTanggalRowSpan = true;

        //                 this.reportHTMLDetail += "<tr></tr>";
        //             }

        //             this.reportHTMLDetail += "<tr></tr>";

        //         }
        //         this.reportHTMLDetail += "<tr></tr>";
        //     }
        //     this.reportHTMLDetail += "        <tr>";
        //     if (unique[j] != "Cash") {

        //         this.reportHTMLDetail += "        <tr>";
        //         this.reportHTMLDetail += "        <td>Total</td>";

        //         this.reportHTMLDetail += "        <td></td>";
        //         this.reportHTMLDetail += "        <td></td>";
        //         this.reportHTMLDetail += "<td style='background-color:#48cbe2;'>" + totalTempDebit + "</td>";
        //         this.reportHTMLDetail += "<td style='background-color:#48cbe2;'>" + totalTempCredit + "</td>";
        //         this.reportHTMLDetail += "<td style='background-color:#48cbe2;'>" + totalTempCreditVisa + "</td>";
        //         this.reportHTMLDetail += "<td style='background-color:#48cbe2;'>" + totalTempCreditMaster + "</td>";

        //         this.reportHTMLDetail += "        </tr>";
        //         this.arrTotalTempDebit[j] = totalTempDebit;
        //         this.totalTempDebit = totalTempDebit;
        //         this.arrTotalTempCredit[j] = totalTempCredit;
        //         this.totalTempCredit = totalTempCredit;
        //         this.arrTotalTempCreditVisa[j] = totalTempCreditVisa;
        //         this.totalTempCreditVisa = totalTempCreditVisa;
        //         this.arrTotalTempCreditMaster[j] = totalTempCreditMaster;
        //         this.totalTempCreditMaster = totalTempCreditMaster;

        //         this.subtotalArrTotal += this.arrTotalTempDebit[j] + this.arrTotalTempCredit[j] + this.arrTotalTempCreditMaster[j] + this.arrTotalTempCreditVisa[j];
        //     }

        //     this.reportHTMLDetail += "        </tr>";
        //     if (unique[j] == "Cash") {
        //         var index = unique.indexOf("Cash");
        //         if (index >= 0) {
        //             unique.splice(index, 1);
        //         }
        //     }




        // }
        // this.subtotalArrTotal += (this.totalCash + this.data.filter.store.salesCapital);

        this.reportHTMLDetail += "        </tbody>";
        this.reportHTMLDetail += "    </table>";




    }
}
