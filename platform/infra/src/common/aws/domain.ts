import {ValidDomain} from '../system/Domain';

function isValidDomain(domain: string) {
    // Regular expression for validating a 2 or 3-level domain with optional wildcard at the 3rd level
    const regex = /^(?:\*\.)?[a-zA-Z\d-]{1,63}(\.[a-zA-Z\d-]{1,63}){1,2}$/;
    return regex.test(domain);
}

export function getValidDomain(domainName: string): ValidDomain {
    if (isValidDomain(domainName)) {
        const parts = domainName.split('.');
        if (parts[0] === '*') {
            return {
                rootName: parts.slice(1).join('.'),
                alternativeName: domainName
            };
        } else {
            return {
                rootName: parts.join('.')
            }
        }
    }
    throw Error('Invalid domain name');
}

export function getSubdomainRecordName(customDomainName?: string | null): string {
    if (customDomainName) {
        const parts = customDomainName.split('.');
        if (parts[0]?.startsWith('*') || parts.length === 2) {
            return '@';
        }
        return parts[0] || '';
    }
    return '';
}
