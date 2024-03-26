import React, {ReactNode, useContext, useState, useEffect, useRef} from 'react';
import {useFetcher, Form, useNavigate,} from 'react-router-dom';
import {LucideTrash2, LucideIcon, LucideX} from 'lucide-react';
import isArray from 'lodash-es/isArray';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from '@/components/ui/dialog';
import {ActionDataRequestError} from '@/components/utils/ActionDataRequestError';
import {ButtonAction} from '@/components/utils/ButtonAction';
import {ActionDataFieldsHaveError} from '@/components/utils/ActionDataFieldsHaveError';
import {ActionDataNoErrors} from '@/components/utils/ActionDataNoErrors';

export type ShowDialogOptions = {
    title: string;
    description?: string;
    action: string;
    formDataParams: Record<string, string | Array<string>>;
    Icon?: LucideIcon;
    buttonLabel?: string;
    forwardTo?: string;
    forwardBack?: boolean;
    dialogType?: 'confirm' | 'progress';
    contentClassName?: string;
    render?: (options: {
        actionData?: any;
        isInAction: boolean;
        actionState: 'idle' | 'loading' | 'submitting';
    }) => React.ReactElement;
};

export type ExecuteActionOptions = {
    action: string;
    formDataParams: Record<string, string | Array<string>>;
};

export type ActionFormProviderProps = {
    children: ReactNode;
};

export const ActionFormContext = React.createContext<{
    showDialog: (options: ShowDialogOptions) => void;
    executeAction: (options: ExecuteActionOptions) => void;
    actionData?: any;
    isInAction: boolean;
    actionState: 'idle' | 'loading' | 'submitting';
    Form: typeof Form;
} | null>(null);

