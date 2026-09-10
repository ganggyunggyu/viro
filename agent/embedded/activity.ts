/** Embedded jobs report their durable outcome to the owner-scoped broker.
 * Browser helpers must not also write counters to a local MongoDB connection. */
export const incrementActivity = async (): Promise<void> => {};
