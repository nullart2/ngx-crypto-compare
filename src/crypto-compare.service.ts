import { Injectable, Inject } from '@angular/core';
import * as io from 'socket.io-client';
import { Observable } from 'rxjs/Observable';
import { Observer } from 'rxjs/Observer';

import { CcResponse } from './cc-response.class';
import { CcMarketSubscription, MARKET_SUBSCRIPTION_TYPES } from './cc-market-subscription.class';

@Injectable()
export class CryptoCompareService {
  socket: any;

  constructor(@Inject('API_URL') private apiUrl: string) {}

  /**
   * Connects to API and returns observable of CcResponse objects
   * @param subsciptions
   */
  connect(subsciptions: CcMarketSubscription): Observable<CcResponse>;
  connect(subscriptions: Array<CcMarketSubscription>): Observable<CcResponse>;
  connect(subscriptions: any): Observable<CcResponse> {
    let subs: Array<CcMarketSubscription> = [];
    if (!Array.isArray(subscriptions)) {
      subs.push(subscriptions);
    } else {
      subs = subscriptions;
    }
    return Observable.create((observer: Observer<CcResponse>) => {
      this.socket = io(this.apiUrl);
      this.subscribeToMarketData(subs);
      this.socket.on('m', (message: string) => {
        const messageType =  +message.substring(0, message.indexOf('~'));
        if (Array.from(MARKET_SUBSCRIPTION_TYPES.values()).indexOf(messageType) > -1) {
          observer.next(new CcResponse(message));
        }
      });
    });
  }
  
  /**
   * unsubscribe to API and returns observable of CcResponse objects
   * @param subsciptions
   */
  disconnect(subsciptions: CcMarketSubscription);
  disconnect(subscriptions: Array<CcMarketSubscription>);
  disconnect(subscriptions: any){
    let subs: Array<CcMarketSubscription> = [];
    if (!Array.isArray(subscriptions)) {
      subs.push(subscriptions);
    } else {
      subs = subscriptions;
    }
    
    this.unSubscribeToMarketData(subs);
  }

  /**
   * Subscribes to market data by emitting 'SubAdd'
   * including a list of items you want to get updates on.
   * @param subscriptions
   */
  private subscribeToMarketData(subscriptions: Array<CcMarketSubscription>): void {
    if (this.socket) {
      this.socket.emit('SubAdd', {subs: subscriptions.map(s => s.packed)});
    }
  }
  
  /**
   * unSubscribes to market data by emitting 'SubRemove'
   * including a list of items you want to get updates on.
   * @param subscriptions
   */
  private unSubscribeToMarketData(subscriptions: Array<CcMarketSubscription>): void {
    if (this.socket) {
      this.socket.emit('SubRemove', {subs: subscriptions.map(s => s.packed)});
    }
  }
}