export const ActionFormProvider: React.FC<ActionFormProviderProps> = (props) => {
    const {children} = props;
    const fetcher = useFetcher();
    const navigate = useNavigate();
    const [dialogOptions, setDialogOptions] = useState<ShowDialogOptions>();
    const [openConfirmDialog, setOpenConfirmDialog] = useState<boolean>(false);
    const [openProgressDialog, setOpenProgressDialog] = useState<boolean>(false);
    const [actionDataLocal, setActionDataLocal] = useState<any>();
    const contentDialogRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (fetcher.state === 'idle' && fetcher.data?.ok) {
            if (openConfirmDialog) {
                setOpenConfirmDialog(false);
            }
            if (openProgressDialog) {
                setOpenProgressDialog(false);
            }
            if (dialogOptions?.forwardTo) {
                navigate(dialogOptions.forwardTo);
            } else if (dialogOptions?.forwardBack) {
                navigate(-1);
            }
        }
        if (fetcher.state === 'idle') {
            setActionDataLocal(fetcher.data);
        } else if (fetcher.state === 'submitting') {
            setActionDataLocal({});
        }
    }, [fetcher.state, fetcher.data]);

    useEffect(() => {
        if (openConfirmDialog) {
            setTimeout(() => {
                const foundAutoFocusElement: HTMLElement | undefined | null = contentDialogRef.current?.querySelector('[data-autofocus]');
                if (foundAutoFocusElement) {
                    foundAutoFocusElement.focus();
                }
            }, 200);
        }
    }, [openConfirmDialog]);

    const showDialog = ({dialogType = 'confirm', ...rest}: ShowDialogOptions) => {
        setDialogOptions({dialogType, ...rest});
        if (dialogType === 'confirm') {
            setActionDataLocal({});
            setOpenConfirmDialog(true);
        } else if (dialogType === 'progress') {
            setActionDataLocal({});
            setOpenProgressDialog(true);
            setTimeout(() => {
                executeAction({
                    action: rest.action,
                    formDataParams: rest.formDataParams
                });
            }, 1000);
        }
    };

    const executeAction = (options: ExecuteActionOptions) => {
        const {action, formDataParams} = options;
        const formData = new FormData();
        formData.set('action', action);
        if (formDataParams) {
            for (const [key, value] of Object.entries(formDataParams)) {
                if (isArray(value)) {
                    for (const valueItem of value) {
                        formData.append(key, valueItem);
                    }
                } else {
                    formData.set(key, value);
                }
            }
        }
        fetcher.submit(
            formData,
            {method: 'post'}
        );
    };

    const isInAction = fetcher.state === 'loading' || fetcher.state === 'submitting';
    const hiddenFormInputs = [];
    if (dialogOptions?.formDataParams) {
        for (const [key, value] of Object.entries(dialogOptions.formDataParams)) {
            if (isArray(value)) {
                let valueIndex = 0;
                for (const valueItem of value) {
                    hiddenFormInputs.push(
                        <input type="hidden" key={`${key}_${valueIndex}`} name={key} value={valueItem}/>
                    );
                    valueIndex++;
                }
            } else {
                hiddenFormInputs.push(
                    <input type="hidden" key={key} name={key} value={value}/>
                );
            }
        }
    }

    return (
        <ActionFormContext.Provider
            value={{
                showDialog,
                executeAction,
                actionData: fetcher.data,
                isInAction,
                Form: fetcher.Form,
                actionState: fetcher.state
            }}
        >
            {children}
            <Dialog open={openConfirmDialog} onOpenChange={setOpenConfirmDialog}>
                <DialogContent ref={contentDialogRef} className={dialogOptions?.contentClassName}>
                    <fetcher.Form method="post" className="flex flex-col gap-6">
                        {hiddenFormInputs}
                        <DialogHeader>
                            <DialogTitle>{dialogOptions?.title || 'Undefined Title'}</DialogTitle>
                            {dialogOptions?.description && (
                                <DialogDescription>
                                    {dialogOptions.description}
                                </DialogDescription>
                            )}
                            <ActionDataRequestError actionData={actionDataLocal}/>
                        </DialogHeader>
                        {dialogOptions?.render && dialogOptions?.render({
                            actionData: actionDataLocal,
                            actionState: fetcher.state,
                            isInAction
                        })}
                        <DialogFooter>
                            <ButtonAction
                                Icon={LucideX}
                                disabled={isInAction}
                                type="button"
                                size="sm"
                                variant="ghost"
                                label="Cancel"
                                onClick={() => setOpenConfirmDialog(false)}
                            />
                            <ButtonAction
                                autoFocus={true}
                                Icon={dialogOptions?.Icon || LucideTrash2}
                                value={dialogOptions?.action || ''}
                                type="submit"
                                name="action"
                                label={dialogOptions?.buttonLabel || 'Confirm'}
                                variant="default"
                                size="sm"
                                isLoading={isInAction}
                            />
                        </DialogFooter>
                    </fetcher.Form>
                </DialogContent>
            </Dialog>
            <Dialog open={openProgressDialog} onOpenChange={setOpenProgressDialog}>
                <DialogContent onOpenAutoFocus={e => e.preventDefault()}>
                    <DialogHeader>
                        <DialogTitle>{dialogOptions?.title || 'Undefined Title'}</DialogTitle>
                        {dialogOptions?.description && (
                            <DialogDescription>
                                {dialogOptions.description}
                            </DialogDescription>
                        )}
                        <ActionDataRequestError actionData={actionDataLocal}/>
                        <ActionDataFieldsHaveError actionData={actionDataLocal}/>
                    </DialogHeader>
                    <ActionDataNoErrors actionData={actionDataLocal}>
                        {dialogOptions?.render && dialogOptions?.render({
                            actionData: actionDataLocal,
                            actionState: fetcher.state,
                            isInAction
                        })}
                    </ActionDataNoErrors>
                </DialogContent>
            </Dialog>
        </ActionFormContext.Provider>
    );
};

export const useActionForm = () => {
    const context = useContext(ActionFormContext);
    if (!context) {
        throw new Error('useActionForm must be used within a ActionFormProvider');
    }
    return context;
};
