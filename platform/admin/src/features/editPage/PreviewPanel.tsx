import React, {useEffect, useRef, useMemo} from 'react';
import {useSessionState} from '@/utils/localStorage';
import IFrameExtended, {IFrameExtendedHandle} from '@/components/utils/IFrameExtended';
import {DI_PageEntry, DI_TemplateEntry, DI_SiteEntry} from 'infra-common/data/DocumentItem';
import {useSystemInfo} from '@/data/useSystemInfo';
import {pageDataSingleton} from '@/data/PageData';
import {RELOAD_PREVIEW_EVENT, PreviewToolbar} from '@/features/editPage/PreviewToolbar';
import {IFrameToolbox} from '@/components/utils/IFrameToolbox';

interface PreviewPanelProps {
    pageSessionStateKey: string;
    templateSessionStateKey: string;
    siteSessionStateKey: string;
}

export function PreviewPanel(props: PreviewPanelProps) {
    const {pageSessionStateKey, templateSessionStateKey, siteSessionStateKey} = props;
    const {defaultWebsiteUrl} = useSystemInfo();
    const {value: pageEntry} = useSessionState<DI_PageEntry>(pageSessionStateKey);
    const {value: templateEntry} = useSessionState<DI_TemplateEntry>(templateSessionStateKey);
    const {value: siteEntry} = useSessionState<DI_SiteEntry>(siteSessionStateKey);
    const iFrameRef = useRef<IFrameExtendedHandle>(null);
    const {
        value: autoReloadPreview = true,
    } = useSessionState<boolean>('autoReloadPreview');

    const reloadPreview = () => {
        if (pageEntry && templateEntry && siteEntry) {
            if (iFrameRef.current) {
                iFrameRef.current.showNotification('Loading HTML...');
            }
            (async () => {
                const {html} = await pageDataSingleton.getPreviewHtml({pageEntry, templateEntry}, {siteEntry});
                console.log('Reload src doc');
                if (iFrameRef.current) {
                    iFrameRef.current.loadSrcDoc(html);
                }
            })().catch((e: any) => {
                if (iFrameRef.current) {
                    iFrameRef.current.loadSrcDoc(`<html><body><p style="color: red; padding: 2em">${e.message}</p></body></html>`);
                }
            });
        }
    };

    useEffect(() => {
        if (!autoReloadPreview) {
            reloadPreview();
        }
    }, []);

    useEffect(() => {
        if (autoReloadPreview) {
            reloadPreview();
        }
    }, [pageEntry, templateEntry, siteEntry, defaultWebsiteUrl, autoReloadPreview]);

    useEffect(() => {
        console.log('Rebind the reload preview');
        window.addEventListener(RELOAD_PREVIEW_EVENT, reloadPreview, false);
        return () => {
            window.removeEventListener(RELOAD_PREVIEW_EVENT, reloadPreview, false);
        };
    }, [pageEntry, templateEntry, siteEntry, defaultWebsiteUrl]);

    const iframeElement = useMemo(() => {
        return (
            <IFrameExtended
                ref={iFrameRef}
                zoomOut={true}
                devMode={true}
                srcdoc={'<html><body><p style="padding: 2em">Loading...</p></body></html>'}
            />
        );
    }, []);

    return (
        <div className="flex flex-col gap-2 w-full h-full">
            <div className="flex flex-row items-center gap-2 justify-between">
                <div className="flex flex-row items-center gap-2">
                    <PreviewToolbar/>
                </div>
                <div>
                    <IFrameToolbox key="pageEditPreview" title={templateEntry?.Meta?.TemplateTitle.S || ''}/>
                </div>
            </div>
            <div className="flex-grow relative w-full h-full">
                <div className="absolute top-0 left-0 right-0 bottom-0">
                    {iframeElement}
                </div>
            </div>
        </div>
    );
}
