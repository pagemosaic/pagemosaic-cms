import React from 'react';
import {LucideExternalLink, LucideDownloadCloud, LucideBookOpenText} from 'lucide-react';
import {Card, CardTitle} from '@/components/ui/card';
import imagePlaceholder from '@/assets/image-placeholder.svg';
import {ButtonAction} from '@/components/utils/ButtonAction';
import {GalleryItem} from '@/data/GalleryData';
import {getRepositoryName} from '@/utils/FormatUtils';
import {downloadFile} from '@/utils/DownloadUtils';

interface WebsiteTemplateCardProps {
    attrs: GalleryItem;
}

export function WebsiteTemplateCard(props: WebsiteTemplateCardProps) {
    const {attrs} = props;

    return (
        <div>
            <Card className="w-full p-4">
                <div className="grid w-full lg:grid-cols-[300px,1fr] grid-1 gap-4 overflow-hidden">
                    <div
                        className="w-full rounded-md border-[1px] border-slate-200 flex-grow-0 overflow-hidden">
                        <img
                            src={attrs.imageUrl || imagePlaceholder}
                            alt={'Unknown'}
                            className="h-full w-full object-cover object-top aspect-square"
                        />
                    </div>
                    <div className="w-full flex flex-col gap-2 justify-between">
                        <div className="flex flex-col gap-2">
                            <CardTitle>{attrs.title || 'Undefined Title'}</CardTitle>
                            <div className="text-muted-foreground">
                                <p>{attrs.description}</p>
                            </div>
                            {/*<div className="text-muted-foreground">*/}
                            {/*    <p>{getRepositoryName(attrs.repository)}</p>*/}
                            {/*</div>*/}
                        </div>
                        <div className="flex flex-row items-center gap-2 flex-wrap">
                            <ButtonAction
                                size="sm"
                                variant="default"
                                Icon={LucideDownloadCloud}
                                label="Download Package"
                                onClick={() => {
                                    downloadFile(attrs.downloadUrl, getRepositoryName(attrs.repository));
                                }}
                            />
                            <ButtonAction
                                size="sm"
                                variant="secondary"
                                Icon={LucideBookOpenText}
                                label="Read Me"
                                onClick={() => {window.open(attrs.repository, '__blank');}}
                            />
                            <ButtonAction
                                size="sm"
                                variant="secondary"
                                Icon={LucideExternalLink}
                                label="Live Demo"
                                disabled={!attrs.demoUrl}
                            />
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
}