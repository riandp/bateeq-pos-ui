import {inject, Lazy} from 'aurelia-framework';
import {HttpClient} from 'aurelia-fetch-client';
import {RestService} from '../../rest-service';
  
const serviceUri = require('../../host').sales + '/docs/salesreturns';
export class Service extends RestService{
  
  constructor(http, aggregator) {
    super(http, aggregator);
  } 

  getAllSalesReturnByFilter(store, dateFrom, dateTo)
  {
    var endpoint = `${serviceUri}/${store}/${dateFrom}/${dateTo}`;
    return super.get(endpoint);
  } 
}
