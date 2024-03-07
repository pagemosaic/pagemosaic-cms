import camelCase from 'lodash/camelCase';
import pick from 'lodash/pick';
import {
    DynamoDBClient,
    UpdateItemInput,
    GetItemCommand,
    UpdateItemCommand,
    PutItemCommand,
    QueryCommand,
    QueryCommandInput,
    DeleteItemCommand,
    ScanCommandInput,
    ScanCommand,
    BatchWriteItemCommand, BatchWriteItemCommandInput
} from '@aws-sdk/client-dynamodb';
import {BasicItem, ItemKey} from '../data/BasicItem';

const AWS_REGION: string | undefined = process.env.AWS_REGION;

let dynamoClient: DynamoDBClient | undefined = undefined;

export function getDynamoClient(): DynamoDBClient {
    if (!dynamoClient) {
        dynamoClient = new DynamoDBClient({region: AWS_REGION});
    }
    return dynamoClient;
}

export async function createOrUpdateItem<T extends BasicItem>(tableName: string, item: T, restrictedParams?: Array<keyof  T>): Promise<T> {
    const dynamoClient = getDynamoClient();
    const foundItem = await getItemByKey(tableName, pick(item, ['PK', 'SK']));
    if (foundItem) {
        const updateParams = prepareItemUpdateParams(tableName, item, restrictedParams);
        const updateCommand = new UpdateItemCommand(updateParams);
        await dynamoClient.send(updateCommand);
    } else {
        const command = new PutItemCommand({TableName: tableName, Item: item});
        await dynamoClient.send(command);
    }
    return item;
}

export async function getItemByKey<T extends BasicItem>(tableName: string, itemKey: ItemKey): Promise<T | undefined> {
    const dynamoClient = getDynamoClient();
    const selectParams = {
        TableName: tableName,
        Key: itemKey
    };
    const command = new GetItemCommand(selectParams);
    const response = await dynamoClient.send(command);
    if (response.Item) {
        return response.Item as T;
    }
    return undefined;
}

export async function deleteItemByKey(tableName: string, itemKey: ItemKey): Promise<void> {
    const dynamoClient = getDynamoClient();
    const deleteParams = {
        TableName: tableName,
        Key: itemKey
    };
    const command = new DeleteItemCommand(deleteParams);
    await dynamoClient.send(command);
}

