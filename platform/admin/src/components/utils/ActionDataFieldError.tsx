export interface ActionDataFieldErrorProps {
    actionData: any;
    fieldName: string;
}

export function ActionDataFieldError(props: ActionDataFieldErrorProps) {
    const {actionData, fieldName} = props;
    if (actionData && actionData[fieldName]?._errors) {
        return (
            <>
                {actionData[fieldName]?._errors.map((e: string, idx: number) => {
                    return <p key={`error_${idx}`} className="text-xs text-red-600">{e}</p>
                })}
            </>
        );
    }
    return null;
}
