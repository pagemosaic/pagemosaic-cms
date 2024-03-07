import React, {useState, useEffect} from 'react';
import {LucideClipboard, LucideCheck} from 'lucide-react';
import {Button, ButtonProps} from '@/components/ui/button';

export type CopyToClipboardButtonProps = ButtonProps & {
    text: string;
};

export const CopyToClipboardButton = React.forwardRef<HTMLButtonElement, CopyToClipboardButtonProps>((props: CopyToClipboardButtonProps, ref) => {
    const {text, ...rest} = props;
    const [isCopied, setCopied] = useState<boolean>(false);

    const handleCopyContent = () => {
        if (text) {
            navigator.clipboard.writeText(text)
                .then(() => {
                    setCopied(true);
                })
                .catch((err) => {
                    console.error('Unable to copy text: ', err);
                });
        }
    };

    useEffect(() => {
        let timeout: NodeJS.Timeout;
        if (isCopied) {
            timeout = setTimeout(() => {
                setCopied(false);
            }, 900);
        }
        return () => {
            if (timeout) {
                clearTimeout(timeout);
            }
        };
    }, [isCopied]);
    return (
        <Button ref={ref} {...rest} onClick={handleCopyContent}>
            {isCopied
                ? <LucideCheck />
                : <LucideClipboard />
            }
        </Button>
    );
});