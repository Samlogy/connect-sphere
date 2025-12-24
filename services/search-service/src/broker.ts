import amqp from 'amqplib';

export const RABBIT_URL = process.env.RABBIT_URL || 'amqp://localhost';

export async function connectRabbit() {
  const conn = await amqp.connect(RABBIT_URL);
  const channel = await conn.createChannel();
  return { conn, channel };
}
