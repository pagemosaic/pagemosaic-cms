import React, {useEffect, useRef} from 'react';
import {useSessionState} from '@/utils/localStorage';
import IFrameExtended, {IFrameExtendedHandle} from '@/components/utils/IFrameExtended';
import {DI_PageEntry, DI_TemplateEntry, DI_SiteEntry} from 'infra-common/data/DocumentItem';
import {useSystemInfo} from '@/data/useSystemInfo';
import {pageDataSingleton} from '@/data/PageData';
import {siteDataSingleton} from '@/data/SiteData';

interface PreviewPanelProps {
    pageId?: string;
    templateId?: string;
    pageSessionStateKey: string;
    templateSessionStateKey: string;
    siteSessionStateKey: string;
}

export function PreviewPanel(props: PreviewPanelProps) {
    const {pageId, templateId, pageSessionStateKey, templateSessionStateKey, siteSessionStateKey} = props;
    const {defaultWebsiteUrl} = useSystemInfo();

    const {value: pageEntry} = useSessionState<DI_PageEntry>(pageSessionStateKey);
    const {value: templateEntry} = useSessionState<DI_TemplateEntry>(templateSessionStateKey);
    const {value: siteEntry} = useSessionState<DI_SiteEntry>(siteSessionStateKey);
    const iFrameRef = useRef<IFrameExtendedHandle>(null);

    useEffect(() => {
        if (pageEntry && templateEntry && siteEntry) {
            if (iFrameRef.current) {
                iFrameRef.current.showNotification('Loading HTML...');
            }
            if (pageId && templateId) {
                (async () => {
                    const siteData = await siteDataSingleton.getSiteData();
                    const pageData = await pageDataSingleton.getPage(pageId, templateId);
                    const {html} = await pageDataSingleton.getPreviewHtml(pageData, siteData);
                    if (iFrameRef.current) {
                        iFrameRef.current.loadSrcDoc(html);
                    }
                })().catch((e: any) => {
                    if (iFrameRef.current) {
                        iFrameRef.current.loadSrcDoc(`<html><body><p style="color: red; padding: 2em">${e.message}</p></body></html>`);
                    }
                });
            } else {
                (async () => {
                    const {html} = await pageDataSingleton.getPreviewHtml({pageEntry, templateEntry}, {siteEntry});
                    if (iFrameRef.current) {
                        iFrameRef.current.loadSrcDoc(html);
                    }
                })().catch((e: any) => {
                    if (iFrameRef.current) {
                        iFrameRef.current.loadSrcDoc(`<html><body><p style="color: red; padding: 2em">${e.message}</p></body></html>`);
                    }
                });
            }
        }
    }, [pageEntry, templateEntry, siteEntry, defaultWebsiteUrl, pageId, templateId]);

    return (
        <IFrameExtended
            ref={iFrameRef}
            zoomOut={true}
            devMode={true}
            srcdoc={'<html><body><p style="padding: 2em">Loading...</p></body></html>'}
        />
    );
}
