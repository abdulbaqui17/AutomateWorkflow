import { prisma } from './prisma.js';
import { Kafka } from 'kafkajs';
import { Topics } from '../../../packages/kafka/src/topics.js';

const TOPIC_NAME = Topics.ZapEvents;

const kafka = new Kafka({
    clientId: 'my-app',
    brokers: [process.env.KAFKA_BROKERS || 'localhost:9092'],
});


async function main() {
    const producer = kafka.producer();
    await producer.connect();

    // New: consume trigger events, create ZapRun, and forward to run-requested
    const consumer = kafka.consumer({ groupId: 'processor-zap-trigger' });
    await consumer.connect();
    await consumer.subscribe({ topic: Topics.ZapTrigger, fromBeginning: false });

    consumer.run({
        eachMessage: async ({ message }) => {
            try {
                if (!message.value) return;
                const evt = JSON.parse(message.value.toString()) as { trigger: string; zapId: string; payload: any };

                const run = await prisma.zapRun.create({
                    data: {
                        zapId: evt.zapId,
                        metaData: evt.payload ?? {},
                    }
                });

                // @ts-ignore - Prisma client will have status/startedAt after migration
                await prisma.zapRun.update({ where: { id: run.id }, data: { status: 'running', startedAt: new Date() } });

                await producer.send({
                    topic: Topics.ZapRunRequested,
                    messages: [{ key: run.zapId, value: JSON.stringify({ zapRunId: run.id }) }]
                });
            } catch (err) {
                console.error('[processor] error handling trigger', err);
            }
        }
    });

    while (true) {
        const pendingRows = await prisma.zapRunOutbox.findMany({
            where: {},
            take: 10,
        });

        if (pendingRows.length > 0) {
            console.log(`Found ${pendingRows.length} pending zap runs`);
            
            await producer.send({
                topic: TOPIC_NAME,
                messages: pendingRows.map((row: any) => ({
                    value: row.zapRunId,
                })) 
            });

            // Delete processed rows
            await prisma.zapRunOutbox.deleteMany({
                where: {
                    id: {
                        in: pendingRows.map(row => row.id)
                    }
                }
            });

            console.log(`Processed ${pendingRows.length} zap runs`);
        }

        // Wait 1 second before checking again
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
}
main();