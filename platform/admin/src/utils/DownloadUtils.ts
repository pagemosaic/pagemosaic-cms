export const downloadFile = async (url: string, fileName: string) => {
    const link: HTMLAnchorElement = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
