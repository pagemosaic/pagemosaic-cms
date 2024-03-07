import {DI_PageEntry, DI_TemplateEntry, DI_SiteEntry} from 'infra-common/data/DocumentItem';

export type HistoryDataItem = {
    pageEntry?: DI_PageEntry;
    templateEntry?: DI_TemplateEntry;
    siteEntry?: DI_SiteEntry;
};
export type HistoryData = Record<string, Array<HistoryDataItem>>;

class HistoryDataSingleton {
    private historyData: HistoryData;
    constructor() {
        this.historyData = {};
    }

    public getFromHistory(pageId: string): HistoryDataItem | undefined {
        const foundHistoryRecord = this.historyData[pageId];
        if (foundHistoryRecord && foundHistoryRecord.length > 0) {
            return foundHistoryRecord.pop();
        }
        return undefined;
    }

    public putIntoHistory(pageId: string, historyRecord: HistoryDataItem): void {
        const foundHistoryRecord = this.historyData[pageId] || [];
        foundHistoryRecord.push(historyRecord);
        if (foundHistoryRecord.length > 10) {
            foundHistoryRecord.shift();
        }
        this.historyData[pageId] = foundHistoryRecord;
    }

    public deleteFromHistory(pageId: string): void {
        delete this.historyData[pageId];
    }

    public getHistoryLength(pageId: string): number {
        const foundHistoryRecord = this.historyData[pageId] || [];
        return foundHistoryRecord.length;
    }

}

export const historyDataSingleton = new HistoryDataSingleton();
