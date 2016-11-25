import {inject, Lazy} from 'aurelia-framework';
import {HttpClient} from 'aurelia-fetch-client';
import {RestService} from '../../rest-service';

const serviceUri = require('../../host').sales + '/docs/sales';
const serviceUriSalesVoids = require('../../host').sales + '/docs/salesvoids';
const serviceUriBank = require('../../host').master + '/banks';
const serviceUriCardType = require('../../host').master + '/cardtypes';
const serviceUriPromo = require('../../host').sales + '/promos'; 
const serviceUriFinishedgood = require('../../host').master + '/finishedgoods';

export class Service extends RestService {

    constructor(http, aggregator) {
        super(http, aggregator);
    }

    search(keyword) {
        var endpoint = `${serviceUri}?keyword=${keyword}`;
        return super.get(endpoint);
    }

    getById(id) {
        var endpoint = `${serviceUri}/${id}`;
        return super.get(endpoint);
    }

    getSalesVoidsByCode(code)
    { 
        var endpoint = `${serviceUriSalesVoids}?code=${code}`;
        return super.get(endpoint); 
    }

    create(data) {
        var endpoint = `${serviceUri}`;
        var header = '';
        var request = {
            method: 'POST',
            headers: new Headers(Object.assign({}, this.header, header)),
            body: JSON.stringify(data)
        };
        var postRequest = this.http.fetch(endpoint, request);
        this.publish(postRequest);
        return postRequest
            .then(response => {
                return response;
            })
            // .then(result => {
            //     console.log(result);
            //     this.publish(postRequest);
            //     return this.parseResult(result);
            // }); 
        //return super.post(endpoint, data);
    } 
    
    getBank() {
        return super.get(serviceUriBank);
    }
    
    getCardType() {
        return super.get(serviceUriCardType);
    }
    
    getPromoByStoreDatetimeItemQuantity(storeId, datetime, itemId, quantity) {
        var endpoint = `${serviceUriPromo}/${storeId}/${datetime}/${itemId}/${quantity}`;
        return super.get(endpoint);
    }
     
    getProductByCode(code) {
        var endpoint = `${serviceUriFinishedgood}/code/${code}`;
        return super.get(endpoint);
    }
}
