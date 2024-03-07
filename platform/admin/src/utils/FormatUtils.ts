import {
    format,
    formatDistanceToNow,
    formatDistanceToNowStrict,
    differenceInDays
} from 'date-fns';

const DATE_FORMAT: string = 'yyyy-MM-dd';
const DATE_TIME_FORMAT: string = 'dd.MM.yyyy hh:mm:ss a';

export function formatDate(dateValue: number | Date | null | undefined): string {
    if (dateValue) {
        return format(dateValue, DATE_FORMAT);
    }
    return '';
}

export function formatDateTime(dateValue: number | Date | null | undefined): string {
    if (dateValue) {
        return format(dateValue, DATE_TIME_FORMAT);
    }
    return '';
}

export function getTimeDistance(dateValue: number | Date | null | undefined): string {
    if (dateValue) {
        return formatDistanceToNow(dateValue, {addSuffix: true});
    }
    return '';
}

export function getTimeDistanceStrict(dateValue: number | Date | null | undefined, unit: 'second' | 'minute' | 'hour' | 'day' | 'month' | 'year'): string {
    if (dateValue) {
        return formatDistanceToNowStrict(dateValue, {addSuffix: true, unit});
    }
    return '';
}

export function getCustomDistanceToNow(dateValue: number | Date | null | undefined): string {
    if (dateValue) {
        const daysDifference = differenceInDays(new Date(), dateValue);
        if (daysDifference < 1) {
            return 'Today';
        } else if (daysDifference >= 1 && daysDifference < 2) {
            return 'Yesterday';
        } else {
            return formatDistanceToNow(dateValue, {addSuffix: true});
        }
    }
    return '';
}

export function humanReadableBytes(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Byte';
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)).toString(), 10);
    if (i >= 2) {  // Check if the unit is MB, GB, or TB
        return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
    } else {
        return `${Math.round(bytes / Math.pow(1024, i))} ${sizes[i]}`;
    }
}

export function removeFileExtension(filename: string): string {
    const lastDotIndex = filename.lastIndexOf('.');
    if (lastDotIndex <= 0) {
        return filename;
    }
    return filename.substring(0, lastDotIndex);
}

export function getRepositoryName(repositoryUrl: string): string {
    const lastIndex = repositoryUrl.lastIndexOf('/');
    if (lastIndex <= 0) {
        return repositoryUrl;
    }
    return repositoryUrl.substring(lastIndex + 1);
}
