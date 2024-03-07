import React from 'react';

export interface ActionDataFieldErrorBadgeProps {
    actionData: any;
    fieldNames: Array<string>;
    children: React.ReactNode;
}

export function ActionDataFieldErrorBadge(props: ActionDataFieldErrorBadgeProps) {
    const {actionData, fieldNames, children} = props;
    if (actionData) {
        let errorCount = 0;
        for (const fieldName of fieldNames) {
            if (actionData[fieldName]?._errors.length > 0) {
                errorCount++;
            }
        }
        if (errorCount > 0) {
            return (
                <div className="relative">
                    <div className="absolute -top-[5px] -right-[5px] w-[10px] h-[10px] rounded-full bg-red-600"/>
                    {children}
                </div>
            );
        }
    }
    return children;
}
