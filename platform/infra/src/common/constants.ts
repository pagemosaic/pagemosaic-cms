const stackName = process.env.STACK_NAME;

export const PLATFORM_STACK_NAME: string = stackName ? stackName.replace(/\s+/g, '') : 'Undefined';
export const PLATFORM_DOCUMENTS_TABLE_NAME: string = `${PLATFORM_STACK_NAME}Documents`;
export const PLATFORM_ENTRIES_BY_TYPE_INDEX_NAME: string = 'EntriesByType';
export const PLATFORM_ENTRIES_BY_TAG_ID_INDEX_NAME: string = 'EntriesByTagId';
export const PLATFORM_ENTRIES_BY_TEMPLATE_ID_INDEX_NAME: string = 'EntriesByTemplateId';
export const PLATFORM_SYSTEM_TABLE_NAME: string = `${PLATFORM_STACK_NAME}System`;
export const PLATFORM_SYSTEM_BUCKET_NAME: string = `${PLATFORM_STACK_NAME}-system-bucket`.toLowerCase();
export const PLATFORM_PUBLIC_BUCKET_NAME: string = `${PLATFORM_STACK_NAME}-public-bucket`.toLowerCase();
// System Manager parameters
export const PARAM_ENTRY_POINT_DOMAIN = `/pagemosaic/${PLATFORM_STACK_NAME}/EntryPointDomain`;
export const PARAM_PREVIEW_POINT_DOMAIN = `/pagemosaic/${PLATFORM_STACK_NAME}/PreviewPointDomain`;
export const PARAM_SYS_USER_POOL_ID = `/pagemosaic/${PLATFORM_STACK_NAME}/SysUserPoolId`;
export const PARAM_SYS_USER_POOL_CLIENT_ID = `/pagemosaic/${PLATFORM_STACK_NAME}/SysUserPoolClientId`;
export const PARAM_ENTRY_POINT_DISTRIBUTION_ID = `/pagemosaic/${PLATFORM_STACK_NAME}/EntryPointDistributionId`;
export const PARAM_SSL_CERTIFICATE_ARN = `/pagemosaic/${PLATFORM_STACK_NAME}/SslCertificateArn`;
export const PARAM_DOMAIN = `/pagemosaic/${PLATFORM_STACK_NAME}/Domain`;

// Platform Stack output IDs
export const INFRA_ENTRY_POINT_DOMAIN = 'EntryPointDomain';
export const INFRA_PREVIEW_POINT_DOMAIN = 'PreviewPointDomain';
export const INFRA_SYS_USER_POOL_ID = 'SysUserPoolId';
export const INFRA_SYS_USER_POOL_CLIENT_ID = 'SysUserPoolClientId';
export const INFRA_ENTRY_POINT_DISTRIBUTION_ID = 'EntryPointDistributionId';

export const BUCKET_ASSETS_DIR = '_assets';
export const BUCKET_GENERATED_DIR = '_generated';
export const BUCKET_STATIC_DIR = '_static';
export const BUCKET_DOCUMENTS_DIR = 'documents'; // keep pages contents files

export const GENERATOR_IDLE_STATUS = 'idle';
export const GENERATOR_RUNNING_STATUS = 'running';
export const GENERATOR_WITH_ERRORS_STATUS = 'with_errors';

export const DI_PAGE_ROUTE_ROOT = '@root';

// Database document item constants

export const DI_SITE_ENTRY_KEY = 'SITE';
export const DI_GENERATOR_ENTRY_KEY = 'GENERATOR';

export const DI_SITE_ENTRY_TYPE = 'site';
export const DI_TEMPLATE_ENTRY_TYPE = 'template';
export const DI_PAGE_ENTRY_TYPE = 'page';
export const DI_DELETED_PAGE_ENTRY_TYPE = 'deleted_page';
export const DI_TAG_ENTRY_TYPE = 'tag';

export const DI_PAGE_ENTRY_PREFIX = 'PAGE';
export const DI_TEMPLATE_ENTRY_PREFIX = 'TEMPLATE';
export const DI_TAG_ENTRY_PREFIX = 'TAG';

export const DI_ENTRY_SLICE_KEY = 'ENTRY';
export const DI_PAGE_CONTENT_SLICE_KEY = 'PAGE_CONTENT';
export const DI_PAGE_ARTICLE_SLICE_KEY = 'PAGE_ARTICLE';
export const DI_TEMPLATE_CONTENT_SLICE_KEY = 'TEMPLATE_CONTENT';
export const DI_PAGE_META_SLICE_KEY = 'PAGE_META';
export const DI_TEMPLATE_META_SLICE_KEY = 'TEMPLATE_META';
export const DI_TAG_SLICE_KEY = 'TAG';
export const DI_DESCRIPTION_SLICE_KEY = 'DESCRIPTION';
export const DI_SITE_MAP_SLICE_KEY = 'SITE_MAP';
export const DI_SITE_CONTENT_SLICE_KEY = 'SITE_CONTENT';
export const DI_SITE_PARTIAL_SLICE_KEY = 'SITE_PARTIAL';
export const DI_GENERATOR_STATUS_SLICE_KEY = 'STATUS';

export const DI_PAGE_ENTRY_SLICE_KEYS = [
    DI_ENTRY_SLICE_KEY,
    DI_PAGE_META_SLICE_KEY,
    DI_PAGE_CONTENT_SLICE_KEY,
    DI_PAGE_ARTICLE_SLICE_KEY,
    DI_TAG_SLICE_KEY
] as const;

export const DI_TEMPLATE_ENTRY_SLICE_KEYS = [
    DI_ENTRY_SLICE_KEY,
    DI_TEMPLATE_META_SLICE_KEY,
    DI_TEMPLATE_CONTENT_SLICE_KEY,
] as const;

export const DI_TAG_ENTRY_SLICE_KEYS = [
    DI_ENTRY_SLICE_KEY,
    DI_DESCRIPTION_SLICE_KEY
] as const;

export const DI_SITE_ENTRY_SLICE_KEYS = [
    DI_ENTRY_SLICE_KEY,
    DI_SITE_MAP_SLICE_KEY,
    DI_SITE_CONTENT_SLICE_KEY
] as const;
