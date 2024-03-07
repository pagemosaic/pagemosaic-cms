import { useAsyncError, useNavigate } from "react-router-dom";
import {useEffect} from 'react';

export function AwaitError() {
    const navigate = useNavigate();
    const error: any = useAsyncError();
    useEffect(() => {
        if (error.message === '[ACCESS_TOKEN_IS_MISSING]') {
            navigate('/login');
        }
    }, [error]);
    return (
        <div className="w-full h-full flex flex-col items-center justify-center">
            <div className="text-sm text-red-600">{error.message}</div>
        </div>
    );
}
