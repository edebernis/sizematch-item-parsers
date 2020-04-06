#!/usr/bin/env node

'use strict';

const amqp = require('amqplib');
const items = require('sizematch-protobuf/items_pb');


class Messenger {
    constructor(hostname, port, username, password, vhost, heartbeat, appId) {
        this.hostname = hostname;
        this.port = port;
        this.username = username;
        this.password = password;
        this.vhost = vhost;
        this.heartbeat = heartbeat;
        this.appId = appId;

        this.connection = null;
        this.channel = null;
        this.publisher = null;
        this.consumer = null;
    }

    async connect() {
        this.connection = await amqp.connect({
            protocol: 'amqp',
            hostname: this.hostname,
            port: this.port,
            username: this.username,
            password: this.password,
            vhost: this.vhost,
            heartbeat: this.heartbeat
        });

        this.channel = await this.connection.createConfirmChannel();
        this.channel.on('close', this.onChannelClosed);
        this.channel.on('error', this.onChannelError);
    }

    onChannelClosed() {
        console.log('Channel closed');
    }

    onChannelError(err) {
        console.log('Channel error');
        console.log(err);
    }

    async setupPublisher(exchangeName, routingKey, queueName) {
        await this.channel.assertExchange(exchangeName, 'direct', {durable: false});
        await this.channel.assertQueue(queueName, {durable: false});
        await this.channel.bindQueue(queueName, exchangeName, routingKey);

        this.publisher = {
            exchangeName: exchangeName,
            routingKey: routingKey,
            queueName: queueName
        };
    }

    async setupConsumer(queueName, prefetchCount) {
        await this.channel.assertQueue(queueName, {durable: false});
        await this.channel.prefetch(Number(prefetchCount));

        this.consumer = {
            queueName: queueName
        };
    }

    async consumeItem(callback) {
        return await this.channel.consume(this.consumer.queueName, async (msg) => {
            callback(msg, items.Item.deserializeBinary(msg.content));
        }, {noAck: false});
    }

    async ack(msg) {
        await this.channel.ack(msg);
    }

    async nack(msg) {
        await this.channel.nack(msg);
    }

    publishItem(item, callback) {
        const content = Buffer.from(item.serializeBinary());
        return this.channel.publish(this.publisher.exchangeName, this.publisher.routingKey, content, {
            persistent: false,
            mandatory: true,
            contentType: 'application/protobuf',
            appId: this.appId
        }, callback);
    }

    async close() {
        await this.connection.close();
    }
}


async function connect(messenger, connectionAttempts, connectionInterval=5000) {
    try {
        await messenger.connect();
        return messenger;
    } catch (e) {
        console.log(e);
        console.log('Failed to connect to RabbitMQ. Retrying.');
        connectionAttempts -= 1;

        if (connectionAttempts < 1) {
            console.log('All retries failed.');
            throw e;
        }

        await new Promise(resolve => setTimeout(resolve, connectionInterval));
        return connect(messenger, connectionAttempts);
    }
}


async function load(hostname, port, username, password, vhost, heartbeat, connectionAttempts, appId) {
    const messenger = new Messenger(hostname, port, username, password, vhost, heartbeat, appId);
    return await connect(messenger, connectionAttempts);
}


module.exports = {load: load};
