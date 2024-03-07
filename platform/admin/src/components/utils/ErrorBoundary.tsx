import {isRouteErrorResponse, useRouteError } from "react-router-dom";

export function ErrorBoundary() {
    const error = useRouteError();
    if (isRouteErrorResponse(error) && error?.status === 404) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center">
                <div className="text-sm text-red-600">The Page Was Not Found</div>
            </div>
        );
    }
    throw error;
}
