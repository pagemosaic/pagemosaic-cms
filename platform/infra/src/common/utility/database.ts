import {DI_PAGE_ROUTE_ROOT} from '../constants';

export function getIdFromPK(pk?: string): string {
    if (pk) {
        if (pk.includes('#')) {
            const parts = pk.split('#');
            return parts[1];
        }
        return pk;
    }
    return '';
}

export function getNormalizedRoute(route?: string): string {
    if (route) {
        if (route === DI_PAGE_ROUTE_ROOT) {
            return '/';
        } else {
            return `${route.replace(DI_PAGE_ROUTE_ROOT, '')}/`;
        }
    }
    return '/';
}

export function getDenormalizedRoute(route: string): string {
    if (route && route.startsWith('/')) {
        return route.substring(1);
    }
    throw Error('Wrong format of the specified route.');
}

export function fixIndexRoute(route: string): string {
    if (route === '/index') {
        return '/';
    }
    return route;
}

export function getFilePathByRoute(route: string): string {
    if (route && route.startsWith('/')) {
        return `${route.substring(1)}.html`;
    }
    throw Error('Wrong format of the specified route.');
}