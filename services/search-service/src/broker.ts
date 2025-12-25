import amqp from 'amqplib';
import { logger } from './logger';
import { indexRessource } from './elastic';

export const RABBIT_URL = process.env.RABBIT_URL || 'amqp://localhost';

export async function connectRabbit() {
  const conn = await amqp.connect(RABBIT_URL);
  const channel = await conn.createChannel();
  return { conn, channel };
}

export async function startConsumer(index: string, ressourceType: string, eventType: string) {
  const { channel } = await connectRabbit();
  await channel.assertQueue(ressourceType);

  channel.consume(ressourceType, async (msg) => {
    if (!msg) return;

    const event = JSON.parse(msg.content.toString());

    // handles => create / update events
    if (event.type === eventType) {
      await indexRessource(index, eventType, event.data);
      logger.info(`📥 ${index} indexed from event: ${eventType}`);
    }

    channel.ack(msg);
  });
}