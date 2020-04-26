// https://mobx.js.org/best/store.html#combining-multiple-stores
import { action, observable, computed } from 'mobx';
import { initService } from '../services/init.service';
import { fetchWidgets } from '../services/widgets.data.service';
import { INewsFlash } from '../models/NewFlash';
import { IWidgetTypes } from '../models/WidgetData';
import { SourceFilterEnum } from '../models/SourceFilter';
import { fetchNews } from '../services/news.data.service';
import SettingsStore from './settings.store';

export default class RootStore {
  [key: string]: any; // Declaring an index signature

  appInitialized = false;

  @observable newsFlashCollection: Array<INewsFlash> = [];
  @observable activeNewsFlashId: number = 0; // active newsflash id
  @observable newsFlashWidgetsData: Array<IWidgetTypes> = [];
  @observable newsFlashWidgetsTimerFilter = 0; // newsflash time filter (in years ago, 0- no filter)

  // domain stores
  settingsStore: SettingsStore;

  constructor() {
    // init app data
    initService().then((initData) => {
      console.log(initData);
      this.safeSet('newsFlashCollection', initData.newsFlashCollection);
      this.safeSet('newsFlashWidgetsData', initData.newsFlashWidgetsData.widgets);
      this.appInitialized = true;
    });
    // settings store - settings of the app such as num of results returned etc.
    this.settingsStore = new SettingsStore(this);
  }

  // prop is a property on RootStore to be initialized, like: this.suggestions
  safeSet(prop: string, valueToCheck: any) {
    if (valueToCheck && Array.isArray(valueToCheck)) {
      this[prop] = valueToCheck;
    } else {
      console.warn(`Property [${prop}] was not initialized. Invalid value (${valueToCheck})`);
    }
  }

  @computed
  get activeNewsFlash() {
    return this.newsFlashCollection.find((activeNewsFlash) => {
      return activeNewsFlash.id === this.activeNewsFlashId ? activeNewsFlash : this.activeNewsFlashId;
    });
  }

  @action
  filterNewsFlashCollection(source: SourceFilterEnum): void {
    fetchNews(source, 10).then((data: any) => {
      if (data) {
        this.safeSet('newsFlashCollection', data);
      } else {
        console.error(`filterNewsFlashCollection(source:${source}) invalid data:`, data);
      }
    });
  }

  @action
  selectNewsFlash(id: number): void {
    this.activeNewsFlashId = id;
    this.fetchSelectedNewsFlashWidgets(id, this.newsFlashWidgetsTimerFilter);
  }

  @action
  changeTimeFilter(filterValue: number): void {
    if (this.newsFlashWidgetsTimerFilter !== filterValue) {
      this.newsFlashWidgetsTimerFilter = filterValue;
      this.fetchSelectedNewsFlashWidgets(this.activeNewsFlashId, filterValue);
    }
  }

  private fetchSelectedNewsFlashWidgets(id: number, filterValue = 0): void {
    fetchWidgets(id, filterValue).then((response: any) => {
      if (response && response.widgets !== undefined) {
        this.safeSet('newsFlashWidgetsData', response.widgets);
      } else {
        console.error(`fetchWidgets(id:${id}) invalid response:`, response);
      }
    });
  }
}
