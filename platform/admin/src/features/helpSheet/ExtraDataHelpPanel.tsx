import React from 'react';
import {CopyToClipboardButton} from '@/components/utils/CopyToClipboardButton';
import {DI_TemplateEntry} from 'infra-common/data/DocumentItem';
import {getIdFromPK} from 'infra-common/utility/database';

const pageTitleSnippet = `{{ thisPage.title }}`;
const pageRouteSnippet = `{{ thisPage.route }}`;
const pageSlugSnippet = `{{ thisPage.slug }}`;
const articleHtmlSnippet = `{{ thisPage.article }}`;
const websiteDomainSnippet = `{{ site.domain }}`;
const inDevModeSnippet = `{% if isDevMode != 'true' %}
    <!-- do anything that you don't do in the dev mode -->
{% endif %}
`;
const linkedPageSnippet = (templateEntries: Array<DI_TemplateEntry>) => {
    let result = '';
    templateEntries.forEach(templateEntry => {
        result += `{% if linkedPage.templateId == '${getIdFromPK(templateEntry.Entry?.PK.S)}' %}\n`;
        result += `\t<!-- This page has the "${templateEntry.Meta?.TemplateTitle.S}" template -->\n`
        result += '{% endif %}\n\n';
    });
    return result;
};
const blockDataConfigSnippet = `"newBlockKey": {
    "label": "New Block",
    "group": "Block Group",
    "fields": [
        {
            "label": "New Field",
            "key": "newFieldKey",
            "type": "string",
            "isArray": false
        }
    ]
}`;
const fieldDataConfigSnippet = `{
    "label": "New Field",
    "key": "newFieldKey",
    "type": "string",
    "isArray": false,
    "variants": [
        {
            "label": "Variant 1 Label",
            "value": "variant1"
        },
        {
            "label": "Variant 2 Label",
            "value": "variant2"
        }
    ]
}`;

const identificationSectionsMap: Array<{ label: string; snippet: string }> = [
    {
        label: 'Page Title',
        snippet: pageTitleSnippet,
    },
    {
        label: 'Page Route (Page URL)',
        snippet: pageRouteSnippet,
    },
    {
        label: 'Slug',
        snippet: pageSlugSnippet,
    }
];

const additionalSectionsMap: Array<{ label: string; snippet: string }> = [
    {
        label: 'Page Article',
        snippet: articleHtmlSnippet,
    },
    {
        label: 'Website Domain Name',
        snippet: websiteDomainSnippet,
    },
    {
        label: 'Development Mode',
        snippet: inDevModeSnippet,
    }
];

const contentConfigSectionsMap: Array<{ label: string; snippet: string }> = [
    {
        label: 'Block Data Config',
        snippet: blockDataConfigSnippet,
    },
    {
        label: 'Field Data Config',
        snippet: fieldDataConfigSnippet,
    }
];

interface ExtraDataHelpPanelProps {
    templateEntries?: Array<DI_TemplateEntry>;
}

function FieldDot() {
    return (
        <span className="absolute -left-[13px] top-[12px] w-[5px] h-[5px] bg-slate-400 rounded-full"/>
    );
}

export function ExtraDataHelpPanel(props: ExtraDataHelpPanelProps) {
    const {templateEntries} = props;
    const templateEntriesSnippet = templateEntries ? linkedPageSnippet(templateEntries) : '';
    return (
        <div className="flex flex-col gap-4 prose-fixed">
            <div className="flex flex-col gap-2">
                <h4 className="line-clamp-1">Page Identification</h4>
                <ul>
                    {identificationSectionsMap.map((section, sectionIndex) => {
                        return (
                            <li key={`section_${sectionIndex}`} className="flex flex-col gap-2 relative">
                                <FieldDot/>
                                <p>Get <code>{section.label}</code></p>
                                <div className="relative w-full">
                                    <CopyToClipboardButton
                                        className="absolute -right-[5px] -top-[5px] z-10 bg-slate-100 text-slate-600"
                                        variant="outline"
                                        size="xs"
                                        text={section.snippet}
                                    />
                                    <pre className="w-full overflow-auto"><code>{section.snippet}</code></pre>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </div>
            <div className="flex flex-col gap-2">
                <h4 className="line-clamp-1">Extra Data</h4>
                <ul>
                    {additionalSectionsMap.map((section, sectionIndex) => {
                        return (
                            <li key={`section_${sectionIndex}`} className="flex flex-col gap-2 relative">
                                <FieldDot/>
                                <p>Get <code>{section.label}</code></p>
                                <div className="relative w-full">
                                    <CopyToClipboardButton
                                        className="absolute -right-[5px] -top-[5px] z-10 bg-slate-100 text-slate-600"
                                        variant="outline"
                                        size="xs"
                                        text={section.snippet}
                                    />
                                    <pre className="w-full overflow-auto"><code>{section.snippet}</code></pre>
                                </div>
                            </li>
                        );
                    })}
                    {templateEntriesSnippet && (
                        <li key="section_page_templates" className="flex flex-col gap-2 relative">
                            <FieldDot/>
                            <p>Use <code>pages data by template</code></p>
                            <div className="relative w-full">
                                <CopyToClipboardButton
                                    className="absolute -right-[5px] -top-[5px] z-10 bg-slate-100 text-slate-600"
                                    variant="outline"
                                    size="xs"
                                    text={templateEntriesSnippet}
                                />
                                <pre className="w-full overflow-auto"><code>{templateEntriesSnippet}</code></pre>
                            </div>
                        </li>
                    )}
                </ul>
            </div>
            <div className="flex flex-col gap-2">
                <h4 className="line-clamp-1">Data Config</h4>
                <ul>
                    {contentConfigSectionsMap.map((section, sectionIndex) => {
                        return (
                            <li key={`section_${sectionIndex}`} className="flex flex-col gap-2 relative">
                                <FieldDot/>
                                <p>{section.label}</p>
                                <div className="relative w-full">
                                    <CopyToClipboardButton
                                        className="absolute -right-[5px] -top-[5px] z-10 bg-slate-100 text-slate-600"
                                        variant="outline"
                                        size="xs"
                                        text={section.snippet}
                                    />
                                    <pre className="w-full overflow-auto"><code>{section.snippet}</code></pre>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </div>
    );
}