import {Construct} from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import {RemovalPolicy} from 'aws-cdk-lib';
import {
    PLATFORM_DOCUMENTS_TABLE_NAME,
    PLATFORM_SYSTEM_TABLE_NAME,
    PLATFORM_ENTRIES_BY_TAG_ID_INDEX_NAME,
    PLATFORM_ENTRIES_BY_TYPE_INDEX_NAME,
    PLATFORM_ENTRIES_BY_TEMPLATE_ID_INDEX_NAME
} from '../../common/constants';

export class DbTablesConstruct extends Construct {
    public readonly tables: Array<dynamodb.Table>;

    constructor(scope: Construct, id: string) {
        super(scope, id);
        this.tables = [];

        const documentsTable = new dynamodb.Table(this, PLATFORM_DOCUMENTS_TABLE_NAME, {
                tableName: PLATFORM_DOCUMENTS_TABLE_NAME,
                partitionKey: {name: 'PK', type: dynamodb.AttributeType.STRING},
                sortKey: {name: 'SK', type: dynamodb.AttributeType.STRING},
                billingMode: dynamodb.BillingMode.PAY_PER_REQUEST, // Use on-demand billing mode
                removalPolicy: RemovalPolicy.RETAIN
            });
        documentsTable.addGlobalSecondaryIndex({
            indexName: PLATFORM_ENTRIES_BY_TAG_ID_INDEX_NAME,
            partitionKey: { name: 'TagId', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
            projectionType: dynamodb.ProjectionType.ALL
        });
        documentsTable.addGlobalSecondaryIndex({
            indexName: PLATFORM_ENTRIES_BY_TYPE_INDEX_NAME,
            partitionKey: { name: 'EntryType', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
            projectionType: dynamodb.ProjectionType.ALL
        });
        documentsTable.addGlobalSecondaryIndex({
            indexName: PLATFORM_ENTRIES_BY_TEMPLATE_ID_INDEX_NAME,
            partitionKey: { name: 'PageTemplateId', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
            projectionType: dynamodb.ProjectionType.KEYS_ONLY
        });
        this.tables.push(documentsTable);

        this.tables.push(new dynamodb.Table(this, PLATFORM_SYSTEM_TABLE_NAME, {
                tableName: PLATFORM_SYSTEM_TABLE_NAME,
                partitionKey: {name: 'PK', type: dynamodb.AttributeType.STRING},
                sortKey: {name: 'SK', type: dynamodb.AttributeType.STRING},
                billingMode: dynamodb.BillingMode.PAY_PER_REQUEST, // Use on-demand billing mode
                removalPolicy: RemovalPolicy.RETAIN
            })
        );
        // // Store the table name in AWS Systems Manager Parameter Store
        // new ssm.StringParameter(this, 'ProbeTableNameParameter', {
        //     parameterName: 'probe-table-name',
        //     stringValue: this.table.tableName,
        // });
    }
}
