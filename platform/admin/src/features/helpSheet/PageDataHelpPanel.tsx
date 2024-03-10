import React from 'react';
import template from 'lodash-es/template';
import {CopyToClipboardButton} from '@/components/utils/CopyToClipboardButton';
import {
    ContentDataConfigClass,
    ContentDataFieldClass,
    ContentDataFieldTypes
} from 'infra-common/data/ContentDataConfig';

type TemplateFunc = (pathPrefix: string, fieldClass: ContentDataFieldClass) => string;

const loopThroughTheBlocksTemplate = template(`{% for pageBlock in thisPage.blocks %}
    <% if (blockKeys.length > 0) { %>
    {% if pageBlock.key == '<%= blockKeys[0] %>' %}
        {% assign <%= blockKeys[0] %> = pageBlock %}
        <!-- get the block fields -->
    <% for(let i = 1; i < blockKeys.length; i++) { %>  
    {% elsif pageBlock.key == '<%= blockKeys[i] %>' %}
        {% assign <%= blockKeys[i] %> = pageBlock %}
        <!-- get the block fields -->
    <% } %>
    {% endif %}
    <% } %>
{% endfor %}
`);

const getBlockOutsideTheLoopTemplate = (blockKey: string) => `{% assign ${blockKey} = thisPage.blocks | where: 'key', '${blockKey}' | first %}`;
const getBlockLoopTemplate = (blockKey: string) => {
    let result = `{% assign ${blockKey}List = thisPage.blocks | where: 'key', '${blockKey}' %}\n`;
    result += `{% for ${blockKey} in ${blockKey}List %}\n`;
    result += `\t<!-- get the block fields -->\n`;
    result += '{% endfor %}';
    return result;
};

const useFieldTemplateMap: Record<typeof ContentDataFieldTypes[number], TemplateFunc> = {
    'string': (pathPrefix: string, fieldClass: ContentDataFieldClass) => {
        let result = `{{ ${pathPrefix}.${fieldClass.key}.stringValue }}`;
        if (fieldClass.variants) {
            result += '\n\n<!-- Choose variant value -->\n';
            result += `{{ assign ${fieldClass.key} = ${pathPrefix}.${fieldClass.key}.stringValue }}\n`;
            fieldClass.variants.forEach(variant => {
                result += `{% if ${fieldClass.key} == '${variant.value}' %}\n{% endif %}\n`;
            });
        }
        return result;
    },
    'image': (pathPrefix: string, fieldClass: ContentDataFieldClass) => {
        return `{{ ${pathPrefix}.${fieldClass.key}.imageSrc }}\n{{ ${pathPrefix}.${fieldClass.key}.imageAlt }}`
    },
    'page_link': (blockKey: string, fieldClass: ContentDataFieldClass) => {
        let result = `{% assign linkedPage = site.pages[${blockKey}.fields.${fieldClass.key}.pageId] %}\n`;
        result += '{{ linkedPage.title }}\n';
        result += '{{ linkedPage.route }}\n';
        return result;
    },
    'rich_text': (pathPrefix: string, fieldClass: ContentDataFieldClass) => `{{ ${pathPrefix}.${fieldClass.key}.richTextValue }}`,
    'composite': (pathPrefix: string, fieldClass: ContentDataFieldClass) => {
        if (fieldClass.nested) {
            let result = `{% assign ${fieldClass.key} = ${pathPrefix}.${fieldClass.key} %}\n`;
            result += '<!-- get nested field -->\n';
            return result;
        }
        return '';
    }
};

