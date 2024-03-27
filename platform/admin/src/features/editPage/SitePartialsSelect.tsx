import React, {useState, useMemo, useRef, useEffect} from 'react';
import {LucidePlusCircle, LucideX, LucideTrash2, LucideSave, LucideChevronDown} from 'lucide-react';
import set from 'lodash-es/set';
import {DI_SiteEntry} from 'infra-common/data/DocumentItem';
import {useSessionState} from '@/utils/localStorage';
import {DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem} from '@/components/ui/dropdown-menu';
import {ButtonAction} from '@/components/utils/ButtonAction';
import {AsyncStatus} from '@/components/utils/AsyncStatusProvider';
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter} from '@/components/ui/dialog';
import {Label} from '@/components/ui/label';
import {Input} from '@/components/ui/input';
import {DI_SITE_ENTRY_KEY, DI_SITE_PARTIAL_SLICE_KEY} from 'infra-common/constants';

export interface SitePartialsSelectProps {
    siteSessionStateKey: string;
}

export function SitePartialsSelect(props: SitePartialsSelectProps) {
    const {siteSessionStateKey} = props;
    const {value: siteEntry, saveValue: setSiteEntry} = useSessionState<DI_SiteEntry>(siteSessionStateKey);
    const {
        value: selectedPartialIndex = -1,
        saveValue: setSelectedPartialIndex
    } = useSessionState<number>('siteSelectedPartialIndex');
    const [openDialog, setOpenDialog] = useState<boolean>(false);
    const [openDeleteDialog, setOpenDeleteDialog] = useState<boolean>(false);
    const [status, setStatus] = useState<AsyncStatus>({isUninitialized: true});

    const partialLabelInputRef = useRef<HTMLInputElement>(null);
    const partialKeyInputRef = useRef<HTMLInputElement>(null);

    const addNewPartial = () => {
        setStatus({isUninitialized: true});
        if (siteEntry && partialLabelInputRef.current && partialKeyInputRef.current) {
            if (partialLabelInputRef.current.value.length <= 0 || partialKeyInputRef.current.value.length <= 0) {
                setStatus({
                    isError: true, error: 'The label and key values should be not empty'
                });
            } else {
                const foundEqualKeyIndex = siteEntry.SitePartials.findIndex(i => i.SitePartialKey.S === partialKeyInputRef.current?.value) || -1;
                if (foundEqualKeyIndex >= 0) {
                    setStatus({
                        isError: true, error: 'The key value should be unique'
                    });
                } else {
                    siteEntry.SitePartials.push({
                        PK: {S: DI_SITE_ENTRY_KEY},
                        SK: {S: `${DI_SITE_PARTIAL_SLICE_KEY}#${partialKeyInputRef.current?.value}`},
                        SitePartialKey: {S: partialKeyInputRef.current?.value},
                        SitePartialLabel: {S: partialLabelInputRef.current.value},
                        SitePartialContentData: {S: ''}
                    });
                    set<string>(siteEntry, 'Entry.EntryUpdateDate.N', Date.now().toString());
                    setSiteEntry(siteEntry);
                    setSelectedPartialIndex(siteEntry.SitePartials.length - 1);
                    setOpenDialog(false);
                }
            }
        }
    };

    const deletePartial = () => {
        setStatus({isUninitialized: true});
        if (siteEntry && selectedPartialIndex >= 0) {
            if (siteEntry.SitePartials.length < selectedPartialIndex + 1) {
                setStatus({
                    isError: true, error: 'Wrong selected partial'
                });
            } else {
                siteEntry.SitePartials.splice(selectedPartialIndex, 1);
                set<string>(siteEntry, 'Entry.EntryUpdateDate.N', Date.now().toString());
                setSelectedPartialIndex(siteEntry.SitePartials.length - 1);
                setSiteEntry(siteEntry);
                setOpenDeleteDialog(false);
            }
        }
    };

    useEffect(() => {
        if (openDialog || openDeleteDialog) {
            setStatus({isUninitialized: true});
        }
    }, [openDialog, openDeleteDialog]);

    return useMemo(() => (
        <div className="flex flex-row items-center gap-1">
            {siteEntry?.SitePartials && siteEntry.SitePartials.length > 0
                ? (
                    <>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <ButtonAction
                                    size="sm"
                                    label={selectedPartialIndex >= 0 ? siteEntry?.SitePartials[selectedPartialIndex].SitePartialLabel.S : 'Select Partial...'}
                                    SuffixIcon={LucideChevronDown}
                                    variant="default"
                                    disabled={!siteEntry?.SitePartials || siteEntry?.SitePartials.length === 0}
                                />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" collisionPadding={{top: 10, right: 10}}>
                                {siteEntry?.SitePartials.map((entry, entryIndex) => {
                                    return (
                                        <DropdownMenuItem
                                            key={entry.SitePartialKey.S}
                                            onSelect={() => setSelectedPartialIndex(entryIndex)}
                                        >
                                            <div>{entry.SitePartialLabel.S}</div>
                                        </DropdownMenuItem>
                                    );
                                })}
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <ButtonAction
                            size="sm"
                            variant="ghost"
                            Icon={LucidePlusCircle}
                            onClick={() => setOpenDialog(true)}
                        />
                    </>
                )
                : (
                    <ButtonAction
                        size="sm"
                        variant="outline"
                        label="Create New Partial"
                        Icon={LucidePlusCircle}
                        onClick={() => setOpenDialog(true)}
                    />
                )
            }
            {selectedPartialIndex >= 0 && (
                <ButtonAction
                    size="sm"
                    variant="ghost"
                    Icon={LucideTrash2}
                    onClick={() => setOpenDeleteDialog(true)}
                />
            )}
            <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Partial</DialogTitle>
                        {status.isError && (
                            <div>
                                <p className="text-xs text-red-600">{status.error}</p>
                            </div>
                        )}
                    </DialogHeader>
                    <div className="flex flex-col gap-4">
                        {selectedPartialIndex >= 0 && (
                            <p className="font-normal text-sm">
                                You are going to
                                delete the "{siteEntry?.SitePartials[selectedPartialIndex].SitePartialLabel.S}" partial.
                            </p>
                        )}
                    </div>
                    <DialogFooter>
                        <ButtonAction
                            onClick={() => setOpenDeleteDialog(false)}
                            label="Cancel"
                            type="button"
                            Icon={LucideX}
                            variant="ghost"
                        />
                        <ButtonAction
                            variant="default"
                            size="default"
                            label="Delete"
                            type="button"
                            Icon={LucideTrash2}
                            onClick={deletePartial}
                        />
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                <DialogContent className="max-w-xl bg-slate-50">
                    <DialogHeader>
                        <DialogTitle>Create New Partial</DialogTitle>
                        {status.isError && (
                            <div>
                                <p className="text-xs text-red-600">{status.error}</p>
                            </div>
                        )}
                    </DialogHeader>
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="newPartialLabel">Partial Label</Label>
                            <Input
                                ref={partialLabelInputRef}
                                id="newPartialLabel"
                                name="newPartialLabel"
                                type="text"
                                defaultValue=""
                                onKeyDown={e => {if (e.key === 'Enter') { e.preventDefault(); addNewPartial(); }}}
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="newPartialKey">Partial Key</Label>
                            <Input
                                ref={partialKeyInputRef}
                                id="newPartialKey"
                                name="newPartialKey"
                                type="text"
                                defaultValue=""
                                onKeyDown={e => {if (e.key === 'Enter') { e.preventDefault(); addNewPartial(); }}}
                            />
                            <p className="text-sm text-muted-foreground">
                                The partial key is used as a Liquid object key to include in the HTML page template
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <ButtonAction
                            onClick={() => setOpenDialog(false)}
                            label="Cancel"
                            type="button"
                            Icon={LucideX}
                            variant="ghost"
                        />
                        <ButtonAction
                            variant="default"
                            size="default"
                            label="Create"
                            type="button"
                            Icon={LucideSave}
                            onClick={addNewPartial}
                        />
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    ), [siteEntry?.SitePartials, selectedPartialIndex, openDialog, openDeleteDialog, status]);

}