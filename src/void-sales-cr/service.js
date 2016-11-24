import {inject, Lazy} from 'aurelia-framework';
import {HttpClient} from 'aurelia-fetch-client';
import {RestService} from '../rest-service';

const serviceUri = require('../host').sales + '/docs/sales';
const serviceUriUpdate = require('../host').sales + '/docs/sales';
const serviceUriBank = require('../host').master + '/banks';
const serviceUriCardType = require('../host').master + '/cardtypes';
const serviceUriPromo = require('../host').sales + '/promos'; 
    const serviceUriStore = require('../host').master + '/stores';
        const serviceUriTransferInDoc = require('../host').inventory + '/docs/transfer-in';


export class Service extends RestService {

    constructor(http, aggregator) {
        super(http, aggregator);
    }

    search(allDate, allCode, allStore) {
        var endpoint = `${serviceUri}/${allDate}/${allCode}/${allStore}`;
        return super.get(endpoint);
    }

    getAllSalesAllShift(storeName, dateFrom, dateTo, shift, typeAllStore, typeAllShift, typeAllStoreAllShift)
  {
    var endpoint = `${serviceUri}/${storeName}/${dateFrom}/${dateTo}/${shift}/${typeAllStore}/${typeAllShift}/${typeAllStoreAllShift}`;
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

    // update(data) {
    //     var endpoint = `${serviceUri}`;
    //     return super.put(endpoint, data);
    // } 

    delete(data) {
        var endpoint = `${serviceUri}`;
        return super.del(endpoint, data);
    }

    voidSales(data) {
        var endpoint = `${serviceUri}`;
        return super.put(endpoint, data);
    } 
    
    
    getBank() {
        return super.get(serviceUriBank);
    }
    
    getCardType() {
        return super.get(serviceUriCardType);
    }

    
    getStore() {
        return super.get(serviceUriStore);
    }

    getTrans()
    {
        return super.get(serviceUri);
    }

    getTransByStoreName(storename, isTransByStoreName)
    {
        var endpoint = `${serviceUri}/${storename}/${isTransByStoreName}`;
        return super.get(endpoint);
    }
    
    getPromoByStoreDatetimeItemQuantity(storeId, datetime, itemId, quantity) {
        var endpoint = `${serviceUriPromo}/${storeId}/${datetime}/${itemId}/${quantity}`;
        return super.get(endpoint);
    }
    createTransferIn(data)
  {
      var endpoint = `${serviceUriTransferInDoc}`;
      return super.post(endpoint, data);
  }

  getOutByCode(code) 
  {
      var endpoint = `${serviceUri}?keyword=${code}`;
      return super.get(endpoint);
  }
}
