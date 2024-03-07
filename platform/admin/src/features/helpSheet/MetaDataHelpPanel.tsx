import React from 'react';
import {CopyToClipboardButton} from '@/components/utils/CopyToClipboardButton';

const pageTitleSnippet = `{{ thisPage.title }}`;
const pageRouteSnippet = `{{ thisPage.route }}`;
const pageSlugSnippet = `{{ thisPage.slug }}`;

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

interface MetaDataHelpPanelProps {
}

function FieldDot() {
    return (
        <span className="absolute -left-[13px] top-[12px] w-[5px] h-[5px] bg-slate-400 rounded-full"/>
    );
}

export function MetaDataHelpPanel(props: MetaDataHelpPanelProps) {
    return (
        <div className="flex flex-col gap-4 prose-fixed">
            <div className="flex flex-col gap-2">
                <h4 className="line-clamp-1">Page identification</h4>
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
        </div>
    );
}