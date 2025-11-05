import { createConsumer } from '../../../packages/kafka/src/index.js';
import { Topics } from '../../../packages/kafka/src/topics.js';
import { executeZapRun } from '../../../packages/core/src/executor.js';

async function main() {
    const consumer = await createConsumer('main-worker');
    await consumer.subscribe({ topic: Topics.ZapRunRequested, fromBeginning: true });
    
    await consumer.run({
        autoCommit: false,
        eachMessage: async ({ topic, partition, message }) => {
            try {
                const data = JSON.parse(message.value?.toString() || '{}');
                const zapRunId = data.zapRunId;
                
                if (!zapRunId) {
                    console.error('Received message with no zapRunId');
                    return;
                }
                
                console.log(`Processing ZapRun: ${zapRunId}`);
                
                // Execute the actual workflow
                const result = await executeZapRun(zapRunId);
                console.log(`Successfully processed ZapRun: ${zapRunId}`, result);
                
                // Commit the offset to mark message as processed
                await consumer.commitOffsets([{ 
                    topic: Topics.ZapRunRequested,
                    partition: partition, 
                    offset: (Number(message.offset) + 1).toString() 
                }]);
                
            } catch (error) {
                console.error('Error processing message:', error);
                // Don't commit offset on error - message will be retried
            }
        }           
    });
}   
main();