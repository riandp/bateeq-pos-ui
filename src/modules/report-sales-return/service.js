import {inject, Lazy} from 'aurelia-framework';
import {HttpClient} from 'aurelia-fetch-client';
import {RestService} from '../../rest-service';
import {SecureService} from '../../utils/secure-service';
  
const serviceUri = require('../../host').sales + '/docs/salesreturns';
export class Service extends SecureService{
  
  constructor(http, aggregator) {
    super(http, aggregator);
  } 

  getAllSalesReturnByFilter(store, dateFrom, dateTo, shift)
  {
    var endpoint = `${serviceUri}/${store}/${dateFrom}/${dateTo}/${shift}`;
    return super.get(endpoint);
  } 
}