const useFieldArrayTemplateMap: Record<typeof ContentDataFieldTypes[number], TemplateFunc> = {
    'string': (pathPrefix: string, fieldClass: ContentDataFieldClass) => {
        let result = `{% for ${fieldClass.key} in ${pathPrefix}.${fieldClass.key} %}\n`;
        result += `\t{{ ${fieldClass.key}.stringValue }}\n`;
        if (fieldClass.variants) {
            result += '\n\t\n<!-- Choose variant value -->\n';
            result += `\t{{ assign ${fieldClass.key} = ${pathPrefix}.${fieldClass.key}.stringValue }}\n`;
            fieldClass.variants.forEach(variant => {
                result += `\t{% if ${fieldClass.key} == '${variant.value}' %}\n{% endif %}\n`;
            });
        }
        result += '{% endfor %}';
        return result;
    },
    'image': (pathPrefix: string, fieldClass: ContentDataFieldClass) => `{% for ${fieldClass.key} in ${pathPrefix}.${fieldClass.key} %}\n\t{{ ${fieldClass.key}.imageSrc }}\n\t{{ ${fieldClass.key}.imageAlt }}\n{% endfor %}`,
    'page_link': (pathPrefix: string, fieldClass: ContentDataFieldClass) => {
        let result = `{% for ${fieldClass.key} in ${pathPrefix}.${fieldClass.key} %}\n`;
        result += `\t{% assign linkedPage = site.pages[${fieldClass.key}.pageId] %}\n`;
        result += '\t{{ linkedPage.title }}\n';
        result += '\t{{ linkedPage.route }}\n';
        result += `{% endfor %}`;
        return result;
    },
    'rich_text': (pathPrefix: string, fieldClass: ContentDataFieldClass) => `{% for ${fieldClass.key} in ${pathPrefix}.${fieldClass.key} %}\n\t{{ ${fieldClass.key}.richTextValue }}\n{% endfor %}`,
    'composite': (pathPrefix: string, fieldClass: ContentDataFieldClass) => {
        if (fieldClass.nested) {
            let result = `{% for ${fieldClass.key} in ${pathPrefix}.${fieldClass.key} %}\n`;
            result += '\t<!-- get nested field -->\n';
            result += '{% endfor %}';
            return result;
        }
        return '';
    }
};

interface PageDataHelpPanelProps {
    pageContentDataConfig: string;
}

function FieldDot({nested}: {nested?: boolean}) {
    if (nested) {
        return (
            <span className="absolute -left-[13px] top-[12px] w-[7px] h-[2px] bg-slate-400"/>
        );
    }
    return (
        <span className="absolute -left-[13px] top-[12px] w-[5px] h-[5px] bg-slate-400 rounded-full"/>
    );
}

export function PageDataHelpPanel(props: PageDataHelpPanelProps) {
    const {pageContentDataConfig} = props;
    let pageContentDataConfigClass: ContentDataConfigClass;
    try {
        pageContentDataConfigClass = JSON.parse(pageContentDataConfig);
    } catch(e: any) {
        console.error(`Error parsing page content config: ${e.message}`);
        pageContentDataConfigClass = {};
    }

    let groups: Record<string, Array<string>> = {'Default': []};
    for (const [blockKey, configClass] of Object.entries(pageContentDataConfigClass)) {
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
            {Object.entries(pageContentDataConfigClass).map(([blockKey, blockClass]) => {
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
                                const useField = field.isArray
                                    ? useFieldArrayTemplateMap[field.type](`${blockKey}.fields`, field)
                                    : useFieldTemplateMap[field.type](`${blockKey}.fields`, field);
                                let nestedFields = null;
                                if (field.type === 'composite' && field.nested) {
                                    nestedFields = (
                                        <ul className="pl-6">
                                            {field.nested.map((nestedField: ContentDataFieldClass, nestedFieldIndex: number) => {
                                                const useNestedField = nestedField.isArray
                                                    ? useFieldArrayTemplateMap[nestedField.type](`${field.key}.nested`, nestedField)
                                                    : useFieldTemplateMap[nestedField.type](`${field.key}.nested`, nestedField);
                                                return (
                                                    <li key={`${nestedField.key}_${nestedFieldIndex}`}
                                                        className="flex flex-col gap-2 relative">
                                                        <FieldDot nested={true}/>
                                                        <h5>Get <code>{nestedField.label}</code> field</h5>
                                                        <div className="relative">
                                                            <CopyToClipboardButton
                                                                className="absolute -right-[5px] -top-[5px] z-10 bg-slate-100 text-slate-600"
                                                                variant="outline"
                                                                size="xs"
                                                                text={useNestedField}
                                                            />
                                                            <pre
                                                                className="w-full overflow-auto"><code>{useNestedField}</code></pre>
                                                        </div>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    );
                                }
                                return (
                                    <li key={`${field.key}_${fieldIndex}`} className="flex flex-col gap-2 relative">
                                        <FieldDot/>
                                        <h5>Get <code>{field.label}</code> field</h5>
                                        <div className="relative">
                                            <CopyToClipboardButton
                                                className="absolute -right-[5px] -top-[5px] z-10 bg-slate-100 text-slate-600"
                                                variant="outline"
                                                size="xs"
                                                text={useField}
                                            />
                                            <pre className="w-full overflow-auto"><code>{useField}</code></pre>
                                        </div>
                                        {nestedFields}
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