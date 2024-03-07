export interface ActionDataRequestErrorProps {
    actionData: any;
    className?: string;
}

export function ActionDataRequestError(props: ActionDataRequestErrorProps) {
    const {actionData, className} = props;
    if (actionData && actionData.error) {
        return (
            <div className={className}>
                <p className="text-xs text-red-600">{actionData.error}</p>
            </div>
        );
    }
    return null;
}
