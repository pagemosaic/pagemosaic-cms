import path from 'path';
import {ensureFileSync, writeFileSync} from 'fs-extra';
import JSZip from 'jszip';
import {
    PARAM_PREVIEW_POINT_DOMAIN,
    BUCKET_DOCUMENTS_DIR,
    PLATFORM_DOCUMENTS_TABLE_NAME,
    PLATFORM_SYSTEM_BUCKET_NAME,
    PLATFORM_PUBLIC_BUCKET_NAME
} from '../common/constants';
import {getSsmParameter} from '../common/aws/sysParameters';
import {scanWithExponentialBackoff} from '../common/aws/database';
import {getFilesInDirectory, getFileContent} from '../common/aws/bucket';

const outputFileName = Date.now().toString()
const outputFilePath = path.resolve(__dirname, `../../backup/${outputFileName}.zip`);

const backup = async () => {
    try {
        const entryPointDomain = await getSsmParameter(PARAM_PREVIEW_POINT_DOMAIN);
        const documentsRecords = await scanWithExponentialBackoff({TableName: PLATFORM_DOCUMENTS_TABLE_NAME});
        console.log(`Documents retrieved: ${documentsRecords.length}`);
        const zip = new JSZip();

        documentsRecords.forEach((item: any, index: number) => {
            const fileName = `${outputFileName}/data/documents/record_${index}.json`;
            const fileContent = JSON.stringify(item);
            zip.file(fileName, fileContent);
        });

        const filesDocuments = await getFilesInDirectory({
            bucketName: PLATFORM_SYSTEM_BUCKET_NAME,
            entryPointDomain
        }, BUCKET_DOCUMENTS_DIR);

        for (const fileDocument of filesDocuments) {
            const fileData = await getFileContent(PLATFORM_SYSTEM_BUCKET_NAME, fileDocument.id);
            zip.file(`${outputFileName}/system/${fileDocument.id}`, fileData);
            console.log('System document file packed: ', fileDocument.id);
        }

        const filesPublic = await getFilesInDirectory({
            bucketName: PLATFORM_PUBLIC_BUCKET_NAME,
            entryPointDomain
        }, '');

        for (const filePublic of filesPublic) {
            const fileData = await getFileContent(PLATFORM_PUBLIC_BUCKET_NAME, filePublic.id);
            zip.file(`${outputFileName}/public/${filePublic.id}`, fileData);
            console.log('Public document file packed: ', filePublic.id);
        }

        const zipData = await zip.generateAsync({ type: 'nodebuffer' });

        ensureFileSync(outputFilePath);
        writeFileSync(outputFilePath, zipData);

    } catch (error) {
        console.error("Error during backup.", error);
    }
};

console.log('Please wait. Backup resources...');

backup()
    .then(() => {
        console.log('The platform has been successfully backup.');
        console.log(`Please find the "${outputFilePath}" file`);
    })
    .catch(error => {
        console.error(error.message);
    });
