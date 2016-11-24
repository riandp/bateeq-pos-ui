import {inject, Lazy} from 'aurelia-framework';
import {HttpClient} from 'aurelia-fetch-client';
import {RestService} from '../../rest-service';
  
const serviceUri = require('../../host').sales + '/docs/sales';
export class Service extends RestService{
  
  constructor(http, aggregator) {
    super(http, aggregator);
  } 

  getAllSalesByFilter(store, dateFrom, dateTo, shift)
  {
    var endpoint = `${serviceUri}/${store}/${dateFrom}/${dateTo}/${shift}`;
    return super.get(endpoint);
  }
  
}
