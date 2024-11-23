import { Kafka, Partitioners } from "kafkajs";

const initializeKafka = () => {
  let retryCount = 0;
  const maxRetries = 5;

  const kafka = new Kafka({
    clientId: "chat-service",
    brokers: ["localhost:9092"],
    retry: {
      initialRetryTime: 1000, // 1 second
      maxRetryTime: 30000, // 30 seconds
      retries: 5,
      factor: 2, // exponential backoff
    },
    connectionTimeout: 3000, // 3 seconds
  });

  const producer = kafka.producer({
    allowAutoTopicCreation: true,
    transactionTimeout: 30000,
    createPartitioner: Partitioners.LegacyPartitioner,
  });

  const consumer = kafka.consumer({
    groupId: "chat-group",
    sessionTimeout: 30000,
    heartbeatInterval: 3000,
  });

  // Handle producer connection
  const connectProducer = async () => {
    try {
      await producer.connect();
      console.log("Producer connected successfully");
      retryCount = 0; // Reset retry count on successful connection
    } catch (error) {
      retryCount++;
      console.error(
        `Failed to connect producer (attempt ${retryCount}/${maxRetries}):`,
        error.message
      );

      if (retryCount < maxRetries) {
        const timeout = Math.min(1000 * Math.pow(2, retryCount), 30000);
        console.log(`Retrying in ${timeout / 1000} seconds...`);
        setTimeout(connectProducer, timeout);
      } else {
        console.error("Max retries reached for producer connection");
      }
    }
  };

  // Handle consumer connection
  const connectConsumer = async () => {
    try {
      await consumer.connect();
      console.log("Consumer connected successfully");
      retryCount = 0;

      await consumer.subscribe({
        topic: "chat-messages",
        fromBeginning: false,
      });
      console.log("Consumer subscribed to chat-messages topic");
    } catch (error) {
      retryCount++;
      console.error(
        `Failed to connect consumer (attempt ${retryCount}/${maxRetries}):`,
        error.message
      );

      if (retryCount < maxRetries) {
        const timeout = Math.min(1000 * Math.pow(2, retryCount), 30000);
        console.log(`Retrying in ${timeout / 1000} seconds...`);
        setTimeout(connectConsumer, timeout);
      } else {
        console.error("Max retries reached for consumer connection");
      }
    }
  };

  // Reconnection logic
  const handleDisconnection = async () => {
    console.log("Kafka connection lost. Attempting to reconnect...");
    retryCount = 0;
    await connectProducer();
    await connectConsumer();
  };

  // Event listeners
  producer.on("producer.disconnect", handleDisconnection);
  consumer.on("consumer.disconnect", handleDisconnection);

  return {
    kafka,
    producer,
    consumer,
    connectProducer,
    connectConsumer,
  };
};

const kafkaInstance = initializeKafka();
export const { producer, consumer, connectProducer, connectConsumer } =
  kafkaInstance;
