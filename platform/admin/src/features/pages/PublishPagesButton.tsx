import React, {useMemo} from 'react';
import {ButtonAction} from '@/components/utils/ButtonAction';
import {LucideGlobe, LucideRefreshCw, LucideSave} from 'lucide-react';
import {useActionForm} from '@/components/utils/ActionFormProvider';
import {GeneratorData} from '@/data/GeneratorData';
import {DelayedLoading} from '@/components/utils/DelayedLoading';
import {GENERATOR_WITH_ERRORS_STATUS} from 'infra-common/constants';
import {useSystemInfo} from '@/data/useSystemInfo';
import {PagesData} from '@/data/PagesData';
import {SiteDataStatus} from '@/data/SiteData';
import {DI_PageEntry} from 'infra-common/data/DocumentItem';
import {PageDataStatus, pageDataSingleton} from '@/data/PageData';
import {getIdFromPK} from 'infra-common/utility/database';

interface PublishPagesButtonProps {
    siteDataStatus: SiteDataStatus;
    generatorData: GeneratorData;
    pagesData: PagesData;
}

export function PublishPagesButton(props: PublishPagesButtonProps) {
    const {siteDataStatus, generatorData, pagesData} = props;
    const {platformWebsiteUrl} = useSystemInfo();
    const {isInAction, showDialog} = useActionForm();
    let isNotPublishedChanges = false;
    if (generatorData?.generator) {
        const lastChanged = Number(generatorData.generator.Status?.LastChanged.N);
        const lastRun = Number(generatorData.generator.Status?.LastRun.N);
        isNotPublishedChanges = lastRun < lastChanged;
    }

    const changedPages: Array<DI_PageEntry> = useMemo(() => {
        const result: Array<DI_PageEntry> = [];
        if (pagesData) {
            let status: PageDataStatus;
            const {pageEntries = []} = pagesData;
            for (const pageEntry of pageEntries) {
                status = pageDataSingleton.getStatus(getIdFromPK(pageEntry.Entry?.PK.S), pageEntry.Meta?.PageTemplateId.S || '');
                if (status === 'changed') {
                    result.push(pageEntry);
                }
            }
        }
        return result;
    }, [pagesData]);

    const handlePublishPages = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        showDialog({
            title: 'Publish Website',
            // description: 'The pages you have changed recently will be published',
            action: 'publishPages',
            formDataParams: {
                websiteDomain: platformWebsiteUrl?.domain ? platformWebsiteUrl.domain : platformWebsiteUrl?.entryPointDomain || '',
            },
            Icon: LucideGlobe,
            buttonLabel: 'Publish',
            dialogType: 'confirm',
            render: ({isInAction}) => {
                return <DelayedLoading
                    isLoading={isInAction}
                    loadingElement={
                        <div className="flex flex-row gap-2 items-center">
                            <div>
                                <p className="font-medium text-sm">Please wait. Publishing...</p>
                            </div>
                            <div>
                                <LucideRefreshCw className="w-3 h-3 animate-spin"/>
                            </div>
                        </div>
                    }
                    element={
                    <div>
                        <p className="font-medium text-sm">
                            {generatorData?.generator.Status?.State.S !== GENERATOR_WITH_ERRORS_STATUS
                                ? (
                                    <span>All pages will be regenerated to incorporate your recent changes and then uploaded to the CDN.</span>
                                )
                                : (
                                    <span>All pages will be regenerated to incorporate your recent changes and then uploaded to the CDN. However, there were errors in the previous generation: "{generatorData?.generator.Status?.Error.S}"</span>
                                )
                            }
                        </p>
                    </div>
                }
                />
            }
        });
    };

    const handleSaveChanges = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        showDialog({
            title: 'Save Changes',
            // description: 'The pages you have changed recently will be published',
            action: 'saveChanges',
            formDataParams: {},
            Icon: LucideSave,
            buttonLabel: 'Save',
            dialogType: 'confirm',
            render: ({isInAction}) => {
                return <DelayedLoading
                    isLoading={isInAction}
                    loadingElement={
                        <div className="flex flex-row gap-2 items-center">
                            <div>
                                <p className="font-medium text-sm">Please wait. Saving changes...</p>
                            </div>
                            <div>
                                <LucideRefreshCw className="w-3 h-3 animate-spin"/>
                            </div>
                        </div>
                    }
                    element={
                    <div>
                        <p className="font-medium text-sm">
                            {siteDataStatus === 'changed' && (
                                <span>There are changes in global settings.&nbsp;</span>
                            )}
                            {changedPages.length === 1 && (
                                <span>One page was changed.</span>
                            )}
                            {changedPages.length > 1 && (
                                <span>{changedPages.length} pages were changed.</span>
                            )}
                        </p>
                    </div>
                    }
                />
            }
        });
    };

    if (siteDataStatus === 'changed' || changedPages.length > 0) {
        return (
            <ButtonAction
                Icon={LucideSave}
                variant="default"
                className="bg-orange-500"
                size="default"
                label="Save Changes"
                onClick={handleSaveChanges}
            />
        );
    }

    return (
        <ButtonAction
            Icon={LucideGlobe}
            variant="default"
            className={generatorData?.generator.Status?.State.S === GENERATOR_WITH_ERRORS_STATUS ? 'bg-amber-600 text-white' : ''}
            size="default"
            disabled={isInAction || !isNotPublishedChanges}
            label="Publish Changes"
            onClick={handlePublishPages}
        />
    );
}