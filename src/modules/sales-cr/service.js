import {inject, Lazy} from 'aurelia-framework';
import {HttpClient} from 'aurelia-fetch-client';
import {RestService} from '../../rest-service';

const serviceUri = require('../../host').sales + '/docs/sales';
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

    create(data) {
        var endpoint = `${serviceUri}`;
        return super.post(endpoint, data);
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
