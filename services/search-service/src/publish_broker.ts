import amqp from "amqplib"

async function run() {
  const conn = await amqp.connect("amqp://localhost");
  const ch = await conn.createChannel();
  await ch.assertQueue("post.events");

  let dataset = [
    {
      id: "p1",
      title: "Learning System Design",
      content: "Elasticsearch, Redis, RabbitMQ explained",
      author_id: "u1",
      created_at: new Date().toISOString(),
    },
    {
      id: "p2",
      title: "Advanced Redis Caching",
      content: "How cache improves search latency",
      author_id: "u2",
      created_at: new Date().toISOString(),
    },
    {
      id: "p3",
      title: "Microservices Architecture",
      content: "Event-driven systems and scalability",
      author_id: "u3",
      created_at: new Date().toISOString(),
    },
  ];


  const raw = process.argv[2];
  console.log('RAW => ', raw)
  if (raw) dataset = JSON.parse(raw);  

  for (const d of dataset) {
    ch.sendToQueue(
      "post.events",
      Buffer.from(JSON.stringify({ type: "POST_CREATED", data: d }))
    );
    console.log("📤 Published: ", d.title);
  } 

  await ch.close();
  await conn.close();
  setTimeout(() => process.exit(0), 500);
}

run();


// node dist/publish_broker.js 
// '[
//     {
//       "id": "p3",
//       "title": "Microservices Architecture",
//       "content": "Event-driven systems and scalability",
//       "author_id": "u3",
//       "created_at": "2025-11-16T00:00:00Z",
//     }
// ]'
