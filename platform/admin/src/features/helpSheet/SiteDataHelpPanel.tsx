import React from 'react';
import template from 'lodash-es/template';
import {CopyToClipboardButton} from '@/components/utils/CopyToClipboardButton';
import {
    ContentDataConfigClass,
    ContentDataFieldClass,
    ContentDataFieldTypes, ContentDataFieldVariant
} from 'infra-common/data/ContentDataConfig';

type TemplateFunc = (blockKey: string, fieldKey: string, variants?: Array<ContentDataFieldVariant>) => string;

const loopThroughTheBlocksTemplate = template(`{% for siteBlock in site.blocks %}
    <% if (blockKeys.length > 0) { %>
    {% if siteBlock.key == '<%= blockKeys[0] %>' %}
        {% assign <%= blockKeys[0] %> = siteBlock %}
        <!-- get the block fields -->
    <% for(let i = 1; i < blockKeys.length; i++) { %>  
    {% elsif siteBlock.key == '<%= blockKeys[i] %>' %}
        {% assign <%= blockKeys[i] %> = siteBlock %}
        <!-- get the block fields -->
    <% } %>
    {% endif %}
    <% } %>
{% endfor %}
`);

const getBlockOutsideTheLoopTemplate = (blockKey: string) => `{% assign ${blockKey} = site.blocks | where: 'key', '${blockKey}' | first %}`;
const getBlockLoopTemplate = (blockKey: string) => {
    let result = `{% assign ${blockKey}List = site.blocks | where: 'key', '${blockKey}' %}\n`;
    result += `{% for ${blockKey} in ${blockKey}List %}\n`;
    result += `\t<!-- get the block fields -->\n`;
    result += '{% endfor %}';
    return result;
};


const useFieldTemplateMap: Record<typeof ContentDataFieldTypes[number], TemplateFunc> = {
    'string': (blockKey: string, fieldKey: string) => `{{ ${blockKey}.fields.${fieldKey}.stringValue }}`,
    'image': (blockKey: string, fieldKey: string) => `{{ ${blockKey}.fields.${fieldKey}.imageSrc }}\n{{ ${blockKey}.fields.${fieldKey}.imageAlt }}`,
    'page_link': (blockKey: string, fieldKey: string) => `{% assign linkedPage = site.pages[${blockKey}.fields.${fieldKey}.pageId] %}`,
    'rich_text': (blockKey: string, fieldKey: string) => `{{ ${blockKey}.fields.${fieldKey}.richTextValue }}`,
};

const useFieldArrayTemplateMap: Record<typeof ContentDataFieldTypes[number], any> = {
    'string': (blockKey: string, fieldKey: string) => `{% for ${fieldKey} in ${blockKey}.fields.${fieldKey} %}\n\t{{ ${fieldKey}.stringValue }}\n{% endfor %}`,
    'image': (blockKey: string, fieldKey: string) => `{% for ${fieldKey} in ${blockKey}.fields.${fieldKey} %}\n\t{{ ${fieldKey}.imageSrc }}\n\t{{ ${fieldKey}.imageAlt }}\n{% endfor %}`,
    'page_link': (blockKey: string, fieldKey: string) => `{% for ${fieldKey} in ${blockKey}.fields.${fieldKey} %}\n\t{% assign linkedPage = site.pages[${fieldKey}.pageId] %}\n{% endfor %}`,
    'rich_text': (blockKey: string, fieldKey: string) => `{% for ${fieldKey} in ${blockKey}.fields.${fieldKey} %}\n\t{{ ${fieldKey}.richTextValue }}\n{% endfor %}`,
};

interface SiteDataHelpPanelProps {
    siteContentDataConfig: string;
}

function FieldDot() {
    return (
        <span className="absolute -left-[13px] top-[12px] w-[5px] h-[5px] bg-slate-400 rounded-full"/>
    );
}