function prepareItemUpdateParams(
    tableName: string,
    item: BasicItem,
    restrictedParams?: Array<any>
): UpdateItemInput {
    const {PK, SK, ...restAttributes} = item;
    const updateExpressionParts = [];
    const expressionAttributeNames: Record<string, any> = {};
    const expressionAttributeValues: Record<string, any> = {};
    let useParam: boolean;
    for (const [key, value] of Object.entries(restAttributes as Record<string, any>)) {
        useParam = true;
        if (restrictedParams) {
            useParam = restrictedParams.includes(key);
        }
        if (useParam) {
            const keyValue = `${camelCase(key)}Value`;
            const attributeNameAlias = `#${key}Field`;
            updateExpressionParts.push(`${attributeNameAlias} = :${keyValue}`);
            expressionAttributeNames[attributeNameAlias] = key;
            expressionAttributeValues[`:${keyValue}`] = value;
        }
    }
    if (updateExpressionParts.length === 0) {
        throw Error('Update expression parameters mismatch.');
    }
    return {
        TableName: tableName,
        Key: {PK, SK},
        UpdateExpression: `SET ${updateExpressionParts.join(', ')}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
    };
}

export async function queryWithExponentialBackoff(
    params: QueryCommandInput,
    retries: number = 3, // The maximum number of retries
    backoff: number = 100 // The initial backoff delay is set to 100 milliseconds and doubles with each retry attempt.
): Promise<Array<any>> {
    const dynamoClient = getDynamoClient();
    try {
        const command = new QueryCommand(params);
        const response = await dynamoClient.send(command);
        if (response.Items && response.Items.length > 0) {
            return response.Items as Array<any>;
        }
        return [];
    } catch (error: any) {
        if (retries > 0 && (error.name === 'ProvisionedThroughputExceededException' || error.name === 'ThrottlingException')) {
            await new Promise(resolve => setTimeout(resolve, backoff));
            return queryWithExponentialBackoff(params, retries - 1, backoff * 2);
        }
        throw error;
    }
}

export async function scanWithExponentialBackoff(
    params: ScanCommandInput,
    retries: number = 3, // Maximum number of retries
    backoff: number = 100 // Initial backoff delay in milliseconds
): Promise<Array<any>> {
    const dynamoDBClient = getDynamoClient();
    const allItems: Array<any> = [];

    async function scan(params: ScanCommandInput | undefined, currentBackoff: number, remainingRetries: number): Promise<void> {
        try {
            if (!params) return;

            const command = new ScanCommand(params);
            const response = await dynamoDBClient.send(command);
            if (response.Items && response.Items.length > 0) {
                allItems.push(...response.Items);
            }

            if (response.LastEvaluatedKey) {
                // Continue scanning with the ExclusiveStartKey
                const nextParams: ScanCommandInput = {
                    ...params,
                    ExclusiveStartKey: response.LastEvaluatedKey
                };
                await scan(nextParams, currentBackoff, remainingRetries);
            }
        } catch (error: any) {
            if (remainingRetries > 0 && (error.name === 'ProvisionedThroughputExceededException' || error.name === 'ThrottlingException')) {
                await new Promise(resolve => setTimeout(resolve, currentBackoff));
                await scan(params, currentBackoff * 2, remainingRetries - 1); // Double the backoff and decrement retries
            } else {
                throw error;
            }
        }
    }

    await scan(params, backoff, retries);
    return allItems;
}

export async function deleteItemsInBatches(tableName: string, itemsToDelete: Array<ItemKey>) {
    const dynamoDBClient = getDynamoClient();
    // Split the items into batches of 25
    const batchedItems = [];
    for (let i = 0; i < itemsToDelete.length; i += 25) {
        batchedItems.push(itemsToDelete.slice(i, i + 25));
    }
    for (const batch of batchedItems) {
        const deleteRequests = batch.map(item => {
            return {
                DeleteRequest: {
                    Key: {
                        "PK": item.PK,
                        "SK": item.SK
                    }
                }
            };
        });
        try {
            await dynamoDBClient.send(new BatchWriteItemCommand({
                RequestItems: {
                    [tableName]: deleteRequests,
                },
            }));
            // console.log(`Batch delete successful for ${batch.length} items.`);
        } catch (error: any) {
            console.error("Error executing batch delete:", error.message);
            throw error;
        }
    }
}

export async function putItemsInBatches(tableName: string, itemsToPut: Array<any>) {
    const dynamoDBClient = getDynamoClient();
    // DynamoDB allows a maximum of 25 put requests in a single batch write operation
    const MAX_BATCH_SIZE = 25;
    for (let i = 0; i < itemsToPut.length; i += MAX_BATCH_SIZE) {
        const batch = itemsToPut.slice(i, i + MAX_BATCH_SIZE);
        const batchWriteItemInput: BatchWriteItemCommandInput = {
            RequestItems: {
                [tableName]: batch.map(item => ({
                    PutRequest: {
                        Item: item
                    }
                }))
            }
        };

        try {
            const response = await dynamoDBClient.send(new BatchWriteItemCommand(batchWriteItemInput));
            // console.log(`Batch write successful for ${batch.length} items.`, response);
            // Handle any unprocessed items as needed
            if (response.UnprocessedItems && Object.keys(response.UnprocessedItems).length > 0) {
                console.log("Some items were not processed:", response.UnprocessedItems);
                // Implement retry logic for unprocessed items here
            }
        } catch (error: any) {
            console.error("Error executing batch write:", error.message);
            throw error;
        }
    }
}
