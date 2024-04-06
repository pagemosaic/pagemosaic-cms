import React, {
    CSSProperties,
    forwardRef,
    RefAttributes,
    useEffect,
    useImperativeHandle,
    useRef
} from 'react';
import {useSessionState} from '@/utils/localStorage';

const containerStyle: CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    overflow: 'hidden',
    inset: 0,
    borderRadius: '8px',
    border: '1px dashed #cdcdcd',
    backgroundColor: '#fff'
};

export const IFRAME_RESIZE_EVENT = 'iframe_resize_event';

export type IFrameExtendedEvent = {
    iframeWidth: number;
}

export type IFrameExtendedHandle = {
    reloadPage: () => void;
    loadURL: (url: string) => void;
    loadSrcDoc: (srcDoc: string) => void;
    setFocus: () => void;
    showNotification: (message: string) => void;
};

export type IFrameExtendedProps = RefAttributes<IFrameExtendedHandle> & {
    url?: string;
    srcdoc?: string;
    zoomOut?: boolean;
    devMode?: boolean;
    keepScrollPos?: boolean;
    onIFrameReady?: (url: string) => void;
    onIFrameMessage?: (data: any) => void;
};

const IFrameExtended = forwardRef<IFrameExtendedHandle, IFrameExtendedProps>((props, ref) => {
    const {url, srcdoc, zoomOut, devMode = false, keepScrollPos = true} = props;
    const {value: scale = 0.8} = useSessionState<number>('iFrameScale');

    const frameWindow = useRef<HTMLIFrameElement>(null);
    const scrollTopRef = useRef<number>(0);

    const handleWindowResize = () => {
        if (frameWindow.current) {
            window.dispatchEvent(new CustomEvent<IFrameExtendedEvent>(IFRAME_RESIZE_EVENT, {
                detail: {
                    iframeWidth: frameWindow.current.scrollWidth
                }
            }));
        }
    };

    const handleWindowScroll = () => {
        if (frameWindow.current?.contentWindow) {
            scrollTopRef.current = frameWindow.current.contentWindow?.document.documentElement.scrollTop || frameWindow.current.contentWindow?.document.body.scrollTop || 0;
        }
    };

    const handleLoad = () => {
        if (frameWindow.current?.contentWindow) {
            if (keepScrollPos) {
                frameWindow.current.contentWindow.scrollTo({top: scrollTopRef.current});
                frameWindow.current.contentWindow.addEventListener('scroll', handleWindowScroll);
            } else {
                frameWindow.current.contentWindow.scrollTo({top: 0});
            }
            frameWindow.current.contentWindow.addEventListener('resize', handleWindowResize);
            const doc = frameWindow.current.contentWindow.document;
            if (doc) {
                // Add target="_blank" attribute to each <a> element
                const anchorElements = doc.querySelectorAll('a');
                anchorElements.forEach(anchor => {
                    anchor.setAttribute('target', '_blank');
                });
            } else {
                console.error('The iFrame\'s content window document is null.');
            }
        }
    };

    const handleUnload = () => {
        if (frameWindow.current?.contentWindow) {
            if (keepScrollPos) {
                frameWindow.current.contentWindow.removeEventListener('scroll', handleWindowScroll);
            }
            frameWindow.current.contentWindow.removeEventListener('resize', handleWindowResize);
        }
    };

    useEffect(() => {
        if (frameWindow.current) {
            frameWindow.current.addEventListener('load', handleLoad);
            frameWindow.current.addEventListener('beforeunload', handleUnload);
            handleWindowResize();
        }
        return () => {
            if (frameWindow.current) {
                frameWindow.current.removeEventListener('beforeunload', handleUnload);
                frameWindow.current.removeEventListener('load', handleLoad);
            }
        };
    }, []);

    const reloadPage = () => {
        if (frameWindow.current) {
            const url = frameWindow.current.src;
            setTimeout(() => {
                if (frameWindow.current) {
                    frameWindow.current.src = url;
                }
            }, 1);
        }
    };

    const loadURL = (url: string) => {
        if (frameWindow.current) {
            frameWindow.current.src = url;
        }
    };

    const setFocus = () => {
        if (frameWindow.current) {
            frameWindow.current.contentWindow?.focus();
        }
    };

    const loadSrcDoc = (srcDoc: string) => {
        if (frameWindow.current && frameWindow.current.contentWindow) {
            frameWindow.current.srcdoc = srcDoc;
        }
    };

    const showNotification = (message: string) => {
        if (frameWindow.current && frameWindow.current.contentWindow) {
            const doc = frameWindow.current.contentWindow.document;
            if (doc && doc.body) {
                // Create a new div element
                const overlayDiv = doc.createElement('div');

                // Set styles for the div
                overlayDiv.style.position = 'fixed';
                overlayDiv.style.top = '0';
                overlayDiv.style.left = '0';
                overlayDiv.style.width = '100%';
                overlayDiv.style.height = '100%';
                overlayDiv.style.backgroundColor = 'transparent';
                // overlayDiv.style.opacity = '0.8';
                overlayDiv.style.display = 'flex';
                overlayDiv.style.justifyContent = 'center';
                overlayDiv.style.alignItems = 'center';
                overlayDiv.style.zIndex = '9999'; // Ensure it's above other content

                // Add text to the div
                const textNode = doc.createElement('p');
                textNode.innerHTML = message;
                textNode.style.fontFamily = 'monospace';
                textNode.style.letterSpacing = '2px';
                textNode.style.fontSize = '24px';
                textNode.style.fontWeight = '700';
                textNode.style.padding = '2em 3em';
                textNode.style.color = '#000000';
                textNode.style.backgroundColor = '#ffffff';
                textNode.style.border = '1px solid #000000';
                textNode.style.borderRadius = '6px';
                textNode.style.outline = '1px solid #ffffff';
                overlayDiv.appendChild(textNode);

                // Append the div to the body
                doc.body.appendChild(overlayDiv);
            } else {
                console.error('The iFrame\'s content window document is null.');
            }
        }
    };

    useImperativeHandle(ref, () => ({
        reloadPage() {
            reloadPage();
        },
        loadURL(url: string) {
            loadURL(url);
        },
        setFocus() {
            setFocus();
        },
        loadSrcDoc(srcDoc: string) {
            loadSrcDoc(srcDoc);
        },
        showNotification(message: string) {
            showNotification(message);
        },
    }));

    const validScale = devMode ? scale : 0.8;
    const innerContainerStyle: CSSProperties = zoomOut
        ? {
            position: 'absolute',
            top: 0,
            left: 0,
            width: `calc(100% / ${validScale})`, /* Double the width and height to compensate for the scaling */
            height: `calc(100% / ${validScale}`,
            transformOrigin: 'top left',
            transform: `scale(${validScale})`, /* Adjust this value to control the zoom level */
            border: 'none'
        }
        : {
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            border: 'none'
        };

    // const iFrameStyle: CSSProperties = {
    //     position: 'absolute',
    //     top: 0,
    //     left: 0,
    //     width: '100%',
    //     height: '100%',
    //     border: 'none'
    // };

    return (
        <div style={containerStyle}>
            {/*<div style={innerContainerStyle}>*/}
            <iframe
                title="IFrame"
                ref={frameWindow}
                style={innerContainerStyle}
                src={url}
                srcDoc={srcdoc}
                allowFullScreen={true}
            >
            </iframe>
            {/*</div>*/}
        </div>
    );
});

export default IFrameExtended;