export function SiteDataHelpPanel(props: SiteDataHelpPanelProps) {
    const {siteContentDataConfig} = props;
    let siteContentDataConfigClass: ContentDataConfigClass;
    try {
        siteContentDataConfigClass = JSON.parse(siteContentDataConfig);
    } catch(e: any) {
        console.error(`Error parsing site content config: ${e.message}`);
        siteContentDataConfigClass = {};
    }

    let groups: Record<string, Array<string>> = {'Default': []};
    for (const [blockKey, configClass] of Object.entries(siteContentDataConfigClass)) {
        if (configClass.group) {
            groups[configClass.group] = groups[configClass.group] || [];
            groups[configClass.group].push(blockKey);
        } else {
            groups['Default'].push(blockKey);
        }
    }
    const sortedGroups = Object.entries(groups).sort(([groupKey, _]) => groupKey === 'Default' ? 0 : 1);

    return (
        <div className="flex flex-col gap-2 prose-fixed">
            {sortedGroups.map(([groupKey, blockKeys], idx) => {
                if (blockKeys.length > 0) {
                    const loopThroughTheBlocks = loopThroughTheBlocksTemplate({blockKeys});
                    return (
                        <div key={groupKey} className="flex flex-col gap-2">
                            <h5>Loop through the blocks in the <code>{groupKey}</code> group</h5>
                            <div className="relative box-content">
                                <CopyToClipboardButton
                                    className="absolute -right-[5px] -top-[5px] z-10 bg-slate-100 text-slate-600"
                                    variant="outline"
                                    size="xs"
                                    text={loopThroughTheBlocks}
                                />
                                <pre className="w-full overflow-auto"><code>{loopThroughTheBlocks}</code></pre>
                            </div>
                        </div>
                    );
                }
                return null;
            })}
            {Object.entries(siteContentDataConfigClass).map(([blockKey, blockClass]) => {
                const getBlockOutsideTheLoop = getBlockOutsideTheLoopTemplate(blockKey);
                const getBlockLoop = getBlockLoopTemplate(blockKey);
                return (
                    <div key={blockKey} className="flex flex-col gap-2 mt-4">
                        <div className="p-1 rounded-[6px] bg-slate-100 flex-row justify-center">
                            <h4 className="line-clamp-1 text-center">
                                {blockClass.label}&nbsp;
                                {/*<span*/}
                                {/*    className="font-normal text-sm text-muted-foreground">({blockClass.group || 'Default'})</span>*/}
                            </h4>
                        </div>
                        <h5>Get the first {blockClass.label} block item</h5>
                        <div className="relative">
                            <CopyToClipboardButton
                                className="absolute -right-[5px] -top-[5px] z-10 bg-slate-100 text-slate-600"
                                variant="outline"
                                size="xs"
                                text={getBlockOutsideTheLoop}
                            />
                            <pre className="w-full overflow-auto"><code>{getBlockOutsideTheLoop}</code></pre>
                        </div>
                        <h5>Loop through the list of the {blockClass.label} blocks</h5>
                        <div className="relative">
                            <CopyToClipboardButton
                                className="absolute -right-[5px] -top-[5px] z-10 bg-slate-100 text-slate-600"
                                variant="outline"
                                size="xs"
                                text={getBlockLoop}
                            />
                            <pre className="w-full overflow-auto"><code>{getBlockLoop}</code></pre>
                        </div>
                        <ul>
                            {blockClass.fields.map((field: ContentDataFieldClass, fieldIndex: number) => {
                                const useFieldOutsideTheLoop = field.isArray
                                    ? useFieldArrayTemplateMap[field.type](blockKey, field.key)
                                    : useFieldTemplateMap[field.type](blockKey, field.key);
                                return (
                                    <li key={`${field.key}_${fieldIndex}`} className="flex flex-col gap-2 relative">
                                        <FieldDot/>
                                        <h5>Get <code>{field.label}</code> field</h5>
                                        <div className="relative">
                                            <CopyToClipboardButton
                                                className="absolute -right-[5px] -top-[5px] z-10 bg-slate-100 text-slate-600"
                                                variant="outline"
                                                size="xs"
                                                text={useFieldOutsideTheLoop}
                                            />
                                            <pre className="w-full overflow-auto"><code>{useFieldOutsideTheLoop}</code></pre>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                );
            })}
        </div>
    );
}