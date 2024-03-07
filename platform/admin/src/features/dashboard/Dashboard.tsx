import {
    LucideGlobe,
    LucideExternalLink,
    LucideGalleryHorizontalEnd
} from 'lucide-react';
import {formatDistanceToNow} from 'date-fns';
import {useSystemInfo} from '@/data/useSystemInfo';
import {MainSubSection} from '@/components/layouts/MainSubSection';
import {Card, CardHeader, CardTitle, CardDescription, CardContent} from '@/components/ui/card';
import {ButtonAction} from '@/components/utils/ButtonAction';
import {ButtonLink} from '@/components/utils/ButtonLink';
import {PagesData} from '@/data/PagesData';
import {GeneratorData} from '@/data/GeneratorData';
import {PublicBucketStaticData, PublicBucketAssetsData} from '@/data/PublicBucketData';
import {humanReadableBytes} from '@/utils/FormatUtils';
import {getIdFromPK} from 'infra-common/utility/database';
import {defaultTemplateId} from 'infra-common/utility/defaultTemplateEntry';

interface DashboardProps {
    pagesData: PagesData;
    generatorData: GeneratorData;
    staticFilesData: PublicBucketStaticData;
    assetsFilesData: PublicBucketAssetsData;
}

export function Dashboard(props: DashboardProps) {
    const {pagesData, generatorData, assetsFilesData, staticFilesData} = props;
    const {platformWebsiteUrl, defaultWebsiteUrl} = useSystemInfo();
    let isInitialDeployment = false;
    if (pagesData?.templateEntries) {
        if (pagesData.templateEntries.length === 1) {
            isInitialDeployment = getIdFromPK(pagesData.templateEntries[0].Entry?.PK.S) === defaultTemplateId;
        }
    }
    return (
        <MainSubSection>
            <div className="flex flex-col gap-4 p-4">
                <div>
                    <p className="text-xl">Dashboard</p>
                </div>
                {isInitialDeployment && (
                    <div className="w-full">
                        <Card
                            className="w-full p-4 grid grid-cols-1 place-items-center bg-violet-700 border-violet-700 text-white gap-4">
                            <p className="text-xl font-normal">It looks like this is your first deployment of the Page Mosaic Platform.</p>
                            <p className="text-xl font-normal">We suggest selecting a website template from our gallery and installing it on the platform.</p>
                            <ButtonLink variant="secondary" to="/gallery" Icon={LucideGalleryHorizontalEnd} label="Open Websites Gallery" />
                        </Card>
                    </div>
                )}
                <div className="w-full min-h-full grid lg:grid-cols-2 grid-rows-1 gap-4">
                    <div>
                        <Card className="h-full w-full">
                            <CardHeader>
                                <CardTitle>Website</CardTitle>
                                <CardDescription>A brief overview of the website settings.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid w-full lg:grid-cols-[1fr,200px] grid-1 gap-4 overflow-hidden">
                                    <div>
                                        {!platformWebsiteUrl?.domain
                                            ? (
                                                <>
                                                    <p className="pb-2">
                                                        This website doesn't have a custom domain assigned to it.
                                                    </p>
                                                    <p className="text-muted-foreground">
                                                        If you wish to use a custom domain name for your site, you'll need to purchase the domain first.
                                                        After that, you can press the "Add Custom Domain" button to set it up.
                                                    </p>
                                                </>
                                            )
                                            : (
                                                <>
                                                    <p className="pb-2">Your website has a custom domain address.</p>
                                                    <p>
                                                        <a className="text-blue-600 hover:underline font-normal"
                                                          href={`https://${platformWebsiteUrl?.domain}`} target="_blank">{`https://${platformWebsiteUrl?.domain}`}</a>
                                                    </p>
                                                </>
                                            )
                                        }
                                    </div>
                                    <div className="flex md:justify-end">
                                        {!platformWebsiteUrl?.domain
                                            ? <ButtonLink Icon={LucideGlobe} to="/edit-domain" label="Add Custom Domain" size="sm"
                                                            variant="default"/>
                                            : <ButtonLink size="sm" to={`https://${platformWebsiteUrl?.domain}`} target="_blank"
                                                          Icon={LucideExternalLink} label="Open in New Tab"/>
                                        }
                                    </div>
                                    <div>
                                        <p className="pb-2">
                                            The website has a default address that you can always use.
                                        </p>
                                        <p><a className="text-blue-600 hover:underline font-normal"
                                              href={defaultWebsiteUrl} target="_blank">{defaultWebsiteUrl}</a></p>
                                    </div>
                                    <div className="flex md:justify-end">
                                        {defaultWebsiteUrl &&
                                            <ButtonLink size="sm" to={defaultWebsiteUrl} target="_blank"
                                                        Icon={LucideExternalLink} label="Open in New Tab"/>}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                    <div>
                        <Card className="h-full w-full">
                            <CardHeader>
                                <CardTitle>System Information</CardTitle>
                                <CardDescription>Brief description of the website content.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid md:grid-cols-4 grid-cols-3 gap-6">
                                    <div className="h-full flex flex-col gap-2 items-center border-solid border-[1px] border-slate-200 p-3 rounded-2xl">
                                        <div className="flex-grow flex items-center justify-center">
                                            <p className="text-xl">
                                                {pagesData?.pageEntries.length || 0}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground font-normal">Pages</p>
                                        </div>
                                    </div>
                                    <div className="h-full flex flex-col gap-2 items-center border-solid border-[1px] border-slate-200 p-3 rounded-2xl">
                                        <div className="flex-grow flex items-center justify-center">
                                            <p className="text-xl">
                                                {pagesData?.templateEntries.length || 0}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground font-normal">
                                                Templates
                                            </p>
                                        </div>
                                    </div>
                                    <div className="h-full flex flex-col gap-2 items-center border-solid border-[1px] border-slate-200 p-3 rounded-2xl">
                                        <div className="flex-grow flex items-center justify-center">
                                            <p className="text-xl text-center">
                                                {generatorData?.generator.Status?.LastRun.N && generatorData.generator.Status.LastRun.N !== '0'
                                                    ? formatDistanceToNow(Number(generatorData.generator.Status.LastRun.N), {addSuffix: false}).replace('about', '').trim()
                                                    : 'Never'
                                                }
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground font-normal text-center">
                                                Published
                                            </p>
                                        </div>
                                    </div>
                                    <div className="h-full flex flex-col gap-2 items-center border-solid border-[1px] border-slate-200 p-3 rounded-2xl">
                                        <div className="flex-grow flex items-center justify-center">
                                            <p className="text-xl text-center">
                                                {generatorData?.generator.Status?.LastChanged.N && generatorData.generator.Status.LastChanged.N !== '0'
                                                    ? formatDistanceToNow(Number(generatorData.generator.Status.LastChanged.N), {addSuffix: false}).replace('about', '').trim()
                                                    : 'Never'
                                                }
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground font-normal text-center line-clamp-1">
                                                Changes Made
                                            </p>
                                        </div>
                                    </div>
                                    <div className="h-full flex flex-col gap-2 items-center border-solid border-[1px] border-slate-200 p-3 rounded-2xl">
                                        <div className="flex-grow flex items-center justify-center">
                                            <p className="text-xl text-center">
                                                {(staticFilesData?.totalItems || 0) + (assetsFilesData?.totalItems || 0)}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground font-normal text-center line-clamp-1">
                                                Total Files
                                            </p>
                                        </div>
                                    </div>
                                    <div className="h-full flex flex-col gap-2 items-center border-solid border-[1px] border-slate-200 p-3 rounded-2xl">
                                        <div className="flex-grow flex items-center justify-center">
                                            <p className="text-xl text-center">
                                                {humanReadableBytes((staticFilesData?.totalSize || 0) + (assetsFilesData?.totalSize || 0))}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground font-normal text-center line-clamp-1">
                                                Files Size
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                    <div></div>
                    <div></div>
                </div>
            </div>
        </MainSubSection>
    );
}
