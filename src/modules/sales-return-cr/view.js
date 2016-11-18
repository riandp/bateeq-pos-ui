import {inject, Lazy} from 'aurelia-framework';
import {Router} from 'aurelia-router';
import {Service} from './service';


@inject(Router, Service)
export class View {
    constructor(router, service) {
        this.router = router;
        this.service = service;
        this.printStruk = "";
    }

    activate(params) {
        var id = params.id;
        this.service.getById(id)
        .then(data=>{
            this.data = data;
            this.checkPaymentType();
            this.generatePrintStruk();
        })
    }

    list()
    {
        this.router.navigateToRoute('list');
    } 
    
    checkPaymentType() {
        this.isCard = false;
        this.isCash = false;   
        var paymentType = this.data.salesDocReturn.salesDetail.paymentType; 
        if(paymentType.toLowerCase() == 'cash'){  
            this.isCash = true;
        }
        else if(paymentType.toLowerCase() == 'card'){  
            this.isCard = true;
        }
        else if(paymentType.toLowerCase() == 'partial'){  
            this.isCard = true;
            this.isCash = true;
        }  
    }
    
    print() {
        window.print();
    }
    
    getStringDate(date) { 
        date = new Date(date);
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
    
    getStringTime(date) { 
        date = new Date(date);
        var hh = date.getHours();
        var mm = date.getMinutes();
        var ss = date.getSeconds();
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
    
    generatePrintStruk() {
        var discountSubTotal = parseInt(this.data.salesDocReturn.subTotal) * (parseInt(this.data.salesDocReturn.discount) / 100);
        var exchange = (parseInt(this.data.salesDocReturn.salesDetail.cardAmount) + parseInt(this.data.salesDocReturn.salesDetail.cashAmount) + parseInt(this.data.salesDocReturn.salesDetail.voucher.value)) - parseInt(this.data.salesDocReturn.grandTotal);
        var hemat = 0;
        hemat += discountSubTotal;
        
        this.printStruk = "";
        // this.printStruk += "<div class='row'>";
        // this.printStruk += "    <div class='col-xs-12'> " + this.data.salesDocReturn.salesDetail.paymentType + " </div>";
        // this.printStruk += "</div>";
        this.printStruk += "<div class='row'>";
        this.printStruk += "    <div class='col-xs-12'> " + this.data.store.name + " </div>";
        this.printStruk += "</div>";
        this.printStruk += "<div class='row'>";
        this.printStruk += "    <div class='col-xs-12'> " + this.data.store.address + " </div>";
        this.printStruk += "</div>";
        this.printStruk += "<div class='row'>";
        this.printStruk += "    <div class='col-xs-12'> Telp: " + this.data.store.phone + " </div>";
        this.printStruk += "</div>";
        this.printStruk += "<div class='row'>";
        this.printStruk += "    <div class='col-xs-12'> No. NPWP: 31.579.110.3-532.000 </div>";
        this.printStruk += "</div>";
        this.printStruk += "<div class='row'>";
        this.printStruk += "    <div class='col-xs-12'> ====================================================== </div>";
        this.printStruk += "</div>"; 
        this.printStruk += "<div class='row'>";
        this.printStruk += "    <div class='col-xs-3'> Kasir </div>"; 
        this.printStruk += "    <div class='col-xs-9'> " + this.data.store.code + "/" + this.data._createdBy + " </div>"; 
        this.printStruk += "</div>";
        this.printStruk += "<div class='row'>";
        this.printStruk += "    <div class='col-xs-3'> Nomor </div>"; 
        this.printStruk += "    <div class='col-xs-9'> " + this.data.code + " </div>"; 
        this.printStruk += "</div>";
        this.printStruk += "<div class='row'>";
        this.printStruk += "    <div class='col-xs-3'> Tanggal </div>"; 
        this.printStruk += "    <div class='col-xs-9'> " + this.getStringDate(this.data.date) + " " + this.getStringTime(this.data.date) + " </div>"; 
        this.printStruk += "</div>"; 
        this.printStruk += "<div class='row'>";
        this.printStruk += "    <div class='col-xs-12'> Retur ================================================ </div>";
        this.printStruk += "</div>";  
        for(var item of this.data.salesDocReturn.items) {
            if(item.isReturn) {
                var totalPrice = item.quantity * item.price;
                var discount1Nominal = totalPrice * (item.discount1 / 100);
                var discount2Nominal = (totalPrice - discount1Nominal) * (item.discount2 / 100);
                var totalDiscount12 = discount1Nominal + discount2Nominal;
                var discountSpecialNominal = ((totalPrice - totalDiscount12) - item.discountNominal) * (item.specialDiscount / 100)
                //hemat += discount1Nominal + discount2Nominal + item.discountNominal + discountSpecialNominal;
                
                this.printStruk += "<div>";
                this.printStruk += "    <div class='row'>";
                this.printStruk += "        <div class='col-xs-3'> " + item.item.code + " </div>"; 
                this.printStruk += "        <div class='col-xs-9'> " + item.item.name + " </div>"; 
                this.printStruk += "    </div>"; 
                this.printStruk += "    <div class='row'>";
                this.printStruk += "        <div class='col-xs-3 text-right'> " + item.quantity.toLocaleString() + " X </div>"; 
                this.printStruk += "        <div class='col-xs-5'> " + item.price.toLocaleString() + " </div>"; 
                this.printStruk += "        <div class='col-xs-4 text-right'> " + item.total.toLocaleString() + " </div>"; 
                this.printStruk += "    </div>"; 
                if(item.discount1 > 0 || item.discount2 > 0) {
                    this.printStruk += "    <div class='row'>";
                    this.printStruk += "        <div class='col-xs-12'> Disc. Item ";
                    if(item.discount1 > 0) {
                        this.printStruk += item.discount1 + "%"; 
                    }
                    if(item.discount2 > 0) {
                        this.printStruk += " + " + item.discount2 + "%"; 
                    }
                    this.printStruk += " : " + totalDiscount12.toLocaleString() + " </div>"; 
                    this.printStruk += "    </div>"; 
                } 
                if(item.discountNominal > 0) {
                    this.printStruk += "    <div class='row'>";
                    this.printStruk += "        <div class='col-xs-12'> Disc. Nominal " + item.discountNominal.toLocaleString() + " </div>";
                    this.printStruk += "    </div>"; 
                }
                if(item.specialDiscount > 0) {
                    this.printStruk += "    <div class='row'>";
                    this.printStruk += "        <div class='col-xs-12'> Special Disc. " + item.specialDiscount + "% : " + discountSpecialNominal.toLocaleString() + " </div>";
                    this.printStruk += "    </div>"; 
                }
                this.printStruk += "    <br/>";
                this.printStruk += "</div>";
            } 
        }  
        this.printStruk += "<div class='row'>";
        this.printStruk += "    <div class='col-xs-12'> Ambil ================================================ </div>";
        this.printStruk += "</div>";  
        for(var item of this.data.salesDocReturn.items) {
            if(!item.isReturn) {
                var totalPrice = item.quantity * item.price;
                var discount1Nominal = totalPrice * (item.discount1 / 100);
                var discount2Nominal = (totalPrice - discount1Nominal) * (item.discount2 / 100);
                var totalDiscount12 = discount1Nominal + discount2Nominal;
                var discountSpecialNominal = ((totalPrice - totalDiscount12) - item.discountNominal) * (item.specialDiscount / 100)
                hemat += discount1Nominal + discount2Nominal + item.discountNominal + discountSpecialNominal;
                
                this.printStruk += "<div>";
                this.printStruk += "    <div class='row'>";
                this.printStruk += "        <div class='col-xs-3'> " + item.item.code + " </div>"; 
                this.printStruk += "        <div class='col-xs-9'> " + item.item.name + " </div>"; 
                this.printStruk += "    </div>"; 
                this.printStruk += "    <div class='row'>";
                this.printStruk += "        <div class='col-xs-3 text-right'> " + item.quantity.toLocaleString() + " X </div>"; 
                this.printStruk += "        <div class='col-xs-5'> " + item.price.toLocaleString() + " </div>"; 
                this.printStruk += "        <div class='col-xs-4 text-right'> " + item.total.toLocaleString() + " </div>"; 
                this.printStruk += "    </div>"; 
                if(item.discount1 > 0 || item.discount2 > 0) {
                    this.printStruk += "    <div class='row'>";
                    this.printStruk += "        <div class='col-xs-12'> Disc. Item ";
                    if(item.discount1 > 0) {
                        this.printStruk += item.discount1 + "%"; 
                    }
                    if(item.discount2 > 0) {
                        this.printStruk += " + " + item.discount2 + "%"; 
                    }
                    this.printStruk += " : " + totalDiscount12.toLocaleString() + " </div>"; 
                    this.printStruk += "    </div>"; 
                } 
                if(item.discountNominal > 0) {
                    this.printStruk += "    <div class='row'>";
                    this.printStruk += "        <div class='col-xs-12'> Disc. Nominal " + item.discountNominal.toLocaleString() + " </div>";
                    this.printStruk += "    </div>"; 
                }
                if(item.specialDiscount > 0) {
                    this.printStruk += "    <div class='row'>";
                    this.printStruk += "        <div class='col-xs-12'> Special Disc. " + item.specialDiscount + "% : " + discountSpecialNominal.toLocaleString() + " </div>";
                    this.printStruk += "    </div>"; 
                }
                this.printStruk += "    <br/>";
                this.printStruk += "</div>";
            }
        } 
        this.printStruk += "<div class='row'>";
        this.printStruk += "    <div class='col-xs-12'> ====================================================== </div>";
        this.printStruk += "</div>";   
        this.printStruk += "<div>";
        this.printStruk += "    <div class='row'>";
        this.printStruk += "        <div class='col-xs-4'> Total Item: " + this.data.salesDocReturn.totalProduct.toLocaleString() + " </div>";
        this.printStruk += "        <div class='col-xs-8'>";
        this.printStruk += "            <div class='row'>";
        this.printStruk += "                <div class='col-xs-8 text-right'> Subtotal :</div>";
        this.printStruk += "                <div class='col-xs-4 text-right'> " + this.data.salesDocReturn.subTotal.toLocaleString() + " </div>";
        this.printStruk += "            </div>";
        this.printStruk += "            <div class='row'>";
        this.printStruk += "                <div class='col-xs-8 text-right'> Disc :</div>";
        this.printStruk += "                <div class='col-xs-4 text-right'> " + discountSubTotal.toLocaleString() + " </div>";
        this.printStruk += "            </div>";
        this.printStruk += "            <div class='row'>";
        this.printStruk += "                <div class='col-xs-8 text-right'> Grand Total :</div>";
        this.printStruk += "                <div class='col-xs-4 text-right'> " + this.data.salesDocReturn.grandTotal.toLocaleString() + " </div>";
        this.printStruk += "            </div>";
        if(this.isCash) {
            this.printStruk += "            <div class='row'>";
            this.printStruk += "                <div class='col-xs-8 text-right'> Tunai :</div>";
            this.printStruk += "                <div class='col-xs-4 text-right'> " + this.data.salesDocReturn.salesDetail.cashAmount.toLocaleString() + " </div>";
            this.printStruk += "            </div>";
        }
        if(this.isCard) { 
            this.printStruk += "            <div class='row'>";
            this.printStruk += "                <div class='col-xs-8 text-right'> " + this.data.salesDocReturn.salesDetail.card + " Card :</div>";
            this.printStruk += "                <div class='col-xs-4 text-right'> " + this.data.salesDocReturn.salesDetail.cardAmount.toLocaleString() + " </div>";
            this.printStruk += "            </div>";
        }
        if(this.data.salesDocReturn.salesDetail.voucher.value > 0) {
            this.printStruk += "            <div class='row'>";
            this.printStruk += "                <div class='col-xs-8 text-right'> Voucher :</div>";
            this.printStruk += "                <div class='col-xs-4 text-right'> " + this.data.salesDocReturn.salesDetail.voucher.value.toLocaleString() + " </div>";
            this.printStruk += "            </div>";
        }
        if(this.isCash) {
            this.printStruk += "            <div class='row'>";
            this.printStruk += "                <div class='col-xs-8 text-right'> Kembali :</div>";
            this.printStruk += "                <div class='col-xs-4 text-right'> " + exchange.toLocaleString() + " </div>";
            this.printStruk += "            </div>";
        }
        this.printStruk += "        </div>";
        this.printStruk += "    </div>"; 
        this.printStruk += "</div>"; 
        if(this.isCard) {
            this.printStruk += "<div class='row'>";
            this.printStruk += "    <div class='col-xs-12'> Bank: " + this.data.salesDocReturn.salesDetail.bank.name + " - " + this.data.salesDocReturn.salesDetail.cardNumber + " </div>";
            this.printStruk += "</div>";  
        }
        this.printStruk += "<div class='row'>";
        this.printStruk += "    <div class='col-xs-12'> Hemat: " + hemat.toLocaleString() + " </div>";
        this.printStruk += "</div>";  
        this.printStruk += "<div class='row'>";
        this.printStruk += "    <div class='col-xs-12'> ====================================================== </div>";
        this.printStruk += "</div>";  
        this.printStruk += "<div class='row'>";
        this.printStruk += "    <div class='col-xs-12' style='font-size:6pt;'> <center>Harga sudah termasuk PPN dan tas belanja</center> </div>";
        this.printStruk += "</div>";  
        this.printStruk += "<div class='row'>";
        this.printStruk += "    <div class='col-xs-12' style='font-size:6pt;'> <center>BARANG CACAT KARENA PRODUSEN DAPAT DITUKAR DALAM 7 HARI</center> </div>";
        this.printStruk += "</div>";  
        this.printStruk += "<div class='row'>";
        this.printStruk += "    <div class='col-xs-12' style='font-size:6pt;'> <center>SETELAH TRANSAKSI</center> </div>";
        this.printStruk += "</div>";  
        this.printStruk += "<div class='row'>";
        this.printStruk += "    <div class='col-xs-12'> ====================================================== </div>";
        this.printStruk += "</div>";  
        this.printStruk += "<div class='row'>";
        this.printStruk += "    <div class='col-xs-12'> <center>TERIMA KASIH ATAS KUNJUNGAN ANDA</center> </div>";
        this.printStruk += "</div>";   
          
    }
}
