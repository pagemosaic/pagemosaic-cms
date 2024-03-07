import React from 'react';

export interface ActionDataNoErrorsProps {
    actionData: any;
    children: React.ReactNode;
}

export function ActionDataNoErrors(props: ActionDataNoErrorsProps) {
    const {actionData, children} = props;
    if (actionData) {
        let isError: boolean = false;
        for (const [key, value] of Object.entries(actionData)) {
            if (value && (value as any)._errors) {
                isError = true;
                break;
            }
        }
        if (actionData.error) {
            isError = true;
        }
        if (!isError) {
            return children;
        }
    }
    return null;
}
