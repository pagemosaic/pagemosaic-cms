export interface ActionDataFieldsHaveErrorProps {
    actionData: any;
}

export function ActionDataFieldsHaveError(props: ActionDataFieldsHaveErrorProps) {
    const {actionData} = props;
    if (actionData) {
        let isError: boolean = false;
        for (const [key, value] of Object.entries(actionData)) {
            if (value && (value as any)._errors) {
                isError = true;
                break;
            }
        }
        if (isError) {
            return (
                <p className="text-xs text-red-600">There are errors. Please double-check the values.</p>
            );
        }
    }
    return null;
}
