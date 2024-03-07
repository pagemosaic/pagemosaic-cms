import React, {useRef, useEffect} from 'react';
import IFrameExtended, {IFrameExtendedHandle} from '@/components/utils/IFrameExtended';
import {pageDataSingleton} from '@/data/PageData';
import {siteDataSingleton} from '@/data/SiteData';
import {IFrameToolbox} from '@/components/utils/IFrameToolbox';
import {PagesData} from '@/data/PagesData';

interface PagePreviewPanelProps {
    pagesData: PagesData;
    pageId?: string;
    templateId?: string;
}

export function PagePreviewPanel(props: PagePreviewPanelProps) {
    const {pagesData, pageId, templateId} = props;
    const iFrameRef = useRef<IFrameExtendedHandle>(null);
    const titleRef = useRef<HTMLParagraphElement>(null);

    useEffect(() => {
        if (pageId && templateId) {
            if (iFrameRef.current) {
                iFrameRef.current.showNotification('Loading HTML...');
            }
            (async () => {
                const siteData = await siteDataSingleton.getSiteData();
                const pageData = await pageDataSingleton.getPage(pageId, templateId);
                const {html, title} = await pageDataSingleton.getPreviewHtml(pageData, siteData);
                if (iFrameRef.current) {
                    iFrameRef.current.loadSrcDoc(html);
                }
                if (titleRef.current) {
                    titleRef.current.innerHTML = title;
                }
            })().catch((e: any) => {
                if (iFrameRef.current) {
                    iFrameRef.current.loadSrcDoc(`<html><body><p style="color: red; padding: 2em">${e.message}</p></body></html>`);
                }
                if (titleRef.current) {
                    titleRef.current.innerHTML = 'Error';
                }
            });
        }
    }, [pageId, templateId, pagesData]);

    if (!pageId || !templateId) {
        return (
            <div className="h-full flex flex-col items-center justify-center">
                <p className="text-muted-foreground font-medium">Select Item to Preview</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-2 w-full h-full">
            <div className="flex flex-row items-center justify-between gap-2 h-9 py-1">
                <div>
                    <p ref={titleRef} className="text-sm font-semibold text-muted-foreground"></p>
                </div>
                <IFrameToolbox/>
            </div>
            <div className="flex-grow relative w-full h-full">
                <IFrameExtended
                    ref={iFrameRef}
                    zoomOut={true}
                    devMode={true}
                    url="about:blank"
                    srcdoc={'<html><body><p style="padding: 2em">Loading...</p></body></html>'}
                />
            </div>
        </div>
    );
}
